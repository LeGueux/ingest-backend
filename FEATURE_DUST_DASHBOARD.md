# Dust Dashboard — architecture et flux

## Objectif
Ce projet permet d’afficher sur un dashboard Nuxt les markets “dust” sélectionnés par le bot Discord, via un backend de synchronisation hébergé sur Koyeb.

## Schéma de fonctionnement
1. Le bot Discord analyse les markets Polymarket et génère la liste des opportunités dust.
2. Le bot envoie cette liste vers le backend Koyeb via l’endpoint POST /ingest.
3. Le backend Koyeb enregistre les données dans son état local et les diffuse ensuite au frontend via /state et /events.
4. Le frontend Nuxt (hébergé sur Vercel) récupère les données depuis le backend Koyeb et les affiche dans la page Dust Dashboard.

## Rôle de chaque projet
- bot_discord
  - Détecte les markets dust.
  - Formate les résultats.
  - Envoie les données au backend Koyeb.

- ingest-backend
  - Reçoit les payloads du bot.
  - Sauvegarde l’état.
  - Fournit les endpoints /state et /events.

- dashboard-ui-frontend
  - Lit les données depuis Koyeb.
  - Affiche les markets dust dans une interface moderne.
  - Peut être déployé sur Vercel.

## Variables d’environnement utiles
- Bot Discord :
  - INGEST_BACKEND_URL
  - BOT_TO_UI_TOKEN

- Backend Koyeb :
  - BOT_TO_UI_TOKEN
  - UI_ORIGIN
  - PORT

- Frontend Vercel / Nuxt :
  - NUXT_PUBLIC_INGEST_BACKEND_URL

## Résultat attendu
Le dashboard affiche uniquement les markets dust que le bot a sélectionnés, avec une mise à jour régulière et une interface propre adaptée à une première version fonctionnelle.

## Note de conception
Le flux est volontairement séparé en 3 couches :
- collecte (bot)
- stockage / diffusion (Koyeb)
- affichage (Vercel)

Cela permet de garder le bot Discord léger, de centraliser les données côté backend, et d’avoir un frontend simple à faire évoluer ensuite.
