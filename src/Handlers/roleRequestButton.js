const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
const { createDenyEmbed, createHistoryEmbed, createAcceptEmbed, createAcceptHistoryEmbed } = require('@Helpers/Embed');
const RoleRequestSchema = require('@Database/schemas/RoleRequest');
const { getStaffChannel } = require('@Helpers/getChannels');
const { safeReply } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Handles the role request interaction by creating a request and notifying the staff for approval.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @returns {Promise<void>}
 */
async function handleRequest(interaction, client) {
  try {
    const [action, roleId] = interaction.customId.split('-');
    if (action !== 'ROLE_REQUEST') return;

    const role = await fetchRole(interaction, roleId);
    if (!role) return;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.cache.has(roleId)) {
      return safeReply(interaction, { content: `Vous possédez déjà le rôle <@&${roleId}>.` });
    }

    const existingRequest = await RoleRequestSchema.findOne({ userId: interaction.user.id, roleId, status: 'pending' });
    if (existingRequest) {
      return safeReply(interaction, { content: 'Vous avez déjà une demande en cours pour ce rôle.' });
    }

    const staffChannel = await getStaffChannel(interaction.guild);
    if (!staffChannel) {
      return safeReply(interaction, { content: 'Le canal staff n\'est pas configuré.' });
    }

    await createRoleRequest(interaction, roleId);
    await sendRequestToStaff(interaction, client, role, staffChannel);
    await safeReply(interaction, { content: 'Votre demande a été envoyée au staff.' });

    logger.log(`Demande de rôle envoyée au staff: ${interaction.user.tag} a demandé ${role.name}`);
  } catch (error) {
    logger.error(`Erreur lors de la demande de rôle: ${error.message}`);
    return safeReply(interaction, { content: 'Une erreur est survenue lors de la gestion de votre demande.' });
  }
}

/**
 * Handles the acceptance of a pending role request, updates the staff channel history,
 * and notifies the user via DM.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
async function handleAccept(interaction) {
  try {
    const [action, userId, roleId] = interaction.customId.split('-');
    if (action !== 'ROLE_ACCEPT') return;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return safeReply(interaction, { content: 'Vous n\'avez pas la permission d\'accepter des demandes de rôle.' });
    }

    const member = await interaction.guild.members.fetch(userId);
    const role = interaction.guild.roles.cache.get(roleId);

    if (!member || !role) {
      return safeReply(interaction, { content: 'Le membre ou le rôle est introuvable.' });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return safeReply(interaction, { content: 'Je ne peux pas attribuer ce rôle, il est trop élevé dans la hiérarchie.', ephemeral: true });
    }

    await member.roles.add(role);
    await RoleRequestSchema.findOneAndUpdate({ userId, roleId, status: 'pending' }, { status: 'accepted', staffId: interaction.user.id, updatedAt: new Date() });
    await safeReply(interaction, { content: `Le rôle <@&${role.id}> a été attribué à <@${member.user.id}>.` });

    // Notify the user via DM
    await member.send({ embeds: [createAcceptEmbed({ roleName: role.name, CLIENT: interaction.client })] });

    // Update the staff channel with the acceptance history
    const historyEmbed = createAcceptHistoryEmbed({ roleId: role.id, member, staffMember: interaction.user, CLIENT: interaction.client });
    await interaction.message.delete();
    await interaction.channel.send({ embeds: [historyEmbed] });

    logger.log(`Rôle (${role.name}) attribué à ${member.user.tag} par ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Erreur lors de l'acceptation: ${error.message}`);
    await safeReply(interaction, { content: 'Une erreur est survenue lors de l\'acceptation.' });
  }
}

/**
 * Handles the denial of a pending role request by showing a modal to enter the reason,
 * updates the staff channel history, and notifies the user via DM.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
async function handleDeny(interaction) {
  try {
    const [action, userId, roleId] = interaction.customId.split('-');
    if (action !== 'ROLE_DENY') return;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return safeReply(interaction, { content: 'Vous n\'avez pas la permission de refuser des demandes de rôle.' });
    }

    const modal = new ModalBuilder()
      .setCustomId(`ROLE_DENY_MODAL-${userId}-${roleId}`)
      .setTitle('Raison du refus');

    const reasonInput = new TextInputBuilder()
      .setCustomId('reasonInput')
      .setLabel('Pourquoi refusez-vous cette demande ?')
      .setStyle(TextInputStyle.Paragraph);

    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error(`Erreur lors du refus : ${error.message}`);
    await safeReply(interaction, { content: 'Une erreur est survenue lors du refus.' });
  }
}

// Utility functions

/**
 * Fetches a role from the guild by its ID.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {string} roleId - The ID of the role to fetch.
 * @returns {Promise<import('discord.js').Role|null>} - The fetched role or null if not found.
 */
async function fetchRole(interaction, roleId) {
  let role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId);
  if (!role) {
    logger.error('Le rôle est introuvable.');
    await safeReply(interaction, { content: 'Le rôle est introuvable.' });
  }
  return role;
}

/**
 * Creates a new role request entry in the database.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {string} roleId - The ID of the role requested.
 * @returns {Promise<void>}
 */
async function createRoleRequest(interaction, roleId) {
  await RoleRequestSchema.create({ userId: interaction.user.id, roleId: roleId, status: 'pending' });
}

/**
 * Sends a role request to the staff channel for approval.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {import('discord.js').Role} role - The role requested.
 * @param {import('discord.js').TextChannel} staffChannel - The staff channel to send the request to.
 * @returns {Promise<void>}
 */
async function sendRequestToStaff(interaction, client, role, staffChannel) {
  const requestEmbed = new EmbedBuilder()
    .setTitle('🛠️ Nouvelle demande de rôle')
    .setColor('#ffcc00')
    .setDescription(`<@${interaction.user.id}> a demandé le rôle <@&${role.id}>.`)
    .setFooter({ text: 'Dead - Bot ©', iconURL: client.user.displayAvatarURL() })
    .setTimestamp();

  await staffChannel.send({
    embeds: [requestEmbed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ROLE_ACCEPT-${interaction.user.id}-${role.id}`)
          .setLabel('Accepter')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ROLE_DENY-${interaction.user.id}-${role.id}`)
          .setLabel('Refuser')
          .setStyle(ButtonStyle.Danger)
      )
    ]
  });
}

// Export functions
module.exports = { handleRequest, handleAccept, handleDeny };