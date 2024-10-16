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

module.exports = { createProgressBar, getDaysUntilNextFriday };
  