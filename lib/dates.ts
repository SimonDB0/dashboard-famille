// Dates manipulées en chaînes "AAAA-MM-JJ" (heure de Bruxelles), sans dépendance externe.

const TZ = "Europe/Brussels";

// Date du jour à Bruxelles, quel que soit le fuseau du serveur
export function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

const parse = (key: string) => new Date(`${key}T12:00:00Z`); // midi UTC : évite les soucis d'heure d'été
const toKey = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(key: string, n: number): string {
  const d = parse(key);
  d.setUTCDate(d.getUTCDate() + n);
  return toKey(d);
}

// 1 = lundi … 7 = dimanche
export function isoWeekday(key: string): number {
  return parse(key).getUTCDay() || 7;
}

export function weekDays(key: string): string[] {
  const monday = addDays(key, -(isoWeekday(key) - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const fmtDay = (key: string) =>
  parse(key).toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", timeZone: "UTC" });

export const fmtLong = (key: string) =>
  parse(key).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
