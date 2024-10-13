const fs = require('fs');
const path = require('path');
const logger = require('@Helpers/Logger');

/**
 * Charger toutes les commandes depuis le dossier 'commands', y compris les sous-dossiers.
 * @param {Client} client - L'instance du client Discord
 */
module.exports = (client) => {
  logger.log('Chargement des commandes...');

  // Fonction récursive pour obtenir tous les fichiers .js dans les sous-dossiers
  function getAllCommandFiles(dirPath, commandFiles = []) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        // Récursion pour les sous-dossiers
        getAllCommandFiles(filePath, commandFiles);
      } else if (file.endsWith('.js')) {
        commandFiles.push(filePath);
      }
    }
    
    return commandFiles;
  }

  // Récupérer tous les fichiers de commandes dans 'commands' et ses sous-dossiers
  const commandFiles = getAllCommandFiles(path.join(__dirname, '../Commands'));

  let commandCount = 0;
  let failedCount = 0;

  // Charger chaque commande trouvée
  for (const file of commandFiles) {
    try {
      const command = require(file);

      // Vérifier que la commande a bien une structure attendue
      if (!command.data || !command.data.name) {
        throw new Error(`La commande dans le fichier ${file} n'a pas de propriété 'data.name'.`);
      }

      // Enregistrer la commande dans la collection du client
      client.commands.set(command.data.name, command);
      commandCount++;
    } catch (error) {
      logger.error(`Erreur lors du chargement de la commande '${file}' : ${error.message}`);
      failedCount++;
    }
  }

  // Résumé du chargement
  logger.success(`${commandCount} commandes chargées avec succès.`);
  if (failedCount > 0) {
    logger.warn(`${failedCount} commandes ont échoué à se charger.`);
  }
};