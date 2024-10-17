const handlePresence = require("@Handlers/presenceHandler");
const { PRESENCE } = require("@Config/Config");
const logger = require('@Helpers/Logger');

/**
 * Handles the bot's ready event, logging the connection status and updating the bot's presence.
 * 
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @returns {Promise<void>} - Resolves when the presence has been updated (if applicable).
 * 
 * @example
 * client.on('ready', async () => {
 *   require('./path/to/this/file')(client);
 * });
 * 
 * @description
 * This function is triggered when the bot is connected and ready. It logs the bot's status 
 * and, if presence updates are enabled in the configuration, it calls the `handlePresence`
 * function to update the bot's presence accordingly.
 */
module.exports = async (client) => {
    // Log the bot's connection status
    logger.ready(`Bot is now connected as ${client.user.tag} 🚀`);

    // Update the bot's presence if enabled in the config
    if (PRESENCE.ENABLED) {
        handlePresence(client);
    }
};