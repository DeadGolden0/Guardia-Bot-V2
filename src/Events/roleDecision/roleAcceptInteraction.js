const { createAcceptEmbed, createAcceptHistoryEmbed } = require('@Helpers/embed');
const RoleRequest = require('@Database/schemas/RoleRequest');
const logger = require('@Helpers/Logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const [action, userId, roleId] = interaction.customId.split('-');

    if (action === 'AcceptRequest') {
      try {
        const member = await interaction.guild.members.fetch(userId);
        const role = interaction.guild.roles.cache.get(roleId);

        if (!member || !role) {
          return interaction.reply({ content: 'Le membre ou le rôle est introuvable.', ephemeral: true });
        }

        if (!interaction.guild.members.me.permissions.has('MANAGE_ROLES')) {
          return interaction.reply({ content: 'Je n\'ai pas la permission de gérer les rôles.', ephemeral: true });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.reply({ content: 'Je ne peux pas attribuer ce rôle, il est trop élevé dans la hiérarchie.', ephemeral: true });
        }

        await member.roles.add(role);

        await RoleRequest.findOneAndUpdate(
          { userId, roleId, status: 'pending' },
          { status: 'accepted', staffId: interaction.user.id, updatedAt: Date.now() }
        );

        // Réponse éphémère pour confirmer l'acceptation
        await interaction.reply({ content: `Le rôle <@&${role.id}> a été attribué à <@${member.user.id}>.`, ephemeral: true });

        // Envoyer un message privé à l'utilisateur pour confirmer l'acceptation
        await member.send({ embeds: [createAcceptEmbed({ roleName: role.name, CLIENT: client })] });

        // Créer un embed d'historique d'acceptation
        const historyEmbed = createAcceptHistoryEmbed({
          roleId: role.id,
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
        logger.log(`Rôle (${role.name}) attribué à ${member.user.tag} par ${interaction.user.tag}`);

        // Supprimer la réponse éphémère après 5 secondes
        setTimeout(async () => {
          await interaction.deleteReply();
        }, 5000);

      } catch (error) {
        logger.error(`Erreur lors de l'acceptation de la demande : ${error.message}`);
        return interaction.reply({ content: 'Une erreur est survenue lors de l\'acceptation.', ephemeral: true }).then(() => {
          setTimeout(() => interaction.deleteReply(), 5000);
        });
      }
    }
  }
};
