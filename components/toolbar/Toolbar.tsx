"use client";
import { useGraphStore } from "@/lib/store";
import type { Scope } from "@/lib/graph/filter";

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "my-work", label: "My Work" },
  { value: "person", label: "Person" },
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
  const people = graph
    ? Array.from(new Map(graph.issues.flatMap((i) => (i.assignee ? [[i.assignee.id, i.assignee]] : []))).values())
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <div className="flex items-center justify-between gap-3 px-[14px] border-b border-line h-[46px] text-sm">
      <div className="flex min-w-0 items-center gap-4">
        <span className="font-semibold tracking-tight text-sm">better-linear</span>
        <div className="flex gap-0.5">
          {SCOPES.map((s) => (
            <button
              type="button"
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
        <div className="relative min-w-[180px] w-[240px] max-w-[28vw]">
          <label htmlFor="issue-search" className="sr-only">
            Search issues
          </label>
          <input
            id="issue-search"
            type="search"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            placeholder="Search title or issue #"
            className="w-full h-7 rounded border border-line bg-surface pl-2.5 pr-8 text-sm text-ink placeholder:text-muted hover:border-line-strong focus:border-line-ink focus:outline-none"
          />
          {filters.query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setFilters({ query: "" })}
              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-hover hover:text-ink"
            >
              ×
            </button>
          )}
        </div>
        {filters.scope !== "my-work" && (
          <div className="flex items-center gap-1.5 pl-3 ml-1.5 border-l border-line text-ink-2">
            <span className="text-muted">
              {filters.scope === "project"
                ? "Project"
                : filters.scope === "cycle"
                ? "Cycle"
                : filters.scope === "team"
                ? "Team"
                : "Person"}
            </span>
            <select
              className="bg-transparent rounded px-1.5 py-1 hover:bg-hover cursor-pointer text-sm"
              value={
                filters.scope === "project"
                  ? filters.projectId ?? ""
                  : filters.scope === "cycle"
                  ? filters.cycleId ?? ""
                  : filters.scope === "team"
                  ? filters.teamKey ?? ""
                  : filters.personId ?? ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (filters.scope === "project") setFilters({ projectId: v || null });
                else if (filters.scope === "cycle") setFilters({ cycleId: v || null });
                else if (filters.scope === "team") setFilters({ teamKey: v || null });
                else setFilters({ personId: v || null });
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
              {filters.scope === "person" &&
                people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-muted">
        <button
          type="button"
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
          type="button"
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
