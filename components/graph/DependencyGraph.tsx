"use client";
import { useMemo, useState } from "react";
import { ReactFlow, type Node, type Edge as RFEdge, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IssueNode } from "./IssueNode";
import type { Issue } from "@/lib/linear/types";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { layoutGraph, NODE_WIDTH, NODE_HEIGHT, connectedIssueIds } from "@/lib/graph/layout";
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
  const [showIsolated, setShowIsolated] = useState(true);

  const view = useMemo(() => {
    if (!graph) return null;
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const ready = new Set(computeReady(filtered.issues, filtered.edges));
    const connected = connectedIssueIds(filtered.issues, filtered.edges);
    const isolatedCount = filtered.issues.filter((i) => !connected.has(i.id)).length;
    const positions = layoutGraph(filtered.issues, filtered.edges, { hideIsolated: !showIsolated });
    const closure = selection ? dependencyClosure(selection, filtered.edges) : null;

    const nodes: Node[] = filtered.issues
      .filter((i) => positions.has(i.id))
      .map((issue) => {
        const pos = positions.get(issue.id)!;
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
        type: "smoothstep",
        pathOptions: { borderRadius: 8 },
        style: { stroke: "var(--color-line-strong)", strokeWidth: 1.25 },
      }));

    return { nodes, edges, isolatedCount };
  }, [graph, filters, selection, setSelection, showIsolated]);

  if (!view) return null;

  return (
    <div className="w-full h-full relative" onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}>
      {view.isolatedCount > 0 && (
        <button
          onClick={() => setShowIsolated((v) => !v)}
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded text-xs font-mono text-ink-2 bg-app border border-line hover:bg-hover hover:text-ink transition-colors"
          title="Issues with no blockers and that block nothing"
        >
          {showIsolated ? "Hide" : "Show"} {view.isolatedCount} standalone
        </button>
      )}
      <ReactFlow
        nodes={view.nodes}
        edges={view.edges}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        fitView
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{ type: "step" }}
        onNodeClick={(_, node) => {
          const url = (node.data as { issue?: { url?: string } } | undefined)?.issue?.url;
          if (url) window.open(url, "_blank", "noopener,noreferrer");
        }}
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
