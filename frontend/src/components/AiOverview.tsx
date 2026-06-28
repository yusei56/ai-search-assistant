"use client";

import type { Source } from "@/lib/api";
import { Markdown } from "./Markdown";

function SparkleBadge({ pulse }: { pulse: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2l1.8 4.6L18.5 8l-4.7 1.4L12 14l-1.8-4.6L5.5 8l4.7-1.4L12 2zM19 14l.9 2.3 2.3.9-2.3.9L19 20.4l-.9-2.3-2.3-.9 2.3-.9L19 14z" />
      </svg>
    </span>
  );
}

function SkeletonLines() {
  return (
    <div className="mt-4 space-y-2.5">
      {["w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
        <div key={i} className={`h-3.5 animate-pulse rounded bg-slate-200 ${w}`} />
      ))}
    </div>
  );
}

export function AiOverview({
  text,
  sources,
  streaming,
}: {
  text: string;
  sources: Source[];
  streaming: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white shadow-sm">
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <SparkleBadge pulse={streaming && !text} />
        <h2 className="text-sm font-semibold text-slate-700">AI Overview</h2>
        {streaming && (
          <span className="flex items-center gap-1.5 text-xs text-brand-600">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand-500" />
            generating
          </span>
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="mt-1 text-[15px] text-slate-800">
          {text ? (
            <>
              <Markdown text={text} sources={sources} />
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-600 align-middle" />
              )}
            </>
          ) : streaming ? (
            <SkeletonLines />
          ) : null}
        </div>

        {sources.length > 0 && (
          <div className="mt-4 border-t border-brand-100 pt-3">
            <p className="text-xs font-medium text-slate-500">Sources</p>
            <ol className="mt-2 flex flex-wrap gap-2">
              {sources.map((s) => (
                <li key={s.n}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[15rem] items-center gap-1.5 truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                      {s.n}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!streaming && text && (
          <p className="mt-3 text-xs text-slate-400">
            AI-generated from site content; may be incomplete — verify against the
            linked sources.
          </p>
        )}
      </div>
    </section>
  );
}
