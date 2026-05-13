import dagre from "dagre";
import type { Issue, Edge, IssueStateType } from "@/lib/linear/types";

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

export type BandKey = "backlog" | "unstarted" | "started";

export type BandInfo = {
  key: BandKey;
  label: string;
  yTop: number;
  yBottom: number;
  xLeft: number;
  xRight: number;
};

export type LayoutResult = {
  positions: Map<string, NodePosition>;
  bands: BandInfo[];
};

const NODESEP = 56;
const RANKSEP = 120;
const MARGIN = 32;
const BAND_GAP = 96;
const BAND_HEADER = 36;

const BAND_ORDER: BandKey[] = ["backlog", "unstarted", "started"];
const BAND_LABELS: Record<BandKey, string> = {
  backlog: "Backlog",
  unstarted: "Todo",
  started: "In Progress",
};

function bandKeyFor(type: IssueStateType): BandKey | null {
  if (type === "backlog") return "backlog";
  if (type === "unstarted") return "unstarted";
  if (type === "started") return "started";
  return null;
}

type BandLayout = {
  positions: Map<string, NodePosition>;
  width: number;
  height: number;
};

function layoutBand(issues: Issue[], edges: Edge[], options: LayoutOptions): BandLayout {
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
    marginx: 0,
    marginy: 0,
    ranker: "network-simplex",
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const i of connectedIssues) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const positions = new Map<string, NodePosition>();
  let minX = 0;
  let minY = 0;
  let maxRight = 0;
  let maxBottom = 0;
  let firstConnected = true;
  for (const i of connectedIssues) {
    const n = g.node(i.id);
    if (!n) continue;
    const x = n.x - NODE_WIDTH / 2;
    const y = n.y - NODE_HEIGHT / 2;
    if (firstConnected) {
      minX = x;
      minY = y;
      firstConnected = false;
    } else {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
    positions.set(i.id, { x, y });
    if (x + NODE_WIDTH > maxRight) maxRight = x + NODE_WIDTH;
    if (y + NODE_HEIGHT > maxBottom) maxBottom = y + NODE_HEIGHT;
  }

  // Normalize so top-left of connected sits at (0, 0).
  if (!firstConnected) {
    for (const [id, pos] of positions) {
      positions.set(id, { x: pos.x - minX, y: pos.y - minY });
    }
    maxRight -= minX;
    maxBottom -= minY;
  }

  if (isolatedIssues.length > 0) {
    const sorted = [...isolatedIssues].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const startX = firstConnected ? 0 : maxRight + RANKSEP;
    const rowY = 0;
    sorted.forEach((issue, idx) => {
      const x = startX + idx * (NODE_WIDTH + NODESEP);
      positions.set(issue.id, { x, y: rowY });
      if (x + NODE_WIDTH > maxRight) maxRight = x + NODE_WIDTH;
      if (NODE_HEIGHT > maxBottom) maxBottom = NODE_HEIGHT;
    });
  }

  return { positions, width: maxRight, height: maxBottom };
}

export function layoutGraph(
  issues: Issue[],
  edges: Edge[],
  options: LayoutOptions = {},
): LayoutResult {
  const positions = new Map<string, NodePosition>();
  const bands: BandInfo[] = [];

  let currentY = MARGIN;

  for (const key of BAND_ORDER) {
    const bandIssues = issues.filter((i) => bandKeyFor(i.state.type) === key);
    if (bandIssues.length === 0) continue;
    const bandIds = new Set(bandIssues.map((i) => i.id));
    const bandEdges = edges.filter((e) => bandIds.has(e.from) && bandIds.has(e.to));

    const band = layoutBand(bandIssues, bandEdges, options);
    const yOffset = currentY + BAND_HEADER;
    const xOffset = MARGIN;

    for (const [id, pos] of band.positions) {
      positions.set(id, { x: pos.x + xOffset, y: pos.y + yOffset });
    }

    bands.push({
      key,
      label: BAND_LABELS[key],
      yTop: currentY,
      yBottom: yOffset + band.height,
      xLeft: xOffset,
      xRight: xOffset + band.width,
    });

    currentY = yOffset + band.height + BAND_GAP;
  }

  return { positions, bands };
}
