export type IssueStateType = "backlog" | "unstarted" | "started" | "completed" | "canceled";
export type IssueState = { id: string; name: string; type: IssueStateType; color: string };

export type Issue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: 0 | 1 | 2 | 3 | 4;
  estimate: number | null;
  state: IssueState;
  team: { key: string; name: string; color: string };
  project: { id: string; name: string } | null;
  cycle: { id: string; number: number } | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  isMine: boolean;
};

export type Edge =
  | { kind: "blocks"; from: string; to: string }
  | { kind: "parent"; from: string; to: string };

export type IssueGraph = { issues: Issue[]; edges: Edge[]; viewerId: string };
