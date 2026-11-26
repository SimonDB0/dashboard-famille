"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main className="login">
      <form action={action} className="card stack">
        <h1>🏠 Tableau de la famille</h1>
        <input
          name="code"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="Code d'accès"
          autoFocus
          required
        />
        {state?.error && <p className="error">{state.error}</p>}
        <button className="btn" disabled={pending}>{pending ? "…" : "Entrer"}</button>
      </form>
    </main>
  );
}
