const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('@Database/schemas/ServerConfig');
const { safeFollowUp } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Sets the vote channel for the server configuration.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /setvotechannel channel:#votes
 * 
 * @description
 * This command allows administrators to configure the channel used for voting
 * in a Discord server. The channel is saved in the server's configuration and 
 * logged for future reference. It provides feedback to the user via an ephemeral 
 * message that is deleted after 5000ms.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setvotechannel')
    .setDescription('Configurer le canal de vote.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal de vote à utiliser')
        .setRequired(true)),

  async execute(interaction) {
    // Retrieve the vote channel from the command option
    const voteChannel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // Fetch the server configuration from the database
    let config = await ServerConfig.findOne({ guildId });

    // If no config exists, create a new one
    if (!config) { config = new ServerConfig({ guildId }); }

    // Update the vote channel in the server configuration
    config.voteChannelId = voteChannel.id;
    await config.save();

    // Log in the console for traceability
    logger.log(`Le canal de vote a été configuré à ${voteChannel.name} (${voteChannel.id}) pour ${interaction.guild.name}`);

    // Respond to the user with an ephemeral message
    await safeFollowUp(interaction, { content: `Le canal de vote a été configuré avec succès. [ <#${voteChannel.id}> ]` });
  }
};