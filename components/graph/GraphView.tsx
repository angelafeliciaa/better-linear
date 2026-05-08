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
  const { data, refetch, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["graph"],
    queryFn: fetchGraph,
  });
  useShortcuts({ onRefresh: () => refetch() });

  const cycles = useMemo(() => (data ? detectCycles(data.edges) : []), [data]);

  useEffect(() => {
    if (data) setGraph(data);
  }, [data, setGraph]);

  return (
    <div className="w-full max-w-[1180px] mx-auto my-7 rounded-[10px] overflow-hidden bg-app shadow-[0_1px_0_oklch(0.18_0.012_80/0.02),0_30px_80px_-36px_oklch(0.18_0.012_80/0.18)]">
      {cycles.length > 0 && (
        <div className="px-4 py-2 bg-hover border-b border-line text-xs text-ink-2">
          Detected {cycles.length} dependency cycle{cycles.length === 1 ? "" : "s"}: {cycles[0].slice(0, 3).join(" ↔ ")}{cycles[0].length > 3 ? "…" : ""}
        </div>
      )}
      <Toolbar onRefresh={() => refetch()} />
      <div className="grid grid-cols-[1fr_305px] min-h-[540px]">
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
