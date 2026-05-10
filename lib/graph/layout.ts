import dagre from "dagre";
import type { Issue, Edge } from "@/lib/linear/types";

export type NodePosition = { x: number; y: number };
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 96;

export function connectedIssueIds(issues: Issue[], edges: Edge[]): Set<string> {
  const known = new Set(issues.map((i) => i.id));
  const connected = new Set<string>();
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (known.has(e.from)) connected.add(e.from);
    if (known.has(e.to)) connected.add(e.to);
  }
  return connected;
}

export type LayoutOptions = { hideIsolated?: boolean };

export function layoutGraph(
  issues: Issue[],
  edges: Edge[],
  options: LayoutOptions = {},
): Map<string, NodePosition> {
  const connected = connectedIssueIds(issues, edges);
  const visible = options.hideIsolated ? issues.filter((i) => connected.has(i.id)) : issues;

  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 56,
    ranksep: 120,
    edgesep: 24,
    marginx: 32,
    marginy: 32,
    ranker: "network-simplex",
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const i of visible) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const out = new Map<string, NodePosition>();
  for (const i of visible) {
    const n = g.node(i.id);
    if (n) out.set(i.id, { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 });
  }
  return out;
}
