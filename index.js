require('module-alias/register');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { initializeMongoose } = require("@Database/mongoose");
const { checkForUpdates } = require('@Helpers/versioning');
const loadCommands = require('@Loaders/commandsLoader');
const loadEvents = require('@Loaders/eventsLoader');
const { DISCORD_TOKEN } = require('@Root/Config');
const logger = require('@Helpers/Logger');

// Initialisation du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

/**
 * Asynchronous function to initialize the bot
 * @returns {void}
 */
async function init() {
  try {
    // Vérifier les mises à jour
    await  checkForUpdates();

    // Initialiser la connexion à MongoDB
    await initializeMongoose();

    // Charger les commandes et les événements
    loadCommands(client);
    loadEvents(client);

    // Démarrer le bot Discord
    await client.login(DISCORD_TOKEN);
    logger.log('Bot Discord démarré avec succès.');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation du bot :', error);
    process.exit(1);
  }
} init();