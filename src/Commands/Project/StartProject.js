const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const { isProjectLeader, isGroupNumberUnique } = require('@Helpers/Validators');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { createProjectInfoEmbed } = require('@Helpers/Embed');
const { getDaysUntilNextFriday, safeFollowUp } = require('@Helpers/Utils');
const Project = require('@Database/schemas/Project');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Starts a new project with a unique group number and creates the necessary channels and roles.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
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

    // Check that the group number is greater than 0
    if (groupeNumber <= 0) {
      return safeFollowUp(interaction, { content: Responses.invalidGroupNumber });
    }

    // Check if the user is already a project leader
    const { project: existingUserProject, isLeader } = await isProjectLeader(leaderId);
    if (isLeader) {
      return safeFollowUp(interaction, { content: Responses.alreadyHasProject(existingUserProject.groupeNumber) });
    }

    // Check if the group number is unique
    const isGroupUnique = await isGroupNumberUnique(groupeNumber);
    if (!isGroupUnique) {
      return safeFollowUp(interaction, { content: Responses.groupExists(groupeNumber) });
    }

    // Create roles (leader and group)
    const [leaderRole, groupRole] = await Promise.all([
      interaction.guild.roles.create({
        name: `Lead Groupe ${groupeNumber}`,
        color: 'Gold',
        mentionable: true,
        reason: `Rôle leader pour le groupe ${groupeNumber}`,
      }),
      interaction.guild.roles.create({
        name: `Groupe ${groupeNumber}`,
        color: 'Blue',
        mentionable: true,
        reason: `Rôle pour le groupe ${groupeNumber}`,
      }),
    ]);

    // Add roles to the leader
    const leaderMember = await interaction.guild.members.fetch(leaderId);
    await leaderMember.roles.add([groupRole, leaderRole]);

    // Create a category for the project
    const category = await interaction.guild.channels.create({
      name: `⭐ | Groupe ${groupeNumber}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // Everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: groupRole, // Groupe
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole, // Leader
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
        },
      ],
    });

    // Create channels in the project category
    const [infoChannel, textChannel, voiceChannel] = await Promise.all([
      interaction.guild.channels.create({
        name: `✨┇ɪɴꜰᴏ-ᴘʀᴏᴊᴇᴛ`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: groupRole, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] },
          { id: leaderRole, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages] },
        ],
      }),
      interaction.guild.channels.create({
        name: `💬┇ᴅɪꜱᴄᴜꜱꜱɪᴏɴ`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: groupRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          { id: leaderRole, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ],
      }),
      interaction.guild.channels.create({
        name: `🍹 ● ᴠᴏᴄᴀʟ`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: groupRole, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: leaderRole, allow: [PermissionsBitField.Flags.ViewChannel] },
        ],
      }),
    ]);

    // Calculate the remaining days until Friday
    const daysUntilFriday = getDaysUntilNextFriday();

    // Create the project information embed
    const infoEmbed = createProjectInfoEmbed({
      project: {
        groupeNumber,
        memberIds: [leaderId],
        progress: 0,
        daysUntilFriday,
        techDocsStatus: 'En cours...',
        presentationStatus: 'En cours...',
        tasks: []
      },
      CLIENT: interaction.client
    });

    // Send the info embed to the info channel
    await infoChannel.send({ embeds: [infoEmbed] });

    // Save project information to the database
    const project = new Project({
      groupeNumber,
      leaderId: leaderId,
      memberIds: [leaderId],
      roleId: groupRole.id,
      leaderRoleId: leaderRole.id,
      categoryId: category.id,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      infoChannelId: infoChannel.id,
      daysUntilFriday: daysUntilFriday,
      status: 'active',
    });

    // Save to MongoDB
    await project.save();

    // Confirmation of the created project
    logger.log(`[START_PROJECT] Projet démarré avec succès par ${interaction.user.tag}.`);
    return safeFollowUp(interaction, { content: Responses.projectCreated(groupeNumber) });
  },
};
