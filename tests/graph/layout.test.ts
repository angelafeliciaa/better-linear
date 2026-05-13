import { describe, it, expect } from "vitest";
import { layoutGraph } from "@/lib/graph/layout";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string): Issue => ({
  id, identifier: id, title: id, url: "", priority: 2, estimate: null,
  state: { id: "s", name: "T", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true, updatedAt: "2026-05-01T00:00:00Z",
});

describe("layoutGraph", () => {
  it("returns a position for every issue", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const { positions } = layoutGraph(issues, edges);
    expect(positions.get("a")).toBeDefined();
    expect(positions.get("b")).toBeDefined();
  });
  it("places blocked issues below their blockers (higher y)", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const { positions } = layoutGraph(issues, edges);
    expect(positions.get("b")!.y).toBeGreaterThan(positions.get("a")!.y);
  });
  it("emits a band per non-empty state, ordered backlog → unstarted → started", () => {
    const issues = [
      { ...mk("u1"), state: { id: "s", name: "Todo", type: "unstarted" as const, color: "#aaa" } },
      { ...mk("s1"), state: { id: "s", name: "Doing", type: "started" as const, color: "#aaa" } },
    ];
    const { bands, positions } = layoutGraph(issues, []);
    expect(bands.map((b) => b.key)).toEqual(["unstarted", "started"]);
    expect(positions.get("s1")!.y).toBeGreaterThan(positions.get("u1")!.y);
  });
});
