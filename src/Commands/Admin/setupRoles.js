const { ButtonStyle, PermissionsBitField, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { getRoleChannel } = require('@Helpers/getChannels');
const { createEmbed } = require('@Helpers/Embed');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuproles')
    .setDescription('Configurer les rôles disponibles pour les utilisateurs')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle à ajouter')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    logger.log(`Ajout du rôle: ${role.name} avec l'ID: ${role.id}`);

    // Récupérer ou fetch le canal des rôles
    const roleChannel = await getRoleChannel(interaction.guild);
    if (!roleChannel) {
      return interaction.reply({ content: 'Le canal des rôles n\'est pas configuré. Veuillez le configurer d\'abord.', ephemeral: true });
    }

    // Chercher un message existant avec l'embed "🎭 Demandes de rôles"
    const messages = await roleChannel.messages.fetch({ limit: 10 });
    const existingMessage = messages.find(msg => 
      msg.embeds.length > 0 && msg.embeds[0].title === '🎭 Demandes de rôles'
    );

    const customId = `Request-${role.id}`; // CustomId basé uniquement sur l'ID du rôle

    // Créer un nouveau bouton pour la demande de rôle
    const newButton = new ButtonBuilder()
      .setLabel(`${role.name}`)
      .setStyle(ButtonStyle.Primary)
      .setCustomId(customId);

    // Si un embed existe déjà, vérifier si le bouton existe déjà avant de l'ajouter
    if (existingMessage) {
      const existingEmbed = existingMessage.embeds[0];
      let components = existingMessage.components.map(component => ActionRowBuilder.from(component));

      // Vérifier si le bouton pour ce rôle existe déjà
      const buttonExists = components.some(row => 
        row.components.some(button => button.data.custom_id === customId)
      );

      if (buttonExists) {
        return interaction.reply({ content: `Le bouton pour le rôle <@&${role.id}> existe déjà dans l'embed.`, ephemeral: true });
      }

      // Si le dernier ActionRow est plein (5 boutons), créer un nouveau ActionRow
      if (components.length === 0 || components[components.length - 1].components.length >= 5) {
        components.push(new ActionRowBuilder().addComponents(newButton));
      } else {
        components[components.length - 1].addComponents(newButton);
      }

      // Mettre à jour le message existant avec le nouveau bouton
      await existingMessage.edit({ embeds: [existingEmbed], components });
      logger.log(`Le bouton pour le rôle ${role.name} a été ajouté à l'embed existant.`);
      await interaction.reply({ content: `Le bouton pour le rôle <@&${role.id}> a été ajouté à l'embed existant.`, ephemeral: true });
    } else {
      // Sinon, créer un nouvel embed et ajouter le premier bouton
      const roleEmbed = createEmbed({
        TITLE: '🎭 Demandes de rôles',
        DESC: 'Cliquez sur les boutons ci-dessous pour demander un rôle spécifique.',
        COLOR: '#00ff00',
        CLIENT: interaction.client
      });

      const components = [new ActionRowBuilder().addComponents(newButton)];

      await roleChannel.send({
        embeds: [roleEmbed],
        components
      });

      logger.log(`Le rôle ${role.name} est maintenant disponible dans le canal des rôles.`);
      await interaction.reply({ content: `Le rôle <@&${role.id}> est maintenant disponible dans le canal des rôles.`, ephemeral: true });
    }

    setTimeout(async () => {
      await interaction.deleteReply();
    }, 5000);
  },
};