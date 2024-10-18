const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('@Database/schemas/ServerConfig');
const { safeFollowUp } = require('@Helpers/Message');
const { SUGGESTIONS } = require('@Config/Config');

const logger = require('@Helpers/Logger');

/**
 * Sets the suggestion channel for the server configuration.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /setsuggestionchannel channel:#suggestions
 * 
 * @description
 * This command allows administrators to configure the channel used for receiving
 * suggestions in a Discord server. The channel is saved in the server's configuration 
 * and logged for future reference. It provides feedback to the user via an ephemeral 
 * message that is deleted after 5000ms.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setsuggestionchannel')
    .setDescription('Configurer le canal des suggestions.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal des suggestions à utiliser')
        .setRequired(true)),

  async execute(interaction) {
    if (!SUGGESTIONS.ENABLED) {
      return safeFollowUp(interaction, { content: 'Le module de suggestions n\'est pas activé.', ephemeral: true });
    }

    // Retrieve the suggestion channel from the command option
    const suggestionChannel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // Fetch the server configuration from the database
    let config = await ServerConfig.findOne({ guildId });

    // If no config exists, create a new one
    if (!config) { config = new ServerConfig({ guildId }); }

    // Update the suggestion channel in the server configuration
    config.suggestionChannelId = suggestionChannel.id;
    await config.save();

    // Log in the console for traceability
    logger.log(`Le canal des suggestions a été configuré à ${suggestionChannel.name} (${suggestionChannel.id}) pour ${interaction.guild.name}`);

    // Respond to the user with an ephemeral message
    await safeFollowUp(interaction, { content: `Le canal des suggestions a été configuré avec succès. [ <#${suggestionChannel.id}> ]` });
  }
};
