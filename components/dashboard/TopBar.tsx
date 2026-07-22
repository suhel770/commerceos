"use client";

import { useState } from "react";

export default function TopBar() {
  const [q, setQ] = useState("");
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-md hover:bg-slate-100">☰</button>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anything... (Ctrl + K)"
            className="w-96 rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-500">Jul 18, 2026 - Jul 18, 2026</div>
        <button className="p-2 rounded-full bg-white shadow-sm">🔔</button>
        <div className="h-8 w-8 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
