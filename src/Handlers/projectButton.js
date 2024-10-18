const { isProjectLeader } = require('@Helpers/Validators');
const { safeReply } = require('@Helpers/Message');
const Responses = require('@Config/Responses');
const { PROJECTS } = require('@Config/Config');
const logger = require('@Helpers/Logger');

/**
 * Handles the confirmation or cancellation of the project termination.
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @param {string} action - The action taken by the user (confirm or cancel).
 * @returns {Promise<void>}
 */
async function handleEndProject(interaction, action) {
  if (!PROJECTS.ENABLED) return;
  
  const leaderId = interaction.user.id;

  // Check if the user is the leader of the project
  const { project, isLeader } = await isProjectLeader(leaderId);
  if (!isLeader) {
    return safeReply(interaction, { content: Responses.notLeader });
  }

  if (action === 'PROJECT_CONFIRM') {
    // Delete project channels and roles
    const channels = ['textChannelId', 'infoChannelId', 'voiceChannelId', 'categoryId'].map(id => interaction.guild.channels.cache.get(project[id]));
    for (const channel of channels) {
      if (channel) await channel.delete();
    }

    const roles = ['roleId', 'leaderRoleId'].map(id => interaction.guild.roles.cache.get(project[id]));
    for (const role of roles) {
      if (role) await role.delete();
    }

    // After handling the action, delete the confirmation message
    if (PROJECTS.DELETE) {
      // Remove the project from the database
      await project.deleteOne();
    } else {
      // Update project status
      await project.updateOne({ status: 'terminated', confirmationPending: false });
    }

    logger.log(`[END_PROJECT] Le groupe de projet numéro ${project.groupeNumber} a été supprimé avec succès.`);

  } else if (action === 'PROJECT_CANCEL') {
    // After handling the action, delete the confirmation message
    if (interaction.message) {
      await interaction.message.delete().catch(err => {
        logger.error(`Erreur lors de la suppression du message de confirmation : ${err.message}`);
      });
    }

    // Cancel the project deletion
    project.confirmationPending = false;
    await project.save();

    await safeReply(interaction, { content: Responses.projectDeletionCancelled });
    logger.log(`[END_PROJECT] L'utilisateur ${interaction.user.tag} a annulé la suppression du projet ${project.groupeNumber}.`);
  }
}

module.exports = { handleEndProject };