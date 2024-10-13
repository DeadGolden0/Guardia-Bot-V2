const ServerConfig = require('@Database/schemas/ServerConfig');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('@Helpers/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setstaffchannel')
    .setDescription('Configurer le canal de staff.')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal de staff à utiliser')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const staffChannel = interaction.options.getChannel('channel');

    try {
      let config = await ServerConfig.findOne({ guildId: interaction.guild.id });
      if (!config) {
        config = new ServerConfig({ guildId: interaction.guild.id });
      }

      config.staffChannelId = staffChannel.id;
      await config.save();

      logger.log(`Le canal staff a été configuré à ${staffChannel.name} (${staffChannel.id}) pour ${interaction.guild.name}`);
      await interaction.reply({ content: `Le canal staff a été mis à jour à <#${staffChannel.id}>.`, ephemeral: true });

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 5000);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du canal staff : ${error.message}`);
      interaction.reply({ content: 'Une erreur est survenue lors de la configuration du canal staff.', ephemeral: true });
    }
  }
};
