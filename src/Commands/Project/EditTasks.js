const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getChannelByType } = require('@Helpers/getChannels');
const { safeFollowUp } = require('@Helpers/Message');
const { EmbedBuilder } = require('discord.js');
const { PROJECTS } = require('@Config/Config');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Edits the tasks assigned to project members. Only the project leader can assign tasks.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit-tasks')
    .setDescription('Modifier les tâches assignées aux membres du projet. (Lead groupe uniquement)')
    .addUserOption(option =>
      option.setName('task_member')
        .setDescription('Sélectionner un membre du projet pour lui assigner une tâche')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('task')
        .setDescription('La tâche à assigner au membre sélectionné')
        .setRequired(true)),

  async execute(interaction) {
    if (!PROJECTS.ENABLED) {
      return safeFollowUp(interaction, { content: Responses.projectsDisabled });
    }

    const leaderId = interaction.user.id;
    const taskMember = interaction.options.getUser('task_member');
    const task = interaction.options.getString('task');

    // Check if the user is the leader of an active project
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) {
      return safeFollowUp(interaction, { content: Responses.notLeader });
    }

    // Check if the member is part of the project
    const isMember = await isMemberInProject(project._id, taskMember.id);
    if (!isMember) {
      return safeFollowUp(interaction, { content: Responses.memberNotFound(taskMember) });
    }

    // Add or update the task in the project task list
    const existingTaskIndex = project.tasks.findIndex(t => t.member === taskMember.tag);
    if (existingTaskIndex >= 0) {
      project.tasks[existingTaskIndex].task = task;
    } else {
      project.tasks.push({ member: taskMember.tag, task });
    }

    // Save the changes to the database
    await project.save();

    // Update the project info embed
    await updateProjectInfoEmbed(project, interaction);

    // Create an embed to notify task changes in the project discussion channel
    const taskEmbed = new EmbedBuilder()
      .setTitle('🛠️ Tâches mises à jour')
      .setDescription(`${taskMember} a une nouvelle tâche assignée : **${task}**`)
      .setColor('#00FF00') // Green for success
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Send the embed to the project discussion channel
    const textChannel = getChannelByType(project, 'discussion', interaction.guild);
    if (!textChannel) {
      return safeFollowUp(interaction, { content: Responses.simpleError });
    }

    await textChannel.send({ embeds: [taskEmbed] });

    // Log the task assignment and confirm the update
    logger.log(`[TASKS] ${interaction.user.tag} a assigné la tâche "${task}" à ${taskMember.tag} dans le projet ${project.groupNumber}.`);
    return safeFollowUp(interaction, { content: Responses.taskUpdated(taskMember, task) });
  },
};