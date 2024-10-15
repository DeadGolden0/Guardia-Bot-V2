const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project'); // Le schéma MongoDB pour les projets
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeproject')
    .setDescription('Retirer un membre du projet actuel.')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à retirer du projet')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Vérifier si l'utilisateur est le leader d'un projet actif
    const project = await Project.findOne({ leaderId, status: 'active' });
    if (!project) {
      logger.warn(`[REMOVE_PROJECT] Le leader ${interaction.user.tag} tente de retirer un membre mais n'a pas de projet actif.`);
      return interaction.reply({ content: `Oops! Vous n'avez pas de projet actif.`, ephemeral: true });
    }

    // Empêcher le leader de se retirer lui-même
    if (member.id === leaderId) {
      logger.warn(`[REMOVE_PROJECT] Le leader ${interaction.user.tag} a tenté de se retirer de son propre projet.`);
      return interaction.reply({ content: `Vous ne pouvez pas vous retirer vous-même du projet.`, ephemeral: true });
    }

    // Vérifier si le membre fait partie du projet via la BDD
    if (!project.memberIds.includes(member.id)) {
      logger.warn(`[REMOVE_PROJECT] Le membre ${member.tag} ne fait pas partie du projet.`);
      return interaction.reply({ content: `**${member.tag}** ne fait pas partie de ce projet.`, ephemeral: true });
    }
    
    // Ensuite, retirer le rôle si présent dans Discord
    const guildMember = await interaction.guild.members.fetch(member.id);
    if (guildMember.roles.cache.has(project.roleId)) {
      await guildMember.roles.remove(project.roleId);
      logger.log(`[REMOVE_PROJECT] Le rôle a été retiré pour le membre ${member.tag} dans le projet ${project.groupeNumber}.`);
    }

    // Retirer le membre de memberIds
    project.memberIds = project.memberIds.filter(id => id !== member.id);
    await project.save();

    // Récupérer le channel de discussion
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      logger.error(`[REMOVE_PROJECT] Le channel de discussion du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel de discussion du projet est introuvable.', ephemeral: true });
    }

    // Créer un embed pour notifier le retrait du membre
    const embed = new EmbedBuilder()
      .setTitle('👤 Membre retiré du projet')
      .setDescription(`Le lead projet <@${leaderId}> a retiré <@${member.id}> du groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#FF0000') // Rouge pour suppression
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Envoyer l'embed dans le channel de discussion du projet
    await textChannel.send({ embeds: [embed] });

    // Confirmation du retrait du membre
    logger.log(`[REMOVE_PROJECT] Le membre ${member.tag} a été retiré du groupe de projet numéro ${project.groupeNumber} avec succès.`);
    return interaction.reply({ content: `**${member.tag}** a été retiré du groupe de projet numéro **${project.groupeNumber}** avec succès.`, ephemeral: true });
  },
};
