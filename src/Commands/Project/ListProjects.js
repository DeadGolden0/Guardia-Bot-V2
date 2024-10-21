const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const Project = require('@Database/schemas/Project');
const { safeFollowUp } = require('@Helpers/Message');
const { PROJECTS } = require('@Config/Config');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Lists all active projects on the server.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /listprojects
 * 
 * @description
 * This command allows administrators to view a list of all active projects on the server.
 * It displays the project number, leader, and the status.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-projects')
    .setDescription('Liste tous les projets actifs sur le serveur. (ADMIN ONLY)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!PROJECTS.ENABLED) {
      return safeFollowUp(interaction, { content: Responses.projectsDisabled });
    }

    const projects = await Project.find({ status: 'active' });

    if (!projects.length) {
      return safeFollowUp(interaction, { content: 'Aucun projet actif trouvé.', ephemeral: true });
    }

    // Crée un embed amélioré pour afficher les projets
    const embed = new EmbedBuilder()
      .setTitle('🗂️ **Liste des Projets Actifs**')
      .setDescription(`Voici la liste des projets actuellement actifs sur le serveur.`)
      .setColor('#1E90FF')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    // Ajoute les projets avec une mise en page plus stylée
    projects.forEach(project => {
      embed.addFields(
        {
          name: `🆔 Groupe #${project.groupeNumber}`,
          value: `\u200B`,
          inline: false
        },
        {
          name: `👤 Leader:`,
          value: `<@${project.leaderId}>`,
          inline: true
        },
        {
          name: `📊 Statut:`,
          value: `${project.status}`,
          inline: true
        },
        {
          name: `📅 Date de création:`,
          value: `${project.createdAt.toLocaleDateString()}`,
          inline: true
        },
        {
          name: '\u200B', // Utilisation de cette valeur pour créer un espace vertical
          value: '\u200B',
          inline: false
        }
      );
    });

    logger.log(`Commande de liste des projets exécutée par ${interaction.user.tag}.`);
    await safeFollowUp(interaction, { embeds: [embed], ephemeral: true }, 15000);
  },
};
