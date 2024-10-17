const { version: localVersion } = require('@Root/package.json');
const logger = require('@Helpers/Logger');

/**
 * Checks if an update is available on GitHub
 * @returns {Promise<void>}
 */
async function checkForUpdates() {
  try {
    const repoOwner = 'DeadGolden0';
    const repoName = 'Guardia-Bot-V2';

    // Fetch the package.json from the GitHub repository
    const githubPackageJson = await fetchPackageJsonFromGitHub(repoOwner, repoName);
    const remoteVersion = githubPackageJson.version;

    // Compare the local and remote versions
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
 * Fetches the package.json from the GitHub repository
 * @param {string} repoOwner - The owner of the GitHub repository
 * @param {string} repoName - The name of the GitHub repository
 * @returns {Promise<Object>} Parsed package.json content
 * @throws Will throw an error if fetching fails
 */
async function fetchPackageJsonFromGitHub(repoOwner, repoName) {
  const githubUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/package.json`;

  const response = await fetch(githubUrl); 
  if (!response.ok) {
    throw new Error(`Impossible de récupérer le fichier package.json du dépôt GitHub : ${response.statusText}`);
  }
  return response.json();
}

/**
 * Compares two semantic versions to check if a new version is available
 * @param {string} localVersion - The current local version
 * @param {string} remoteVersion - The remote version available on GitHub
 * @returns {boolean} True if the remote version is newer, false otherwise
 */
function isNewerVersion(localVersion, remoteVersion) {
  const [localMajor, localMinor, localPatch] = localVersion.split('.').map(Number);
  const [remoteMajor, remoteMinor, remotePatch] = remoteVersion.split('.').map(Number);

  // Compare the major, minor, and patch versions
  if (remoteMajor > localMajor) return true;
  if (remoteMajor === localMajor && remoteMinor > localMinor) return true;
  if (remoteMajor === localMajor && remoteMinor === localMinor && remotePatch > localPatch) return true;
  
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

module.exports = { checkForUpdates, createProgressBar, getDaysUntilNextFriday};
  