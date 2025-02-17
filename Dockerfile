# Utiliser une image Node.js officielle comme image de base
FROM node:latest

# Définir le répertoire de travail dans le conteneur
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copier les fichiers package.json et package-lock.json
COPY package*.json /usr/src/bot

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . /usr/src/bot

# Commande pour démarrer l'application
CMD ["node", "index.js"]
