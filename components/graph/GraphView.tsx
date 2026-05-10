"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGraphStore } from "@/lib/store";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { DependencyGraph } from "./DependencyGraph";
import { ReadyPanel } from "./ReadyPanel";
import { useShortcuts } from "@/components/keyboard/useShortcuts";
import { showToast } from "@/components/system/Toaster";
import { detectCycles } from "@/lib/graph/cycle-detect";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { scoreReady } from "@/lib/graph/score";
import type { IssueGraph } from "@/lib/linear/types";

async function fetchGraph(): Promise<IssueGraph> {
  const res = await fetch("/api/issues", { cache: "no-store" });
  if (res.status === 401) {
    window.location.href = "/settings";
    throw new Error("redirecting");
  }
  if (!res.ok) {
    const msg = res.status === 429
      ? "Linear is rate-limiting us. Try again shortly."
      : `Failed to fetch: ${res.status}`;
    showToast(msg);
    throw new Error(msg);
  }
  return res.json();
}

export function GraphView() {
  const setGraph = useGraphStore((s) => s.setGraph);
  const filters = useGraphStore((s) => s.filters);
  const { data, refetch, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["graph"],
    queryFn: fetchGraph,
  });
  useShortcuts({ onRefresh: () => refetch() });

  const cycles = useMemo(() => (data ? detectCycles(data.edges) : []), [data]);

  const startHere = useMemo(() => {
    if (!data) return null;
    const filtered = applyFilters(data.issues, data.edges, filters);
    const readyIds = computeReady(filtered.issues, filtered.edges);
    const ranked = scoreReady(readyIds, filtered.issues, filtered.edges);
    const mine = ranked.find((r) => r.issue.assignee?.id === data.viewerId);
    return mine ?? ranked[0] ?? null;
  }, [data, filters]);

  useEffect(() => {
    if (data) setGraph(data);
  }, [data, setGraph]);

  return (
    <div className="h-screen w-screen flex flex-col bg-app overflow-hidden">
      {cycles.length > 0 && (
        <div className="px-4 py-2 bg-hover border-b border-line text-xs text-ink-2 shrink-0">
          Detected {cycles.length} dependency cycle{cycles.length === 1 ? "" : "s"}: {cycles[0].slice(0, 3).join(" ↔ ")}{cycles[0].length > 3 ? "…" : ""}
        </div>
      )}
      <div className="shrink-0">
        <Toolbar onRefresh={() => refetch()} />
      </div>
      {startHere && (
        <div className="shrink-0 border-b border-line bg-app">
          <div className="max-w-[920px] mx-auto px-6 py-4 flex items-center gap-5">
            <div className="text-right shrink-0">
              <div className="font-mono text-2xl font-medium text-ink leading-none tracking-tight">
                {startHere.unblocks}
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted mt-1">
                unblock{startHere.unblocks === 1 ? "" : "s"}
              </div>
            </div>
            <div className="w-px h-10 bg-line" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted mb-0.5">
                Start here
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted shrink-0">{startHere.issue.identifier}</span>
                <span className="text-sm font-medium text-ink truncate">{startHere.issue.title}</span>
              </div>
              <div className="text-xs font-mono text-muted mt-0.5">
                {startHere.issue.team.name}
                {startHere.issue.assignee && ` · ${startHere.issue.assignee.name}`}
              </div>
            </div>
            <a
              href={startHere.issue.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-3 py-1.5 rounded text-sm bg-ink text-paper hover:bg-ink-2 transition-colors no-underline"
            >
              Open in Linear ↗
            </a>
          </div>
        </div>
      )}
      <div className="grid grid-cols-[1fr_305px] flex-1 min-h-0">
        <div className="relative bg-app">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">
              Loading…
            </div>
          )}
          {isError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">
              Failed to load: {(error as Error).message}
            </div>
          )}
          {data && data.issues.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <p className="text-sm text-ink">Nothing assigned to you.</p>
              <p className="text-sm text-ink-2">Switch scope or pick a project.</p>
            </div>
          )}
          {data && data.issues.length > 0 && <DependencyGraph />}
        </div>
        <ReadyPanel />
      </div>
      <Footer issues={data?.issues.length ?? 0} dataUpdatedAt={dataUpdatedAt} />
    </div>
  );
}

function Footer({ issues, dataUpdatedAt }: { issues: number; dataUpdatedAt: number }) {
  const [ago, setAgo] = useState(0);
  useEffect(() => {
    const compute = () =>
      setAgo(dataUpdatedAt ? Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000)) : 0);
    const id = setInterval(compute, 5000);
    return () => clearInterval(id);
  }, [dataUpdatedAt]);
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-line text-xs text-muted font-mono">
      <div className="flex gap-3.5">
        <span>{issues} issues</span>
        <span>updated {ago}s ago</span>
      </div>
      <span className="inline-flex items-center gap-1.5">
        <kbd className="font-mono text-xs px-1.5 rounded bg-hover text-ink-2">?</kbd>
        shortcuts
      </span>
    </div>
  );
}
