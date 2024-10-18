const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Suggestion = require('@Database/schemas/Suggestion');
const { safeFollowUp } = require('@Helpers/Message');
const { SUGGESTIONS } = require('@Config/Config');
const logger = require('@Helpers/Logger');

/**
 * Deletes a suggestion based on its ID.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletesuggestion')
    .setDescription('Supprime une suggestion par son ID.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(option =>
      option.setName('suggestion_id')
        .setDescription('ID numérique de la suggestion à supprimer.')
        .setRequired(true)),

  async execute(interaction) {
    if (!SUGGESTIONS.ENABLED) {
      return safeFollowUp(interaction, { content: 'Le module de suggestions n\'est pas activé.', ephemeral: true });
    }

    const suggestionId = interaction.options.getInteger('suggestion_id');
    const guildId = interaction.guild.id;

    // Fetch the suggestion from the database
    const suggestion = await Suggestion.findOne({ guildId, suggestionId });

    if (!suggestion) {
      return safeFollowUp(interaction, { content: 'Suggestion introuvable. Veuillez vérifier l\'ID fourni.', ephemeral: true });
    }

    // Retrieve the channel where the suggestion was posted
    const suggestionChannel = interaction.guild.channels.cache.get(suggestion.channelId);
    if (!suggestionChannel) {
      return safeFollowUp(interaction, { content: 'Le canal de la suggestion est introuvable. Veuillez vérifier la configuration.', ephemeral: true });
    }

    // Attempt to fetch and delete the message if it exists
    const suggestionMessage = await suggestionChannel.messages.fetch(suggestion.messageId).catch(() => null);
    if (suggestionMessage) {
      await suggestionMessage.delete();
      logger.log(`Message de suggestion #${suggestionId} supprimé avec succès.`);
    } else {
      logger.warn(`Impossible de trouver le message de suggestion #${suggestionId} pour le supprimer.`);
    }

    // Delete the suggestion from the database
    await Suggestion.deleteOne({ guildId, suggestionId });

    logger.log(`Suggestion #${suggestionId} supprimée par ${interaction.user.tag}`);
    await safeFollowUp(interaction, { content: `La suggestion #${suggestionId} a été supprimée avec succès.`, ephemeral: true });
  },
};
