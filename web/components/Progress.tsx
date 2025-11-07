"use client";

import { useEffect, useState } from "react";
import { loadResults } from "@/lib/storage";

export function Progress() {
  const [rows, setRows] = useState(() => (typeof window !== "undefined" ? loadResults().slice(0, 8) : []));

  useEffect(() => {
    const id = setInterval(() => setRows(loadResults().slice(0, 8)), 1500);
    return () => clearInterval(id);
  }, []);

  if (!rows.length) return null;

  return (
    <div className="rounded-lg border p-4">
      <div className="font-medium mb-2">Recent Results</div>
      <div className="grid grid-cols-3 md:grid-cols-5 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="font-medium">Date</div>
        <div className="font-medium">Score</div>
        <div className="font-medium">Diff</div>
        <div className="font-medium hidden md:block">Correct</div>
        <div className="font-medium hidden md:block">Total</div>
      </div>
      <div className="divide-y">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-3 md:grid-cols-5 py-2 text-sm">
            <div>{new Date(r.timestamp).toLocaleString()}</div>
            <div className="font-medium">{Math.round((r.correct / r.total) * 100)}%</div>
            <div>{r.difficulty}</div>
            <div className="hidden md:block">{r.correct}</div>
            <div className="hidden md:block">{r.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
