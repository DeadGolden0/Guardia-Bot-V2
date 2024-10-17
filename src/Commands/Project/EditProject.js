const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectMember } = require('@Helpers/Validators');
const { safeFollowUp } = require('@Helpers/Message');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Edits the project's progress, technical document status, and presentation status, and updates the project info embed.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('editproject')
    .setDescription('Modifier la progression, le statut des documents techniques ou le statut du diaporama.')
    .addIntegerOption(option => 
      option.setName('progress')
        .setDescription('Modifier le pourcentage de progression du projet (entre 0 et 100)'))
    .addStringOption(option => 
      option.setName('techdocs_status')
        .setDescription('Modifier le statut des documents techniques (En cours, Terminé, etc.)'))
    .addStringOption(option => 
      option.setName('presentation_status')
        .setDescription('Modifier le statut du diaporama (En cours, Terminé, etc.)')),

  async execute(interaction) {
    const memberId = interaction.user.id;

    // Check if the user is a member of an active project
    const { project, isMember } = await isProjectMember(memberId);
    if (!isMember) {
      return safeFollowUp(interaction, { content: Responses.noProject });
    }

    const progress = interaction.options.getInteger('progress');
    const techDocsStatus = interaction.options.getString('techdocs_status');
    const presentationStatus = interaction.options.getString('presentation_status');
    let isModified = false;

    // Update project progress if valid
    if (progress !== null) {
      if (progress >= 0 && progress <= 100) {
        project.progress = progress;
        isModified = true;
      } else {
        return safeFollowUp(interaction, { content: Responses.progressInvalid });
      }
    }

    // Update technical documents status
    if (techDocsStatus) {
      project.techDocsStatus = techDocsStatus;
      isModified = true;
    }

    // Update presentation status
    if (presentationStatus) {
      project.presentationStatus = presentationStatus;
      isModified = true;
    }

    // If no modifications were made
    if (!isModified) {
      return safeFollowUp(interaction, { content: 'Aucune modification spécifiée.' });
    }

    // Save project modifications to the database
    await project.save();

    // Update the project info embed
    await updateProjectInfoEmbed(project, interaction);

    // Log the project update and send confirmation
    logger.log(`[EDIT_PROJECT] Le projet ${project.groupeNumber} a été modifié avec succès par ${interaction.user.tag}.`);
    return safeFollowUp(interaction, { content: Responses.projectUpdated(project.groupeNumber) });
  },
};
