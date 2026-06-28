"use client";

import { Fragment, type ReactNode } from "react";
import type { Source } from "@/lib/api";

/**
 * Tiny, dependency-free Markdown renderer tuned for the LLM overview output:
 * paragraphs, bullet / numbered lists, headings, **bold**, *italic*, and
 * inline [n] citations that link to their source. Intentionally minimal — the
 * model output is constrained, so we avoid pulling in a full markdown stack.
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; level: number; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let listKind: "ul" | "ol" | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length && listKind) {
      blocks.push({ kind: listKind, items: list });
    }
    list = [];
    listKind = null;
  };

  for (const raw of src.split("\n")) {
    const t = raw.trim();
    if (!t) {
      flushPara();
      flushList();
      continue;
    }
    const heading = t.match(/^(#{1,4})\s+(.*)$/);
    const bullet = t.match(/^[-*•]\s+(.*)$/);
    const numbered = t.match(/^\d+[.)]\s+(.*)$/);

    if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: "h", level: heading[1].length, text: heading[2] });
    } else if (bullet) {
      flushPara();
      if (listKind && listKind !== "ul") flushList();
      listKind = "ul";
      list.push(bullet[1]);
    } else if (numbered) {
      flushPara();
      if (listKind && listKind !== "ol") flushList();
      listKind = "ol";
      list.push(numbered[1]);
    } else {
      flushList();
      para.push(t);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

function renderInline(text: string, sources: Source[], keyBase: string): ReactNode[] {
  const byN = new Map(sources.map((s) => [s.n, s]));
  // Order matters: match **bold** before *italic*.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\d+\])/g);
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))
      return <em key={key}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))
      return (
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    const cite = part.match(/^\[(\d+)\]$/);
    if (cite) {
      const src = byN.get(Number(cite[1]));
      if (src)
        return (
          <a
            key={key}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            title={src.title}
            className="mx-0.5 inline-flex -translate-y-0.5 items-center rounded bg-brand-100 px-1 text-[11px] font-semibold leading-none text-brand-700 align-baseline transition hover:bg-brand-200"
          >
            {cite[1]}
          </a>
        );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function Markdown({
  text,
  sources,
}: {
  text: string;
  sources: Source[];
}) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.kind === "h") {
          const size = b.level <= 1 ? "text-lg" : b.level === 2 ? "text-base" : "text-sm";
          return (
            <p key={i} className={`font-semibold text-slate-800 ${size}`}>
              {renderInline(b.text, sources, `h${i}`)}
            </p>
          );
        }
        if (b.kind === "ul")
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, sources, `ul${i}-${j}`)}</li>
              ))}
            </ul>
          );
        if (b.kind === "ol")
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, sources, `ol${i}-${j}`)}</li>
              ))}
            </ol>
          );
        return (
          <p key={i} className="leading-relaxed">
            {renderInline(b.text, sources, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}
