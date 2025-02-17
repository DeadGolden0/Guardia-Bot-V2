require('dotenv').config();

// Export configuration settings
module.exports = {
  // Log level for the logger (DEBUG, INFO, WARN, ERROR)
  LOG_LEVEL: "INFO",

  // Array of owner IDs
  OWNER_IDS: ["285148265962405889"],
  
  // Discord bot token from environment variables
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  
  // MongoDB URI from environment variables
  MONGODB_URI: process.env.MONGODB_URI,

  // Client ID for the Discord bot
  CLIENT_ID: "1295813901421772810",
  
  // Guild ID for the Discord server
  GUILD_ID: "856546352133439530",

  PRESENCE: {
    // Whether or not the bot should update its status
    ENABLED: true,

    // The bot's status [online, idle, dnd, invisible]
    STATUS: "dnd",

    // Status type for the bot [PLAYING | LISTENING | WATCHING | COMPETING]
    TYPE: "WATCHING", 

    // Your bot status message
    MESSAGE: "Surveille {members} membres sur {servers} serveurs",
  },

  // MODULES

  // Configuration for the project module
  PROJECTS : {
    // Whether or not the project module is enabled
    ENABLED: true,

    // Delete MongoDB documents after ending the project
    DELETE: true,
  },

  // Configuration for the suggestion module
  SUGGESTIONS: {
    // Whether or not the suggestion module is enabled
    ENABLED: true,
  },
};
