import { describe, it, expect } from "vitest";
import { avatarBucket, avatarInitial } from "@/lib/avatar";

describe("avatarBucket", () => {
  it("returns 1 | 2 | 3 deterministically per id", () => {
    expect(avatarBucket("u1")).toBe(avatarBucket("u1"));
    expect([1, 2, 3]).toContain(avatarBucket("anything"));
  });
});

describe("avatarInitial", () => {
  it("returns the first char uppercased", () => {
    expect(avatarInitial("Angela")).toBe("A");
    expect(avatarInitial("  jordan")).toBe("J");
    expect(avatarInitial("")).toBe("?");
  });
});
