import type { Issue, Edge, IssueGraph, IssueStateType } from "./types";

type RawAny = Record<string, unknown>;

function asInt(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}
function asPriority(n: unknown): 0 | 1 | 2 | 3 | 4 {
  const i = asInt(n);
  return ((i >= 0 && i <= 4 ? i : 0) as 0 | 1 | 2 | 3 | 4);
}
function asStateType(s: unknown): IssueStateType {
  const ok: IssueStateType[] = ["backlog", "unstarted", "started", "completed", "canceled"];
  return ok.includes(s as IssueStateType) ? (s as IssueStateType) : "backlog";
}

export function normalizeIssues(raw: RawAny[], viewerId: string): IssueGraph {
  const issues: Issue[] = raw.map((r) => {
    const state = (r.state as RawAny | undefined) ?? {};
    const team = (r.team as RawAny | undefined) ?? {};
    const project = (r.project as RawAny | undefined) ?? null;
    const cycle = (r.cycle as RawAny | undefined) ?? null;
    const assignee = (r.assignee as RawAny | undefined) ?? null;
    return {
      id: String(r.id),
      identifier: String(r.identifier ?? ""),
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      priority: asPriority(r.priority),
      estimate: typeof r.estimate === "number" ? r.estimate : null,
      state: {
        id: String(state.id ?? ""),
        name: String(state.name ?? ""),
        type: asStateType(state.type),
        color: String(state.color ?? "#888"),
      },
      team: { key: String(team.key ?? "?"), name: String(team.name ?? "Team"), color: String(team.color ?? "#888") },
      project: project ? { id: String(project.id), name: String(project.name ?? "") } : null,
      cycle: cycle ? { id: String(cycle.id), number: asInt(cycle.number) } : null,
      assignee: assignee
        ? { id: String(assignee.id), name: String(assignee.name ?? ""), avatarUrl: (assignee.avatarUrl as string) ?? null }
        : null,
      isMine: assignee ? String((assignee as RawAny).id) === viewerId : false,
      updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
    };
  });

  const edgeKey = (e: Edge) => `${e.kind}:${e.from}->${e.to}`;
  const edgeMap = new Map<string, Edge>();

  for (const r of raw) {
    const from = String(r.id);
    const children = ((r.children as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const c of children) {
      const e: Edge = { kind: "parent", from, to: String(c.id) };
      edgeMap.set(edgeKey(e), e);
    }
    const rel = ((r.relations as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const n of rel) {
      if (n.type !== "blocks") continue;
      const to = String((n.relatedIssue as RawAny | undefined)?.id ?? "");
      if (!to) continue;
      const e: Edge = { kind: "blocks", from, to };
      edgeMap.set(edgeKey(e), e);
    }
    const inv = ((r.inverseRelations as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const n of inv) {
      if (n.type !== "blocks") continue;
      const blocker = String((n.issue as RawAny | undefined)?.id ?? "");
      if (!blocker) continue;
      const e: Edge = { kind: "blocks", from: blocker, to: from };
      edgeMap.set(edgeKey(e), e);
    }
  }

  return { issues, edges: Array.from(edgeMap.values()), viewerId };
}
