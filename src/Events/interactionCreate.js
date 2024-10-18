const { handleRequest, handleAccept, handleDeny } = require('@Handlers/roleRequestButton');
const { handleSuggestionInteraction } = require('@Handlers/suggestionHandler');
const { handleDenyModal  } = require('@Handlers/roleRequestModal');
const { handleEndProject  } = require('@Handlers/projectButton');
const commandExecutor = require('@Handlers/commandExecutor');
const { InteractionType } = require('discord.js');
const { safeReply } = require('@Helpers/Message');
const logger = require('@Helpers/Logger');

/**
 * Handles the interaction create event from Discord, processing slash commands, button interactions,
 * modals, and other types of interactions.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object from Discord.
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @returns {Promise<void>} - Resolves when the interaction has been processed.
 * 
 * @example
 * // Handles a button interaction
 * client.on('interactionCreate', async (interaction) => {
 *   require('./path/to/this/file')(client, interaction);
 * });
 * 
 * @description
 * This function processes different types of interactions that occur in a Discord server:
 * - Slash commands (via `commandExecutor`)
 * - Button interactions (e.g., handling role requests, accept/deny buttons)
 * - Modal submissions
 * It also handles unexpected interaction types and sends appropriate responses. Errors during
 * interaction processing are logged and a user-friendly error message is returned.
 */
module.exports = async (client, interaction) => {
  if (!interaction.guild) {
    return safeReply(interaction, { content: "Les commandes peuvent seulement être exécutées dans un serveur Discord." });
  }

  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      await commandExecutor(interaction);
    }

    // Button interactions
    else if (interaction.isButton()) {
      const [action] = interaction.customId.split('-');
    
      switch (action) {
        case 'ROLE_REQUEST':
          await handleRequest(interaction, client);
          break;
      
        case 'ROLE_ACCEPT':
          await handleAccept(interaction);
          break;
      
        case 'ROLE_DENY':
          await handleDeny(interaction);
          break;

        case 'PROJECT_CONFIRM':
        case 'PROJECT_CANCEL':
          await handleEndProject(interaction, action);
          break;

        case 'POLL_YES':
        case 'POLL_NO':
          await handleSuggestionInteraction(interaction);
          break;
      
        default:
          return safeReply(interaction, { content: 'Bouton non reconnu.' });
      }
    }

    // Modal interactions
    else if (interaction.type === InteractionType.ModalSubmit) {
      const [action] = interaction.customId.split('-');
      switch (action) {
        case 'ROLE_DENY_MODAL':
          await handleDenyModal(interaction, client);
          break;
      
        default:
          return safeReply(interaction, { content: 'Modal non reconnu.' });
      }
    }

    // Other interaction types
    else {
      return safeReply(interaction, { content: 'Type d\'interaction non reconnu.' });
    }
  } catch (error) {
    logger.error(`Error handling interaction: ${interaction.customId || interaction.commandName}`, error);
    await safeReply(interaction, { content: 'Une erreur est survenue lors du traitement de l\'interaction.' });
  }
};