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

    // Utiliser le validateur pour vérifier si l'utilisateur est leader du projet
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) { return interaction.reply({ content: Responses.errors.notLeader(interaction.user.tag), ephemeral: true }); }

    // Vérifier si une confirmation est déjà en cours pour ce projet
    if (project.confirmationPending) { return interaction.reply({ content: Responses.errors.confirmationPending, ephemeral: true }); }

    // Mettre à jour le projet pour indiquer qu'une confirmation est en cours
    project.confirmationPending = true;
    await project.save();

    // Récupérer le channel texte du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { return interaction.reply({ content: Responses.errors.discutionChannelNotFound, ephemeral: true }); }

    interaction.reply({ content: Responses.confirmations.endProject(project.groupeNumber), ephemeral: true });

    // Créer un embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setTitle('❗ Confirmation de la fin du projet')
      .setDescription(`Êtes-vous sûr de vouloir mettre fin au groupe de projet **n°${project.groupeNumber}** ? **Cette action est irréversible.**`)
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
        await i.update({ content: Responses.success.projectTerminating, components: [], ephemeral: true });

        try {
          // Supprimer le channel texte
          const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
          if (textChannel) await textChannel.delete();

          const infoChannel = interaction.guild.channels.cache.get(project.infoChannelId);
          if (infoChannel) await infoChannel.delete();

          // Supprimer le channel vocal
          const voiceChannel = interaction.guild.channels.cache.get(project.voiceChannelId);
          if (voiceChannel) await voiceChannel.delete();

          // Supprimer les channels et la catégorie
          const category = interaction.guild.channels.cache.get(project.categoryId);
          if (category) await category.delete();

          // Supprimer les rôles
          const role = interaction.guild.roles.cache.get(project.roleId);
          const leaderRole = interaction.guild.roles.cache.get(project.leaderRoleId);
          if (role) await role.delete();
          if (leaderRole) await leaderRole.delete();

          // Mettre à jour le projet dans MongoDB
          project.status = 'terminated';
          project.confirmationPending = false;
          await project.save();

          logger.log(`[END_PROJECT] Le groupe de projet numéro ${project.groupeNumber} a été supprimé avec succès.`);
        } catch (error) {
          logger.error(`[END_PROJECT] Erreur lors de la suppression du projet ${project.groupeNumber}: ${error.message}`);
          return interaction.followUp({ content: Responses.errors.projectDeletionError, ephemeral: true });
        }
      } else if (i.customId === 'cancelEndProject') {
        await i.update({ content: Responses.success.projectDeletionCancelled, components: [], ephemeral: true });

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

        confirmationMessage.edit({ content: Responses.errors.confirmationTimeout, components: [] });
        logger.warn(`[END_PROJECT] Temps écoulé pour la confirmation de la suppression du projet ${project.groupeNumber}.`);
      }
    });
  },
};