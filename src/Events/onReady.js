const handlePresence = require("@Handlers/Presence");
const { PRESENCE } = require("@Root/Config");
const logger = require('@Helpers/Logger');

module.exports = {
    name: 'ready', // Nom de l'événement
    once: true,    // Spécifie que cet événement doit se déclencher une seule fois
    execute(client) {
        logger.ready(`Bot connecté en tant que ${client.user.tag}`);

        // Update Bot Presence
        if (PRESENCE.ENABLED) {
            handlePresence(client);
        }
    },
  };