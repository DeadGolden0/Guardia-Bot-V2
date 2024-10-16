const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectMember } = require('@Helpers/Validators');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

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

    // Utiliser le validateur pour vérifier si l'utilisateur est membre d'un projet actif
    const { project, isMember } = await isProjectMember(memberId);
    if (!isMember) { return interaction.reply({ content: Responses.errors.noProject(interaction.user.tag), ephemeral: true });}

    const progress = interaction.options.getInteger('progress');
    const techDocsStatus = interaction.options.getString('techdocs_status');
    const presentationStatus = interaction.options.getString('presentation_status');
    let isModified = false;

    // Vérifier et modifier le pourcentage de progression
    if (progress !== null) {
      if (progress < 0 || progress > 100) {
        return interaction.reply({ content: Responses.errors.progressInvalid, ephemeral: true });
      }
      project.progress = progress;
      isModified = true;
    }

    // Vérifier et modifier le statut des documents techniques
    if (techDocsStatus) {
      project.techDocsStatus = techDocsStatus;
      isModified = true;
    }

    // Vérifier et modifier le statut du diaporama
    if (presentationStatus) {
      project.presentationStatus = presentationStatus;
      isModified = true;
    }

    if (!isModified) {
      return interaction.reply({ content: 'Aucune modification spécifiée.', ephemeral: true });
    }

    // Sauvegarder les modifications dans la base de données
    await project.save();

    // Utiliser le module pour mettre à jour l'embed d'information
    await updateProjectInfoEmbed(project, interaction);

    // Confirmation de la mise à jour
    logger.log(`[EDIT_PROJECT] Le projet ${project.groupeNumber} a été modifié avec succès par ${interaction.user.tag}.`);
    return interaction.reply({ content: Responses.success.projectUpdated(project.groupeNumber), ephemeral: true });
  },
};