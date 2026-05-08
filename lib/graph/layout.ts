import dagre from "dagre";
import type { Issue, Edge } from "@/lib/linear/types";

export type NodePosition = { x: number; y: number };
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 96;

export function layoutGraph(issues: Issue[], edges: Edge[]): Map<string, NodePosition> {
  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({ rankdir: "TB", nodesep: 36, ranksep: 60, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const i of issues) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const out = new Map<string, NodePosition>();
  for (const i of issues) {
    const n = g.node(i.id);
    out.set(i.id, { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 });
  }
  return out;
}
