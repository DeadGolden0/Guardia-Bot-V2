const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder  } = require('discord.js');
const Project = require('@Database/schemas/Project'); // Le schéma MongoDB pour les projets
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addproject')
    .setDescription('Ajouter un membre au projet actuel.')
    .addUserOption(option => 
      option.setName('member')
        .setDescription('Membre à ajouter au projet')
        .setRequired(true)),

  async execute(interaction) {
    const leaderId = interaction.user.id;
    const member = interaction.options.getUser('member');

    // Vérifier si cet utilisateur est le leader d'un projet actif
    const project = await Project.findOne({ leaderId, status: 'active' });
    if (!project) {
      logger.warn(`[ADD_PROJECT] L'utilisateur ${interaction.user.tag} a tenté d'ajouter un membre sans projet actif.`);
      return interaction.reply({ content: `Oops! Vous n'avez pas de projet actif.`, ephemeral: true });
    }

    // Vérifier si le membre est déjà dans le projet
    if (project.memberIds.includes(member.id)) {
      logger.warn(`[ADD_PROJECT] Le membre ${member.tag} est déjà dans le projet.`);
      return interaction.reply({ content: `**${member.tag}** fait déjà partie de ce projet.`, ephemeral: true });
    }

    // Ajouter le rôle du projet au membre
    const guildMember = await interaction.guild.members.fetch(member.id);
    await guildMember.roles.add(project.roleId);
    logger.log(`[ADD_PROJECT] Le membre ${member.tag} a reçu le rôle du projet ${project.groupeNumber}.`);

    // Ajouter le membre dans memberIds
    project.memberIds.push(member.id);
    await project.save();

    // Récupérer le channel de discussion
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      logger.error(`[ADD_PROJECT] Le channel de discussion du projet pour le groupe ${project.groupeNumber} est introuvable.`);
      return interaction.reply({ content: 'Le channel de discussion du projet est introuvable.', ephemeral: true });
    }

    // Envoyer un ghost ping en mentionnant l'utilisateur puis supprimer immédiatement
    const ghostPingMessage = await textChannel.send(`<@${member.id}>`);
    setTimeout(() => ghostPingMessage.delete().catch(() => {}), 50); // Supprimer après 2 secondes

    // Créer l'embed pour notifier l'ajout du membre
    const embed = new EmbedBuilder()
      .setTitle('👥 Nouveau membre ajouté au projet')
      .setDescription(`Le lead projet <@${leaderId}> a ajouté <@${member.id}> au groupe de projet numéro **${project.groupeNumber}**.`)
      .setColor('#00FF00') // Vert pour succès
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Envoyer l'embed dans le channel de discussion du projet
    await textChannel.send({ embeds: [embed] });

    // Confirmation de l'ajout du membre
    logger.log(`[ADD_PROJECT] Le membre ${member.tag} a été ajouté au groupe de projet numéro ${project.groupeNumber} avec succès.`);
    return interaction.reply({ content: `**${member.tag}** a été ajouté au groupe de projet numéro **${project.groupeNumber}** avec succès.`, ephemeral: true });
  },
};
