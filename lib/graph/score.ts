import type { Issue, Edge } from "@/lib/linear/types";
import { downstreamCount } from "./topo";

export type ScoredIssue = { id: string; unblocks: number; priority: Issue["priority"]; issue: Issue };

export function scoreReady(readyIds: string[], issues: Issue[], edges: Edge[]): ScoredIssue[] {
  const byId = new Map(issues.map((i) => [i.id, i]));
  return readyIds
    .map((id) => {
      const issue = byId.get(id)!;
      return { id, unblocks: downstreamCount(id, issues, edges), priority: issue.priority, issue };
    })
    .sort((a, b) => {
      if (b.unblocks !== a.unblocks) return b.unblocks - a.unblocks;
      return a.priority - b.priority; // P0=0 wins
    });
}
