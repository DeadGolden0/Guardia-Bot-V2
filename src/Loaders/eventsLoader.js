const fs = require('fs');
const path = require('path');
const logger = require('@Helpers/Logger');

/**
 * Charger tous les événements du dossier 'events', y compris les sous-dossiers.
 * @param {Client} client - L'instance du client Discord
 */
module.exports = (client) => {
  logger.log('Chargement des événements...');

  // Fonction récursive pour obtenir tous les fichiers .js dans les sous-dossiers
  function getAllEventFiles(dirPath, eventFiles = []) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        // Récursion pour les sous-dossiers
        getAllEventFiles(filePath, eventFiles);
      } else if (file.endsWith('.js')) {
        eventFiles.push(filePath);
      }
    }
    
    return eventFiles;
  }

  // Récupérer tous les fichiers d'événements dans 'events' et ses sous-dossiers
  const eventFiles = getAllEventFiles(path.join(__dirname, '../Events'));

  let eventCount = 0;
  let failedCount = 0;

  // Charger chaque événement trouvé
  for (const file of eventFiles) {
    try {
      const event = require(file);

      // Vérifier que l'événement a bien un nom et une méthode execute
      if (!event.name || typeof event.execute !== 'function') {
        throw new Error(`L'événement dans le fichier ${file} est mal formé.`);
      }

      // Vérifier si l'événement doit être écouté une seule fois ou en continu
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      eventCount++;
    } catch (error) {
      logger.error(`Erreur lors du chargement de l'événement '${file}' : ${error.message}`);
      failedCount++;
    }
  }

  // Résumé du chargement
  logger.success(`${eventCount} événements chargés avec succès.`);
  if (failedCount > 0) {
    logger.warn(`${failedCount} événements ont échoué à se charger.`);
  }
};
