const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { safeFollowUp } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Clears a specified number of messages in the channel.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 * 
 * @example
 * // Example usage within a Discord server
 * /clear amount:10
 * 
 * @description
 * This command allows administrators to quickly clear a specified number of messages from a channel.
 * The number of messages can be between 1 and 100.
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un certain nombre de messages du canal. (ADMIN ONLY)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Le nombre de messages à supprimer (entre 1 et 100)')
        .setRequired(true)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return safeFollowUp(interaction, { content: 'Vous devez spécifier un nombre entre 1 et 100.' });
    }

    const channel = interaction.channel;
    const deletedMessages = await channel.bulkDelete(amount, true);
    
    logger.log(`Suppression de ${deletedMessages.size} messages dans le canal ${channel.name} par ${interaction.user.tag}.`);
    
    await safeFollowUp(interaction, { content: `${deletedMessages.size} messages supprimés avec succès.`, ephemeral: true });
  },
};
