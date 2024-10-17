const { ButtonStyle, PermissionsBitField, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRoleChannel } = require('@Helpers/getChannels');
const { safeFollowUp } = require('@Helpers/Message');
const { createEmbed } = require('@Helpers/Embed');
const logger = require('@Helpers/Logger');

/**
 * Sets up the roles available for users to request.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /setuproles role:@Role
 * 
 * @description
 * This command allows administrators to configure the roles that users can request in a Discord server. 
 * It adds buttons in a message, which users can click to request a role. If a message with the role request 
 * buttons already exists, the command updates the message with the new role button. The response is 
 * ephemeral and will automatically be deleted after a short delay using the safeFollowUp function.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuproles')
    .setDescription('Configurer les rôles disponibles pour les utilisateurs')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à ajouter')
        .setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');

    // Fetch or find the role request channel
    const roleChannel = await getRoleChannel(interaction.guild);
    if (!roleChannel) {
      return safeFollowUp(interaction, { content: 'Le canal des rôles n\'est pas configuré. Veuillez le configurer d\'abord.' });
    }

    // Look for an existing message with the "🎭 Demandes de rôles" embed
    const messages = await roleChannel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(msg => 
      msg.embeds.length > 0 && msg.embeds[0].title === '🎭 Demandes de rôles'
    );

    const customId = `ROLE_REQUEST-${role.id}`;

    // Create a new button for the role request
    const newButton = new ButtonBuilder()
      .setLabel(`${role.name}`)
      .setStyle(ButtonStyle.Primary)
      .setCustomId(customId);

    // If the embed already exists, check if the button is already present
    if (existingMessage) {
      const existingEmbed = existingMessage.embeds[0];
      let components = existingMessage.components.map(component => ActionRowBuilder.from(component));

      // Check if the button for this role already exists
      const buttonExists = components.some(row => 
        row.components.some(button => button.data.custom_id === customId)
      );

      if (buttonExists) {
        return safeFollowUp(interaction, { content: `Le bouton pour le rôle <@&${role.id}> existe déjà dans l'embed.` });
      }

      // If the last ActionRow is full (5 buttons), create a new ActionRow
      if (components.length === 0 || components[components.length - 1].components.length >= 5) {
        components.push(new ActionRowBuilder().addComponents(newButton));
      } else {
        components[components.length - 1].addComponents(newButton);
      }

      // Update the existing message with the new button
      await existingMessage.edit({ embeds: [existingEmbed], components });

      // Log the action and reply to the user
      logger.log(`Le bouton pour le rôle ${role.name} a été ajouté à l'embed existant.`);
      await safeFollowUp(interaction, { content: `Le bouton pour le rôle <@&${role.id}> a été ajouté à l'embed existant.` });

    } else {

      // Otherwise, create a new embed and add the first button
      const roleEmbed = createEmbed({
        TITLE: '🎭 Demandes de rôles',
        DESC: 'Cliquez sur les boutons ci-dessous pour demander un rôle spécifique.',
        COLOR: '#00ff00',
        CLIENT: interaction.client
      });

      const components = [new ActionRowBuilder().addComponents(newButton)];

      await roleChannel.send({
        embeds: [roleEmbed],
        components
      });

      // Log the action and reply to the user
      logger.log(`Le rôle ${role.name} est maintenant disponible dans le canal des rôles.`);
      await safeFollowUp(interaction, { content: `Le rôle <@&${role.id}> est maintenant disponible dans le canal des rôles.` });
    }
  },
};