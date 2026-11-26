"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const refresh = () => revalidatePath("/");
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optInt = (fd: FormData, k: string) => (fd.get(k) ? Number(fd.get(k)) : null);

// ---- Courses
export async function addShopping(fd: FormData) {
  const name = str(fd, "name");
  if (name) db.prepare("INSERT INTO shopping_item (name) VALUES (?)").run(name);
  refresh();
}
export async function toggleShopping(id: number, checked: boolean) {
  db.prepare("UPDATE shopping_item SET checked = ? WHERE id = ?").run(checked ? 1 : 0, id);
  refresh();
}
export async function clearShopping() {
  db.prepare("DELETE FROM shopping_item WHERE checked = 1").run();
  refresh();
}

// ---- Tâches
export async function addTask(fd: FormData) {
  const title = str(fd, "title");
  if (title) db.prepare("INSERT INTO task (title, member_id) VALUES (?, ?)").run(title, optInt(fd, "memberId"));
  refresh();
}
export async function toggleTask(id: number, done: boolean) {
  db.prepare("UPDATE task SET done = ? WHERE id = ?").run(done ? 1 : 0, id);
  refresh();
}
export async function clearTasks() {
  db.prepare("DELETE FROM task WHERE done = 1").run();
  refresh();
}

// ---- Repas (champ vide = suppression)
export async function setMeal(fd: FormData) {
  const date = str(fd, "date");
  const slot = str(fd, "slot") || "soir";
  const name = str(fd, "name");
  if (!date) return;
  if (name) {
    db.prepare(
      "INSERT INTO meal (date, slot, name) VALUES (?, ?, ?) ON CONFLICT(date, slot) DO UPDATE SET name = excluded.name"
    ).run(date, slot, name);
  } else {
    db.prepare("DELETE FROM meal WHERE date = ? AND slot = ?").run(date, slot);
  }
  refresh();
}

// ---- Événements
export async function addEvent(fd: FormData) {
  const title = str(fd, "title");
  const date = str(fd, "date");
  if (!title || !date) return;
  db.prepare("INSERT INTO event (title, date, time, member_id) VALUES (?, ?, ?, ?)").run(
    title, date, str(fd, "time") || null, optInt(fd, "memberId")
  );
  refresh();
}
export async function deleteEvent(id: number) {
  db.prepare("DELETE FROM event WHERE id = ?").run(id);
  refresh();
}
