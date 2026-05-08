"use client";
import { useGraphStore } from "@/lib/store";
import type { Scope } from "@/lib/graph/filter";

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "my-work", label: "My Work" },
  { value: "project", label: "Project" },
  { value: "cycle", label: "Cycle" },
  { value: "team", label: "Team" },
];

export function Toolbar({ onRefresh }: { onRefresh: () => void }) {
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const graph = useGraphStore((s) => s.graph);

  const projects = graph
    ? Array.from(new Map(graph.issues.flatMap((i) => (i.project ? [[i.project.id, i.project]] : []))).values())
    : [];
  const cycles = graph
    ? Array.from(new Map(graph.issues.flatMap((i) => (i.cycle ? [[i.cycle.id, i.cycle]] : []))).values())
    : [];
  const teams = graph
    ? Array.from(new Map(graph.issues.map((i) => [i.team.key, i.team])).values())
    : [];

  return (
    <div className="flex items-center justify-between px-[14px] border-b border-line h-[46px] text-sm">
      <div className="flex items-center gap-4">
        <span className="font-semibold tracking-tight text-sm">better-linear</span>
        <div className="flex gap-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilters({ scope: s.value })}
              className={`px-2.5 py-1 rounded text-sm ${
                filters.scope === s.value
                  ? "bg-hover text-ink font-medium"
                  : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {filters.scope !== "my-work" && (
          <div className="flex items-center gap-1.5 pl-3 ml-1.5 border-l border-line text-ink-2">
            <span className="text-muted">
              {filters.scope === "project" ? "Project" : filters.scope === "cycle" ? "Cycle" : "Team"}
            </span>
            <select
              className="bg-transparent rounded px-1.5 py-1 hover:bg-hover cursor-pointer text-sm"
              value={
                filters.scope === "project"
                  ? filters.projectId ?? ""
                  : filters.scope === "cycle"
                  ? filters.cycleId ?? ""
                  : filters.teamKey ?? ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (filters.scope === "project") setFilters({ projectId: v || null });
                else if (filters.scope === "cycle") setFilters({ cycleId: v || null });
                else setFilters({ teamKey: v || null });
              }}
            >
              <option value="">All</option>
              {filters.scope === "project" &&
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              {filters.scope === "cycle" &&
                cycles.map((c) => (
                  <option key={c.id} value={c.id}>{`Cycle ${c.number}`}</option>
                ))}
              {filters.scope === "team" &&
                teams.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-muted">
        <button
          onClick={() => setFilters({ showDone: !filters.showDone })}
          className={`inline-flex items-center justify-center w-7 h-7 rounded ${
            filters.showDone ? "bg-hover text-ink" : "hover:bg-hover hover:text-ink"
          }`}
          title="Show done"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" />
            <path d="M5 7 L6.5 8.5 L9 5.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-hover hover:text-ink"
          title="Refresh"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <path d="M11.5 5 A4.5 4.5 0 1 0 12 7" stroke="currentColor" strokeLinecap="round" />
            <path d="M11.5 2.5 V5 H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
