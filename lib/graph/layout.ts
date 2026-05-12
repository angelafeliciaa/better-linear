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

const NODESEP = 56;
const RANKSEP = 120;
const MARGIN = 32;

export function layoutGraph(
  issues: Issue[],
  edges: Edge[],
  options: LayoutOptions = {},
): Map<string, NodePosition> {
  const connected = connectedIssueIds(issues, edges);
  const connectedIssues = issues.filter((i) => connected.has(i.id));
  const isolatedIssues = options.hideIsolated ? [] : issues.filter((i) => !connected.has(i.id));

  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: NODESEP,
    ranksep: RANKSEP,
    edgesep: 24,
    marginx: MARGIN,
    marginy: MARGIN,
    ranker: "network-simplex",
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const i of connectedIssues) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const out = new Map<string, NodePosition>();
  let maxRight = MARGIN;
  let topY = MARGIN;
  let hasConnectedPos = false;
  for (const i of connectedIssues) {
    const n = g.node(i.id);
    if (!n) continue;
    const x = n.x - NODE_WIDTH / 2;
    const y = n.y - NODE_HEIGHT / 2;
    out.set(i.id, { x, y });
    if (!hasConnectedPos || y < topY) topY = y;
    if (x + NODE_WIDTH > maxRight) maxRight = x + NODE_WIDTH;
    hasConnectedPos = true;
  }

  if (isolatedIssues.length > 0) {
    const sorted = [...isolatedIssues].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const startX = hasConnectedPos ? maxRight + RANKSEP : MARGIN;
    const rowY = hasConnectedPos ? topY : MARGIN;
    sorted.forEach((issue, idx) => {
      out.set(issue.id, { x: startX + idx * (NODE_WIDTH + NODESEP), y: rowY });
    });
  }

  return out;
}
