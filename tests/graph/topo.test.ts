import { describe, it, expect } from "vitest";
import { computeReady, computeRanks, downstreamCount } from "@/lib/graph/topo";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, partial: Partial<Issue> = {}): Issue => ({
  id, identifier: id, title: id, url: "", priority: 2, estimate: null,
  state: { id: "s", name: "Todo", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true, updatedAt: "2026-05-01T00:00:00Z", ...partial,
});

describe("computeReady", () => {
  it("returns ids whose blockers are completed/canceled or absent", () => {
    const issues = [mk("a"), mk("b"), mk("c", { state: { id: "s", name: "Done", type: "completed", color: "#aaa" } })];
    const edges: Edge[] = [{ kind: "blocks", from: "c", to: "b" }];
    expect(computeReady(issues, edges).sort()).toEqual(["a", "b"]);
  });
  it("excludes done/canceled themselves", () => {
    const issues = [mk("a", { state: { id: "s", name: "x", type: "completed", color: "#aaa" } })];
    expect(computeReady(issues, [])).toEqual([]);
  });
});

describe("computeRanks", () => {
  it("assigns layer 0 to ready issues, +1 per dependency depth", () => {
    const issues = [mk("a"), mk("b"), mk("c")];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
    ];
    const ranks = computeRanks(issues, edges);
    expect(ranks.get("a")).toBe(0);
    expect(ranks.get("b")).toBe(1);
    expect(ranks.get("c")).toBe(2);
  });
  it("breaks cycles by demoting the lower-priority node", () => {
    const issues = [mk("a", { priority: 1 }), mk("b", { priority: 3 })];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "a" },
    ];
    const ranks = computeRanks(issues, edges);
    expect(ranks.get("a")).toBe(0);
    expect(ranks.get("b")).toBe(1);
  });
});

describe("downstreamCount", () => {
  it("counts transitive descendants reachable through blocks edges", () => {
    const issues = [mk("a"), mk("b"), mk("c"), mk("d")];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
      { kind: "blocks", from: "a", to: "d" },
    ];
    expect(downstreamCount("a", issues, edges)).toBe(3);
    expect(downstreamCount("b", issues, edges)).toBe(1);
    expect(downstreamCount("c", issues, edges)).toBe(0);
  });
});
