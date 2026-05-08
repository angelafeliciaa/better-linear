import { describe, it, expect } from "vitest";
import { detectCycles } from "@/lib/graph/cycle-detect";
import type { Edge } from "@/lib/linear/types";

describe("detectCycles", () => {
  it("returns each cycle as an ordered list of node ids", () => {
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "a" },
    ];
    const cycles = detectCycles(edges);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].sort()).toEqual(["a", "b"]);
  });

  it("returns [] when acyclic", () => {
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    expect(detectCycles(edges)).toEqual([]);
  });
});
