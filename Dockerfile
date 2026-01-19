# Dockerfile pour Chubb Catalogue Pro
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Installer les dépendances de build pour better-sqlite3
RUN apk add --no-cache python3 make g++

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/
COPY prices_data.json ./
COPY fiche_matching.json ./

# Copier les fiches catalogue (si présentes)
COPY ["Fiche catalogue/", "./Fiche catalogue/"]

# Créer le dossier data
RUN mkdir -p /app/data

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
