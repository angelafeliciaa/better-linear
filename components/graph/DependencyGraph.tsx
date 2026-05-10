"use client";
import { useMemo } from "react";
import { ReactFlow, type Node, type Edge as RFEdge, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IssueNode } from "./IssueNode";
import type { Issue } from "@/lib/linear/types";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { layoutGraph, NODE_WIDTH, NODE_HEIGHT } from "@/lib/graph/layout";
import { dependencyClosure } from "@/lib/graph/closure";

type IssueNodeData = { issue: Issue; ready: boolean; dimmed: boolean; onClick: () => void };

const nodeTypes = {
  issue: ({ data }: { data: IssueNodeData }) => (
    <IssueNode issue={data.issue} ready={data.ready} dimmed={data.dimmed} onClick={data.onClick} />
  ),
};

export function DependencyGraph() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const selection = useGraphStore((s) => s.selection);
  const setSelection = useGraphStore((s) => s.setSelection);
  const clearSelection = useGraphStore((s) => s.clearSelection);

  const view = useMemo(() => {
    if (!graph) return null;
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const ready = new Set(computeReady(filtered.issues, filtered.edges));
    const positions = layoutGraph(filtered.issues, filtered.edges);
    const closure = selection ? dependencyClosure(selection, filtered.edges) : null;

    const nodes: Node[] = filtered.issues.map((issue) => {
      const pos = positions.get(issue.id) ?? { x: 0, y: 0 };
      const dimmed = closure ? !closure.has(issue.id) : false;
      return {
        id: issue.id,
        type: "issue",
        position: pos,
        draggable: false,
        selectable: false,
        data: { issue, ready: ready.has(issue.id), dimmed, onClick: () => setSelection(issue.id) },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
    });
    const edges: RFEdge[] = filtered.edges
      .filter((e) => e.kind === "blocks")
      .map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        type: "step",
        style: { stroke: "var(--color-line-strong)", strokeWidth: 1.25 },
      }));

    return { nodes, edges };
  }, [graph, filters, selection, setSelection]);

  if (!view) return null;

  return (
    <div className="w-full h-full" onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}>
      <ReactFlow
        nodes={view.nodes}
        edges={view.edges}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        fitView
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{ type: "step" }}
      >
        <Background gap={0} color="transparent" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="oklch(0.965 0.005 80 / 0.8)"
          nodeColor={(n) =>
            (n.data as { ready?: boolean })?.ready
              ? "oklch(0.40 0.010 80)"
              : "oklch(0.84 0.008 80)"
          }
          nodeStrokeWidth={0}
          className="!bg-paper !border !border-line !rounded"
        />
      </ReactFlow>
    </div>
  );
}
