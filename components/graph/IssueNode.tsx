"use client";
import type { Issue } from "@/lib/linear/types";
import { avatarBucket, avatarInitial } from "@/lib/avatar";

const STATUS_CLASS: Record<Issue["state"]["type"], string> = {
  backlog: "bg-transparent",
  unstarted: "bg-transparent",
  started: "[background:conic-gradient(var(--color-ink-2)_0_50%,transparent_50%_100%)]",
  completed: "bg-ink-2",
  canceled: "bg-ink-2",
};

const AVATAR_BG: Record<1 | 2 | 3, string> = { 1: "bg-av-1", 2: "bg-av-2", 3: "bg-av-3" };

export function IssueNode(props: { issue: Issue; ready: boolean; dimmed: boolean; onClick: () => void }) {
  const { issue, ready, dimmed, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-[220px] text-left rounded-[5px] bg-surface px-3 py-[10px]",
        "border transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        ready ? "border-line-ink" : "border-line-strong",
        dimmed ? "opacity-30" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex items-center gap-[7px]">
        <span aria-label={issue.state.name} className={`w-[11px] h-[11px] rounded-full border-[1.25px] border-ink-2 box-border shrink-0 ${STATUS_CLASS[issue.state.type]}`} />
        <span className={`font-mono text-xs tracking-tight ${ready ? "text-ink font-medium" : "text-muted"}`}>{issue.identifier}</span>
        {issue.assignee && (
          <span className="ml-auto">
            <span title={issue.assignee.name} className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-mono text-[9px] font-medium text-ink ${AVATAR_BG[avatarBucket(issue.assignee.id)]}`}>
              {avatarInitial(issue.assignee.name)}
            </span>
          </span>
        )}
        <a
          href={issue.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 ml-1 text-muted hover:text-ink transition-opacity text-xs"
          title="Open in Linear"
        >↗</a>
      </div>
      <div className="mt-1 text-sm font-medium leading-[1.35] text-ink line-clamp-2">{issue.title}</div>
      <div className="mt-2 flex items-center gap-2 text-xs font-mono text-muted">
        <span>P{issue.priority}</span>
        <span className="text-muted-2">·</span>
        <span>{issue.team.name}</span>
      </div>
    </button>
  );
}
