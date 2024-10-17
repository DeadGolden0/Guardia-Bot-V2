require('module-alias/register');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { initializeMongoose } = require("@Database/mongoose");
const { checkForUpdates } = require('@Helpers/Utils');
const { loadCommands } = require('@Handlers/commandHandler');
const { loadEvents } = require('@Handlers/eventHandler');
const { DISCORD_TOKEN } = require('@Config/Config');
const logger = require('@Helpers/Logger');

// Initialisation du client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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
    // Check for updates
    await checkForUpdates();

    // Initialize MongoDB connection
    await initializeMongoose();

    // Load commands and events
    await loadCommands(client);
    await loadEvents(client);

    // Start the Discord bot
    await client.login(DISCORD_TOKEN);
  } catch (error) {
    logger.error('Error during bot initialization:', error);
    process.exit(1);
  }
} init();
