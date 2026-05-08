import { create } from "zustand";
import type { IssueGraph } from "@/lib/linear/types";
import { defaultFilters, type Filters } from "@/lib/graph/filter";

type State = {
  graph: IssueGraph | null;
  filters: Filters;
  selection: string | null;
  setGraph: (g: IssueGraph) => void;
  setFilters: (patch: Partial<Filters>) => void;
  setSelection: (id: string) => void;
  clearSelection: () => void;
};

export const useGraphStore = create<State>((set) => ({
  graph: null,
  filters: defaultFilters,
  selection: null,
  setGraph: (graph) => set({ graph }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSelection: (id) => set({ selection: id }),
  clearSelection: () => set({ selection: null }),
}));
