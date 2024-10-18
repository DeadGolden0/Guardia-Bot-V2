const mongoose = require('mongoose');

/**
 * Mongoose schema for storing suggestion information.
 * @memberof Suggestion
 */
const SuggestionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  suggestionId: { type: Number, required: true, unique: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  userVotes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Suggestion', SuggestionSchema);
