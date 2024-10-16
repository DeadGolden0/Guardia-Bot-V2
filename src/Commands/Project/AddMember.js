const { isProjectLeader, isMemberInProject } = require('@Helpers/Validators');
const { updateProjectInfoEmbed } = require('@Helpers/updateEmbed');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmember')
    .setDescription('Ajouter un membre au projet actuel.')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à ajouter au projet')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Utiliser le validateur pour vérifier si l'utilisateur est leader d'un projet actif
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) { 
      return interaction.reply({ content: Responses.noProject, ephemeral: true }).then (async () => {
        setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      });
    }

    // Utiliser le validateur pour vérifier si le membre fait déjà partie du projet
    const isMemberAlreadyInProject = await isMemberInProject(project._id, member.id);
    if (isMemberAlreadyInProject) { 
      return interaction.reply({ content: Responses.alreadyInProject(member), ephemeral: true }).then (async () => {
        setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      });
    }

    // Ajouter le membre à la liste `memberIds`
    project.memberIds.push(member.id);
    await project.save();

    // Ajouter le rôle du projet au membre
    const guildMember = await interaction.guild.members.fetch(member.id);
    await guildMember.roles.add(project.roleId);

    // Utiliser le module pour mettre à jour l'embed d'information
    await updateProjectInfoEmbed(project, interaction);

    // Récupérer le channel de discussion
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) { 
      return interaction.reply({ content: Responses.errors.simpleError, ephemeral: true }).then (async () => {
        setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      });
    }

    // Envoyer un ghost ping en mentionnant l'utilisateur puis supprimer immédiatement
    const ghostPingMessage = await textChannel.send(`<@${member.id}>`);
    setTimeout(() => ghostPingMessage.delete().catch(() => {}), 50);

    // Créer l'embed pour notifier l'ajout du membre
    const embed = new EmbedBuilder()
      .setTitle('👥 Nouveau membre ajouté au projet')
      .setDescription(`<@${leaderId}> a ajouté <@${member.id}> au groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#00FF00')
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Envoyer l'embed dans le channel de discussion du projet
    await textChannel.send({ embeds: [embed] });

    // Confirmation de l'ajout du membre
    logger.log(`[ADD_PROJECT] Le membre ${member.tag} a été ajouté au groupe de projet numéro ${project.groupeNumber} avec succès.`);
    return interaction.reply({ content: Responses.memberAdded(member, project.groupeNumber), ephemeral: true }).then (async () => {
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    });
  },
};
