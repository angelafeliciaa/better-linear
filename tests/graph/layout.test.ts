import { describe, it, expect } from "vitest";
import { layoutGraph } from "@/lib/graph/layout";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string): Issue => ({
  id, identifier: id, title: id, url: "", priority: 2, estimate: null,
  state: { id: "s", name: "T", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true,
});

describe("layoutGraph", () => {
  it("returns a position for every issue", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const positions = layoutGraph(issues, edges);
    expect(positions.get("a")).toBeDefined();
    expect(positions.get("b")).toBeDefined();
  });
  it("places blocked issues below their blockers (higher y)", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const positions = layoutGraph(issues, edges);
    expect(positions.get("b")!.y).toBeGreaterThan(positions.get("a")!.y);
  });
});
