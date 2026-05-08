"use client";
import { useMemo } from "react";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { scoreReady } from "@/lib/graph/score";
import { avatarBucket, avatarInitial } from "@/lib/avatar";

const AV: Record<1 | 2 | 3, string> = { 1: "bg-av-1", 2: "bg-av-2", 3: "bg-av-3" };

export function ReadyPanel() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const setSelection = useGraphStore((s) => s.setSelection);

  const { ready, blocked } = useMemo(() => {
    if (!graph) return { ready: [], blocked: [] };
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const readyIds = computeReady(filtered.issues, filtered.edges);
    const ranked = scoreReady(readyIds, filtered.issues, filtered.edges);
    const readySet = new Set(readyIds);
    const blockedIssues = filtered.issues.filter((i) => !readySet.has(i.id));
    return { ready: ranked, blocked: blockedIssues };
  }, [graph, filters]);

  if (!graph) return null;

  return (
    <aside className="w-[305px] border-l border-line bg-app flex flex-col">
      <section className="px-[18px] pt-5 pb-3">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Ready to work <span className="font-mono text-muted-2">{ready.length}</span>
        </h2>
        {ready.length === 0 && (
          <p className="text-sm text-ink-2">Nothing ready right now. Resolve any blocker to unblock work.</p>
        )}
        {ready.map((r) => (
          <button key={r.id} onClick={() => setSelection(r.id)} className="w-full text-left py-3 border-b border-line last:border-b-0 cursor-pointer">
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
          </button>
        ))}
      </section>
      <section className="px-[18px] py-[18px] border-t border-line">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Blocked <span className="font-mono text-muted-2">{blocked.length}</span>
        </h2>
        {blocked.map((i) => (
          <div key={i.id} className="py-3 border-b border-line last:border-b-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted-2">{i.identifier}</span>
              <span className="text-sm text-ink-2">{i.title}</span>
            </div>
          </div>
        ))}
      </section>
    </aside>
  );
}
