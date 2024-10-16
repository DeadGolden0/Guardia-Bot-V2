module.exports = {
  // ----- Project Errors -----
  alreadyHasProject: (groupNumber) => `Vous avez déjà un projet en cours avec le groupe numéro **${groupNumber}**. Vous devez terminer ce projet avant d'en créer un nouveau.`,
  groupExists: (groupNumber) => `Le groupe de projet numéro **${groupNumber}** existe déjà. Veuillez choisir un autre numéro de groupe.`,
  noProject: `Oops! il semblerait que vous n'avez pas de projet actif.`,
  simpleError: `Une erreur s'est produite. Veuillez réessayer.`,
  invalidGroupNumber: `Le numéro de groupe doit être supérieur à 0.`,
  infoChannelNotFound: `Le channel d'information du projet est introuvable.`,
  infoMessageNotFound: `Le message d'information du projet est introuvable.`,
  confirmationPending: `Une confirmation est déjà en cours pour ce projet.`,
  progressInvalid: `Le pourcentage de progression doit être compris entre 0 et 100.`,

  // ----- Member Errors -----
  alreadyInProject: (memberTag) => `${memberTag} fait déjà partie de ce groupe de projet.`,
  memberNotFound: (memberTag) => `${memberTag} ne fait pas partie de ce groupe de projet.`,
  memberAlreadyInProject: (memberTag) => `**${memberTag}** fait déjà partie de ce projet.`,
  notLeader: `Oops! il semblerait que vous n'êtes pas le leader d'un groupe de projet.`,
  leaderSelfRemove: `Vous ne pouvez pas vous retirer vous-même du projet.`,
  leaderCannotLeave: `Le leader du projet ne peut pas quitter le projet. Utilisez la commande /endproject pour mettre fin au projet.`,

  // ----- Project Success -----
  projectCreated: (groupNumber) => `Le projet **numéro ${groupNumber}** a été créé avec succès.`,
  projectUpdated: (groupNumber) => `Le projet **numéro ${groupNumber}** a été mis à jour avec succès.`,
  projectDeletionCancelled: `La suppression du projet a été annulée.`,

  // ----- Member Success -----
  memberAdded: (memberTag, groupNumber) => `${memberTag} a bien été ajouté au projet numéro **${groupNumber}** avec succès.`,
  memberRemoved: (memberTag, groupNumber) => `${memberTag} a été retiré du groupe de projet numéro **${groupNumber}** avec succès.`,
  LeaveProject: (groupNumber) => `Vous avez quitté le groupe de projet numéro **${groupNumber}** avec succès.`,

  // ----- Task Success -----
  taskUpdated: (taskMemberTag, task) => `La tâche de ${taskMemberTag} a été mise à jour : **${task}**.`,

  // ----- Confirmations -----
  endProject: (groupNumber) => `Êtes-vous sûr de vouloir mettre fin au groupe de projet **numéro ${groupNumber}** ? Cette action est irréversible.`,
  cancelEndProject: `Temps écoulé. La suppression du projet a été annulée.`,
};
