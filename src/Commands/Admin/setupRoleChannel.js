const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('@Database/schemas/ServerConfig');
const { safeFollowUp } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Sets the role channel for the server configuration.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /setrolechannel channel:#roles
 * 
 * @description
 * This command allows administrators to configure the channel used for role requests
 * in a Discord server. The channel is saved in the server's configuration and logged
 * for future use. It provides feedback to the user via an ephemeral message that is 
 * deleted after 5000ms.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setrolechannel')
    .setDescription('Configurer le canal des rôles.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal des rôles à utiliser')
        .setRequired(true)),

  async execute(interaction) {
    // Retrieve the role channel from the command option
    const roleChannel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // Fetch the server configuration from the database
    let config = await ServerConfig.findOne({ guildId });

    // If no config exists, create a new one
    if (!config) { config = new ServerConfig({ guildId }); }

    // Update the role channel in the server configuration
    config.roleChannelId = roleChannel.id;
    await config.save();

    // Log in the console for traceability
    logger.log(`Le canal des rôles a été configuré à ${roleChannel.name} (${roleChannel.id}) pour ${interaction.guild.name}`);

    // Respond to the user with an ephemeral message
    await safeFollowUp(interaction, { content: `Le canal des rôles a été configuré avec succès. [ <#${roleChannel.id}> ]` });
  }
};