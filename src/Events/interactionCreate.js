const logger = require('@Helpers/Logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.error(`Commande non trouvée : ${interaction.commandName}`);
        return interaction.reply({ content: 'Commande non trouvée!', ephemeral: true });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'Une erreur est survenue lors de l’exécution de la commande.', ephemeral: true });
      }
    }
  },
};