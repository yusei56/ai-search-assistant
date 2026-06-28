"use client";

import { useState } from "react";

export function Facets({
  facets,
  active,
  onSelect,
}: {
  facets: Record<string, number>;
  active: string | null;
  onSelect: (cat: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(facets).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, c]) => s + c, 0);
  if (entries.length === 0) return null;

  return (
    <aside className="w-full">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 md:hidden"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          Filters
          {active && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
              {active}
            </span>
          )}
        </span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <div className={`${open ? "block" : "hidden"} mt-2 md:mt-0 md:block`}>
        <div className="hidden items-center justify-between md:flex">
          <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
          {active && (
            <button
              onClick={() => onSelect(null)}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <ul className="mt-0 space-y-1 md:mt-3">
          <li>
            <FacetButton
              label="All categories"
              count={total}
              active={active === null}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            />
          </li>
          {entries.map(([cat, count]) => (
            <li key={cat}>
              <FacetButton
                label={cat}
                count={count}
                active={active === cat}
                onClick={() => {
                  onSelect(cat);
                  setOpen(false);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function FacetButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition ${
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
