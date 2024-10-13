const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { createDenyEmbed, createHistoryEmbed } = require('@Helpers/embed');
const RoleRequest = require('@Database/schemas/RoleRequest');
const logger = require('@Helpers/logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Gestion du bouton de refus
    if (interaction.isButton()) {
      const [action, userId, roleId] = interaction.customId.split('-');

      if (action === 'DenyRequest') {
        try {
          const member = await interaction.guild.members.fetch(userId);

          if (!member) {
            return interaction.reply({ content: 'Le membre est introuvable.', ephemeral: true });
          }

          // Création du modal pour entrer la raison du refus
          const modal = new ModalBuilder()
            .setCustomId(`DenyReason-${userId}-${roleId}`)
            .setTitle('Raison du refus');

          // Champ de texte pour entrer la raison
          const reasonInput = new TextInputBuilder()
            .setCustomId('reasonInput')
            .setLabel('Pourquoi refusez-vous cette demande ?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const actionRow = new ActionRowBuilder().addComponents(reasonInput);
          modal.addComponents(actionRow);

          // Afficher le modal
          await interaction.showModal(modal);
        } catch (error) {
          logger.error(`Erreur lors de l'ouverture du modal de refus : ${error.message}`);
          return interaction.reply({ content: 'Une erreur est survenue lors de l\'ouverture du modal.', ephemeral: true }).then(() => {
            setTimeout(() => interaction.deleteReply(), 5000);
          });
        }
      }
    }

    // Gestion de la soumission du modal (DenyReason)
    if (interaction.isModalSubmit()) {
      const [action, userId, roleId] = interaction.customId.split('-');

      if (action === 'DenyReason') {
        try {
          const member = await interaction.guild.members.fetch(userId);
          const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId);

          if (!member || !role) {
            return interaction.reply({ content: 'Le membre ou le rôle est introuvable.', ephemeral: true });
          }

          const reason = interaction.fields.getTextInputValue('reasonInput');

          // Mise à jour dans MongoDB
          const result = await RoleRequest.findOneAndUpdate(
            { userId, roleId, status: 'pending' },
            { status: 'denied', staffId: interaction.user.id, reason, updatedAt: Date.now() }
          );

          if (!result) {
            logger.error('La demande de rôle est introuvable dans la base de données.');
            return interaction.reply({ content: 'Erreur : la demande est introuvable dans la base de données.', ephemeral: true });
          }

          // Confirmer le refus au staff
          await interaction.reply({ content: `La demande de rôle pour <@${member.user.id}> a été refusée.`, ephemeral: true });

          // Informer l'utilisateur via message direct en utilisant `role.name`
          await member.send({ embeds: [createDenyEmbed({ roleName: role.name, reason, CLIENT: client })] });

          // Créer un embed d'historique
          const historyEmbed = createHistoryEmbed({
            roleId: role.id,
            reason,
            member,
            staffMember: interaction.user,
            CLIENT: client
          });

          // Supprimer l'ancien message de demande
          await interaction.message.delete();
          
          // Envoyer un nouveau message avec l'embed d'historique dans le canal staff
          const staffChannel = interaction.channel;
          await staffChannel.send({ embeds: [historyEmbed] });

          // Log final de confirmation
          logger.log(`Demande de rôle refusée pour ${member.user.tag} par ${interaction.user.tag}. Raison: ${reason}`);

          // Supprimer la réponse éphémère après 5 secondes
          setTimeout(async () => {
            await interaction.deleteReply();
          }, 5000);

        } catch (error) {
          logger.error(`Erreur lors de la soumission du refus : ${error.message}`);
          return interaction.reply({ content: 'Une erreur est survenue lors du traitement de la raison.', ephemeral: true }).then(() => {
            setTimeout(() => interaction.deleteReply(), 5000);
          });
        }
      }
    }
  }
};