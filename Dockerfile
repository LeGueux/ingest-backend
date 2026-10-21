# Utilise une image officielle Node.js
FROM node:24.22.1
RUN npm install --global npm@12.2.1

# Dossier de travail
WORKDIR /

# Copier les fichiers
COPY package*.json .npmrc ./
RUN npm ci

COPY . .

# Expose le port
EXPOSE 3001

# Lancer l'app
CMD ["npm", "start"]
