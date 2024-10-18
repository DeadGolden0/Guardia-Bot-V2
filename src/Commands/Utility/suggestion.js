const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const SuggestionCounter = require('@Database/schemas/SuggestionCounter');
const ServerConfig = require('@Database/schemas/ServerConfig');
const Suggestion = require('@Database/schemas/Suggestion');
const { safeFollowUp } = require('@Helpers/Message');
const { SUGGESTIONS } = require('@Config/Config');
const logger = require('@Helpers/Logger');

/**
 * Creates a suggestion poll for members to vote on.
 * 
 * @param {import('discord.js').CommandInteraction} interaction - The command interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Crée une suggestion pour permettre aux membres de voter.')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Suggestion à proposer.')
        .setRequired(true)),

  async execute(interaction) {
    if (!SUGGESTIONS.ENABLED) {
      return safeFollowUp(interaction, { content: 'Le module de suggestions n\'est pas activé.', ephemeral: true });
    }

    const question = interaction.options.getString('question');
    const guildId = interaction.guild.id;

    // Fetch server configuration to get the suggestion channel
    const config = await ServerConfig.findOne({ guildId });

    if (!config || !config.suggestionChannelId) {
      return safeFollowUp(interaction, { content: 'Le canal de suggestions n\'est pas configuré. Veuillez demander à un administrateur de le configurer.', ephemeral: true });
    }

    const suggestionChannel = interaction.guild.channels.cache.get(config.suggestionChannelId);

    if (!suggestionChannel) {
      return safeFollowUp(interaction, { content: 'Le canal de suggestions configuré est introuvable. Veuillez vérifier la configuration.', ephemeral: true });
    }

    // Get or create the suggestion counter
    let counterDoc = await SuggestionCounter.findOne({ guildId });
    if (!counterDoc) {
      counterDoc = await new SuggestionCounter({ guildId, counter: 1 }).save();
    } else {
      counterDoc.counter += 1;
      await counterDoc.save();
    }

    const suggestionId = counterDoc.counter;

    // Create the suggestion poll embed
    const pollEmbed = new EmbedBuilder()
      .setTitle(`📊 Nouvelle Suggestion #${suggestionId}`)
      .setDescription(question)
      .addFields(
        { name: '🟢 Upvotes', value: '0', inline: true },
        { name: '\u200B', value: '\u200B', inline: true }, // Separator
        { name: '🔴 Downvotes', value: '0', inline: true }
      )
      .setColor('#3498DB')
      .setFooter({ text: `Suggestion créée par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    // Create Upvote and Downvote buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('POLL_YES')
        .setLabel('Upvote')
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('POLL_NO')
        .setLabel('Downvote')
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger)
    );

    // Send the suggestion to the configured suggestion channel
    const message = await suggestionChannel.send({ embeds: [pollEmbed], components: [row] });

    // Save the suggestion to MongoDB
    await new Suggestion({
      guildId,
      suggestionId,
      channelId: suggestionChannel.id,
      messageId: message.id,
      authorId: interaction.user.id,
      content: question
    }).save();

    logger.log(`Suggestion #${suggestionId} créée par ${interaction.user.tag} avec la question : "${question}"`);
    await safeFollowUp(interaction, { content: `La suggestion #${suggestionId} a été créée avec succès et envoyée au canal de suggestions.`, ephemeral: true });
  },
};
