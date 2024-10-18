const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { safeFollowUp } = require('@Helpers/Message');
const { EmbedBuilder } = require('discord.js');
const { PROJECTS } = require('@Config/Config');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Adds a member to an existing project, assigns the project role, and updates the project info embed.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmember')
    .setDescription('Ajouter un membre au projet actuel.')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à ajouter au projet')
        .setRequired(true)),

  async execute(interaction) {
    if (!PROJECTS.ENABLED) {
      return safeFollowUp(interaction, { content: Responses.projectsDisabled });
    }


    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Check if the user is the leader of an active project
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) {
      return safeFollowUp(interaction, { content: Responses.noProject });
    }

    // Check if the member is already in the project
    const isMemberAlreadyInProject = await isMemberInProject(project._id, member.id);
    if (isMemberAlreadyInProject) {
      return safeFollowUp(interaction, { content: Responses.alreadyInProject(member) });
    }

    // Add the member to the project and assign the project role
    project.memberIds.push(member.id);
    await project.save();

    const guildMember = await interaction.guild.members.fetch(member.id);
    await guildMember.roles.add(project.roleId);

    // Update the project info embed
    await updateProjectInfoEmbed(project, interaction);

    // Retrieve the discussion channel for the project
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      return safeFollowUp(interaction, { content: Responses.errors.simpleError });
    }

    // Ghost ping the added member and delete the ping message immediately
    const ghostPingMessage = await textChannel.send(`<@${member.id}>`);
    setTimeout(() => ghostPingMessage.delete().catch(() => {}), 50);

    // Create an embed to notify the project group of the new member
    const embed = new EmbedBuilder()
      .setTitle('👥 Nouveau membre ajouté au projet')
      .setDescription(`<@${leaderId}> a ajouté <@${member.id}> au groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#00FF00')
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Send the embed to the project's discussion channel
    await textChannel.send({ embeds: [embed] });

    // Log the successful addition of the member
    logger.log(`[ADD_PROJECT] Le membre ${member.tag} a été ajouté au groupe de projet numéro ${project.groupeNumber} avec succès.`);

    // Confirmation message to the leader
    return safeFollowUp(interaction, { content: Responses.memberAdded(member, project.groupeNumber) });
  },
};
