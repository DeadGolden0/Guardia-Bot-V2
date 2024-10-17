const { ActivityType } = require('discord.js');
const { PRESENCE } = require('@Config/Config');

/**
 * Updates the bot's presence based on servers and members.
 * @param {Client} client - The Discord client instance.
 */
function updatePresence(client) {

  // Check if presence is enabled in the configuration
  if (!PRESENCE.ENABLED) return;

  // Initialize the presence message
  let message = PRESENCE.MESSAGE;

  // Replace the {servers} variable with the total number of servers
  if (message.includes("{servers}")) {
    message = message.replace("{servers}", client.guilds.cache.size);
  }

  // Replace the {members} variable with the total number of members
  if (message.includes("{members}")) {
    const totalMembers = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
    message = message.replace("{members}", totalMembers);
  }

  // Get the activity type
  const activityType = getActivityType(PRESENCE.TYPE);

  // Set the bot's presence
  client.user.setPresence({
    status: PRESENCE.STATUS,
    activities: [
      {
        name: message,
        type: activityType,
      },
    ],
  });
}

/**
 * Returns the activity type based on the given string.
 * @param {string} type - The activity type (PLAYING, LISTENING, etc.).
 * @returns {ActivityType} - The corresponding activity type from Discord.js.
 */
function getActivityType(type) {
  switch (type.toUpperCase()) {
    case 'COMPETING':
      return ActivityType.Competing;
    case 'LISTENING':
      return ActivityType.Listening;
    case 'PLAYING':
      return ActivityType.Playing;
    case 'WATCHING':
      return ActivityType.Watching;
    default:
      return ActivityType.Playing; // Valeur par défaut
  }
}

/**
 * Updates the presence at regular intervals.
 * @param {Client} client - The Discord client instance.
 */
module.exports = function handlePresence(client) {
  // Updates presence on startup
  updatePresence(client);

  // Updates presence every 10 minutes
  setInterval(() => updatePresence(client), 10 * 60 * 1000); 
};
