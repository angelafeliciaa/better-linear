import { describe, it, expect } from "vitest";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

describe("sessionOptions", () => {
  it("uses the SESSION_PASSWORD env var", () => {
    expect(sessionOptions.password.length).toBeGreaterThanOrEqual(32);
  });
  it("uses an httpOnly cookie", () => {
    expect(sessionOptions.cookieName).toBe("better-linear-session");
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
  });
});

describe("SessionData", () => {
  it("has the expected shape", () => {
    const s: SessionData = { accessToken: "tok", linearUserId: "u" };
    expect(s.accessToken).toBe("tok");
  });
});
