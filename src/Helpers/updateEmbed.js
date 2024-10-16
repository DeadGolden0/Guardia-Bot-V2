const { createProjectInfoEmbed } = require('@Helpers/Embed');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Updates the information embed in the project's information channel.
 * @param {Object} project - The project object containing project information.
 * @param {Object} interaction - The Discord interaction object.
 * @returns {Promise} - Resolves if the embed is updated, otherwise throws an error.
 */
async function updateProjectInfoEmbed(project, interaction) {
  try {
    // Récupérer le channel d'information
    const infoChannel = interaction.guild.channels.cache.get(project.infoChannelId);
    if (!infoChannel) { return interaction.reply({ content: Responses.errors.infoChannelNotFound, ephemeral: true }); }

    // Récupérer le message contenant l'embed d'information
    const infoMessage = await infoChannel.messages.fetch({ limit: 1 }).then(messages => messages.first());
    if (!infoMessage) { return interaction.reply({ content: Responses.errors.infoMessageNotFound, ephemeral: true }); }

    // Créer l'embed mis à jour
    const updatedEmbed = createProjectInfoEmbed({ project, CLIENT: interaction.client });

    // Mettre à jour l'embed dans le message
    await infoMessage.edit({ embeds: [updatedEmbed] });
    logger.log(`[UPDATE_EMBED] Embed mis à jour avec succès pour le projet n°${project.groupeNumber}`);
    
  } catch (error) {
    logger.error(`[UPDATE_EMBED] Erreur lors de la mise à jour de l'embed pour le projet n°${project.groupeNumber}: ${error.message}`);
    return interaction.reply({ content: 'Une erreur est survenue lors de la mise à jour de l\'embed.', ephemeral: true });
  }
}

module.exports = { updateProjectInfoEmbed };