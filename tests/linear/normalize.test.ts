import { describe, it, expect } from "vitest";
import { normalizeIssues } from "@/lib/linear/normalize";
import { rawIssue } from "./fixtures/raw-issues";

describe("normalizeIssues", () => {
  it("flattens raw Linear issues into Issue + Edge arrays", () => {
    const { issues, edges } = normalizeIssues([rawIssue], "u1");
    expect(issues).toHaveLength(1);
    expect(issues[0].identifier).toBe("ENG-642");
    expect(issues[0].isMine).toBe(true);
    expect(edges).toEqual([{ kind: "blocks", from: "iss_1", to: "iss_2" }]);
  });

  it("emits parent edges from children.nodes", () => {
    const parentIssue = { ...rawIssue, id: "p", identifier: "ENG-100", children: { nodes: [{ id: "c" }] } };
    const { edges } = normalizeIssues([parentIssue], "u1");
    expect(edges).toContainEqual({ kind: "parent", from: "p", to: "c" });
  });

  it("collapses inverseRelations into the same blocks edges (deduped)", () => {
    const a = { ...rawIssue, id: "a", relations: { nodes: [{ type: "blocks", relatedIssue: { id: "b" } }] } };
    const b = { ...rawIssue, id: "b", relations: { nodes: [] }, inverseRelations: { nodes: [{ type: "blocks", issue: { id: "a" } }] } };
    const { edges } = normalizeIssues([a, b], "u1");
    expect(edges.filter((e) => e.kind === "blocks")).toEqual([{ kind: "blocks", from: "a", to: "b" }]);
  });

  it("ignores related and duplicate relation types", () => {
    const issue = { ...rawIssue, relations: { nodes: [{ type: "related", relatedIssue: { id: "x" } }, { type: "duplicate", relatedIssue: { id: "y" } }] } };
    const { edges } = normalizeIssues([issue], "u1");
    expect(edges).toHaveLength(0);
  });

  it("normalizes priority null/undefined to 0", () => {
    const issue = { ...rawIssue, priority: null as unknown as number };
    const { issues } = normalizeIssues([issue], "u1");
    expect(issues[0].priority).toBe(0);
  });
});
