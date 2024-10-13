const { SlashCommandBuilder } = require('@discordjs/builders');

/**
 * Commande /ping pour tester la réactivité du bot
 * @param {Interaction} interaction L'interaction Discord
 * @returns {void}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!'),
  
  async execute(interaction) {
    await interaction.reply('Pong!');
  },
};
