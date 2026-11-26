"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Horloge + rafraîchissement auto toutes les 5 min (utile sur la tablette de la cuisine)
export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    const r = setInterval(() => router.refresh(), 1000 * 60 * 5);
    return () => { clearInterval(t); clearInterval(r); };
  }, [router]);

  if (!now) return <span className="clock">&nbsp;</span>;
  return (
    <span className="clock">
      {now.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}
