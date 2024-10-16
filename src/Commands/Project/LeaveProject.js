const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectMember } = require('@Helpers/Validators');
const Responses = require('@Config/Responses');
const { EmbedBuilder } = require('discord.js');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaveproject')
    .setDescription('Quitter le projet actuel. (Tous les membres sauf le leader)'),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Vérifier si l'utilisateur est membre d'un projet actif
    const { project, isMember } = await isProjectMember(userId);
    if (!isMember) { 
      return interaction.reply({ content: Responses.noProject, ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000)); 
    }

    // Empêcher le leader de quitter le projet
    if (userId === project.leaderId) { 
      return interaction.reply({ content: Responses.leaderCannotLeave , ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
    }

    // Retirer le membre de la liste `memberIds`
    project.memberIds = project.memberIds.filter(id => id !== userId);
    await project.save();

    // Retirer le rôle de projet dans Discord
    const guildMember = await interaction.guild.members.fetch(userId);
    if (guildMember.roles.cache.has(project.roleId)) { await guildMember.roles.remove(project.roleId); }

    // Mettre à jour l'embed d'information
    await updateProjectInfoEmbed(project, interaction);

    // Récupérer le channel de discussion pour envoyer la notification
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { 
      return interaction.reply({ content: Responses.simpleError, ephemeral: true })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
    }

    // Créer un embed pour notifier le départ du membre
    const embed = new EmbedBuilder()
      .setTitle('👋 Membre a quitté le projet')
      .setDescription(`<@${userId}> a quitté le groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#FF9900') // Orange pour le départ
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    await textChannel.send({ embeds: [embed] });

    // Confirmation du départ du membre
    logger.log(`[LEAVE_PROJECT] L'utilisateur ${interaction.user.tag} a quitté le projet numéro ${project.groupeNumber}.`);
    return interaction.reply({ content: Responses.LeaveProject(project.groupeNumber), ephemeral: true })
      .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
  },
};
