const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemember')
    .setDescription('Retirer un membre du projet actuel. (Lead groupe uniquement)')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à retirer du projet')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Utiliser le validateur pour vérifier si l'utilisateur est leader du projet
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) { return interaction.reply({ content: Responses.errors.notLeader(interaction.user.tag), ephemeral: true });}

    // Empêcher le leader de se retirer lui-même
    if (member.id === leaderId) { return interaction.reply({ content: Responses.errors.leaderSelfRemove, ephemeral: true });}

    // Utiliser le validateur pour vérifier si le membre fait bien partie du projet
    const isMember = await isMemberInProject(project._id, member.id);
    if (!isMember) { return interaction.reply({ content: Responses.errors.memberNotFound(member.tag), ephemeral: true });}
    
    // Retirer le rôle si présent dans Discord
    const guildMember = await interaction.guild.members.fetch(member.id);
    if (guildMember.roles.cache.has(project.roleId)) { await guildMember.roles.remove(project.roleId); }

    // Retirer le membre de memberIds
    project.memberIds = project.memberIds.filter(id => id !== member.id);
    await project.save();

    // Utiliser le module pour mettre à jour l'embed d'information
    await updateProjectInfoEmbed(project, interaction);

    // Récupérer le channel de discussion
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { return interaction.reply({ content: Responses.errors.discutionChannelNotFound, ephemeral: true }); }

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
    logger.log(`[REMOVE] Le membre ${member.tag} a été retiré du groupe de projet numéro ${project.groupeNumber} avec succès.`);
    return interaction.reply({ content: Responses.success.memberRemoved(member.tag, project.groupeNumber), ephemeral: true });
  },
};
