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
  CLIENT_ID: "1294341854921228379",
  
  // Guild ID for the Discord server
  GUILD_ID: "856546352133439530",
  
  // Channel ID for the staff channel
  STAFF_CHANNEL_ID: "1294661005070041169",
  
  // Channel ID for the role channel
  ROLE_CHANNEL_ID: "1294432122341163049",
  
  // Default messages used in the bot
  DEFAULT_MESSAGES: {
    // Message for role request
    ROLE_REQUEST_MESSAGE: 'Cliquez sur le bouton ci-dessous pour demander un rôle.',
    
    // Message when role request is accepted
    ROLE_ACCEPTED: 'Votre demande de rôle a été acceptée !',
    
    // Message when role request is denied
    ROLE_DENIED: 'Votre demande de rôle a été refusée.',
  },

  PRESENCE: {
    // Whether or not the bot should update its status
    ENABLED: true,

    // The bot's status [online, idle, dnd, invisible]
    STATUS: "dnd",

    // Status type for the bot [PLAYING | LISTENING | WATCHING | COMPETING]
    TYPE: "WATCHING", 

    // Your bot status message
    MESSAGE: "Surveille {members} membre sur {servers} servers discord",
  },
};
