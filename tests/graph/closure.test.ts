import { describe, it, expect } from "vitest";
import { dependencyClosure } from "@/lib/graph/closure";
import type { Edge } from "@/lib/linear/types";

describe("dependencyClosure", () => {
  it("returns the node, all transitive ancestors, and all transitive descendants via blocks", () => {
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
      { kind: "blocks", from: "x", to: "a" },
    ];
    expect([...dependencyClosure("b", edges)].sort()).toEqual(["a", "b", "c", "x"]);
  });
});
