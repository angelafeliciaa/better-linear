import { describe, it, expectTypeOf } from "vitest";
import type { Issue, Edge, IssueState } from "@/lib/linear/types";

describe("Issue type", () => {
  it("has the expected fields", () => {
    expectTypeOf<Issue>().toMatchTypeOf<{
      id: string;
      identifier: string;
      title: string;
      url: string;
      priority: 0 | 1 | 2 | 3 | 4;
      estimate: number | null;
      state: IssueState;
      team: { key: string; name: string };
      project: { id: string; name: string } | null;
      cycle: { id: string; number: number } | null;
      assignee: { id: string; name: string; avatarUrl: string | null } | null;
      isMine: boolean;
    }>();
  });
});

describe("Edge type", () => {
  it("has kind, from, to", () => {
    expectTypeOf<Edge>().toMatchTypeOf<{ kind: "blocks" | "parent"; from: string; to: string }>();
  });
});
