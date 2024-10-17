const fs = require('fs').promises;
const path = require('path');
const logger = require('@Helpers/Logger');

/**
 * Load all slash commands from the 'Commands' folder, including subfolders.
 * @param {Client} client - The Discord client instance
 */
async function loadCommands(client) {
  try {
    const commandsPath = path.resolve(__dirname, '../Commands');
    const commandFolders = await fs.readdir(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = (await fs.readdir(folderPath)).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(folderPath, file));
        
        // Only load slash commands (with SlashCommandBuilder)
        if (command.data && command.data.name) {
          client.commands.set(command.data.name, command);
          logger.load(`Loaded slash command: ${command.data.name}`);
        } else {
          logger.warn(`The command ${file} does not have a valid 'data' property.`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error loading commands: ${error.message}`);
  }
}

module.exports = { loadCommands };