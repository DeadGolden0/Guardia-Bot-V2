const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  groupeNumber: { type: Number, required: true },
  leaderId: { type: String, required: true },
  memberIds: { type: [String], default: [] }, // Liste des membres du projet
  roleId: { type: String, required: true },
  leaderRoleId: { type: String, required: true },
  categoryId: { type: String, required: true },
  textChannelId: { type: String, required: true },
  voiceChannelId: { type: String, required: true },
  infoChannelId: { type: String, required: true },
  confirmationPending: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, // Pourcentage d'avancement du projet (0-100%)
  techDocsStatus: { type: String, default: 'En cours...' }, // Statut des documents techniques (en cours/terminé)
  presentationStatus: { type: String, default: 'En cours...' }, // Statut du diaporama (en cours/terminé)
  tasks: { // Assignation des tâches aux membres
    type: [{
      member: { type: String }, // ID ou nom du membre
      task: { type: String } // Description de la tâche assignée
    }],
    default: []
  },
  status: { type: String, default: 'active' },

}, { timestamps: true }); // Inclure les dates de création et de modification

module.exports = mongoose.model('Project', projectSchema);
