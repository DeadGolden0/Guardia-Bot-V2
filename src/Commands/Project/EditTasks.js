const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edittasks')
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
    const leaderId = interaction.user.id;
    const taskMember = interaction.options.getUser('task_member');
    const task = interaction.options.getString('task');

    // Utiliser le validateur pour vérifier si l'utilisateur est le leader d'un projet actif
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) { 
      return interaction.reply({ content: Responses.notLeader, ephemeral: true })
        .then(async () => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000)); 
    }

    // Utiliser le validateur pour vérifier si le membre fait partie du projet
    const isMember = await isMemberInProject(project._id, taskMember.id);
    if (!isMember) { 
      return interaction.reply({ content: Responses.memberNotFound(taskMember), ephemeral: true })
        .then(async () => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
    }

    // Ajouter ou mettre à jour la tâche dans la liste des tâches
    const existingTaskIndex = project.tasks.findIndex(t => t.member === taskMember.tag);
    if (existingTaskIndex >= 0) {
      project.tasks[existingTaskIndex].task = task;
    } else {
      project.tasks.push({ member: taskMember.tag, task });
    }

    // Sauvegarder les modifications dans la base de données
    await project.save();

    // Utiliser le module pour mettre à jour l'embed d'information
    await updateProjectInfoEmbed(project, interaction);

    // Créer un embed pour notifier les modifications des tâches dans le canal de discussion
    const taskEmbed = new EmbedBuilder()
      .setTitle(`🛠️ Tâches mises à jour`)
      .setDescription(`${taskMember} a une nouvelle tâche assignée : **${task}**`)
      .setColor('#00FF00') // Vert pour les succès
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Envoyer l'embed dans le channel de discussion du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { 
      return interaction.reply({ content: Responses.simpleError, ephemeral: true })
        .then(async () => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
    }

    await textChannel.send({ embeds: [taskEmbed] });

    // Confirmer la modification des tâches
    logger.log(`[TASKS] ${interaction.user.tag} a assigné la tâche "${task}" à ${taskMember.tag} dans le projet ${project.groupNumber}.`);
    return interaction.reply({ content: Responses.taskUpdated(taskMember, task), ephemeral: true })
      .then(async () => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
  },
};