const { PermissionsBitField, ChannelType } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getChannelByType } = require('@Helpers/getChannels');
const { isProjectLeader } = require('@Helpers/Validators');
const { safeFollowUp } = require('@Helpers/Message');
const Project = require('@Database/schemas/Project');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-channel')
    .setDescription('Ajoute un nouveau channel texte ou vocal dans la catégorie de votre projet.')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type de channel à créer (text ou voice)')
        .setRequired(true)
        .addChoices(
          { name: 'text', value: 'text' },
          { name: 'voice', value: 'voice' }
        ))
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nom du channel à créer')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const channelType = interaction.options.getString('type');
    const channelName = interaction.options.getString('name');

    // Vérifier si l'utilisateur est le leader d'un projet actif
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) {
      return safeFollowUp(interaction, { content: Responses.noProject });
    }

    // Récupérer la catégorie du projet
    const categoryChannel = getChannelByType(project, 'category', interaction.guild);
    if (!categoryChannel) {
      return safeFollowUp(interaction, { content: 'La catégorie du projet est introuvable.' });
    }

    // Créer le channel texte ou vocal dans la catégorie
    try {
      let newChannel;
      if (channelType === 'text') {
        newChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: categoryChannel.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id, // Everyone
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: project.roleId, // Rôle du projet
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages],
            },
            {
              id: project.leaderRoleId, // Rôle du leader
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages],
            },
          ],
        });
      } else if (channelType === 'voice') {
        newChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: categoryChannel.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id, // Everyone
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: project.roleId, // Rôle du projet
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
            },
            {
              id: project.leaderRoleId, // Rôle du leader
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
            },
          ],
        });
      }

      // Ajouter l'ID du nouveau channel à la liste `channelIds` du projet
      project.channelIds.push({ id: newChannel.id, type: channelType });
      await project.save();

      logger.log(`[ADD_CHANNEL] Le channel "${channelName}" de type "${channelType}" a été ajouté avec succès au projet n°${project.groupeNumber} par ${interaction.user.tag}.`);
      return safeFollowUp(interaction, { content: `Le channel **${channelName}** a été créé avec succès.` });

    } catch (error) {
      logger.error(`[ADD_CHANNEL] Erreur lors de la création du channel : ${error.message}`);
      return safeFollowUp(interaction, { content: 'Une erreur est survenue lors de la création du channel.' });
    }
  },
};
