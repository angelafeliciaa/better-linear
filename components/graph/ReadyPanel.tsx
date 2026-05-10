"use client";
import { useMemo, useState } from "react";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { scoreReady, type ScoredIssue } from "@/lib/graph/score";
import { avatarBucket, avatarInitial } from "@/lib/avatar";
import type { Issue } from "@/lib/linear/types";

const AV: Record<1 | 2 | 3, string> = { 1: "bg-av-1", 2: "bg-av-2", 3: "bg-av-3" };

type Tab = "mine" | "team" | "blocked";

type PerPerson = {
  assigneeId: string;
  assigneeName: string;
  top: ScoredIssue;
  totalReady: number;
};

export function ReadyPanel() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const [tab, setTab] = useState<Tab>("mine");

  const { mine, team, blocked, viewerId } = useMemo(() => {
    if (!graph) {
      return { mine: [] as ScoredIssue[], team: [] as PerPerson[], blocked: [] as Issue[], viewerId: "" };
    }
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const readyIds = computeReady(filtered.issues, filtered.edges);
    const ranked = scoreReady(readyIds, filtered.issues, filtered.edges);
    const readySet = new Set(readyIds);
    const blockedIssues = filtered.issues.filter((i) => !readySet.has(i.id));

    const mineRanked = ranked.filter((r) => r.issue.assignee?.id === graph.viewerId);

    const perPerson = new Map<string, PerPerson>();
    for (const r of ranked) {
      const a = r.issue.assignee;
      if (!a || a.id === graph.viewerId) continue;
      const cur = perPerson.get(a.id);
      if (cur) {
        cur.totalReady++;
      } else {
        perPerson.set(a.id, { assigneeId: a.id, assigneeName: a.name, top: r, totalReady: 1 });
      }
    }
    const teamList = Array.from(perPerson.values()).sort((a, b) => b.top.unblocks - a.top.unblocks);

    return { mine: mineRanked, team: teamList, blocked: blockedIssues, viewerId: graph.viewerId };
  }, [graph, filters]);

  if (!graph) return null;

  const counts: Record<Tab, number> = { mine: mine.length, team: team.length, blocked: blocked.length };

  return (
    <aside className="w-[305px] border-l border-line bg-app flex flex-col overflow-hidden">
      <div className="flex border-b border-line shrink-0">
        {(["mine", "team", "blocked"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-3 text-xs uppercase tracking-[0.09em] font-medium border-b-2 transition-colors ${
              tab === t
                ? "text-ink border-ink"
                : "text-muted border-transparent hover:text-ink-2 hover:bg-hover"
            }`}
          >
            {t === "mine" ? "My Next" : t === "team" ? "Team" : "Blocked"}
            <span className="ml-1.5 font-mono text-[10px] text-muted-2">{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "mine" && <MyNextSection mine={mine} hasViewer={!!viewerId} />}
        {tab === "team" && <TeamSection team={team} setFilters={setFilters} />}
        {tab === "blocked" && <BlockedSection blocked={blocked} />}
      </div>
    </aside>
  );
}

function MyNextSection({ mine, hasViewer }: { mine: ScoredIssue[]; hasViewer: boolean }) {
  if (mine.length === 0) {
    return (
      <div className="px-[18px] py-6 text-sm text-ink-2 leading-relaxed">
        {hasViewer
          ? "Nothing of yours is ready right now. Switch to the Team tab to see what others can pick up, or unblock something to make work available."
          : "Loading your work…"}
      </div>
    );
  }
  return (
    <div className="px-[18px] py-2">
      {mine.map((r, idx) => (
        <a
          key={r.id}
          href={r.issue.url}
          target="_blank"
          rel="noreferrer"
          className="block py-3 border-b border-line last:border-b-0 hover:bg-hover -mx-[18px] px-[18px] no-underline transition-colors"
        >
          {idx === 0 && (
            <div className="text-[10px] uppercase tracking-[0.1em] text-ink font-medium mb-1.5">
              Start here
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xs text-muted">{r.issue.identifier}</span>
            <span className="text-sm font-medium text-ink leading-snug">{r.issue.title}</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="font-mono text-base font-medium text-ink tracking-tight">{r.unblocks}</span>
            <span className="text-sm text-ink-2">issue{r.unblocks === 1 ? "" : "s"} unblock</span>
          </div>
          <div className="mt-1 text-xs font-mono text-muted">
            P{r.priority} · {r.issue.team.name}
          </div>
        </a>
      ))}
    </div>
  );
}

function TeamSection({
  team,
  setFilters,
}: {
  team: PerPerson[];
  setFilters: (patch: { scope: "person"; personId: string }) => void;
}) {
  if (team.length === 0) {
    return (
      <div className="px-[18px] py-6 text-sm text-ink-2 leading-relaxed">
        No teammates with ready work in the current view.
      </div>
    );
  }
  return (
    <div className="px-[18px] py-2">
      {team.map((p) => (
        <div key={p.assigneeId} className="py-3 border-b border-line last:border-b-0">
          <button
            onClick={() => setFilters({ scope: "person", personId: p.assigneeId })}
            className="flex items-center gap-2 w-full text-left hover:text-ink transition-colors"
            title={`Filter the graph to ${p.assigneeName}`}
          >
            <span
              className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full font-mono text-[9px] font-medium text-ink shrink-0 ${
                AV[avatarBucket(p.assigneeId)]
              }`}
            >
              {avatarInitial(p.assigneeName)}
            </span>
            <span className="text-sm font-medium text-ink truncate">{p.assigneeName}</span>
            <span className="ml-auto font-mono text-[10px] text-muted">{p.totalReady} ready</span>
          </button>
          <a
            href={p.top.issue.url}
            target="_blank"
            rel="noreferrer"
            className="block mt-1.5 no-underline hover:bg-hover -mx-[18px] px-[18px] py-1 transition-colors"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted">{p.top.issue.identifier}</span>
              <span className="text-sm text-ink-2 leading-snug truncate">{p.top.issue.title}</span>
            </div>
            <div className="mt-0.5 text-xs font-mono text-muted">
              Unblocks {p.top.unblocks} · P{p.top.priority}
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}

function BlockedSection({ blocked }: { blocked: Issue[] }) {
  if (blocked.length === 0) {
    return (
      <div className="px-[18px] py-6 text-sm text-ink-2 leading-relaxed">
        Nothing blocked. Healthy backlog.
      </div>
    );
  }
  return (
    <div className="px-[18px] py-2">
      {blocked.map((i) => (
        <a
          key={i.id}
          href={i.url}
          target="_blank"
          rel="noreferrer"
          className="block py-3 border-b border-line last:border-b-0 no-underline hover:bg-hover -mx-[18px] px-[18px] transition-colors"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xs text-muted-2">{i.identifier}</span>
            <span className="text-sm text-ink-2">{i.title}</span>
          </div>
          {i.assignee && (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-muted">
              <span
                className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full font-mono text-[8px] font-medium text-ink ${
                  AV[avatarBucket(i.assignee.id)]
                }`}
              >
                {avatarInitial(i.assignee.name)}
              </span>
              <span>{i.assignee.name}</span>
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
