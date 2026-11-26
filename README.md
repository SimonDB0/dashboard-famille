# Tableau de la famille 🏠

Tableau de bord familial à afficher sur une tablette dans la cuisine :
heure et date, météo d'Horrues, semaine de chacun, soupers, tâches et liste de courses.

**Stack :** Next.js 15 (App Router, Server Actions) · React 19 · Postgres Neon (`@neondatabase/serverless`) · CSS simple.
Hébergé sur Vercel, protégé par un code d'accès.

## Variables d'environnement

| Variable       | Rôle                                                                 |
|----------------|----------------------------------------------------------------------|
| `DATABASE_URL` | Base Neon. Ajoutée automatiquement par l'intégration Neon de Vercel. |
| `ACCESS_CODE`  | Code à taper sur chaque appareil (mémorisé 1 an).                    |

Les tables et les données de départ sont créées automatiquement à la première visite.

## Mise en ligne sur Vercel

1. Projet Vercel relié à ce dépôt : chaque `git push` sur `main` redéploie.
2. **Storage → Create Database → Neon** puis *Connect* au projet : ça ajoute `DATABASE_URL`.
3. **Settings → Environment Variables** : ajoute `ACCESS_CODE`.
4. **Deployments → Redeploy** pour prendre en compte les variables.

## En local

```bash
npm install
# .env.local avec DATABASE_URL (copiée depuis Vercel) et ACCESS_CODE
npx vercel env pull .env.local   # ou à la main
npm run dev                       # http://localhost:3000
```

## Structure

```
app/
  page.tsx            → le tableau (composant serveur, lit la base)
  actions.ts          → Server Actions : ajouter / cocher / supprimer
  components/
    Clock.tsx         → horloge + rafraîchissement auto
    CheckItem.tsx     → case à cocher avec mise à jour optimiste
  globals.css         → style (mode clair/sombre automatique)
lib/
  db.ts               → connexion Postgres, création des tables, données de départ
  auth.ts             → hash du code d'accès
middleware.ts         → redirige vers /login sans le bon cookie
app/login/page.tsx    → page du code d'accès
  dates.ts            → semaine en cours, jours (heure de Bruxelles)
  weather.ts          → météo Open-Meteo (gratuit, sans clé)
```

## Tables

| Table             | Rôle                                                       |
|-------------------|------------------------------------------------------------|
| `member`          | membres de la famille (nom, couleur, emoji)                |
| `recurring_event` | ce qui revient chaque semaine (`weekday` 1 = lundi … 7)    |
| `event`           | rendez-vous ponctuels (`date` AAAA-MM-JJ, `time` optionnel) |
| `meal`            | souper par jour (clé `date` + `slot`)                      |
| `task`            | tâches, assignables à quelqu'un                            |
| `shopping_item`   | liste de courses                                           |

Les horaires de départ (travail, école, crèche) se changent dans `seed()` de `lib/db.ts` (pris en compte seulement si la table `member` est vide).

## Idées pour la suite

- [ ] Page `/reglages` pour modifier les membres et les horaires sans toucher au code
- [ ] Synchroniser un agenda Google (API Calendar) à la place des événements manuels
- [ ] Module chauffage : stock de pellets / niveau de mazout, alerte de commande
- [ ] Afficher la conso du HomeWizard via l'API de Home Assistant
- [ ] Tableau d'étoiles pour Léonie
- [ ] Navigation semaine précédente / suivante
- [ ] PWA (manifest + icône) pour l'installer comme une vraie appli
