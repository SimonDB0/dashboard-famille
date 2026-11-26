import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Base SQLite dans data/famille.db — créée et remplie automatiquement au premier lancement.
const dir = path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });

const g = globalThis as unknown as { db?: Database.Database };
export const db = g.db ?? new Database(path.join(dir, "famille.db"));
if (!g.db) {
  g.db = db;
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate();
}

// ---------- Types
export type Member = { id: number; name: string; color: string; emoji: string };
export type Recurring = { id: number; title: string; weekday: number; time: string | null; member_id: number | null };
export type Event = { id: number; title: string; date: string; time: string | null; member_id: number | null };
export type Meal = { date: string; slot: string; name: string };
export type Task = { id: number; title: string; done: number; member_id: number | null };
export type ShoppingItem = { id: number; name: string; checked: number };

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '🙂'
    );
    -- weekday : 1 = lundi … 7 = dimanche
    CREATE TABLE IF NOT EXISTS recurring_event (
      id INTEGER PRIMARY KEY, title TEXT NOT NULL, weekday INTEGER NOT NULL, time TEXT,
      member_id INTEGER REFERENCES member(id) ON DELETE SET NULL
    );
    -- date au format AAAA-MM-JJ, time HH:MM ou NULL (toute la journée)
    CREATE TABLE IF NOT EXISTS event (
      id INTEGER PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL, time TEXT,
      member_id INTEGER REFERENCES member(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS meal (
      date TEXT NOT NULL, slot TEXT NOT NULL DEFAULT 'soir', name TEXT NOT NULL,
      PRIMARY KEY (date, slot)
    );
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0,
      member_id INTEGER REFERENCES member(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS shopping_item (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, checked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const { n } = db.prepare("SELECT COUNT(*) AS n FROM member").get() as { n: number };
  if (n === 0) seed();
}

function seed() {
  const addMember = db.prepare("INSERT INTO member (name, color, emoji) VALUES (?, ?, ?)");
  const addRec = db.prepare("INSERT INTO recurring_event (title, weekday, time, member_id) VALUES (?, ?, ?, ?)");

  db.transaction(() => {
    const simon = addMember.run("Simon", "#2f6fde", "👨").lastInsertRowid;
    addMember.run("Estelle", "#c2410c", "👩");
    const leonie = addMember.run("Léonie", "#a21caf", "👧").lastInsertRowid;
    const eva = addMember.run("Eva", "#059669", "👶").lastInsertRowid;

    for (let d = 1; d <= 5; d++) addRec.run("Travail GXO", d, "07:00", simon);
    for (const d of [1, 2, 4, 5]) addRec.run("École", d, "08:30", leonie);
    addRec.run("École (matin)", 3, "08:30", leonie);
    for (const d of [2, 3, 4, 5]) addRec.run("Crèche", d, null, eva);

    db.prepare("INSERT INTO task (title, member_id) VALUES (?, ?)").run("Commander des pellets", simon);
    db.prepare("INSERT INTO task (title, member_id) VALUES (?, ?)").run("Devoirs : lecture", leonie);
    for (const s of ["Lait", "Pain", "Langes"]) db.prepare("INSERT INTO shopping_item (name) VALUES (?)").run(s);
  })();
}
