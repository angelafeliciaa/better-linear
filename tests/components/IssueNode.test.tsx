import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IssueNode } from "@/components/graph/IssueNode";
import type { Issue } from "@/lib/linear/types";

const issue: Issue = {
  id: "i1", identifier: "ENG-642", title: "Set up Linear OAuth callback", url: "https://linear.app/x",
  priority: 1, estimate: null,
  state: { id: "s", name: "Todo", type: "unstarted", color: "#aaa" },
  team: { key: "ENG", name: "Engineering", color: "#888" }, project: null, cycle: null,
  assignee: { id: "u", name: "Angela Felicia", avatarUrl: null }, isMine: true,
};

describe("IssueNode", () => {
  it("renders identifier, title, priority and team", () => {
    render(<IssueNode issue={issue} ready={false} dimmed={false} onClick={() => {}} />);
    expect(screen.getByText("ENG-642")).toBeInTheDocument();
    expect(screen.getByText("Set up Linear OAuth callback")).toBeInTheDocument();
    expect(screen.getByText(/P1/)).toBeInTheDocument();
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
  });

  it("applies the ready border class when ready=true", () => {
    const { container } = render(<IssueNode issue={issue} ready={true} dimmed={false} onClick={() => {}} />);
    expect(container.firstChild).toHaveClass("border-line-ink");
  });
});
