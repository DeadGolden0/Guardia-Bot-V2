const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectMember } = require('@Helpers/Validators');
const { safeFollowUp } = require('@Helpers/Message');
const { PROJECTS } = require('@Config/Config');
const { EmbedBuilder } = require('discord.js');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Allows a project member to leave the current project, updates the project info embed, and logs the action.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave-project')
    .setDescription('Quitter le projet actuel. (Tous les membres sauf le leader)'),

  async execute(interaction) {
    if (!PROJECTS.ENABLED) {
      return safeFollowUp(interaction, { content: Responses.projectsDisabled });
    }

    const userId = interaction.user.id;

    // Check if the user is a member of an active project
    const { project, isMember } = await isProjectMember(userId);
    if (!isMember) {
      return safeFollowUp(interaction, { content: Responses.noProject });
    }

    // Prevent the project leader from leaving the project
    if (userId === project.leaderId) {
      return safeFollowUp(interaction, { content: Responses.leaderCannotLeave });
    }

    // Remove the user from the project's memberIds
    project.memberIds = project.memberIds.filter(id => id !== userId);
    await project.save();

    // Remove the project role from the user in Discord
    const guildMember = await interaction.guild.members.fetch(userId);
    if (guildMember.roles.cache.has(project.roleId)) {
      await guildMember.roles.remove(project.roleId);
    }

    // Update the project info embed
    await updateProjectInfoEmbed(project, interaction);

    // Retrieve the project's discussion channel
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      return safeFollowUp(interaction, { content: Responses.simpleError });
    }

    // Create an embed to notify that the member has left the project
    const embed = new EmbedBuilder()
      .setTitle('👋 Membre a quitté le projet')
      .setDescription(`<@${userId}> a quitté le groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#FF9900') // Orange for member departure
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    await textChannel.send({ embeds: [embed] });

    // Log the member departure
    logger.log(`[LEAVE_PROJECT] L'utilisateur ${interaction.user.tag} a quitté le projet numéro ${project.groupeNumber}.`);

    // Confirm the member's departure
    return safeFollowUp(interaction, { content: Responses.LeaveProject(project.groupeNumber) });
  },
};
