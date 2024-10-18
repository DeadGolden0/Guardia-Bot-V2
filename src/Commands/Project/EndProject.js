const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { isProjectLeader } = require('@Helpers/Validators');
const { safeFollowUp } = require('@Helpers/Message');
const { PROJECTS } = require('@Config/Config');
const Responses = require('@Config/Responses');
const logger = require('@Helpers/Logger');

/**
 * Ends the project and sends a confirmation request to the leader.
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object.
 * @returns {Promise<void>}
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('endproject')
    .setDescription('Met fin à votre projet actuel en supprimant les channels et rôles associés. (Lead groupe uniquement)'),

  async execute(interaction) {
    if (!PROJECTS.ENABLED) {
      return safeFollowUp(interaction, { content: Responses.projectsDisabled });
    }

    const leaderId = interaction.user.id;

    // Check if the user is the leader of the project
    const { project, isLeader } = await isProjectLeader(leaderId);
    if (!isLeader) {
      return safeFollowUp(interaction, { content: Responses.notLeader });
    }

    // Check if a confirmation is already pending for this project
    if (project.confirmationPending) {
      return safeFollowUp(interaction, { content: Responses.confirmationPending });
    }

    // Set confirmation pending
    project.confirmationPending = true;
    await project.save();

    // Get the project's text channel
    const textChannel = interaction.guild.channels.cache.get(project.textChannelId);
    if (!textChannel) {
      return safeFollowUp(interaction, { content: Responses.simpleError });
    }

    // Send confirmation prompt to the user
    await safeFollowUp(interaction, { content: Responses.endProject(project.groupeNumber) });

    // Create confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setTitle('❗ Confirmation de la fin du projet')
      .setDescription(`Êtes-vous sûr de vouloir mettre fin au groupe de projet **n°${project.groupeNumber}** ?\n\n **Cette action est irréversible.**`)
      .setColor('#FF0000')
      .setTimestamp()
      .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: interaction.client.user.displayAvatarURL() });

    // Create buttons for confirm and cancel
    const cancelButton = new ButtonBuilder()
      .setCustomId('PROJECT_CANCEL')
      .setLabel('Annuler')
      .setStyle(ButtonStyle.Secondary);

    const confirmButton = new ButtonBuilder()
      .setCustomId('PROJECT_CONFIRM')
      .setLabel('Confirmer')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(cancelButton, confirmButton);

    // Ghost ping the leader
    const ghostPingMessage = await textChannel.send(`<@${leaderId}>`);
    setTimeout(() => ghostPingMessage.delete().catch(() => {}), 50);

    // Send the confirmation message
    await textChannel.send({ embeds: [confirmEmbed], components: [row] });

    logger.log(`[END_PROJECT] Confirmation envoyée pour le projet n°${project.groupeNumber}.`);
  },
};
