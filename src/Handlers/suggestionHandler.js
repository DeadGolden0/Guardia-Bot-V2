const { EmbedBuilder } = require('discord.js');
const Suggestion = require('@Database/schemas/Suggestion');
const logger = require('@Helpers/Logger');

/**
 * Handles button interactions for suggestion votes using MongoDB.
 * @param {import('discord.js').Interaction} interaction - The button interaction object.
 * @returns {Promise<void>}
 */
async function handleSuggestionInteraction(interaction) {
    if (!interaction.isButton()) return;

    const { customId, message, user } = interaction;
    if (customId !== 'POLL_YES' && customId !== 'POLL_NO') return;

    // Retrieve the suggestion ID from the embed title
    const suggestionIdMatch = message.embeds[0].title.match(/#(\d+)/);
    const suggestionId = suggestionIdMatch ? parseInt(suggestionIdMatch[1], 10) : null;
    if (!suggestionId) {
        logger.warn("Impossible de récupérer l'ID de la suggestion.");
        return;
    }

    // Fetch the suggestion from the database
    const suggestion = await Suggestion.findOne({ suggestionId, guildId: interaction.guild.id });
    if (!suggestion) {
        logger.warn(`Suggestion avec ID ${suggestionId} introuvable.`);
        return;
    }

    // Track votes using upvote and downvote logic
    let upvotes = suggestion.upvotes || 0;
    let downvotes = suggestion.downvotes || 0;
    let userVote = suggestion.userVotes.find(vote => vote.startsWith(user.id));

    /**
     * Function to parse vote type ('upvote' or 'downvote') from userVotes entry.
     * @param {string} voteEntry - The entry in userVotes (e.g., 'userID:upvote').
     * @returns {string} - The type of vote ('upvote' or 'downvote').
     */
    const getVoteType = (voteEntry) => voteEntry.split(':')[1];

    // Remove existing user vote if any
    if (userVote) {
        const voteType = getVoteType(userVote);
        if (voteType === 'upvote') upvotes--;
        if (voteType === 'downvote') downvotes--;
        suggestion.userVotes = suggestion.userVotes.filter(vote => !vote.startsWith(user.id));
    }

    // Determine new vote type based on the button clicked
    let newVoteType = null;
    if (customId === 'POLL_YES') {
        if (!userVote || getVoteType(userVote) !== 'upvote') {
            newVoteType = 'upvote';
            upvotes++;
        }
    } else if (customId === 'POLL_NO') {
        if (!userVote || getVoteType(userVote) !== 'downvote') {
            newVoteType = 'downvote';
            downvotes++;
        }
    }

    // Add or reset user's vote based on new vote type
    if (newVoteType) {
        suggestion.userVotes.push(`${user.id}:${newVoteType}`);
    }

    // Update suggestion in MongoDB
    suggestion.upvotes = upvotes;
    suggestion.downvotes = downvotes;
    await suggestion.save();

    // Update the embed with new vote counts
    const updatedEmbed = EmbedBuilder.from(message.embeds[0])
        .setFields(
            { name: '🟢 Upvotes', value: `${upvotes}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }, // Separator
            { name: '🔴 Downvotes', value: `${downvotes}`, inline: true }
        );

    // Edit the original message to reflect the new vote counts
    await message.edit({ embeds: [updatedEmbed] });

    // Acknowledge the button interaction
    await interaction.deferUpdate();
}

module.exports = { handleSuggestionInteraction };