const { version: localVersion } = require('@Root/package.json');
const logger = require('@Helpers/Logger');
const fetch = require("node-fetch");

/**
 * Checks if an update is available on GitHub
 * @returns {Promise<void>}
 */
async function checkForUpdates() {
  try {
    const repoOwner = 'DeadGolden0';
    const repoName = 'Guardia-Bot-V2';
    const githubUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/package.json`;

    const response = await fetch(githubUrl);
    if (!response.ok) {
      throw new Error(`Impossible de récupérer le fichier package.json du dépôt GitHub: ${response.statusText}`);
    }

    const githubPackageJson = await response.json();
    const remoteVersion = githubPackageJson.version;

    logger.log(`Version locale: ${localVersion}, Version distante: ${remoteVersion}`);

    // Comparaison des versions
    if (isNewerVersion(localVersion, remoteVersion)) {
      logger.warn(`Une nouvelle version est disponible : ${remoteVersion}. Veuillez mettre à jour !`);
    } else {
      logger.log('Aucune mise à jour disponible. Vous utilisez la dernière version.');
    }
  } catch (error) {
    logger.error(`Erreur lors de la vérification des mises à jour: ${error.message}`);
  }
}

/**
 * Compares two semantic versions (X.Y.Z)
 * @param {string} localVersion - The local version (e.g., "1.0.0")
 * @param {string} remoteVersion - The remote version (e.g., "1.1.0")
 * @returns {boolean} - Returns true if the remote version is newer
 */
function isNewerVersion(localVersion, remoteVersion) {
  const localParts = localVersion.split('.').map(Number);
  const remoteParts = remoteVersion.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (remoteParts[i] > localParts[i]) return true;
    if (remoteParts[i] < localParts[i]) return false;
  }
  return false;
}

module.exports = { checkForUpdates };
