export const ASSIGNED_ISSUES_QUERY = /* GraphQL */ `
  query AssignedIssues($first: Int!) {
    viewer {
      id
      assignedIssues(
        filter: { state: { type: { in: ["backlog", "unstarted", "started"] } } }
        first: $first
      ) {
        nodes {
          id identifier title url priority updatedAt
          state { id name type color }
          team { id key name color }
          project { id name }
          cycle { id number }
          assignee { id name avatarUrl }
          children(first: 20) { nodes { id } }
          relations(first: 20) { nodes { type relatedIssue { id } } }
          inverseRelations(first: 20) { nodes { type issue { id } } }
        }
      }
    }
  }
`;

export const ISSUES_BY_IDS_QUERY = /* GraphQL */ `
  query IssuesByIds($ids: [ID!]!) {
    issues(filter: { id: { in: $ids } }, first: 50) {
      nodes {
        id identifier title url priority updatedAt
        state { id name type color }
        team { id key name color }
        project { id name }
        cycle { id number }
        assignee { id name avatarUrl }
        children(first: 20) { nodes { id } }
        relations(first: 20) { nodes { type relatedIssue { id } } }
        inverseRelations(first: 20) { nodes { type issue { id } } }
      }
    }
  }
`;
