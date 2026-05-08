import { LinearClient } from "@linear/sdk";
import { ASSIGNED_ISSUES_QUERY, ISSUES_BY_IDS_QUERY } from "./queries";
import { normalizeIssues } from "./normalize";
import type { IssueGraph } from "./types";

export async function fetchAssignedGraph(accessToken: string): Promise<IssueGraph> {
  const client = new LinearClient({ accessToken });
  const first = 250;

  const data = (await client.client.rawRequest(ASSIGNED_ISSUES_QUERY, { first })).data as {
    viewer: { id: string; assignedIssues: { nodes: Record<string, unknown>[] } };
  };
  const viewerId = data.viewer.id;
  const assigned = data.viewer.assignedIssues.nodes;

  const knownIds = new Set(assigned.map((n) => String(n.id)));
  const extraIds = new Set<string>();
  for (const n of assigned) {
    const inv = (n.inverseRelations as { nodes?: Array<Record<string, unknown>> } | undefined)?.nodes ?? [];
    for (const r of inv) {
      if (r.type !== "blocks") continue;
      const id = String((r.issue as Record<string, unknown> | undefined)?.id ?? "");
      if (id && !knownIds.has(id)) extraIds.add(id);
    }
  }

  let extra: Record<string, unknown>[] = [];
  if (extraIds.size > 0) {
    const extraData = (await client.client.rawRequest(ISSUES_BY_IDS_QUERY, { ids: Array.from(extraIds) })).data as {
      issues: { nodes: Record<string, unknown>[] };
    };
    extra = extraData.issues.nodes;
  }

  return normalizeIssues([...assigned, ...extra], viewerId);
}
