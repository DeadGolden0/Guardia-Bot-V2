const handlePresence = require("@Handlers/Presence");
const { PRESENCE } = require("@Root/Config");
const logger = require('@Helpers/Logger');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.ready(`Bot connecté en tant que ${client.user.tag}`);

        // Update Bot Presence
        if (PRESENCE.ENABLED) {
            handlePresence(client);
        }
    },
};