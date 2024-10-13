const { PermissionsBitField, ActionRowBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ROLE_CHANNEL_ID } = require('@Root/Config');
const logger = require('@Helpers/Logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Retire un rôle des options de demande de rôle.')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Le rôle à retirer des options.')
        .setRequired(true)),

  async execute(interaction) {
    try {
      // Vérification des permissions administratives
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
      }

      const role = interaction.options.getRole('role');

      // Récupérer ou fetch le canal des rôles
      let roleChannel = interaction.guild.channels.cache.get(ROLE_CHANNEL_ID);
      if (!roleChannel) {
        roleChannel = await interaction.guild.channels.fetch(ROLE_CHANNEL_ID);
      }

      // Chercher les messages récents dans le canal des rôles
      const messages = await roleChannel.messages.fetch({ limit: 10 });
      const existingMessage = messages.find(msg => 
        msg.embeds.length > 0 && msg.embeds[0].title === '🎭 Demandes de rôles'
      );

      // Si aucun message avec l'embed de rôle n'est trouvé
      if (!existingMessage) {
        return interaction.reply({ content: 'Aucun embed de demande de rôle trouvé.', ephemeral: true });
      }

      // Récupérer et transformer les composants en ActionRowBuilder
      let components = existingMessage.components.map(component => ActionRowBuilder.from(component));

      let found = false;

      // Parcourir les ActionRows et les boutons pour trouver le rôle correspondant
      components = components.map(row => {
        row.components = row.components.filter(button => {
          const customId = button.data.custom_id;

          // Vérifier si le customId correspond à celui du rôle
          if (customId && customId === `Request-${role.id}`) {
            found = true;
            return false; // Supprimer ce bouton
          }
          return true; // Garder les autres boutons
        });
        return row;
      });

      // Si aucun bouton correspondant au rôle n'a été trouvé
      if (!found) {
        return interaction.reply({ content: `Le rôle <@&${role.id}> n'a pas été trouvé dans l'embed des demandes de rôles.`, ephemeral: true });
      }

      // Supprimer les ActionRows sans composants
      components = components.filter(row => row.components.length > 0);

      // Mise à jour du message avec les composants restants
      await existingMessage.edit({ components });

      logger.log(`Le bouton pour le rôle ${role.name} a été supprimé avec succès.`);
      await interaction.reply({ content: `Le rôle <@&${role.id}> a été retiré des options de demande de rôle.`, ephemeral: true });

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 5000);
    } catch (error) {
      logger.error(`Erreur lors de la suppression du rôle: ${error.message}`);
      return interaction.reply({ content: 'Une erreur est survenue lors de la suppression du rôle.', ephemeral: true });
    }
  },
};