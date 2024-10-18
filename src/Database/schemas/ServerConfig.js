const mongoose = require('mongoose');

/**
 * Mongoose model for server configuration
 * 
 * @typedef {Object} ServerConfig
 * @property {string} guildId - The ID of the Discord guild (server)
 * @property {string} [staffChannelId=null] - The ID of the staff channel
 * @property {string} [roleChannelId=null] - The ID of the role channel
 * @property {string} [voteChannelId=null] - The ID of the vote channel
 * @property {string} [suggestionChannelId=null] - The ID of the suggestion channel
 * 
 * @description
 * This schema stores configuration data for Discord servers, including
 * the channels used for staff, roles, votes, and suggestions. Each server
 * is uniquely identified by its `guildId`.
 */
const ServerConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  staffChannelId: { type: String, default: null },
  roleChannelId: { type: String, default: null },
  voteChannelId: { type: String, default: null },
  suggestionChannelId: { type: String, default: null },
});

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);