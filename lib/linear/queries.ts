export const ASSIGNED_ISSUES_QUERY = /* GraphQL */ `
  query AssignedIssues($first: Int!) {
    viewer {
      id
      assignedIssues(
        filter: { state: { type: { in: ["backlog", "unstarted", "started"] } } }
        first: $first
      ) {
        nodes {
          id identifier title url priority estimate
          state { id name type color }
          team { id key name color }
          project { id name }
          cycle { id number }
          assignee { id name avatarUrl }
          parent { id }
          children { nodes { id } }
          relations { nodes { type relatedIssue { id } } }
          inverseRelations { nodes { type issue { id } } }
          updatedAt createdAt
        }
      }
    }
  }
`;

export const ISSUES_BY_IDS_QUERY = /* GraphQL */ `
  query IssuesByIds($ids: [String!]!) {
    issues(filter: { id: { in: $ids } }, first: 250) {
      nodes {
        id identifier title url priority estimate
        state { id name type color }
        team { id key name color }
        project { id name }
        cycle { id number }
        assignee { id name avatarUrl }
        parent { id }
        children { nodes { id } }
        relations { nodes { type relatedIssue { id } } }
        inverseRelations { nodes { type issue { id } } }
      }
    }
  }
`;
