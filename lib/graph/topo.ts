import type { Issue, Edge } from "@/lib/linear/types";

const isDone = (i: Issue) => i.state.type === "completed" || i.state.type === "canceled";

export function computeReady(issues: Issue[], edges: Edge[]): string[] {
  const issueById = new Map(issues.map((i) => [i.id, i]));
  const incoming = new Map<string, string[]>();
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    incoming.get(e.to)!.push(e.from);
  }
  return issues
    .filter((i) => !isDone(i))
    .filter((i) => {
      const blockers = incoming.get(i.id) ?? [];
      return blockers.every((bid) => {
        const b = issueById.get(bid);
        return !b || isDone(b);
      });
    })
    .map((i) => i.id);
}

export function computeRanks(issues: Issue[], edges: Edge[]): Map<string, number> {
  const priorityOf = new Map(issues.map((i) => [i.id, i.priority]));
  const blocksEdges = edges.filter((e) => e.kind === "blocks") as Extract<Edge, { kind: "blocks" }>[];

  const trimmed: Extract<Edge, { kind: "blocks" }>[] = [];
  const seen = new Set<string>();
  for (const e of blocksEdges) {
    const reverse = blocksEdges.find((x) => x.from === e.to && x.to === e.from);
    if (reverse && !seen.has(`${e.from}|${e.to}`)) {
      const keep = (priorityOf.get(e.from) ?? 4) <= (priorityOf.get(e.to) ?? 4) ? e : reverse;
      trimmed.push(keep);
      seen.add(`${e.from}|${e.to}`); seen.add(`${e.to}|${e.from}`);
    } else if (!seen.has(`${e.from}|${e.to}`)) {
      trimmed.push(e);
    }
  }

  const incoming = new Map<string, string[]>();
  for (const e of trimmed) incoming.set(e.to, [...(incoming.get(e.to) ?? []), e.from]);

  const rank = new Map<string, number>();
  const queue: string[] = issues.filter((i) => (incoming.get(i.id)?.length ?? 0) === 0).map((i) => i.id);
  for (const id of queue) rank.set(id, 0);
  while (queue.length) {
    const id = queue.shift()!;
    const r = rank.get(id)!;
    const next = trimmed.filter((e) => e.from === id).map((e) => e.to);
    for (const n of next) {
      const candidate = r + 1;
      if (candidate > (rank.get(n) ?? -1)) rank.set(n, candidate);
      const stillBlocked = (incoming.get(n) ?? []).some((b) => !rank.has(b));
      if (!stillBlocked && !queue.includes(n)) queue.push(n);
    }
  }
  for (const i of issues) if (!rank.has(i.id)) rank.set(i.id, 0);
  return rank;
}

export function downstreamCount(id: string, _issues: Issue[], edges: Edge[]): number {
  const out = new Map<string, string[]>();
  for (const e of edges) if (e.kind === "blocks") out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const seen = new Set<string>();
  const stack = [...(out.get(id) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const c of out.get(n) ?? []) stack.push(c);
  }
  return seen.size;
}
