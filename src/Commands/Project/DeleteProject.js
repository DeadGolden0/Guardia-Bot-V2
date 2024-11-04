const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Project = require('@Database/schemas/Project');
const { safeFollowUp } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Deletes an active project by its group number.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /deleteproject groupe_number:100
 * 
 * @description
 * This command allows administrators to delete an active project from the server.
 * It will remove the project entry from the database and delete any associated channels and roles.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-project')
    .setDescription('Supprime un projet actif par son numéro de groupe. (ADMIN ONLY)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(option =>
      option.setName('groupe_number')
        .setDescription('Numéro du groupe du projet à supprimer.')
        .setRequired(true)),

  async execute(interaction) {
    const groupeNumber = interaction.options.getInteger('groupe_number');

    // Rechercher le projet dans la base de données
    const project = await Project.findOne({ groupeNumber });

    if (!project) {
      return safeFollowUp(interaction, { content: 'Projet introuvable. Veuillez vérifier le numéro de groupe fourni.', ephemeral: true });
    }

    // Supprimer les canaux et les rôles associés au projet
    const channels = project.channelIds.map(channelInfo => interaction.guild.channels.cache.get(channelInfo.id));
    for (const channel of channels) {
      if (channel) await channel.delete();
    }

    const roles = ['roleId', 'leaderRoleId'].map(id => interaction.guild.roles.cache.get(project[id]));
    for (const role of roles) {
      if (role) await role.delete();
    }

    // Supprimer le projet de la base de données
    await Project.deleteOne({ groupeNumber });

    logger.log(`Le projet #${groupeNumber} a été supprimé par ${interaction.user.tag}.`);
    await safeFollowUp(interaction, { content: `Le projet #${groupeNumber} a été supprimé avec succès.`, ephemeral: true });
  },
};
