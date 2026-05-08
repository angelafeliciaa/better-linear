import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "@/lib/store";

beforeEach(() => {
  useGraphStore.setState({ graph: null, selection: null });
});

describe("useGraphStore", () => {
  it("starts empty, accepts a graph payload, exposes setSelection / clearSelection", () => {
    const { setGraph, setSelection, clearSelection } = useGraphStore.getState();
    setGraph({ issues: [], edges: [], viewerId: "u" });
    setSelection("a");
    expect(useGraphStore.getState().selection).toBe("a");
    clearSelection();
    expect(useGraphStore.getState().selection).toBeNull();
  });
});
