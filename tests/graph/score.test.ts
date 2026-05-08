import { describe, it, expect } from "vitest";
import { scoreReady } from "@/lib/graph/score";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, p: Issue["priority"] = 2): Issue => ({
  id, identifier: id, title: id, url: "", priority: p, estimate: null,
  state: { id: "s", name: "T", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true,
});

describe("scoreReady", () => {
  it("orders by downstream-unblock count first, then priority", () => {
    const issues = [mk("a", 2), mk("b", 0), mk("c", 1)];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "a", to: "c" },
      { kind: "blocks", from: "c", to: "b" },
    ];
    const ready = ["a", "c"];
    const ranked = scoreReady(ready, issues, edges);
    expect(ranked[0].id).toBe("a"); // unblocks 2
    expect(ranked[1].id).toBe("c"); // unblocks 1
  });
});
