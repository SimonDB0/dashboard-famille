"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql, ensureDb } from "@/lib/db";
import { AUTH_COOKIE, tokenFor } from "@/lib/auth";

const refresh = () => revalidatePath("/");
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optInt = (fd: FormData, k: string) => (fd.get(k) ? Number(fd.get(k)) : null);

// ---- Code d'accès
export async function login(_: unknown, fd: FormData) {
  const code = process.env.ACCESS_CODE;
  if (!code) return { error: "ACCESS_CODE n'est pas configuré sur le serveur." };
  if (str(fd, "code") !== code) return { error: "Code incorrect." };
  (await cookies()).set(AUTH_COOKIE, await tokenFor(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 an : on le tape une seule fois par appareil
  });
  redirect("/");
}

// ---- Courses
export async function addShopping(fd: FormData) {
  await ensureDb();
  const name = str(fd, "name");
  if (name) await sql`INSERT INTO shopping_item (name) VALUES (${name})`;
  refresh();
}
export async function toggleShopping(id: number, checked: boolean) {
  await sql`UPDATE shopping_item SET checked = ${checked} WHERE id = ${id}`;
  refresh();
}
export async function clearShopping() {
  await sql`DELETE FROM shopping_item WHERE checked`;
  refresh();
}

// ---- Tâches
export async function addTask(fd: FormData) {
  await ensureDb();
  const title = str(fd, "title");
  if (title) await sql`INSERT INTO task (title, member_id) VALUES (${title}, ${optInt(fd, "memberId")})`;
  refresh();
}
export async function toggleTask(id: number, done: boolean) {
  await sql`UPDATE task SET done = ${done} WHERE id = ${id}`;
  refresh();
}
export async function clearTasks() {
  await sql`DELETE FROM task WHERE done`;
  refresh();
}

// ---- Repas (champ vide = suppression)
export async function setMeal(fd: FormData) {
  await ensureDb();
  const date = str(fd, "date");
  const slot = str(fd, "slot") || "soir";
  const name = str(fd, "name");
  if (!date) return;
  if (name) {
    await sql`INSERT INTO meal (date, slot, name) VALUES (${date}, ${slot}, ${name})
              ON CONFLICT (date, slot) DO UPDATE SET name = EXCLUDED.name`;
  } else {
    await sql`DELETE FROM meal WHERE date = ${date} AND slot = ${slot}`;
  }
  refresh();
}

// ---- Événements
export async function addEvent(fd: FormData) {
  await ensureDb();
  const title = str(fd, "title");
  const date = str(fd, "date");
  if (!title || !date) return;
  await sql`INSERT INTO event (title, date, time, member_id)
            VALUES (${title}, ${date}, ${str(fd, "time") || null}, ${optInt(fd, "memberId")})`;
  refresh();
}
export async function deleteEvent(id: number) {
  await sql`DELETE FROM event WHERE id = ${id}`;
  refresh();
}
