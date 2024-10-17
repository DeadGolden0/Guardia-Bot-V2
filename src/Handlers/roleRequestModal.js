const { createDenyEmbed, createHistoryEmbed } = require('@Helpers/Embed');
const RoleRequestSchema = require('@Database/schemas/RoleRequest');
const { safeReply } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Handles the denial of a role request when the modal is submitted.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @returns {Promise<void>}
 */
async function handleDenyModal(interaction, client) {
  try {
    const [action, userId, roleId] = interaction.customId.split('-');
    if (action !== 'ROLE_DENY_MODAL') return;

    const member = await interaction.guild.members.fetch(userId);
    const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId);

    if (!member || !role) {
      return safeReply(interaction, { content: 'Le membre ou le rôle est introuvable.' });
    }

    const reason = interaction.fields.getTextInputValue('reasonInput');

    // Update the request in the database
    const result = await RoleRequestSchema.findOneAndUpdate(
      { userId, roleId, status: 'pending' },
      { status: 'denied', staffId: interaction.user.id, reason, updatedAt: Date.now() }
    );

    if (!result) {
      logger.error('La demande de rôle est introuvable dans la base de données.');
      return safeReply(interaction, { content: 'Erreur : la demande est introuvable dans la base de données.' });
    }

    // Confirm to the staff
    await safeReply(interaction, { content: `La demande de rôle pour <@${member.user.id}> a été refusée.` });

    // Notify the user via DM
    await member.send({ embeds: [createDenyEmbed({ roleName: role.name, reason, CLIENT: client })] });

    // Create a history embed
    const historyEmbed = createHistoryEmbed({
      roleId: role.id,
      reason,
      member,
      staffMember: interaction.user,
      CLIENT: client
    });

    // Delete the old request message
    await interaction.message.delete();

    // Send a new message with the history embed to the staff channel
    const staffChannel = interaction.channel;
    await staffChannel.send({ embeds: [historyEmbed] });

    logger.log(`Demande de rôle refusée pour ${member.user.tag} par ${interaction.user.tag}. Raison: ${reason}`);
  } catch (error) {
    logger.error(`Erreur lors de la soumission du refus : ${error.message}`);
    return safeReply(interaction, { content: 'Une erreur est survenue lors du traitement du refus.' });
  }
}

module.exports = { handleDenyModal };
