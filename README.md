# Tableau de la famille 🏠

Tableau de bord familial à afficher sur une tablette dans la cuisine :
heure et date, météo d'Horrues, semaine de chacun, soupers, tâches et liste de courses.

**Stack :** Next.js 15 (App Router, Server Actions) · React 19 · SQLite (`better-sqlite3`) · CSS simple.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

La base `data/famille.db` est créée et remplie toute seule au premier lancement
(Simon, Estelle, Léonie, Eva + horaires de la semaine). Pour repartir de zéro : supprime le dossier `data/`.

## Mettre en route à la maison

```bash
npm run build
npm start          # écoute sur 0.0.0.0:3000
```

Sur la tablette, ouvre `http://<IP-du-PC>:3000` et ajoute la page à l'écran d'accueil.
La page se rafraîchit toute seule toutes les 5 minutes.
Pour qu'elle tourne en permanence : un Raspberry Pi, un vieux PC, ou un conteneur Docker à côté de Home Assistant.

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
  db.ts               → connexion SQLite, création des tables, données de départ
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

Les horaires de départ (travail, école, crèche) se changent dans `seed()` de `lib/db.ts`.

## Idées pour la suite

- [ ] Page `/reglages` pour modifier les membres et les horaires sans toucher au code
- [ ] Synchroniser un agenda Google (API Calendar) à la place des événements manuels
- [ ] Module chauffage : stock de pellets / niveau de mazout, alerte de commande
- [ ] Afficher la conso du HomeWizard via l'API de Home Assistant
- [ ] Tableau d'étoiles pour Léonie
- [ ] Navigation semaine précédente / suivante
- [ ] PWA (manifest + icône) pour l'installer comme une vraie appli
