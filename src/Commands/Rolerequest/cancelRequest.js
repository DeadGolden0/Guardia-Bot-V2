const { SlashCommandBuilder } = require('@discordjs/builders');
const { safeFollowUp } = require('@Helpers/Utils');

/**
 * Cancels a pending role request for the user.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /cancelrequest
 * 
 * @description
 * This command allows users to cancel their pending role request. It checks if a pending request exists for the user
 * and deletes it from the database if found. A confirmation message is sent to the user. If no pending request is found,
 * the user is informed that they have no role request to cancel.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancelrequest')
    .setDescription('Annuler une demande de rôle en attente'),
    
  async execute(interaction) {
    return safeFollowUp(interaction, { content: 'La commande d\'annulation de demande de rôle est en cours de développement. Veuillez réessayer plus tard.' });
  },
};
