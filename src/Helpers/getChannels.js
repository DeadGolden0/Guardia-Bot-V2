const ServerConfig = require('@Database/schemas/ServerConfig');
const logger = require('@Helpers/Logger');

/**
 * Retrieve the configured staff channel for a server
 * @param {Guild} guild - The Discord server
 * @returns {Channel} The staff channel, or null if not configured
 */
async function getStaffChannel(guild) {
  try {
    const config = await ServerConfig.findOne({ guildId: guild.id });
    if (!config || !config.staffChannelId) {
      logger.warn(`Le canal staff n'est pas configuré pour ${guild.name}.`);
      return null;
    }
    return guild.channels.cache.get(config.staffChannelId);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du canal staff : ${error.message}`);
    return null;
  }
}

/**
 * Retrieve the configured role channel for a server
 * @param {Guild} guild - The Discord server
 * @returns {Channel} The role channel, or null if not configured
 */
async function getRoleChannel(guild) {
  try {
    const config = await ServerConfig.findOne({ guildId: guild.id });
    if (!config || !config.roleChannelId) {
      logger.warn(`Le canal des rôles n'est pas configuré pour ${guild.name}.`);
      return null;
    }
    return guild.channels.cache.get(config.roleChannelId);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du canal des rôles : ${error.message}`);
    return null;
  }
}

/**
 * Retrieves a channel by its type from the project's channelIds.
 * @param {Object} project - The project object containing channel information.
 * @param {string} type - The type of channel to retrieve (e.g., 'info', 'discussion', 'vocal').
 * @param {Object} guild - The Discord guild object.
 * @returns {Object|null} - Returns the channel if found, otherwise null.
 */
function getChannelByType(project, type, guild) {
  try {
    // Rechercher le channel correspondant au type spécifié dans la liste channelIds
    const channelData = project.channelIds.find(channel => channel.type === type);
    if (!channelData) {
      return null;
    }

    // Récupérer le channel à partir de l'ID
    const channel = guild.channels.cache.get(channelData.id);
    return channel || null;
  } catch (error) {
    console.error(`[GET_CHANNEL] Erreur lors de la récupération du channel de type "${type}": ${error.message}`);
    return null;
  }
}

module.exports = { getStaffChannel, getRoleChannel, getChannelByType };