import { neon } from "@neondatabase/serverless";

// Base Postgres (Neon). DATABASE_URL est ajoutée automatiquement par l'intégration Neon sur Vercel.
// En local : copie la valeur dans un fichier .env.local (voir README).
const url = process.env.DATABASE_URL;

// URL factice si absente, pour que le build passe ; ensureDb() donne alors une erreur claire.
export const sql = neon(url ?? "postgresql://user:pass@missing.invalid/db");

// ---------- Types
export type Member = { id: number; name: string; color: string; emoji: string };
export type Recurring = { id: number; title: string; weekday: number; time: string | null; member_id: number | null };
export type Event = { id: number; title: string; date: string; time: string | null; member_id: number | null };
export type Meal = { date: string; slot: string; name: string };
export type Task = { id: number; title: string; done: boolean; member_id: number | null };
export type ShoppingItem = { id: number; name: string; checked: boolean };

// Création des tables + données de départ, une seule fois par instance du serveur.
let ready: Promise<void> | null = null;
export function ensureDb() {
  ready ??= migrate().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

async function migrate() {
  if (!url) throw new Error("DATABASE_URL manquante : ajoute la base Neon au projet (voir README).");
  await sql`CREATE TABLE IF NOT EXISTS member (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '🙂'
  )`;
  // weekday : 1 = lundi … 7 = dimanche
  await sql`CREATE TABLE IF NOT EXISTS recurring_event (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, weekday INT NOT NULL, time TEXT,
    member_id INT REFERENCES member(id) ON DELETE SET NULL
  )`;
  // date au format AAAA-MM-JJ, time HH:MM ou NULL (toute la journée)
  await sql`CREATE TABLE IF NOT EXISTS event (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL, time TEXT,
    member_id INT REFERENCES member(id) ON DELETE SET NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS meal (
    date TEXT NOT NULL, slot TEXT NOT NULL DEFAULT 'soir', name TEXT NOT NULL, PRIMARY KEY (date, slot)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS task (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, done BOOLEAN NOT NULL DEFAULT false,
    member_id INT REFERENCES member(id) ON DELETE SET NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS shopping_item (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, checked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  const [{ n }] = (await sql`SELECT COUNT(*)::int AS n FROM member`) as { n: number }[];
  if (n === 0) await seed();
}

async function seed() {
  const add = async (name: string, color: string, emoji: string) =>
    ((await sql`INSERT INTO member (name, color, emoji) VALUES (${name}, ${color}, ${emoji}) RETURNING id`)[0] as { id: number }).id;

  const simon = await add("Simon", "#2f6fde", "👨");
  await add("Estelle", "#c2410c", "👩");
  const leonie = await add("Léonie", "#a21caf", "👧");
  const eva = await add("Eva", "#059669", "👶");

  const rec: [string, number, string | null, number][] = [];
  for (let d = 1; d <= 5; d++) rec.push(["Travail GXO", d, "07:00", simon]);
  for (const d of [1, 2, 4, 5]) rec.push(["École", d, "08:30", leonie]);
  rec.push(["École (matin)", 3, "08:30", leonie]);
  for (const d of [2, 3, 4, 5]) rec.push(["Crèche", d, null, eva]);

  await sql.transaction([
    ...rec.map(([t, d, h, m]) => sql`INSERT INTO recurring_event (title, weekday, time, member_id) VALUES (${t}, ${d}, ${h}, ${m})`),
    sql`INSERT INTO task (title, member_id) VALUES ('Commander des pellets', ${simon}), ('Devoirs : lecture', ${leonie})`,
    sql`INSERT INTO shopping_item (name) VALUES ('Lait'), ('Pain'), ('Langes')`,
  ]);
}
