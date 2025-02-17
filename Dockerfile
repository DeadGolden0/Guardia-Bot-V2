# Utiliser une image Node.js officielle comme image de base
FROM node:16

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port que l'application utilise
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["node", "index.js"]
