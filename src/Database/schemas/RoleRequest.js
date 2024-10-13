// database/schemas/RoleRequest.js
const mongoose = require('mongoose');

/**
 * Modèle Mongoose pour une demande de rôle
 * @memberof RoleRequest
 */
const roleRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  status: { type: String, default: 'pending' },  // Statut de la demande (pending, accepted, refused)
  reason: { type: String },  // Raison du refus si applicable
  requestedAt: { type: Date, default: Date.now },  // Date de la demande
  updatedAt: { type: Date }, // Date de la dernière mise à jour
});

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
