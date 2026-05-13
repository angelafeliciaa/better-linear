import type { Issue, Edge } from "@/lib/linear/types";

export type Scope = "my-work" | "cycle" | "project" | "team" | "person";

export type Filters = {
  scope: Scope;
  query: string;
  cycleId: string | null;
  projectId: string | null;
  teamKey: string | null;
  personId: string | null;
  priorities: Array<0 | 1 | 2 | 3 | 4>;
  assigneeIds: string[];
  showDone: boolean;
};

export const defaultFilters: Filters = {
  scope: "my-work",
  query: "",
  cycleId: null,
  projectId: null,
  teamKey: null,
  personId: null,
  priorities: [],
  assigneeIds: [],
  showDone: false,
};

function matchesSearch(i: Issue, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const identifier = i.identifier.toLowerCase();
  const issueNumber = identifier.split("-").at(-1);
  if (identifier === q) return true;
  if (/^\d+$/.test(q)) return issueNumber === q;
  if (/^[a-z][a-z0-9]*-\d+$/i.test(q)) return false;

  return identifier.includes(q) || i.title.toLowerCase().includes(q);
}

export function applyFilters(issues: Issue[], edges: Edge[], f: Filters): { issues: Issue[]; edges: Edge[] } {
  const allowedByScope = new Set(issues.filter((i) => {
    if (f.scope === "my-work") return i.isMine;
    if (f.scope === "cycle") return f.cycleId ? i.cycle?.id === f.cycleId : true;
    if (f.scope === "project") return f.projectId ? i.project?.id === f.projectId : true;
    if (f.scope === "team") return f.teamKey ? i.team.key === f.teamKey : true;
    if (f.scope === "person") return f.personId ? i.assignee?.id === f.personId : true;
    return true;
  }).map((i) => i.id));

  // For "my-work" and "person", pull in direct blockers so context is visible.
  if (f.scope === "my-work" || f.scope === "person") {
    for (const e of edges) if (e.kind === "blocks" && allowedByScope.has(e.to)) allowedByScope.add(e.from);
  }

  const kept = issues.filter((i) => {
    if (!allowedByScope.has(i.id)) return false;
    if (!f.showDone && (i.state.type === "completed" || i.state.type === "canceled")) return false;
    if (f.priorities.length && !f.priorities.includes(i.priority)) return false;
    if (f.assigneeIds.length && !(i.assignee && f.assigneeIds.includes(i.assignee.id))) return false;
    if (!matchesSearch(i, f.query)) return false;
    return true;
  });
  const keptIds = new Set(kept.map((i) => i.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to));
  return { issues: kept, edges: keptEdges };
}
