import { describe, it, expect } from "vitest";
import { buildLinearAuthUrl, validateOAuthState } from "@/lib/auth/oauth";

describe("buildLinearAuthUrl", () => {
  it("includes client_id, redirect_uri, scope, state, response_type", () => {
    const url = new URL(buildLinearAuthUrl({
      clientId: "abc",
      redirectUri: "http://localhost:3000/api/auth/callback",
      state: "xyz",
    }));
    expect(url.origin + url.pathname).toBe("https://linear.app/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("abc");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/callback");
    expect(url.searchParams.get("scope")).toBe("read");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("xyz");
  });
});

describe("validateOAuthState", () => {
  it("returns true on match", () => { expect(validateOAuthState("abc", "abc")).toBe(true); });
  it("returns false on mismatch or missing", () => {
    expect(validateOAuthState("abc", "xyz")).toBe(false);
    expect(validateOAuthState(null, "abc")).toBe(false);
    expect(validateOAuthState("abc", null)).toBe(false);
  });
});
