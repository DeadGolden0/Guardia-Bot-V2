const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectLeader } = require('@Helpers/Validators');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('endproject')
    .setDescription('Met fin à votre projet actuel en supprimant les channels et rôles associés. (Lead groupe uniquement)'),

  async execute(interaction) {
    const leaderId = interaction.user.id;

    // Vérifier si l'utilisateur est leader du projet
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) { 
      return interaction.reply({ content: Responses.notLeader, ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
    }

    // Vérifier si une confirmation est déjà en cours pour ce projet
    if (project.confirmationPending) { 
      return interaction.reply({ content: Responses.confirmationPending, ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000)); 
    }

    // Mettre à jour le projet pour indiquer qu'une confirmation est en cours
    project.confirmationPending = true;
    await project.save();

    // Récupérer le channel texte du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { 
      return interaction.reply({ content: Responses.simpleError, ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000)); 
    }

    // répondre à l'interaction avec un message de confirmation
    await interaction.reply({ content: Responses.endProject(project.groupeNumber), ephemeral: true })
      .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));

    // Créer un embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('❗ Confirmation de la fin du projet')
      .setDescription(`Êtes-vous sûr de vouloir mettre fin au groupe de projet **n°${project.groupeNumber}** ?\n\n **Cette action est irréversible.**`)
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
    const filter = i => i.user.id === leaderId && ['confirmEndProject', 'cancelEndProject'].includes(i.customId);
    const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirmEndProject') {
        try {
          // Supprimer les canaux et les rôles associés au projet
          const channels = ['textChannelId', 'infoChannelId', 'voiceChannelId', 'categoryId'].map(id => interaction.guild.channels.cache.get(project[id]));
          for (const channel of channels) {
            if (channel) await channel.delete();
          }

          const roles = ['roleId', 'leaderRoleId'].map(id => interaction.guild.roles.cache.get(project[id]));
          for (const role of roles) {
            if (role) await role.delete();
          }

          // Mettre à jour le projet dans MongoDB
          project.status = 'terminated';
          project.confirmationPending = false;
          await project.save();

          logger.log(`[END_PROJECT] Le groupe de projet numéro ${project.groupeNumber} a été supprimé avec succès.`);
        } catch (error) {
          logger.error(`[END_PROJECT] Erreur lors de la suppression du projet ${project.groupeNumber}: ${error.message}`);
          return interaction.followUp({ content: Responses.simpleError, ephemeral: true });
        }
      } else if (i.customId === 'cancelEndProject') {
        // Supprimer l'embed initial
        await confirmationMessage.delete();

        // Envoyer un message éphémère d'annulation
        await interaction.followUp({ content: Responses.projectDeletionCancelled, ephemeral: true });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

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

        logger.warn(`[END_PROJECT] Temps écoulé pour la confirmation de la suppression du projet ${project.groupeNumber}.`);

        // Supprimer l'embed initial
        await confirmationMessage.delete();

        // Envoyer un message éphémère de temps écoulé
        await interaction.followUp({ content: Responses.cancelEndProject, ephemeral: true });
        setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      }
    });
  },
};
