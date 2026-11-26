// Code d'accès simple : le cookie contient un hash du code (jamais le code lui-même).
// Fonctionne dans le middleware (Edge) et côté serveur grâce à Web Crypto.

export const AUTH_COOKIE = "famille_auth";

export async function tokenFor(code: string) {
  const data = new TextEncoder().encode(`tableau-famille:${code}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
