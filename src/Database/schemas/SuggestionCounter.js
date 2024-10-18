const mongoose = require('mongoose');


/**
 * @file SuggestionCounter.js
 * @description Mongoose schema for managing the suggestion counter.
 * @module SuggestionCounter
*/

 /**
 * SuggestionCounter schema definition.
 * @typedef {Object} SuggestionCounter
 * @property {string} guildId - The unique identifier for the guild.
 * @property {number} counter - The counter for suggestions, defaults to 0.
*/
const SuggestionCounterSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  counter: { type: Number, default: 0 }
});

module.exports = mongoose.model('SuggestionCounter', SuggestionCounterSchema);
