# Utiliser une image Node.js officielle comme image de base
FROM node:latest

# Définir le répertoire de travail dans le conteneur
WORKDIR /bot

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Commande pour démarrer l'application
CMD ["node", "index.js"]
