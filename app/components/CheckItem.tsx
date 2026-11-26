"use client";

import { useOptimistic, useTransition } from "react";

type Props = {
  label: string;
  checked: boolean;
  color?: string;
  onToggle: (value: boolean) => Promise<void>;
};

export default function CheckItem({ label, checked, color, onToggle }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, start] = useTransition();

  return (
    <li className={`check ${optimistic ? "is-done" : ""}`}>
      <button
        type="button"
        onClick={() =>
          start(async () => {
            setOptimistic(!optimistic);
            await onToggle(!optimistic);
          })
        }
      >
        <span className="box" style={color ? { borderColor: color } : undefined}>
          {optimistic ? "✓" : ""}
        </span>
        <span className="label">{label}</span>
      </button>
    </li>
  );
}
