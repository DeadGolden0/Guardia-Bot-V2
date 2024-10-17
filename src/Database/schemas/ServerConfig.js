const mongoose = require('mongoose');

/**
 * Mongoose model for server configuration
 * @memberof ServerConfig
 */
const ServerConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  staffChannelId: { type: String, default: null },
  roleChannelId: { type: String, default: null },
  voteChannelId: { type: String, default: null },
});

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);