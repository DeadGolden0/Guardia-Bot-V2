const { ActivityType } = require('discord.js');
const { PRESENCE } = require('@Root/Config');

/**
 * Met à jour la présence du bot en fonction des serveurs et des membres.
 * @param {Client} client - L'instance du client Discord.
 */
function updatePresence(client) {

  // Vérifier si la présence est activée dans la configuration
  if (!PRESENCE.ENABLED) return;

  // Initialisation du message de présence
  let message = PRESENCE.MESSAGE;

  // Remplacement des variables dynamiques dans le message
  if (message.includes("{servers}")) {
    message = message.replace("{servers}", client.guilds.cache.size);
  }

  if (message.includes("{members}")) {
    const totalMembers = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);
    message = message.replace("{members}", totalMembers);
  }

  // Déterminer le type d'activité (jouer, écouter, etc.)
  const activityType = getActivityType(PRESENCE.TYPE);

  // Définir la présence du bot
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
 * Retourne le type d'activité en fonction de la chaîne donnée.
 * @param {string} type - Le type d'activité (PLAYING, LISTENING, etc.).
 * @returns {ActivityType} - Le type d'activité correspondant de Discord.js.
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
 * Met à jour la présence à intervalles réguliers.
 * @param {Client} client - L'instance du client Discord.
 */
module.exports = function handlePresence(client) {
  updatePresence(client); // Met à jour la présence immédiatement

  // Met à jour la présence toutes les 10 minutes
  setInterval(() => updatePresence(client), 10 * 60 * 1000); 
};
