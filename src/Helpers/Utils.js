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
      throw new Error(`Unable to fetch the package.json file from the GitHub repository: ${response.statusText}`);
    }

    const githubPackageJson = await response.json();
    const remoteVersion = githubPackageJson.version;

    logger.log(`Local version: ${localVersion}, Remote version: ${remoteVersion}`);
    if (isNewerVersion(localVersion, remoteVersion)) {
      logger.warn(`A new version is available: ${remoteVersion}. Please update!`);
      logger.warn(`https://github.com/${repoOwner}/${repoName}`);
    } else {
      logger.log('No updates available. You are using the latest version.');
    }
  } catch (error) {
    logger.error(`Error while checking for updates: ${error.message}`);
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

/**
 * Function to create a progress bar based on a percentage
 * @param {number} progress The percentage of completion
 * @returns {string} The progress bar as an emoji string
 */
function createProgressBar(progress) {
    const totalBlocks = 22; // Nombre total de blocs dans la barre
    const filledBlocks = Math.round((progress / 100) * totalBlocks); // Blocs remplis selon le pourcentage
    const emptyBlocks = totalBlocks - filledBlocks;
  
    return '🟩'.repeat(filledBlocks) + '⬜'.repeat(emptyBlocks); // Barres remplies et vides
}
  
/**
 * Function to calculate the number of days until the next Friday
 * @returns {number} The number of days until Friday
 */
function getDaysUntilNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Calcul du nombre de jours restants
  return daysUntilFriday === 0 ? 7 : daysUntilFriday; // Si aujourd'hui c'est vendredi, retournez 7 jours
}

/**
 * Utility function to send an ephemeral follow-up and delete it after a delay.
 * @param {Interaction} interaction - The Discord interaction object
 * @param {Object} options - The options to pass to interaction.followUp
 * @param {number} timeout - The delay before deleting the message (default 5000ms)
 * @param {boolean} ephemeral - Whether the follow-up message should be ephemeral (default true)
 */
async function safeReply(interaction, options, timeout = 5000, ephemeral = true) {
  await interaction.reply({ ...options, ephemeral });

  setTimeout(async () => {
    try {
      await interaction.deleteReply();
    } catch (err) {
      logger.error('Erreur lors de la suppression du message:', err);
    }
  }, timeout);
}

/**
 * Utility function to send an ephemeral follow-up and delete it after a delay.
 * @param {Interaction} interaction - The Discord interaction object
 * @param {Object} options - The options to pass to interaction.followUp
 * @param {number} timeout - The delay before deleting the message (default 5000ms)
 * @param {boolean} ephemeral - Whether the follow-up message should be ephemeral (default true)
 */
async function safeFollowUp(interaction, options, timeout = 5000, ephemeral = true) {
  await interaction.followUp({ ...options, ephemeral });

  setTimeout(async () => {
    try {
      await interaction.deleteReply();
    } catch (err) {
      logger.error('Erreur lors de la suppression du message:', err);
    }
  }, timeout);
}

module.exports = { checkForUpdates, createProgressBar, getDaysUntilNextFriday, safeReply, safeFollowUp};
  