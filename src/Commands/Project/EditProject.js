const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

// Fonction pour créer une barre de progression
function createProgressBar(progress) {
  const totalBlocks = 22; // Nombre total de blocs dans la barre
  const filledBlocks = Math.round((progress / 100) * totalBlocks); // Blocs remplis selon le pourcentage
  const emptyBlocks = totalBlocks - filledBlocks;
  
  return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks); // Barres remplies et vides
}

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

    // Vérifier si l'utilisateur est membre d'un projet actif
    const project = await Project.findOne({ memberIds: memberId, status: 'active' });
    if (!project) {
      logger.warn(`[EDIT_PROJECT] L'utilisateur ${interaction.user.tag} a tenté de modifier un projet sans y être membre.`);
      return interaction.reply({ content: `Oops! Vous ne faites pas partie d'un projet actif.`, ephemeral: true });
    }

    const progress = interaction.options.getInteger('progress');
    const techDocsStatus = interaction.options.getString('techdocs_status');
    const presentationStatus = interaction.options.getString('presentation_status');

    let updateFields = ''; // Pour garder une trace des champs modifiés

    // Vérifier et modifier le pourcentage de progression
    if (progress !== null) {
      if (progress < 0 || progress > 100) {
        return interaction.reply({ content: 'Le pourcentage de progression doit être compris entre 0 et 100.', ephemeral: true });
      }
      project.progress = progress;
      updateFields += `📈 **Avancement** modifié à : **${progress}%**\n`;
    }

    // Vérifier et modifier le statut des documents techniques
    if (techDocsStatus) {
      project.techDocsStatus = techDocsStatus;
      updateFields += `📄 **Statut des documents techniques** modifié en : **${techDocsStatus}**\n`;
    }

    // Vérifier et modifier le statut du diaporama
    if (presentationStatus) {
      project.presentationStatus = presentationStatus;
      updateFields += `🎞️ **Statut du diaporama** modifié en : **${presentationStatus}**\n`;
    }

    if (!updateFields) {
      return interaction.reply({ content: 'Aucune modification spécifiée.', ephemeral: true });
    }

    // Sauvegarder les modifications dans la base de données
    await project.save();
    logger.log(`[EDIT_PROJECT] Le projet ${project.groupeNumber} a été modifié par ${interaction.user.tag} : ${updateFields}`);

    // Récupérer le channel d'information du projet
    const infoChannel = interaction.guild.channels.cache.get(project.infoChannelId);
    if (!infoChannel) {
      logger.error(`[EDIT_PROJECT] Le channel d'information du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel d\'information du projet est introuvable.', ephemeral: true });
    }

    // Mettre à jour l'embed d'info avec la nouvelle progression et le statut
    const updatedEmbed = new EmbedBuilder()
      .setTitle(`📊 Informations sur le groupe projet **n°${project.groupeNumber}**`)
      .setColor('#2F3136')
      .addFields(
        { name: '👥 **Membres du Projet:**', value: project.memberIds.map(id => `<@${id}>`).join(', '), inline: false },
        
        { name: '\u200B', value: '───────────', inline: false },

        // Afficher la barre de progression mise à jour
        { name: '📈 **Avancement:**', value: `${project.progress}%\n${createProgressBar(project.progress)}`, inline: false },

        { name: '\u200B', value: '───────────', inline: false },

        { name: '⏳ **Durée:**', value: `**0** jours`, inline: true },
        { name: '🕒 **Temps restant:**', value: `À déterminer jours avant la remise (Vendredi)`, inline: true },

        { name: '\u200B', value: '───────────', inline: false },

        { name: '📄 **Documents Techniques:**', value: `${project.techDocsStatus}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }, 
        { name: '🎞️ **Statut Diaporama:**', value: `${project.presentationStatus}`, inline: true },

        { name: '\u200B', value: '───────────', inline: false },

        { name: '🛠️ **Tâches Assignées:**', value: project.tasks.map(t => `- **${t.member}**: ${t.task}`).join('\n') || 'Aucune tâche assignée', inline: false }
      )
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    // Mettre à jour l'embed dans le channel d'information
    const infoMessage = await infoChannel.messages.fetch({ limit: 1 }).then(messages => messages.first());
    await infoMessage.edit({ embeds: [updatedEmbed] });

    // Envoyer une confirmation à l'utilisateur
    return interaction.reply({ content: 'Les modifications du projet ont été enregistrées avec succès.', ephemeral: true });
  },
};
