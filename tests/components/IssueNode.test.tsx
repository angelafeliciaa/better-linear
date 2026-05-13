import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { IssueNode } from "@/components/graph/IssueNode";
import type { Issue } from "@/lib/linear/types";

const issue: Issue = {
  id: "i1", identifier: "ENG-642", title: "Set up Linear OAuth callback", url: "https://linear.app/x",
  priority: 1, estimate: null,
  state: { id: "s", name: "Todo", type: "unstarted", color: "#aaa" },
  team: { key: "ENG", name: "Engineering", color: "#888" }, project: null, cycle: null,
  assignee: { id: "u", name: "Angela Felicia", avatarUrl: null }, isMine: true, updatedAt: "2026-05-01T00:00:00Z",
};

const renderNode = (props: { ready: boolean; dimmed: boolean }) =>
  render(
    <ReactFlowProvider>
      <IssueNode issue={issue} ready={props.ready} dimmed={props.dimmed} onClick={() => {}} />
    </ReactFlowProvider>
  );

describe("IssueNode", () => {
  it("renders identifier and title", () => {
    renderNode({ ready: false, dimmed: false });
    expect(screen.getByText("ENG-642")).toBeInTheDocument();
    expect(screen.getByText("Set up Linear OAuth callback")).toBeInTheDocument();
  });

  it("applies the ready border class when ready=true", () => {
    const { container } = renderNode({ ready: true, dimmed: false });
    expect(container.firstChild).toHaveClass("border-line-ink");
  });

  it("keeps Open in Linear as a native link without bubbling to the node", () => {
    const onNodeClick = vi.fn();
    render(
      <ReactFlowProvider>
        <div onClick={onNodeClick}>
          <IssueNode issue={issue} ready={false} dimmed={false} onClick={() => {}} />
        </div>
      </ReactFlowProvider>
    );

    const link = screen.getByRole("link", { name: /open in linear/i });
    expect(link).toHaveAttribute("href", issue.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveClass("nodrag", "nopan");

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onNodeClick).not.toHaveBeenCalled();
  });
});
