const fs = require('fs');
const path = require('path');
const logger = require('@Helpers/Logger');

/**
 * Load all events from the 'Events' folder, including subfolders.
 * @param {Client} client - The Discord client instance
 */
async function loadEvents(client) {
  const baseEventsPath = path.join(__dirname, '../Events');

  const loadEventFiles = (directory) => {
    const eventFiles = fs.readdirSync(directory).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
      const event = require(path.join(directory, file));
      const eventName = path.basename(file, '.js');
      client.on(eventName, event.bind(null, client));
      logger.load(`Loaded event: ${eventName}`);
    }
  };

  // Load event files in the base 'Events' folder
  loadEventFiles(baseEventsPath);

  // Load event files in subfolders
  const eventFolders = fs.readdirSync(baseEventsPath).filter(folder => fs.lstatSync(path.join(baseEventsPath, folder)).isDirectory());
  for (const folder of eventFolders) {
    loadEventFiles(path.join(baseEventsPath, folder));
  }
}

module.exports = { loadEvents };