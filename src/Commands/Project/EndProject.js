const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('endproject')
    .setDescription('Met fin à votre projet actuel en supprimant les channels et rôles associés.'),

  async execute(interaction) {
    const leaderId = interaction.user.id;

    // Vérifier si cet utilisateur est le leader d'un projet actif
    const project = await Project.findOne({ leaderId, status: 'active' });
    if (!project) {
      logger.warn(`[END_PROJECT] L'utilisateur ${interaction.user.tag} a tenté de mettre fin à un projet sans en avoir un actif.`);
      return interaction.reply({ content: `Oops! Vous n'avez pas de projet actif.`, ephemeral: true });
    }

    // Vérifier si une confirmation est déjà en cours pour ce projet
    if (project.confirmationPending) {
      return interaction.reply({ content: 'Une confirmation est déjà en cours pour ce projet.', ephemeral: true });
    }

    // Mettre à jour le projet pour indiquer qu'une confirmation est en cours
    project.confirmationPending = true;
    await project.save();

    // Récupérer le channel texte du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      logger.error(`[END_PROJECT] Le channel de discussion du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel de discussion du projet est introuvable.', ephemeral: true });
    }

    interaction.reply({ content: `Une demande de confirmation pour mettre fin au groupe de projet **numéro ${project.groupeNumber}** a été envoyée.`, ephemeral: true });

    // Créer un embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('❗ Confirmation de la fin du projet')
      .setDescription(`Êtes-vous sûr de vouloir mettre fin au groupe de projet **numéro ${project.groupeNumber}** ? **Cette action est irréversible.**`)
      .setColor('#FF0000')
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Créer des boutons de confirmation et d'annulation
    const cancelButton = new ButtonBuilder()
    .setCustomId('cancelEndProject')
    .setLabel('Annuler')
    .setStyle(ButtonStyle.Secondary);

    const confirmButton = new ButtonBuilder()
      .setCustomId('confirmEndProject')
      .setLabel('Confirmer')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(cancelButton, confirmButton);

    // Ghost ping pour le leader
    const ghostPingMessage = await textChannel.send(`<@${leaderId}>`);
    setTimeout(() => ghostPingMessage.delete().catch(() => {}), 50); // Supprimer après 50 ms

    // Envoyer l'embed de confirmation dans le channel de discussion
    const confirmationMessage = await textChannel.send({ embeds: [confirmEmbed], components: [row] });

    // Écouter les interactions sur les boutons
    const filter = i => i.user.id === leaderId && (i.customId === 'confirmEndProject' || i.customId === 'cancelEndProject');
    const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirmEndProject') {
        // Confirmer la suppression du projet
        await i.update({ content: 'Projet terminé. Suppression en cours...', components: [], ephemeral: true });

        try {
          // Supprimer le channel texte
          const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
          if (textChannel) await textChannel.delete();

          const infoChannel = interaction.guild.channels.cache.get(project.infoChannelId);
          if (infoChannel) await infoChannel.delete();
          logger.log(`[END_PROJECT] Les channels texte du projet ${project.groupeNumber} a été supprimé.`);

          // Supprimer le channel vocal
          const voiceChannel = interaction.guild.channels.cache.get(project.voiceChannelId);
          if (voiceChannel) await voiceChannel.delete();
          logger.log(`[END_PROJECT] Le channel vocal du projet ${project.groupeNumber} a été supprimé.`);

          // Supprimer les channels et la catégorie
          const category = interaction.guild.channels.cache.get(project.categoryId);
          if (category) await category.delete();
          logger.log(`[END_PROJECT] Catégorie et channels du projet ${project.groupeNumber} supprimés.`);

          // Supprimer les rôles
          const role = interaction.guild.roles.cache.get(project.roleId);
          const leaderRole = interaction.guild.roles.cache.get(project.leaderRoleId);
          if (role) await role.delete();
          if (leaderRole) await leaderRole.delete();
          logger.log(`[END_PROJECT] Rôles associés au projet ${project.groupeNumber} supprimés.`);

          // Mettre à jour le projet dans MongoDB
          project.status = 'terminated';
          project.confirmationPending = false; // Annuler la confirmation en cours
          await project.save();
            
          logger.log(`[END_PROJECT] Le groupe de projet numéro ${project.groupeNumber} a été supprimé avec succès.`);
        } catch (error) {
          logger.error(`[END_PROJECT] Erreur lors de la suppression du projet ${project.groupeNumber}: ${error.message}`);
          return interaction.followUp({ content: 'Une erreur est survenue lors de la suppression du projet.', ephemeral: true });
        }
      } else if (i.customId === 'cancelEndProject') {
        // Annuler la suppression du projet
        await i.update({ content: 'Suppression du projet annulée.', components: [], ephemeral: true });
        project.confirmationPending = false;
        await project.save();
        logger.log(`[END_PROJECT] L'utilisateur ${interaction.user.tag} a annulé la suppression du projet ${project.groupeNumber}.`);
      }
    });

    // Si l'utilisateur ne répond pas dans le temps imparti
    collector.on('end', async collected => {
      if (collected.size === 0) {
        project.confirmationPending = false;
        await project.save();
        confirmationMessage.edit({ content: 'Temps de confirmation écoulé. Suppression du projet annulée.', components: [] });
        logger.warn(`[END_PROJECT] Temps écoulé pour la confirmation de la suppression du projet ${project.groupeNumber}.`);
      }
    });
  },
};
