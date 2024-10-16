const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const { isProjectLeader, isGroupNumberUnique } = require('@Helpers/Validators');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createProjectInfoEmbed } = require('@Helpers/Embed');
const { getDaysUntilNextFriday } = require('@Helpers/Utils');
const Project = require('@Database/schemas/Project');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startproject')
    .setDescription('Démarre un nouveau projet avec un numéro de groupe unique.')
    .addIntegerOption(option => 
      option.setName('groupe_number')
        .setDescription('Numéro unique du groupe')
        .setRequired(true)),

  async execute(interaction) {
    const groupeNumber = interaction.options.getInteger('groupe_number');
    const leaderId = interaction.user.id;

    // Vérifier que le numéro de groupe est supérieur à 0
    if (groupeNumber <= 0) { return interaction.reply({ content: Responses.errors.invalidGroupNumber, ephemeral: true }); }

    // Utiliser le validateur pour vérifier si l'utilisateur a déjà un projet actif
    const { project: existingUserProject, isLeader } = await isProjectLeader(leaderId);
    if (isLeader) { return interaction.reply({ content: Responses.errors.alreadyHasProject(existingUserProject.groupeNumber), ephemeral: true }); }

    // Utiliser le validateur pour vérifier si le numéro de groupe est unique
    const isGroupUnique = await isGroupNumberUnique(groupeNumber);
    if (!isGroupUnique) { return interaction.reply({ content: Responses.errors.groupExists(groupeNumber), ephemeral: true }); }

    // Utiliser deferReply pour répondre rapidement à l'interaction et éviter le timeout
    await interaction.reply({ content: 'Création du projet en cours... Veuillez patienter.', ephemeral: true });

    // Créer un rôle spécial pour le leader
    const leaderRole = await interaction.guild.roles.create({
        name: `Lead Groupe ${groupeNumber}`,
        color: 'Gold', // Or en hexadécimal
        mentionable: true,
        reason: `Rôle leader pour le groupe ${groupeNumber}`,
    });

    // Créer un rôle pour le groupe
    const role = await interaction.guild.roles.create({
      name: `Groupe ${groupeNumber}`,
      color: 'Blue', // Bleu en hexadécimal
      mentionable: true,
      reason: `Rôle pour le groupe ${groupeNumber}`,
    });

    // Ajouter les rôles au leader (l'utilisateur qui a utilisé la commande)
    const leaderMember = await interaction.guild.members.fetch(interaction.user.id);
    await leaderMember.roles.add(role);
    await leaderMember.roles.add(leaderRole);

    // Créer une catégorie pour le projet
    const category = await interaction.guild.channels.create({
      name: `⭐ | Groupe ${groupeNumber}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // Everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id, // Groupe spécifique
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id, // Leader
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
        },
      ],
    });

    // Créer un channel d'information dans cette catégorie
    const infoChannel = await interaction.guild.channels.create({
      name: `✨┇ɪɴꜰᴏ-ᴘʀᴏᴊᴇᴛ`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
          deny: [PermissionsBitField.Flags.SendMessages], // Interdire d'écrire
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
          deny: [PermissionsBitField.Flags.SendMessages], // Interdire d'écrire
        },
      ],
    });

    // Créer un channel texte et vocal dans cette catégorie
    const textChannel = await interaction.guild.channels.create({
      name: `💬┇ᴅɪꜱᴄᴜꜱꜱɪᴏɴ`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const voiceChannel = await interaction.guild.channels.create({
      name: `🍹 ● ᴠᴏᴄᴀʟ`,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    // Calculer les jours restants avant vendredi
    const daysUntilFriday = getDaysUntilNextFriday();

    // Créer l'embed d'informations du projet
    const infoEmbed = createProjectInfoEmbed({
      project: {
        groupeNumber,
        memberIds: [interaction.user.id],
        progress: 0,
        daysUntilFriday,
        techDocsStatus: 'En cours...',
        presentationStatus: 'En cours...',
        tasks: []
      },
      CLIENT: interaction.client
    });

    // Envoyer l'embed d'info dans le channel d'information
    await infoChannel.send({ embeds: [infoEmbed] });

    // Enregistrer les informations du projet dans la base de données
    const project = new Project({
      groupeNumber,
      leaderId: interaction.user.id,
      memberIds: [interaction.user.id],
      roleId: role.id,
      leaderRoleId: leaderRole.id,
      categoryId: category.id,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      infoChannelId: infoChannel.id,
      daysUntilFriday: daysUntilFriday,
      status: 'active',
    });

    await project.save(); // Sauvegarder dans MongoDB

    // Confirmation du projet créé
    logger.log(`[START_PROJECT] Projet démarré avec succès par ${interaction.user.tag}.`);
    return interaction.editReply({ content: Responses.success.projectCreated(groupeNumber) });
  },
};