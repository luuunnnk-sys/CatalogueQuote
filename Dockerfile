# Dockerfile pour Catalogue Pro
FROM node:20-slim

# Créer le répertoire de l'application
WORKDIR /app

# Installer les dépendances système pour better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --omit=dev

# Copier le code source
COPY src/ ./src/
COPY prices_data.json ./
COPY fiche_matching.json ./

# Copier les fiches catalogue (optionnel, ignore si absent)
COPY ["Fiche catalogue/", "./Fiche catalogue/"]

# Créer le dossier data
RUN mkdir -p /app/data

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
