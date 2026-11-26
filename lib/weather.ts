// Météo via Open-Meteo (gratuit, sans clé API). Coordonnées : Horrues / Soignies.
const LAT = 50.58;
const LON = 4.05;

const CODES: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 80: "🌦️", 81: "🌧️", 82: "⛈️", 95: "⛈️",
};

export type DayWeather = { date: string; icon: string; min: number; max: number };
export type Weather = { now: number; icon: string; days: DayWeather[] } | null;

export async function getWeather(): Promise<Weather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Europe%2FBrussels&forecast_days=7`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) return null;
    const j = await res.json();
    return {
      now: Math.round(j.current.temperature_2m),
      icon: CODES[j.current.weather_code] ?? "🌡️",
      days: j.daily.time.map((date: string, i: number) => ({
        date,
        icon: CODES[j.daily.weather_code[i]] ?? "🌡️",
        min: Math.round(j.daily.temperature_2m_min[i]),
        max: Math.round(j.daily.temperature_2m_max[i]),
      })),
    };
  } catch {
    return null;
  }
}
