import type { Edge } from "@/lib/linear/types";

export function dependencyClosure(rootId: string, edges: Edge[]): Set<string> {
  const out = new Set<string>([rootId]);
  const blocks = edges.filter((e) => e.kind === "blocks");
  const downstream = (id: string) => blocks.filter((e) => e.from === id).map((e) => e.to);
  const upstream = (id: string) => blocks.filter((e) => e.to === id).map((e) => e.from);
  const stack: string[] = [rootId];
  while (stack.length) {
    const n = stack.pop()!;
    for (const next of [...downstream(n), ...upstream(n)]) {
      if (!out.has(next)) { out.add(next); stack.push(next); }
    }
  }
  return out;
}
