const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { safeFollowUp } = require('@Helpers/Message');
const { EmbedBuilder } = require('discord.js');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Removes a member from the current project if the leader requests it, updates the project embed, and logs the action.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('kickmember')
    .setDescription('Retirer un membre du projet actuel. (Lead groupe uniquement)')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à retirer du projet')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Check if the user is the leader of the project
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) {
      return safeFollowUp(interaction, { content: Responses.notLeader });
    }

    // Prevent the leader from removing themselves
    if (member.id === leaderId) {
      return safeFollowUp(interaction, { content: Responses.leaderSelfRemove });
    }

    // Check if the member is part of the project
    const isMember = await isMemberInProject(project._id, member.id);
    if (!isMember) {
      return safeFollowUp(interaction, { content: Responses.memberNotFound(member) });
    }

    // Remove the member's project role from Discord if they have it
    const guildMember = await interaction.guild.members.fetch(member.id);
    if (guildMember.roles.cache.has(project.roleId)) {
      await guildMember.roles.remove(project.roleId);
    }

    // Remove the member from the project in the database
    project.memberIds = project.memberIds.filter(id => id !== member.id);
    await project.save();

    // Update the project info embed
    await updateProjectInfoEmbed(project, interaction);

    // Get the project's discussion channel
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      return safeFollowUp(interaction, { content: Responses.simpleError });
    }

    // Create an embed to notify the removal of the member
    const embed = new EmbedBuilder()
      .setTitle('👤 Membre retiré du projet')
      .setDescription(`<@${leaderId}> a retiré <@${member.id}> du groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#FF0000')
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Send the embed to the project's discussion channel
    await textChannel.send({ embeds: [embed] });

    // Log the removal action
    logger.log(`[REMOVE] Le membre ${member.tag} a été retiré du groupe de projet numéro ${project.groupeNumber} avec succès.`);

    // Confirm the member removal to the leader
    return safeFollowUp(interaction, { content: Responses.memberRemoved(member, project.groupeNumber) });
  },
};