const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

// Fonction pour créer une barre de progression
function createProgressBar(progress) {
  const totalBlocks = 22; // Nombre total de blocs dans la barre
  const filledBlocks = Math.round((progress / 100) * totalBlocks); // Blocs remplis selon le pourcentage
  const emptyBlocks = totalBlocks - filledBlocks;
  
  return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks); // Barres remplies et vides
}

// Fonction pour calculer le nombre de jours avant le prochain vendredi
function getDaysUntilNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Calcul du nombre de jours restants
  return daysUntilFriday === 0 ? 7 : daysUntilFriday; // Si aujourd'hui c'est vendredi, retournez 7 jours
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('startproject')
    .setDescription('Démarre un nouveau projet avec un numéro de groupe unique.')
    .addIntegerOption(option => 
      option.setName('groupe_number')
        .setDescription('Numéro unique du groupe')
        .setRequired(true)),

  async execute(interaction) {
    const groupeNumber = interaction.options.getInteger('groupe_number');
    const leaderId = interaction.user.id;

    // Vérifier si cet utilisateur a déjà un projet actif
    const existingUserProject = await Project.findOne({ leaderId, status: 'active' });
    if (existingUserProject) {
      return interaction.reply({ content: `Vous avez déjà un projet en cours avec le groupe numéro **${existingUserProject.groupeNumber}**. Vous devez terminer ce projet avant d'en créer un nouveau.`, ephemeral: true });
    }

    // Vérifier si le groupe existe déjà avec ce numéro
    const existingGroup = await Project.findOne({ groupeNumber, status: 'active' });
    if (existingGroup) {
      return interaction.reply({ content: `Le groupe numéro **${groupeNumber}** est déjà actif. Veuillez choisir un autre numéro de groupe.`, ephemeral: true });
    }

    // Créer un rôle spécial pour le leader
    const leaderRole = await interaction.guild.roles.create({
        name: `Lead Groupe ${groupeNumber}`,
        color: 'Gold', // Or en hexadécimal
        mentionable: true,
        reason: `Rôle leader pour le groupe ${groupeNumber}`,
      });

    // Créer un rôle pour le groupe
    const role = await interaction.guild.roles.create({
      name: `Groupe ${groupeNumber}`,
      color: 'Blue', // Bleu en hexadécimal
      mentionable: true,
      reason: `Rôle pour le groupe ${groupeNumber}`,
    });

    // Ajouter les rôles au leader (l'utilisateur qui a utilisé la commande)
    const leaderMember = await interaction.guild.members.fetch(interaction.user.id);
    await leaderMember.roles.add(role);
    await leaderMember.roles.add(leaderRole);

    // Créer une catégorie pour le projet
    const category = await interaction.guild.channels.create({
      name: `⭐ | Groupe ${groupeNumber}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: interaction.guild.id, // Everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id, // Groupe spécifique
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id, // Leader
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels],
        },
      ],
    });

    // **Créer un channel d'information dans cette catégorie**
    const infoChannel = await interaction.guild.channels.create({
      name: `✨┇ɪɴꜰᴏ-ᴘʀᴏᴊᴇᴛ`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
          deny: [PermissionsBitField.Flags.SendMessages], // Interdire d'écrire
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
          deny: [PermissionsBitField.Flags.SendMessages], // Interdire d'écrire
        },
      ],
    });

    // Créer un channel texte et vocal dans cette catégorie
    const textChannel = await interaction.guild.channels.create({
      name: `💬┇ᴅɪꜱᴄᴜꜱꜱɪᴏɴ`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const voiceChannel = await interaction.guild.channels.create({
      name: `🍹 ● ᴠᴏᴄᴀʟ`,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: leaderRole.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    // Calculer les jours restants avant le vendredi
    const daysUntilFriday = getDaysUntilNextFriday();

    // **Créer un embed avec les infos du projet**
    const infoEmbed = new EmbedBuilder()
      .setTitle(`📊 Informations sur le groupe projet **n°${groupeNumber}**`)
      .setColor('#2F3136')
      .addFields(
        { name: '👥 **Membres du Projet:**', value: `<@${leaderId}>`, inline: false },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '📈 **Avancement:**', value: `0%\n${createProgressBar(0)}`, inline: false },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '⏳ **Durée:**', value: `**0** jours`, inline: true },
        { name: '🕒 **Temps restant:**', value: `**${daysUntilFriday}** jours avant la remise (Vendredi)`, inline: true },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '📄 **Documents Techniques:**', value: `En cours...`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true }, // Séparateur
        { name: '🎞️ **Statut Diaporama:**', value: `En cours...`, inline: true },

        { name: '\u200B', value: '───────────', inline: false }, // Séparateur

        { name: '🛠️ **Tâches Assignées:**', value: 'Aucune tâche assignée', inline: false }
      )
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    // Envoyer l'embed d'info dans le channel d'information
    await infoChannel.send({ embeds: [infoEmbed] });

    // Enregistrer les informations du projet dans la base de données
    const project = new Project({
      groupeNumber,
      leaderId: interaction.user.id,
      memberIds: [interaction.user.id],
      roleId: role.id,
      leaderRoleId: leaderRole.id,
      categoryId: category.id,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
      infoChannelId: infoChannel.id,
      status: 'active',
    });

    await project.save(); // Sauvegarder dans MongoDB

    // Confirmation du projet créé
    return interaction.reply({ content: `Le groupe de projet **numéro ${groupeNumber}** a été créé avec succès avec les channels associés.`, ephemeral: true });
  },
};
