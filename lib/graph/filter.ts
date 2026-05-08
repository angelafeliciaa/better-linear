import type { Issue, Edge } from "@/lib/linear/types";

export type Scope = "my-work" | "cycle" | "project" | "team";

export type Filters = {
  scope: Scope;
  cycleId: string | null;
  projectId: string | null;
  teamKey: string | null;
  priorities: Array<0 | 1 | 2 | 3 | 4>;
  assigneeIds: string[];
  showDone: boolean;
};

export const defaultFilters: Filters = {
  scope: "my-work",
  cycleId: null,
  projectId: null,
  teamKey: null,
  priorities: [],
  assigneeIds: [],
  showDone: false,
};

export function applyFilters(issues: Issue[], edges: Edge[], f: Filters): { issues: Issue[]; edges: Edge[] } {
  const allowedByScope = new Set(issues.filter((i) => {
    if (f.scope === "my-work") return i.isMine;
    if (f.scope === "cycle") return f.cycleId ? i.cycle?.id === f.cycleId : true;
    if (f.scope === "project") return f.projectId ? i.project?.id === f.projectId : true;
    if (f.scope === "team") return f.teamKey ? i.team.key === f.teamKey : true;
    return true;
  }).map((i) => i.id));

  if (f.scope === "my-work") {
    for (const e of edges) if (e.kind === "blocks" && allowedByScope.has(e.to)) allowedByScope.add(e.from);
  }

  const kept = issues.filter((i) => {
    if (!allowedByScope.has(i.id)) return false;
    if (!f.showDone && (i.state.type === "completed" || i.state.type === "canceled")) return false;
    if (f.priorities.length && !f.priorities.includes(i.priority)) return false;
    if (f.assigneeIds.length && !(i.assignee && f.assigneeIds.includes(i.assignee.id))) return false;
    return true;
  });
  const keptIds = new Set(kept.map((i) => i.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to));
  return { issues: kept, edges: keptEdges };
}
