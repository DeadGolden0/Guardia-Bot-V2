const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  groupeNumber: { type: Number, required: true },
  leaderId: { type: String, required: true },
  memberIds: { type: [String], default: [] },
  roleId: { type: String, required: true },
  leaderRoleId: { type: String, required: true },
  categoryId: { type: String, required: true },
  textChannelId: { type: String, required: true },
  voiceChannelId: { type: String, required: true },
  infoChannelId: { type: String, required: true },
  confirmationPending: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  daysUntilFriday : { type: Number, default: 0 },
  techDocsStatus: { type: String, default: 'En cours...' },
  presentationStatus: { type: String, default: 'En cours...' },
  tasks: {
    type: [{
      member: { type: String },
      task: { type: String }
    }],
    default: []
  },
  status: { type: String, default: 'active' },

}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
