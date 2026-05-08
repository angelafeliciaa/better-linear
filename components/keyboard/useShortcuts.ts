"use client";
import { useEffect } from "react";
import { useGraphStore } from "@/lib/store";
import type { Scope } from "@/lib/graph/filter";

const SCOPE_BY_KEY: Record<string, Scope> = {
  "1": "my-work",
  "2": "project",
  "3": "cycle",
  "4": "team",
};

export function useShortcuts({ onRefresh }: { onRefresh: () => void }) {
  const setFilters = useGraphStore((s) => s.setFilters);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "SELECT" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") clearSelection();
      else if (e.key === "r" || e.key === "R") onRefresh();
      else if (SCOPE_BY_KEY[e.key]) setFilters({ scope: SCOPE_BY_KEY[e.key] });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setFilters, clearSelection, onRefresh]);
}
