require('module-alias/register');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = require('@Config/Config');
const fs = require('fs');
const path = require('path');

// Fonction pour récupérer tous les fichiers de commande de manière récursive
function getAllFilesRecursively(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      jsFiles = [...jsFiles, ...getAllFilesRecursively(fullPath)];
    } else if (file.isFile() && file.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

// Récupérer toutes les commandes du dossier commands et ses sous-dossiers
const commandsPath = path.join(__dirname, './src/Commands');
const commandFiles = getAllFilesRecursively(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
  const command = require(file);
  commands.push(command.data.toJSON());
}

// Crée une nouvelle instance REST pour interagir avec l'API Discord
const rest = new REST({ version: '9' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Si tu veux enregistrer les commandes dans un serveur spécifique (guilde locale)
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
