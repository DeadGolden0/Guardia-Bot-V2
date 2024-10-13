// commands/cancelRequest.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const RoleRequest = require('@Database/schemas/RoleRequest');
const logger = require('@Helpers/Logger');

/**
 * Commande slash pour annuler une demande de rôle en attente
 * @param {Interaction} interaction L'interaction de commande slash
 * @returns {void}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancelrequest')
    .setDescription('Annuler une demande de rôle en attente'),
    
  async execute(interaction) {
    const userId = interaction.user.id;
    const request = await RoleRequest.findOne({ userId, status: 'pending' });

    if (!request) {
      return interaction.reply({ content: 'Vous n\'avez aucune demande de rôle en attente.', ephemeral: true });
    }

    await RoleRequest.deleteOne({ _id: request._id });
    logger.info(`Demande annulée par l'utilisateur ${interaction.user.tag}`);

    return interaction.reply({ content: 'Votre demande de rôle a été annulée avec succès.', ephemeral: true });
  },
};
