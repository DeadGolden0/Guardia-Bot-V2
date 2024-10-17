const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { safeFollowUp } = require('@Helpers/Message');

/**
 * /ping command to test the bot's responsiveness
 * @param {import('discord.js').Interaction} interaction - The Discord interaction
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  async execute(interaction) {
    await safeFollowUp(interaction, { content: `🏓 Pong : \`${Math.floor(interaction.client.ws.ping)}ms\`` });
  },
};
