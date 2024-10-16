const mongoose = require('mongoose');

/**
 * Mongoose model for a role request
 * @memberof RoleRequest
 */
const roleRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  status: { type: String, default: 'pending' },
  reason: { type: String },
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
