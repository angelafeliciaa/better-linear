import type { Edge } from "@/lib/linear/types";

export function detectCycles(edges: Edge[]): string[][] {
  const blocks = edges.filter((e) => e.kind === "blocks");
  const nodes = Array.from(new Set(blocks.flatMap((e) => [e.from, e.to])));
  const adj = new Map<string, string[]>();
  for (const e of blocks) adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);

  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const sccs: string[][] = [];

  const strong = (v: string) => {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);
    for (const w of adj.get(v) ?? []) {
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  };
  for (const v of nodes) if (!idx.has(v)) strong(v);
  return sccs;
}
