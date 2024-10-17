const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

/**
 * Commande /ping pour tester la réactivité du bot
 * @param {Interaction} interaction L'interaction Discord
 * @returns {void}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
  async execute(interaction) {
    await interaction.followUp(`🏓 Pong : \`${Math.floor(interaction.client.ws.ping)}ms\``);
  },
};
