import { describe, it, expect } from "vitest";
import { applyFilters, defaultFilters } from "@/lib/graph/filter";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, p: Issue["priority"] = 2, type: Issue["state"]["type"] = "unstarted", isMine = true): Issue => ({
  id, identifier: id, title: id, url: "", priority: p, estimate: null,
  state: { id: "s", name: "T", type, color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine, updatedAt: "2026-05-01T00:00:00Z",
});

describe("applyFilters", () => {
  it("hides done/canceled by default", () => {
    const issues = [mk("a"), mk("b", 2, "completed")];
    const out = applyFilters(issues, [], defaultFilters);
    expect(out.issues.map((i) => i.id)).toEqual(["a"]);
  });

  it("respects scope=My Work by filtering to isMine plus blockers", () => {
    const issues = [mk("a", 2, "unstarted", true), mk("b", 2, "unstarted", false)];
    const edges: Edge[] = [{ kind: "blocks", from: "b", to: "a" }];
    const out = applyFilters(issues, edges, { ...defaultFilters, scope: "my-work" });
    expect(out.issues.map((i) => i.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps edges only between issues that survived", () => {
    const issues = [mk("a"), mk("b", 2, "completed")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const out = applyFilters(issues, edges, { ...defaultFilters, showDone: false });
    expect(out.edges).toEqual([]);
  });

  it("filters issues by title keyword", () => {
    const issues = [
      { ...mk("ENG-101"), title: "Add dependency graph search" },
      { ...mk("ENG-102"), title: "Polish ready panel" },
    ];

    const out = applyFilters(issues, [], { ...defaultFilters, query: "graph search" });

    expect(out.issues.map((i) => i.identifier)).toEqual(["ENG-101"]);
  });

  it("filters issues by issue identifier without matching partial numbers", () => {
    const issues = [
      { ...mk("ENG-42"), identifier: "ENG-42", title: "OAuth callback" },
      { ...mk("ENG-142"), identifier: "ENG-142", title: "Settings page" },
    ];

    const out = applyFilters(issues, [], { ...defaultFilters, query: "  eng-42  " });

    expect(out.issues.map((i) => i.identifier)).toEqual(["ENG-42"]);
  });
});
