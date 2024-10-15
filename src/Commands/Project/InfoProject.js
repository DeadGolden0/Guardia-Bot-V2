const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infoproject')
    .setDescription('Affiche les informations actuelles sur le projet en cours.'),

  async execute(interaction) {
    const memberId = interaction.user.id;

    // Vérifier si l'utilisateur est membre d'un projet actif
    const project = await Project.findOne({ memberIds: memberId, status: 'active' });
    if (!project) {
      logger.warn(`[INFO_PROJECT] L'utilisateur ${interaction.user.tag} a tenté d'afficher un projet sans être membre.`);
      return interaction.reply({ content: `Oops! Vous ne faites pas partie d'un projet actif.`, ephemeral: true });
    }

    // Calculer le temps écoulé depuis la création du projet
    const startDate = new Date(project.createdAt);
    const now = new Date();
    const timePassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)); // Nombre de jours

    // Calculer le temps restant avant la date limite (vendredi le plus proche)
    const friday = new Date(now);
    friday.setDate(friday.getDate() + (5 - friday.getDay() + 7) % 7); // Obtenir le vendredi le plus proche
    const timeLeft = Math.floor((friday - now) / (1000 * 60 * 60 * 24)); // Nombre de jours

    // Barre de progression : 10 segments
    const totalBars = 22;
    const progressBars = Math.round((project.progress / 100) * totalBars); // Nombre de segments remplis
    const emptyBars = totalBars - progressBars; // Nombre de segments vides
    const progressBar = '🟩'.repeat(progressBars) + '⬜'.repeat(emptyBars); // Utilisation d'emojis pour créer la barre

    // Récupérer les membres du projet
    const memberList = project.memberIds.map(id => `<@${id}>`).join('\n') || 'Aucun membre ajouté';

    // Préparer l'embed des informations
    const embed = new EmbedBuilder()
      .setTitle(`📊 Informations sur le groupe projet **n°${project.groupeNumber}**`)
      .setColor('#2F3136') // Un gris foncé, style plus sobre
      .addFields(
        { name: '👥 **Membres du Projet:**', value: memberList, inline: false },
        
        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '📈 **Avancement:**', value: `**${project.progress}%**\n${progressBar}`, inline: false },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '⏳ **Durée:**', value: `**${timePassed}** jours`, inline: true },
        { name: '🕒 **Temps restant:**', value: `**${timeLeft}** jours avant la remise (Vendredi)`, inline: true },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur
        
        { name: '📄 **Documents Techniques:**', value: `${project.techDocsStatus}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: '🎞️ **Statut Diaporama:**', value: `${project.presentationStatus}`, inline: true },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { 
          name: '🛠️ **Tâches Assignées:**', 
          value: project.tasks.map(t => `- **${t.member}**: ${t.task}`).join('\n') || 'Aucune tâche assignée', 
          inline: false 
        }
      )
      //.setImage('https://i.imgur.com/xyz123.png') // Exemple : tu peux utiliser un séparateur ou bannière personnalisée
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    // Récupérer le canal de discussion du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      logger.error(`[INFO_PROJECT] Le channel de discussion du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel de discussion du projet est introuvable.', ephemeral: true });
    }

    // Envoyer les informations du projet dans le channel de discussion du projet
    await textChannel.send({ embeds: [embed] });

    // Réponse éphémère pour confirmer à l'utilisateur que le message a été envoyé
    return interaction.reply({ content: `Les informations du projet numéro **${project.groupeNumber}** ont été postées dans le canal de discussion du projet.`, ephemeral: true });
  },
};
