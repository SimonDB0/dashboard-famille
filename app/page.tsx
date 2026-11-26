import { db, type Event, type Meal, type Member, type Recurring, type ShoppingItem, type Task } from "@/lib/db";
import { getWeather } from "@/lib/weather";
import { fmtDay, fmtLong, isoWeekday, todayKey, weekDays } from "@/lib/dates";
import * as A from "./actions";
import Clock from "./components/Clock";
import CheckItem from "./components/CheckItem";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = todayKey();
  const days = weekDays(today);
  const [from, to] = [days[0], days[6]];

  const members = db.prepare("SELECT * FROM member ORDER BY id").all() as Member[];
  const recurring = db.prepare("SELECT * FROM recurring_event ORDER BY time IS NULL, time").all() as Recurring[];
  const events = db.prepare("SELECT * FROM event WHERE date BETWEEN ? AND ? ORDER BY time IS NOT NULL, time").all(from, to) as Event[];
  const meals = db.prepare("SELECT * FROM meal WHERE date BETWEEN ? AND ?").all(from, to) as Meal[];
  const tasks = db.prepare("SELECT * FROM task ORDER BY done, id").all() as Task[];
  const shopping = db.prepare("SELECT * FROM shopping_item ORDER BY checked, created_at").all() as ShoppingItem[];
  const weather = await getWeather();

  const who = (id: number | null) => members.find((m) => m.id === id);
  const mealFor = (d: string) => meals.find((m) => m.date === d && m.slot === "soir")?.name ?? "";

  return (
    <main className="board">
      {/* ---------- En-tête */}
      <header className="top">
        <div>
          <Clock />
          <div className="date">{fmtLong(today)}</div>
        </div>
        <div className="family">
          {members.map((m) => (
            <span key={m.id} className="chip" style={{ background: m.color }}>
              {m.emoji} {m.name}
            </span>
          ))}
        </div>
        {weather && (
          <div className="weather">
            <span className="big">{weather.icon}</span>
            <span className="temp">{weather.now}°</span>
          </div>
        )}
      </header>

      {/* ---------- Semaine */}
      <section className="week">
        {days.map((d) => {
          const rec = recurring.filter((r) => r.weekday === isoWeekday(d));
          const evs = events.filter((e) => e.date === d);
          const w = weather?.days.find((x) => x.date === d);
          return (
            <div key={d} className={`day ${d === today ? "today" : ""}`}>
              <div className="day-head">
                <strong>{fmtDay(d)}</strong>
                {w && <span className="mini-w">{w.icon} {w.min}°/{w.max}°</span>}
              </div>
              <ul className="events">
                {rec.map((r) => (
                  <li key={`r${r.id}`} style={{ borderColor: who(r.member_id)?.color }}>
                    {r.time && <span className="t">{r.time}</span>} {who(r.member_id)?.emoji} {r.title}
                  </li>
                ))}
                {evs.map((e) => (
                  <li key={`e${e.id}`} className="ev" style={{ borderColor: who(e.member_id)?.color }}>
                    {e.time && <span className="t">{e.time}</span>} {who(e.member_id)?.emoji} {e.title}
                    <form action={A.deleteEvent.bind(null, e.id)}>
                      <button className="x" title="Supprimer">×</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={A.setMeal} className="meal">
                <input type="hidden" name="date" value={d} />
                <input type="hidden" name="slot" value="soir" />
                <span>🍽️</span>
                <input name="name" defaultValue={mealFor(d)} placeholder="Souper ?" key={mealFor(d)} />
              </form>
            </div>
          );
        })}
      </section>

      {/* ---------- Bas : ajout d'événement, tâches, courses */}
      <section className="bottom">
        <div className="card">
          <h2>➕ Nouvel événement</h2>
          <form action={A.addEvent} className="stack">
            <input name="title" placeholder="Rendez-vous, anniversaire…" required />
            <div className="row">
              <input type="date" name="date" defaultValue={today} required />
              <input type="time" name="time" />
            </div>
            <select name="memberId" defaultValue="">
              <option value="">Toute la famille</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
            </select>
            <button className="btn">Ajouter</button>
          </form>
        </div>

        <div className="card">
          <h2>✅ Tâches</h2>
          <ul className="list">
            {tasks.map((t) => (
              <CheckItem
                key={t.id}
                label={`${who(t.member_id) ? who(t.member_id)!.emoji + " " : ""}${t.title}`}
                checked={!!t.done}
                color={who(t.member_id)?.color}
                onToggle={A.toggleTask.bind(null, t.id)}
              />
            ))}
          </ul>
          <form action={A.addTask} className="row">
            <input name="title" placeholder="Nouvelle tâche" />
            <select name="memberId" defaultValue="">
              <option value="">—</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.emoji}</option>)}
            </select>
            <button className="btn">+</button>
          </form>
          {tasks.some((t) => t.done) && (
            <form action={A.clearTasks}><button className="link">Retirer les tâches faites</button></form>
          )}
        </div>

        <div className="card">
          <h2>🛒 Courses</h2>
          <ul className="list">
            {shopping.map((s) => (
              <CheckItem key={s.id} label={s.name} checked={!!s.checked} onToggle={A.toggleShopping.bind(null, s.id)} />
            ))}
          </ul>
          <form action={A.addShopping} className="row">
            <input name="name" placeholder="Ajouter un article" />
            <button className="btn">+</button>
          </form>
          {shopping.some((s) => s.checked) && (
            <form action={A.clearShopping}><button className="link">Vider les articles cochés</button></form>
          )}
        </div>
      </section>
    </main>
  );
}
