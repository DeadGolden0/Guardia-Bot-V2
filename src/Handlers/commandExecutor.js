const logger = require('@Helpers/Logger');

/**
 * Handles the execution of commands, with permission checks and cooldowns
 * @param {Interaction} interaction - The Discord interaction
 */
module.exports = async (interaction) => {
    const cmd = interaction.client.commands.get(interaction.commandName);

    if (!cmd) {
        const msg = await interaction.reply({ content: "An error has occurred", ephemeral: true });
        setTimeout(() => msg.delete(), 5000);
        return;
    }

    // Vérification des permissions de la commande
    if (cmd.data.default_member_permissions && !interaction.member.permissions.has(cmd.data.default_member_permissions)) {
        const msg = await interaction.reply({ content: 'Oops! Vous n\'avez pas la permission d\'exécuter cette commande.', ephemeral: true });
        setTimeout(() => msg.delete(), 5000);
        return;
    }

    // Exécuter la commande
    try {
        await interaction.deferReply({ ephemeral: true });
        await cmd.execute(interaction);
    } catch (error) {
        logger.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
        await interaction.reply({ content: 'Une erreur est survenue lors de l’exécution de la commande.', ephemeral: true });
    }
};
