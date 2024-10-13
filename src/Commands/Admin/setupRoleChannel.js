const ServerConfig = require('@Database/schemas/ServerConfig');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('@Helpers/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setrolechannel')
    .setDescription('Configurer le canal des rôles.')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal des rôles à utiliser')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const roleChannel = interaction.options.getChannel('channel');

    try {
      let config = await ServerConfig.findOne({ guildId: interaction.guild.id });
      if (!config) {
        config = new ServerConfig({ guildId: interaction.guild.id });
      }

      config.roleChannelId = roleChannel.id;
      await config.save();

      logger.log(`Le canal des rôles a été configuré à ${roleChannel.name} (${roleChannel.id}) pour ${interaction.guild.name}`);
      await interaction.reply({ content: `Le canal des rôles a été mis à jour à <#${roleChannel.id}>.`, ephemeral: true });

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 5000);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du canal des rôles : ${error.message}`);
      interaction.reply({ content: 'Une erreur est survenue lors de la configuration du canal des rôles.', ephemeral: true });
    }
  }
};
