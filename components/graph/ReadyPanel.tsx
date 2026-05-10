"use client";
import { useMemo } from "react";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { scoreReady, type ScoredIssue } from "@/lib/graph/score";
import { avatarBucket, avatarInitial } from "@/lib/avatar";
import type { Issue } from "@/lib/linear/types";

const AV: Record<1 | 2 | 3, string> = { 1: "bg-av-1", 2: "bg-av-2", 3: "bg-av-3" };

type PerPerson = {
  assigneeId: string;
  assigneeName: string;
  top: ScoredIssue;
};

export function ReadyPanel() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);

  const { upNext, ready, blocked } = useMemo(() => {
    if (!graph) return { upNext: [] as PerPerson[], ready: [] as ScoredIssue[], blocked: [] as Issue[] };
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const readyIds = computeReady(filtered.issues, filtered.edges);
    const ranked = scoreReady(readyIds, filtered.issues, filtered.edges);
    const readySet = new Set(readyIds);
    const blockedIssues = filtered.issues.filter((i) => !readySet.has(i.id));

    const seen = new Set<string>();
    const perPerson: PerPerson[] = [];
    for (const r of ranked) {
      const a = r.issue.assignee;
      if (!a || seen.has(a.id)) continue;
      seen.add(a.id);
      perPerson.push({ assigneeId: a.id, assigneeName: a.name, top: r });
    }

    return { upNext: perPerson, ready: ranked, blocked: blockedIssues };
  }, [graph, filters]);

  if (!graph) return null;

  return (
    <aside className="w-[305px] border-l border-line bg-app flex flex-col overflow-y-auto">
      {upNext.length > 0 && (
        <section className="px-[18px] pt-5 pb-3">
          <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
            Up next by person <span className="font-mono text-muted-2">{upNext.length}</span>
          </h2>
          {upNext.map((p) => (
            <button
              key={p.assigneeId}
              onClick={() => setFilters({ scope: "person", personId: p.assigneeId })}
              className="w-full text-left py-3 border-b border-line last:border-b-0 cursor-pointer hover:bg-hover -mx-[18px] px-[18px] transition-colors"
              title={`Filter the graph to ${p.assigneeName}`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-mono text-[9px] font-medium text-ink shrink-0 ${AV[avatarBucket(p.assigneeId)]}`}>
                  {avatarInitial(p.assigneeName)}
                </span>
                <span className="text-sm font-medium text-ink truncate">{p.assigneeName}</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-mono text-xs text-muted">{p.top.issue.identifier}</span>
                <span className="text-sm text-ink-2 leading-snug truncate">{p.top.issue.title}</span>
              </div>
              <div className="mt-1 text-xs font-mono text-muted">
                Unblocks {p.top.unblocks} · P{p.top.priority}
              </div>
            </button>
          ))}
        </section>
      )}

      <section className="px-[18px] pt-5 pb-3 border-t border-line">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Ready to work <span className="font-mono text-muted-2">{ready.length}</span>
        </h2>
        {ready.length === 0 && (
          <p className="text-sm text-ink-2">Nothing ready right now. Resolve any blocker to unblock work.</p>
        )}
        {ready.map((r) => (
          <a
            key={r.id}
            href={r.issue.url}
            target="_blank"
            rel="noreferrer"
            className="block py-3 border-b border-line last:border-b-0 hover:bg-hover -mx-[18px] px-[18px] transition-colors no-underline"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted">{r.issue.identifier}</span>
              <span className="text-sm font-medium text-ink leading-snug">{r.issue.title}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-base font-medium text-ink tracking-tight">{r.unblocks}</span>
              <span className="text-sm text-ink-2">issues unblock</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-mono text-muted">
              {r.issue.assignee && (
                <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full font-mono text-[8px] font-medium text-ink ${AV[avatarBucket(r.issue.assignee.id)]}`}>
                  {avatarInitial(r.issue.assignee.name)}
                </span>
              )}
              {r.issue.assignee?.name && <span>{r.issue.assignee.name}</span>}
              <span>·</span><span>P{r.issue.priority}</span>
              <span>·</span><span>{r.issue.team.name}</span>
            </div>
          </a>
        ))}
      </section>

      <section className="px-[18px] py-[18px] border-t border-line">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Blocked <span className="font-mono text-muted-2">{blocked.length}</span>
        </h2>
        {blocked.map((i) => (
          <a
            key={i.id}
            href={i.url}
            target="_blank"
            rel="noreferrer"
            className="block py-3 border-b border-line last:border-b-0 no-underline hover:bg-hover -mx-[18px] px-[18px] transition-colors"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted-2">{i.identifier}</span>
              <span className="text-sm text-ink-2">{i.title}</span>
            </div>
          </a>
        ))}
      </section>
    </aside>
  );
}
