"use client";

import type { SearchResult } from "@/lib/api";

export function ResultCard({ r }: { r: SearchResult }) {
  let host = "";
  try {
    host = new URL(r.url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      {r.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.thumbnail}
          alt=""
          loading="lazy"
          className="hidden h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-100 sm:block"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {r.category}
          </span>
          {r.subcategory && r.subcategory !== r.category && (
            <span className="truncate text-xs text-slate-400">
              {r.subcategory}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-semibold text-slate-800 group-hover:text-brand-700">
          {r.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {r.snippet}
        </p>
        {host && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2v-4.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14L20 4m0 0h-5m5 0v5" />
            </svg>
            {host}
          </p>
        )}
      </div>
      <span className="absolute right-4 top-4 text-slate-300 opacity-0 transition group-hover:opacity-100">
        →
      </span>
    </a>
  );
}

export function ResultCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="hidden h-20 w-20 shrink-0 animate-pulse rounded-xl bg-slate-200 sm:block" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
