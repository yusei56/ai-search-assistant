"use client";

import { useEffect, useRef, useState } from "react";
import { suggest } from "@/lib/api";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced autosuggest
  useEffect(() => {
    const q = value.trim();
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const nextItems = q.length < 2 ? [] : await suggest(q);
      if (!cancelled) setItems(nextItems);
    }, q.length < 2 ? 0 : 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          onSubmit(value);
        }}
        className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 ${
          compact ? "px-4 py-2" : "px-5 py-3.5"
        }`}
      >
        <svg
          className="h-5 w-5 shrink-0 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.3-4.3m1.3-5.4a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search herbal testing services, herbs, methods…"
          className={`w-full bg-transparent outline-none placeholder:text-slate-400 ${
            compact ? "text-sm" : "text-base"
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
          {items.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                  onSubmit(s);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="text-slate-400">↗</span>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
