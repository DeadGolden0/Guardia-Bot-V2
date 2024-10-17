const { PermissionsBitField, ActionRowBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRoleChannel } = require('@Helpers/getChannels');
const { safeFollowUp } = require('@Helpers/Utils');
const logger = require('@Helpers/Logger');

/**
 * Removes a role from the available role request options.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /removerole role:@Role
 * 
 * @description
 * This command allows administrators to remove a specific role from the list of roles users can request in the role channel.
 * It finds the message with role request buttons, removes the button corresponding to the role, and updates the message.
 * If the role or message is not found, a feedback message is sent to the administrator.
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Retire un rôle des options de demande de rôle.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Le rôle à retirer des options.')
        .setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');

    // Fetch or find the role request channel
    const roleChannel = await getRoleChannel(interaction.guild);
    if (!roleChannel) {
      return safeFollowUp(interaction, { content: 'Le canal des rôles n\'est pas configuré. Veuillez le configurer d\'abord.' });
    }

    // Fetch recent messages in the role channel
    const messages = await roleChannel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(msg => 
      msg.embeds.length > 0 && msg.embeds[0].title === '🎭 Demandes de rôles'
    );

    // If no message with the role request embed is found
    if (!existingMessage) {
      return safeFollowUp(interaction, { content: 'Aucun embed de demande de rôle trouvé.' });
    }

    // Retrieve and transform the components into ActionRowBuilder
    let components = existingMessage.components.map(component => ActionRowBuilder.from(component));
    let found = false;

    // Iterate over the ActionRows and buttons to find the matching role
    components = components.map(row => {
      row.components = row.components.filter(button => {
        const customId = button.data.custom_id;

        // Check if the customId matches the role
        if (customId && customId === `ROLE_REQUEST-${role.id}`) {
          found = true;
          return false; // Remove this button
        }
        return true; // Keep other buttons
      });
      return row;
    });

    // If no button matching the role was found
    if (!found) {
      return safeFollowUp(interaction, { content: `Le rôle <@&${role.id}> n'a pas été trouvé dans l'embed des demandes de rôles.` });
    }

    // Remove empty ActionRows
    components = components.filter(row => row.components.length > 0);

    // Update the message with the remaining components
    await existingMessage.edit({ components });

    logger.log(`Le bouton pour le rôle ${role.name} a été supprimé avec succès.`);
    await safeFollowUp(interaction, { content: `Le rôle <@&${role.id}> a été retiré des options de demande de rôle.` });
  },
};