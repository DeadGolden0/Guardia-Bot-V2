const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const RoleRequest = require('@Database/schemas/RoleRequest');
const { getStaffChannel } = require('@Helpers/getChannels');
const logger = require('@Helpers/Logger');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Vérifie si l'interaction est un bouton de demande de rôle
    if (!interaction.isButton()) return;

    const [action, roleId] = interaction.customId.split('-');

    // Vérifie si c'est une demande de rôle (action === 'Request')
    if (action === 'Request') {
      try {
        // Récupération du rôle
        let role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId);

        if (!role) {
          logger.error('Le rôle est introuvable après le fetch.');
          return interaction.reply({ content: 'Le rôle est introuvable.', ephemeral: true });
        }

        // Vérification si l'utilisateur possède déjà ce rôle
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(roleId)) {
          return interaction.reply({ content: `Vous possédez déjà le rôle <@&${roleId}>. Vous ne pouvez pas faire une nouvelle demande.`, ephemeral: true });
        }

        // Vérifier s'il y a déjà une demande en cours pour ce rôle et cet utilisateur
        const existingRequest = await RoleRequest.findOne({ userId: interaction.user.id, roleId, status: 'pending' });

        if (existingRequest) {
          return interaction.reply({ content: `Vous avez déjà une demande en cours pour le rôle <@&${roleId}>. Veuillez attendre que celle-ci soit traitée avant de faire une nouvelle demande.`, ephemeral: true });
        }

        // Enregistrement de la demande dans MongoDB
        await RoleRequest.create({
          userId: interaction.user.id,
          roleId: role.id,
          status: 'pending',
        });

        // Utiliser la fonction getStaffChannel pour récupérer dynamiquement le canal staff
        const staffChannel = await getStaffChannel(interaction.guild);
        if (!staffChannel) {
          return interaction.reply({ content: 'Le canal staff n\'est pas configuré. Veuillez le configurer d\'abord.', ephemeral: true });
        }

        // Créer un embed avec les informations du membre qui fait la demande
        const requestEmbed = new EmbedBuilder()
          .setTitle('🛠️ Nouvelle demande de rôle')
          .setColor('#ffcc00')
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription(`**<@${interaction.user.id}>** a demandé le rôle <@&${role.id}>.`)
          .setFooter({ text: 'Dead - Bot ©', iconURL: client.user.displayAvatarURL() })
          .setTimestamp();

        // Envoyer la demande de rôle au canal staff avec des boutons pour accepter ou refuser
        await staffChannel.send({
          embeds: [requestEmbed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`AcceptRequest-${interaction.user.id}-${roleId}`)
                .setLabel('Accepter')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`DenyRequest-${interaction.user.id}-${roleId}`)
                .setLabel('Refuser')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });

        // Réponse éphémère pour informer l'utilisateur
        await interaction.reply({ content: 'Votre demande a été envoyée au staff pour validation.', ephemeral: true });

        // Supprime la réponse éphémère après 5 secondes
        setTimeout(async () => {
          await interaction.deleteReply();
        }, 5000);

        // Log de la demande
        logger.log(`Demande de rôle envoyée au staff: ${interaction.user.tag} a demandé ${role.name}`);

      } catch (error) {
        logger.error(`Erreur lors de la gestion de la demande : ${error.message}`);
        return interaction.reply({ content: 'Une erreur est survenue lors de la gestion de votre demande.', ephemeral: true });
      }
    }
  },
};
