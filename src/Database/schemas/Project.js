const mongoose = require('mongoose');

// Define the schema for the Project model
const projectSchema = new mongoose.Schema({
  // Group information
  groupeNumber: { type: Number, required: true },
  leaderId: { type: String, required: true },
  memberIds: { type: [String], default: [] },
  
  // Role information
  roleId: { type: String, required: true },
  leaderRoleId: { type: String, required: true },
  
  // Channel information
  channelIds: {
    type: [{
      id: { type: String, required: true },
      type: { type: String, required: true }
    }],
    default: []
  },
  
  // Project status and progress
  confirmationPending: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  daysUntilFriday: { type: Number, default: 0 },
  techDocsStatus: { type: String, default: 'En cours...' },
  presentationStatus: { type: String, default: 'En cours...' },
  
  // Task information
  tasks: {
    type: [{
      member: { type: String },
      task: { type: String }
    }],
    default: []
  },
  
  // Overall status
  status: { type: String, default: 'active' },
  
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
