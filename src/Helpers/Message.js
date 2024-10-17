const logger = require('@Helpers/Logger');

/**
 * Utility function to send an ephemeral follow-up and delete it after a delay.
 * @param {Interaction} interaction - The Discord interaction object
 * @param {Object} options - The options to pass to interaction.followUp
 * @param {number} timeout - The delay before deleting the message (default 5000ms)
 * @param {boolean} ephemeral - Whether the follow-up message should be ephemeral (default true)
 */
async function safeReply(interaction, options, timeout = 5000, ephemeral = true) {
    await interaction.reply({ ...options, ephemeral });
  
    setTimeout(async () => {
        try {
            await interaction.deleteReply();
        } catch (err) {
            logger.error('Erreur lors de la suppression du message:', err);
        }
    }, timeout);
}
  
/**
 * Utility function to send an ephemeral follow-up and delete it after a delay.
 * @param {Interaction} interaction - The Discord interaction object
 * @param {Object} options - The options to pass to interaction.followUp
 * @param {number} timeout - The delay before deleting the message (default 5000ms)
 * @param {boolean} ephemeral - Whether the follow-up message should be ephemeral (default true)
 */
async function safeFollowUp(interaction, options, timeout = 5000, ephemeral = true) {
    await interaction.followUp({ ...options, ephemeral });
    
    setTimeout(async () => {
        try {
            await interaction.deleteReply();
        } catch (err) {
            logger.error('Erreur lors de la suppression du message:', err);
        }
    }, timeout);
}

module.exports = { safeReply, safeFollowUp};