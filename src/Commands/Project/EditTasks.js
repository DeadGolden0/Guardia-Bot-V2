const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edittasks')
    .setDescription('Modifier les tâches assignées aux membres du projet (réservé aux leaders).')
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

    // Vérifier si l'utilisateur est le leader d'un projet actif
    const project = await Project.findOne({ leaderId, status: 'active' });
    if (!project) {
      logger.warn(`[EDIT_TASKS] L'utilisateur ${interaction.user.tag} a tenté de modifier des tâches sans être leader.`);
      return interaction.reply({ content: `Oops! Vous n'êtes pas leader d'un projet actif.`, ephemeral: true });
    }

    // Vérifier si le membre fait partie du projet
    if (!project.memberIds.includes(taskMember.id)) {
      return interaction.reply({ content: `Le membre **${taskMember.tag}** ne fait pas partie de ce projet.`, ephemeral: true });
    }

    // Ajouter ou mettre à jour la tâche dans la liste des tâches
    const existingTaskIndex = project.tasks.findIndex(t => t.member === taskMember.tag);
    if (existingTaskIndex >= 0) {
      project.tasks[existingTaskIndex].task = task; // Mettre à jour la tâche existante
    } else {
      project.tasks.push({ member: taskMember.tag, task }); // Ajouter une nouvelle tâche
    }

    // Sauvegarder les modifications dans la base de données
    await project.save();
    logger.log(`[EDIT_TASKS] Tâche pour ${taskMember.tag} mise à jour par ${interaction.user.tag} : ${task}`);

    // Récupérer le channel de discussion du projet
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      logger.error(`[EDIT_TASKS] Le channel de discussion du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel de discussion du projet est introuvable.', ephemeral: true });
    }

    // Créer un embed pour notifier les modifications des tâches
    const embed = new EmbedBuilder()
      .setTitle(`🛠️ Tâches mises à jour`)
      .setDescription(`**${taskMember.tag}** a une nouvelle tâche assignée : **${task}**`)
      .setColor('#00FF00') // Vert pour les succès
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Envoyer l'embed dans le channel de discussion du projet
    await textChannel.send({ embeds: [embed] });

    // Confirmer la modification des tâches
    return interaction.reply({ content: `La tâche de **${taskMember.tag}** a été mise à jour avec succès.`, ephemeral: true });
  },
};
