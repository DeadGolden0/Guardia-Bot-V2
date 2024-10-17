const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ServerConfig = require('@Database/schemas/ServerConfig');
const { safeFollowUp } = require('@Helpers/Utils');
const logger = require('@Helpers/Logger');

/**
 * Sets the staff channel for the server configuration.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /setstaffchannel channel:#staff
 * 
 * @description
 * This command allows administrators to configure the channel used for staff-related
 * communications in a Discord server. The selected channel is saved in the server's
 * configuration and logged for future reference. A feedback message is provided to the user
 * via an ephemeral message that is automatically deleted after 5000ms.
 */

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setstaffchannel')
    .setDescription('Configure the staff channel.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The staff channel to use')
        .setRequired(true)),

  async execute(interaction) {
    // Get the staff channel from the command options
    const staffChannel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    // Fetch the server configuration from the database or create a new one
    let config = await ServerConfig.findOne({ guildId });
    if (!config) { config = new ServerConfig({ guildId }); }

    // Update the staff channel in the server config and save it
    config.staffChannelId = staffChannel.id;
    await config.save();

    // Log the change
    logger.log(`Staff channel set to ${staffChannel.name} (${staffChannel.id}) for ${interaction.guild.name}`);

    // Send a follow-up message to the user
    await safeFollowUp(interaction, { content: `Le canal de staff a été configuré avec succès. [ <#${staffChannel.id}> ]` });
  }
};
