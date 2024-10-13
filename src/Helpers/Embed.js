const { EmbedBuilder } = require('discord.js');

/**
 * Creates a custom embed with a global footer and structured options
 * @param {Object} options The options to configure the embed
 * @param {string} options.TITLE The title of the embed
 * @param {string} options.DESC The description of the embed
 * @param {string} [options.COLOR] The color of the embed (optional)
 * @param {Object} options.CLIENT The Discord client instance (to fetch the avatar)
 * @returns {EmbedBuilder} The Embed object
 */
function createEmbed({ TITLE, DESC, COLOR = '#0099ff', CLIENT }) {
  const embed = new EmbedBuilder()
    .setTitle(TITLE)
    .setDescription(DESC)
    .setColor(COLOR)
    .setTimestamp()
    .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: CLIENT.user.displayAvatarURL() });

  return embed;
}

/**
 * Creates an embed to inform the user that their role request has been accepted
 * @param {Object} options The options to configure the embed
 * @param {string} options.roleName The name of the accepted role
 * @param {Object} options.CLIENT The Discord client instance
 * @returns {EmbedBuilder} The acceptance Embed object
 */
function createAcceptEmbed({ roleName, CLIENT }) {
  const embed = new EmbedBuilder()
    .setTitle('✅ Demande de rôle acceptée')
    .setDescription(`Votre demande pour le rôle **${roleName}** a été acceptée ! 🎉`)
    .setColor('#00ff00')
    .setTimestamp()
    .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: CLIENT.user.displayAvatarURL() });

  return embed;
}

/**
 * Creates an embed to inform the user that their role request has been denied
 * @param {Object} options The options to configure the embed
 * @param {string} options.roleName The name of the denied role
 * @param {string} options.reason The reason for the denial
 * @param {Object} options.CLIENT The Discord client instance
 * @returns {EmbedBuilder} The denial Embed object
 */
function createDenyEmbed({ roleName, reason, CLIENT }) {
  const embed = new EmbedBuilder()
    .setTitle('❌ Demande de rôle refusée')
    .setDescription(`Votre demande pour le rôle **${roleName}** a été refusée.`)
    .addFields({ name: 'Raison:', value: reason })
    .setColor('#ff0000')
    .setTimestamp()
    .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: CLIENT.user.displayAvatarURL() });

  return embed;
}

/**
 * Creates an embed for role acceptance history
 * @param {Object} options The options to configure the history embed
 * @param {string} options.roleId The name of the role
 * @param {Object} options.member The user who requested the role
 * @param {Object} options.staffMember The staff member who handled the request
 * @param {Object} options.CLIENT The Discord client instance
 * @returns {EmbedBuilder} The history embed
 */
function createAcceptHistoryEmbed({ roleId, member, staffMember, CLIENT }) {
  return new EmbedBuilder()
    .setTitle('📜 Historique de demande de rôle (Acceptée)')
    .setDescription(`La demande de <@${member.id}> pour le rôle <@&${roleId}> a été **acceptée** par <@${staffMember.id}>.`)
    .setColor('#00ff00') // Couleur verte pour acceptation
    .setTimestamp()
    .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: CLIENT.user.displayAvatarURL() });
}

/**
 * Creates an embed for role request denial history
 * @param {Object} options The options to configure the history embed
 * @param {string} options.roleId The ID of the role
 * @param {string} options.reason The reason for the denial
 * @param {Object} options.member The user who requested the role
 * @param {Object} options.staffMember The staff member who handled the request
 * @param {Object} options.CLIENT The Discord client instance
 * @returns {EmbedBuilder} The history embed
 */
function createHistoryEmbed({ roleId, reason, member, staffMember, CLIENT }) {
  return new EmbedBuilder()
    .setTitle('📜 Historique de demande de rôle (Refusée)')
    .setDescription(`La demande de <@${member.id}> pour le rôle <@&${roleId}> a été **refusée** par <@${staffMember.id}>.`)
    .addFields(
      { name: 'Raison:', value: reason || 'Aucune raison fournie' }
    )
    .setColor('#ff0000') // Couleur rouge pour refus
    .setTimestamp()
    .setFooter({ text: '🍹 𝓓𝓔𝓐𝓓 - Bot ©', iconURL: CLIENT.user.displayAvatarURL() });
}

module.exports = { createEmbed, createAcceptEmbed, createDenyEmbed, createAcceptHistoryEmbed, createHistoryEmbed };