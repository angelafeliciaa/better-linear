# better-linear v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed Next.js web app that signs in with Linear OAuth, fetches the viewer's assigned issues via Linear's GraphQL API, renders them as a top-down dependency DAG (blocks / blocked-by + parent / sub-issue), and surfaces a "Ready to work" panel ranked by downstream unblock count.

**Architecture:** Stateless Next.js 15 (App Router) on Vercel. Linear OAuth 2.0 token stored only in an encrypted httpOnly cookie via `iron-session`. Server route `/api/issues` makes one batched GraphQL call to Linear, normalizes the response into internal `Issue` and `Edge` types, and ships JSON to the client. Client uses Zustand for view state, TanStack Query for fetching, dagre for layered DAG layout, and React Flow for canvas rendering. No application database in v1.

**Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, TypeScript 5 strict, Tailwind CSS 4, shadcn/ui primitives, React Flow, dagre, Zustand, TanStack Query, `@linear/sdk`, `iron-session`, zod, Vitest, React Testing Library, Playwright (deferred), Geist + Geist Mono fonts.

**References:**
- Spec: `docs/superpowers/specs/2026-05-06-better-linear-design.md`
- UI design contract: `docs/tech-design/ui-design.md`
- Product brief: `PRODUCT.md`, `DESIGN.md`
- Reference mockup: `docs/tech-design/mockups/v5.html`

---

## Phase 0 · Skeleton

### Task 1: Scaffold Next.js 15 with TypeScript + Tailwind 4

**Files:**
- Create: project directory contents (Next.js install scaffolds many files)
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Run the official Next.js scaffold**

Run from repo root:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --no-git --use-npm
```

Choose: yes to overwriting `README.md` (we will rewrite it).
Expected: a working Next.js 15 + Tailwind 4 + TypeScript project with App Router. Do NOT `npm run dev` yet.

- [ ] **Step 2: Pin React 19 explicitly and verify versions**

Edit `package.json` so `dependencies` has `"react": "^19"` and `"react-dom": "^19"` (the scaffold should already do this; verify).

- [ ] **Step 3: Smoke check**

Run:
```bash
npm run dev
```
Open http://localhost:3000. Expected: default Next.js page renders. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts eslint.config.mjs postcss.config.mjs app/ public/
git commit -m "feat: scaffold Next.js 15 app with TypeScript and Tailwind"
```

---

### Task 2: Add Geist fonts and design tokens

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Install Geist via `next/font`**

Edit `app/layout.tsx` to load Geist Sans and Geist Mono via `next/font/google`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "better-linear",
  description: "Graph-based dependency view for Linear issues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/globals.css` with the design tokens from `docs/tech-design/ui-design.md`**

Write `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-ink: oklch(0.18 0.012 80);
  --color-ink-2: oklch(0.34 0.010 80);
  --color-muted: oklch(0.58 0.008 80);
  --color-muted-2: oklch(0.72 0.006 80);
  --color-line: oklch(0.91 0.006 80);
  --color-line-strong: oklch(0.84 0.008 80);
  --color-line-ink: oklch(0.40 0.010 80);
  --color-paper: oklch(0.965 0.005 80);
  --color-app: oklch(0.985 0.004 80);
  --color-surface: oklch(0.995 0.002 80);
  --color-hover: oklch(0.94 0.006 80);

  --color-av-1: oklch(0.78 0.05 60);
  --color-av-2: oklch(0.78 0.05 200);
  --color-av-3: oklch(0.78 0.05 140);

  --font-sans: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), "SF Mono", ui-monospace, monospace;

  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
}

html, body { font-family: var(--font-sans); font-feature-settings: "ss01", "ss03", "tnum"; letter-spacing: -0.005em; }
```

- [ ] **Step 3: Smoke check**

Replace `app/page.tsx` with a quick swatch:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-base font-semibold tracking-tight">better-linear</h1>
      <p className="text-sm text-ink-2 mt-1">Tokens loaded.</p>
    </main>
  );
}
```
`npm run dev`, open http://localhost:3000, confirm warm-paper background and Geist font.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx
git commit -m "feat: add Geist font and OKLCH design tokens"
```

---

### Task 3: Add Vitest + React Testing Library

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Install dev deps**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: { alias: { "@": resolve(__dirname, ".") } },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add npm scripts**

In `package.json`, under `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Write a failing smoke test**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

Run: `npm test`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts tests/ package.json package-lock.json
git commit -m "test: add vitest + RTL setup"
```

---

### Task 4: Add zod, dagre, react-flow, zustand, tanstack-query, iron-session, @linear/sdk

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install zod dagre @xyflow/react zustand @tanstack/react-query iron-session @linear/sdk
npm install -D @types/dagre
```

- [ ] **Step 2: Verify install**

Run `npm run typecheck`. Expected: PASS (no TypeScript errors).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add runtime dependencies (linear sdk, react flow, dagre, etc.)"
```

---

## Phase 1 · Authentication

### Task 5: Create the Linear OAuth app and document env

**Files:**
- Modify: `.env.example` (already exists)
- Manual: register OAuth application on linear.app

- [ ] **Step 1: Register the OAuth app**

A human (the user) goes to https://linear.app/settings/api/applications/new and creates an application named `better-linear (local)` with:
- Redirect URI: `http://localhost:3000/api/auth/callback`
- Scopes: `read`

Save the client id and client secret to `.env.local` (created from `.env.example`).

- [ ] **Step 2: Generate `SESSION_PASSWORD`**

Run:
```bash
openssl rand -hex 32
```
Paste the output into `SESSION_PASSWORD` in `.env.local`.

- [ ] **Step 3: Commit (no secrets — only docs)**

`.env.example` already exists from a prior commit. Skip if unchanged. If it changed, commit the docs.

---

### Task 6: Implement the iron-session config

**Files:**
- Create: `lib/auth/session.ts`
- Test: `tests/auth/session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/auth/session.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

describe("sessionOptions", () => {
  it("uses the SESSION_PASSWORD env var", () => {
    expect(sessionOptions.password.length).toBeGreaterThanOrEqual(32);
  });
  it("uses an httpOnly secure cookie name", () => {
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
```

Run: `SESSION_PASSWORD=$(openssl rand -hex 32) npm test -- session`. Expected: FAIL ("Cannot find module '@/lib/auth/session'").

- [ ] **Step 2: Implement `lib/auth/session.ts`**

```ts
import type { SessionOptions } from "iron-session";

export type SessionData = {
  accessToken: string;
  linearUserId: string;
};

const password = process.env.SESSION_PASSWORD;
if (!password || password.length < 32) {
  throw new Error("SESSION_PASSWORD must be at least 32 characters. Set it in .env.local.");
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "better-linear-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};
```

- [ ] **Step 3: Run test, verify pass**

```bash
SESSION_PASSWORD=$(openssl rand -hex 32) npm test -- session
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/session.ts tests/auth/session.test.ts
git commit -m "feat(auth): iron-session config"
```

---

### Task 7: Implement `/api/auth/login` redirect

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `lib/auth/oauth.ts`
- Test: `tests/auth/oauth.test.ts`

- [ ] **Step 1: Write the failing test for the URL builder**

Create `tests/auth/oauth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildLinearAuthUrl } from "@/lib/auth/oauth";

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
```

Run: `npm test -- oauth`. Expected: FAIL.

- [ ] **Step 2: Implement `lib/auth/oauth.ts`**

```ts
import { z } from "zod";

export const LINEAR_AUTH_URL = "https://linear.app/oauth/authorize";
export const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";

export type AuthUrlInput = { clientId: string; redirectUri: string; state: string };

export function buildLinearAuthUrl({ clientId, redirectUri, state }: AuthUrlInput): string {
  const u = new URL(LINEAR_AUTH_URL);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "read");
  u.searchParams.set("state", state);
  return u.toString();
}

const TokenResponse = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number().int().nonnegative(),
  scope: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponse>;

export async function exchangeCodeForToken(args: {
  code: string; clientId: string; clientSecret: string; redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(LINEAR_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error(`Linear token exchange failed: ${res.status}`);
  return TokenResponse.parse(await res.json());
}
```

Run: `npm test -- oauth`. Expected: PASS.

- [ ] **Step 3: Implement the login route**

Create `app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { buildLinearAuthUrl } from "@/lib/auth/oauth";

export async function GET() {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return new NextResponse("Linear OAuth env vars missing.", { status: 500 });
  }
  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(buildLinearAuthUrl({ clientId, redirectUri, state }));
}
```

- [ ] **Step 4: Smoke check (optional)**

`npm run dev`, visit http://localhost:3000/api/auth/login, expect a redirect to `linear.app/oauth/authorize?...`. (Will fail at Linear if env vars not set; that is fine.)

- [ ] **Step 5: Commit**

```bash
git add lib/auth/oauth.ts tests/auth/oauth.test.ts app/api/auth/login/route.ts
git commit -m "feat(auth): /api/auth/login redirects to Linear OAuth"
```

---

### Task 8: Implement `/api/auth/callback`

**Files:**
- Create: `app/api/auth/callback/route.ts`
- Test: `tests/auth/callback.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/auth/callback.test.ts` (lightweight: tests just the state validation helper):

```ts
import { describe, it, expect } from "vitest";
import { validateOAuthState } from "@/lib/auth/oauth";

describe("validateOAuthState", () => {
  it("returns true on match", () => {
    expect(validateOAuthState("abc", "abc")).toBe(true);
  });
  it("returns false on mismatch or missing", () => {
    expect(validateOAuthState("abc", "xyz")).toBe(false);
    expect(validateOAuthState(null, "abc")).toBe(false);
    expect(validateOAuthState("abc", null)).toBe(false);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Add `validateOAuthState` to `lib/auth/oauth.ts`**

Append:
```ts
export function validateOAuthState(cookieState: string | null | undefined, queryState: string | null | undefined): boolean {
  if (!cookieState || !queryState) return false;
  return cookieState === queryState;
}
```

Run: PASS.

- [ ] **Step 3: Implement the callback route**

Create `app/api/auth/callback/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { LinearClient } from "@linear/sdk";
import { exchangeCodeForToken, validateOAuthState } from "@/lib/auth/oauth";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const queryState = url.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("oauth_state")?.value ?? null;

  if (!validateOAuthState(cookieState, queryState)) {
    return new NextResponse("Invalid OAuth state.", { status: 400 });
  }
  if (!code) return new NextResponse("Missing OAuth code.", { status: 400 });

  const clientId = process.env.LINEAR_CLIENT_ID!;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET!;
  const redirectUri = process.env.LINEAR_REDIRECT_URI!;

  const token = await exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
  const linear = new LinearClient({ accessToken: token.access_token });
  const viewer = await linear.viewer;

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.accessToken = token.access_token;
  session.linearUserId = viewer.id;
  await session.save();

  cookieStore.delete("oauth_state");
  return NextResponse.redirect(new URL("/graph", req.url));
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/auth/oauth.ts tests/auth/callback.test.ts app/api/auth/callback/route.ts
git commit -m "feat(auth): /api/auth/callback exchanges code for session"
```

---

### Task 9: Implement `/api/auth/logout`

**Files:**
- Create: `app/api/auth/logout/route.ts`

- [ ] **Step 1: Implement the logout route**

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/logout/route.ts
git commit -m "feat(auth): /api/auth/logout destroys session"
```

---

### Task 10: Add a session helper for server components

**Files:**
- Create: `lib/auth/get-session.ts`

- [ ] **Step 1: Write the helper**

```ts
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "./session";

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.accessToken) return null;
  return { accessToken: session.accessToken, linearUserId: session.linearUserId };
}

export async function requireSession(): Promise<SessionData> {
  const s = await getSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  return s;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth/get-session.ts
git commit -m "feat(auth): add getSession / requireSession helpers"
```

---

## Phase 2 · Data layer

### Task 11: Define internal `Issue` and `Edge` types

**Files:**
- Create: `lib/linear/types.ts`
- Test: `tests/linear/types.test.ts`

- [ ] **Step 1: Write the failing type test**

Create `tests/linear/types.test.ts`:

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { Issue, Edge, IssueState } from "@/lib/linear/types";

describe("Issue type", () => {
  it("has the expected fields", () => {
    expectTypeOf<Issue>().toMatchTypeOf<{
      id: string;
      identifier: string;
      title: string;
      url: string;
      priority: 0 | 1 | 2 | 3 | 4;
      estimate: number | null;
      state: IssueState;
      team: { key: string; name: string };
      project: { id: string; name: string } | null;
      cycle: { id: string; number: number } | null;
      assignee: { id: string; name: string; avatarUrl: string | null } | null;
      isMine: boolean;
    }>();
  });
});

describe("Edge type", () => {
  it("has kind, from, to", () => {
    expectTypeOf<Edge>().toMatchTypeOf<{ kind: "blocks" | "parent"; from: string; to: string }>();
  });
});
```

Run: FAIL (module not found).

- [ ] **Step 2: Implement `lib/linear/types.ts`**

```ts
export type IssueStateType = "backlog" | "unstarted" | "started" | "completed" | "canceled";
export type IssueState = { id: string; name: string; type: IssueStateType; color: string };

export type Issue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: 0 | 1 | 2 | 3 | 4;
  estimate: number | null;
  state: IssueState;
  team: { key: string; name: string; color: string };
  project: { id: string; name: string } | null;
  cycle: { id: string; number: number } | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  isMine: boolean;
};

export type Edge =
  | { kind: "blocks"; from: string; to: string }
  | { kind: "parent"; from: string; to: string };

export type IssueGraph = { issues: Issue[]; edges: Edge[]; viewerId: string };
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/linear/types.ts tests/linear/types.test.ts
git commit -m "feat(linear): internal Issue / Edge types"
```

---

### Task 12: Implement Linear → internal normalize layer

**Files:**
- Create: `lib/linear/normalize.ts`
- Test: `tests/linear/normalize.test.ts`
- Create: `tests/linear/fixtures/raw-issues.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/linear/fixtures/raw-issues.ts`:

```ts
export const rawIssue = {
  id: "iss_1",
  identifier: "ENG-642",
  title: "Set up Linear OAuth callback",
  url: "https://linear.app/x/issue/ENG-642",
  priority: 2,
  estimate: 3,
  state: { id: "s1", name: "Todo", type: "unstarted", color: "#aaaaaa" },
  team: { id: "t1", key: "ENG", name: "Engineering", color: "#bbbbbb" },
  project: { id: "p1", name: "Auth" },
  cycle: { id: "c1", number: 12 },
  assignee: { id: "u1", name: "Angela Felicia", avatarUrl: null },
  parent: null,
  children: { nodes: [] },
  relations: { nodes: [{ type: "blocks", relatedIssue: { id: "iss_2" } }] },
  inverseRelations: { nodes: [] },
  updatedAt: "2026-05-06T10:00:00Z",
  createdAt: "2026-05-01T10:00:00Z",
};
```

Create `tests/linear/normalize.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeIssues } from "@/lib/linear/normalize";
import { rawIssue } from "./fixtures/raw-issues";

describe("normalizeIssues", () => {
  it("flattens raw Linear issues into Issue + Edge arrays", () => {
    const { issues, edges } = normalizeIssues([rawIssue], "u1");
    expect(issues).toHaveLength(1);
    expect(issues[0].identifier).toBe("ENG-642");
    expect(issues[0].isMine).toBe(true);
    expect(edges).toEqual([{ kind: "blocks", from: "iss_1", to: "iss_2" }]);
  });

  it("emits parent edges from children.nodes", () => {
    const parentIssue = { ...rawIssue, id: "p", identifier: "ENG-100", children: { nodes: [{ id: "c" }] } };
    const { edges } = normalizeIssues([parentIssue], "u1");
    expect(edges).toContainEqual({ kind: "parent", from: "p", to: "c" });
  });

  it("collapses inverseRelations into the same blocks edges (deduped)", () => {
    const a = { ...rawIssue, id: "a", relations: { nodes: [{ type: "blocks", relatedIssue: { id: "b" } }] } };
    const b = { ...rawIssue, id: "b", relations: { nodes: [] }, inverseRelations: { nodes: [{ type: "blocks", issue: { id: "a" } }] } };
    const { edges } = normalizeIssues([a, b], "u1");
    expect(edges.filter(e => e.kind === "blocks")).toEqual([{ kind: "blocks", from: "a", to: "b" }]);
  });

  it("ignores `related` and `duplicate` relation types", () => {
    const issue = { ...rawIssue, relations: { nodes: [{ type: "related", relatedIssue: { id: "x" } }, { type: "duplicate", relatedIssue: { id: "y" } }] } };
    const { edges } = normalizeIssues([issue], "u1");
    expect(edges).toHaveLength(0);
  });

  it("normalizes priority null/undefined to 0", () => {
    const issue = { ...rawIssue, priority: null as unknown as number };
    const { issues } = normalizeIssues([issue], "u1");
    expect(issues[0].priority).toBe(0);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/linear/normalize.ts`**

```ts
import type { Issue, Edge, IssueGraph, IssueStateType } from "./types";

type RawAny = Record<string, unknown>;

function asInt(n: unknown): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}
function asPriority(n: unknown): 0 | 1 | 2 | 3 | 4 {
  const i = asInt(n);
  return ((i >= 0 && i <= 4 ? i : 0) as 0 | 1 | 2 | 3 | 4);
}
function asStateType(s: unknown): IssueStateType {
  const ok: IssueStateType[] = ["backlog", "unstarted", "started", "completed", "canceled"];
  return ok.includes(s as IssueStateType) ? (s as IssueStateType) : "backlog";
}

export function normalizeIssues(raw: RawAny[], viewerId: string): IssueGraph {
  const issues: Issue[] = raw.map((r) => {
    const state = (r.state as RawAny | undefined) ?? {};
    const team = (r.team as RawAny | undefined) ?? {};
    const project = (r.project as RawAny | undefined) ?? null;
    const cycle = (r.cycle as RawAny | undefined) ?? null;
    const assignee = (r.assignee as RawAny | undefined) ?? null;
    return {
      id: String(r.id),
      identifier: String(r.identifier ?? ""),
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      priority: asPriority(r.priority),
      estimate: typeof r.estimate === "number" ? r.estimate : null,
      state: {
        id: String(state.id ?? ""),
        name: String(state.name ?? ""),
        type: asStateType(state.type),
        color: String(state.color ?? "#888"),
      },
      team: { key: String(team.key ?? "?"), name: String(team.name ?? "Team"), color: String(team.color ?? "#888") },
      project: project ? { id: String(project.id), name: String(project.name ?? "") } : null,
      cycle: cycle ? { id: String(cycle.id), number: asInt(cycle.number) } : null,
      assignee: assignee
        ? { id: String(assignee.id), name: String(assignee.name ?? ""), avatarUrl: (assignee.avatarUrl as string) ?? null }
        : null,
      isMine: assignee ? String((assignee as RawAny).id) === viewerId : false,
    };
  });

  const edgeKey = (e: Edge) => `${e.kind}:${e.from}->${e.to}`;
  const edgeMap = new Map<string, Edge>();

  for (const r of raw) {
    const from = String(r.id);
    const children = ((r.children as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const c of children) {
      const e: Edge = { kind: "parent", from, to: String(c.id) };
      edgeMap.set(edgeKey(e), e);
    }
    const rel = ((r.relations as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const n of rel) {
      if (n.type !== "blocks") continue;
      const to = String((n.relatedIssue as RawAny | undefined)?.id ?? "");
      if (!to) continue;
      const e: Edge = { kind: "blocks", from, to };
      edgeMap.set(edgeKey(e), e);
    }
    const inv = ((r.inverseRelations as RawAny | undefined)?.nodes as RawAny[] | undefined) ?? [];
    for (const n of inv) {
      if (n.type !== "blocks") continue;
      const blocker = String((n.issue as RawAny | undefined)?.id ?? "");
      if (!blocker) continue;
      const e: Edge = { kind: "blocks", from: blocker, to: from };
      edgeMap.set(edgeKey(e), e);
    }
  }

  return { issues, edges: Array.from(edgeMap.values()), viewerId };
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/linear/normalize.ts tests/linear/
git commit -m "feat(linear): normalize raw GraphQL into Issue/Edge"
```

---

### Task 13: Build the Linear GraphQL query and SDK wrapper

**Files:**
- Create: `lib/linear/queries.ts`
- Create: `lib/linear/client.ts`

- [ ] **Step 1: Implement `lib/linear/queries.ts`**

```ts
export const ASSIGNED_ISSUES_QUERY = /* GraphQL */ `
  query AssignedIssues($first: Int!) {
    viewer {
      id
      assignedIssues(
        filter: { state: { type: { in: ["backlog", "unstarted", "started"] } } }
        first: $first
      ) {
        nodes {
          id identifier title url priority estimate
          state { id name type color }
          team { id key name color }
          project { id name }
          cycle { id number }
          assignee { id name avatarUrl }
          parent { id }
          children { nodes { id } }
          relations { nodes { type relatedIssue { id } } }
          inverseRelations { nodes { type issue { id } } }
          updatedAt createdAt
        }
      }
    }
  }
`;

export const ISSUES_BY_IDS_QUERY = /* GraphQL */ `
  query IssuesByIds($ids: [String!]!) {
    issues(filter: { id: { in: $ids } }, first: 250) {
      nodes {
        id identifier title url priority estimate
        state { id name type color }
        team { id key name color }
        project { id name }
        cycle { id number }
        assignee { id name avatarUrl }
        parent { id }
        children { nodes { id } }
        relations { nodes { type relatedIssue { id } } }
        inverseRelations { nodes { type issue { id } } }
      }
    }
  }
`;
```

- [ ] **Step 2: Implement `lib/linear/client.ts`**

```ts
import { LinearClient } from "@linear/sdk";
import { ASSIGNED_ISSUES_QUERY, ISSUES_BY_IDS_QUERY } from "./queries";
import { normalizeIssues } from "./normalize";
import type { IssueGraph } from "./types";

export async function fetchAssignedGraph(accessToken: string): Promise<IssueGraph> {
  const client = new LinearClient({ accessToken });
  const first = 250;

  const data = (await client.client.rawRequest(ASSIGNED_ISSUES_QUERY, { first })).data as {
    viewer: { id: string; assignedIssues: { nodes: Record<string, unknown>[] } };
  };
  const viewerId = data.viewer.id;
  const assigned = data.viewer.assignedIssues.nodes;

  // Close the graph: pull in any blocker issues that aren't in the assigned set.
  const knownIds = new Set(assigned.map((n) => String(n.id)));
  const extraIds = new Set<string>();
  for (const n of assigned) {
    const inv = (n.inverseRelations as { nodes?: Array<Record<string, unknown>> } | undefined)?.nodes ?? [];
    for (const r of inv) {
      if (r.type !== "blocks") continue;
      const id = String((r.issue as Record<string, unknown> | undefined)?.id ?? "");
      if (id && !knownIds.has(id)) extraIds.add(id);
    }
  }

  let extra: Record<string, unknown>[] = [];
  if (extraIds.size > 0) {
    const extraData = (await client.client.rawRequest(ISSUES_BY_IDS_QUERY, { ids: Array.from(extraIds) })).data as {
      issues: { nodes: Record<string, unknown>[] };
    };
    extra = extraData.issues.nodes;
  }

  return normalizeIssues([...assigned, ...extra], viewerId);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/linear/queries.ts lib/linear/client.ts
git commit -m "feat(linear): GraphQL queries and fetchAssignedGraph"
```

---

### Task 14: Implement `/api/issues` route

**Files:**
- Create: `app/api/issues/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import { fetchAssignedGraph } from "@/lib/linear/client";

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  try {
    const graph = await fetchAssignedGraph(session.accessToken);
    return NextResponse.json(graph, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const status = err instanceof Response ? err.status : 500;
    const message = err instanceof Error ? err.message : "Failed to fetch issues from Linear.";
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/issues/route.ts
git commit -m "feat: /api/issues route fetches and returns IssueGraph"
```

---

### Task 15: Implement `/api/me` route

**Files:**
- Create: `app/api/me/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server";
import { LinearClient } from "@linear/sdk";
import { requireSession } from "@/lib/auth/get-session";

export async function GET() {
  let session;
  try { session = await requireSession(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const linear = new LinearClient({ accessToken: session.accessToken });
  const viewer = await linear.viewer;
  return NextResponse.json({
    id: viewer.id, name: viewer.name, displayName: viewer.displayName, avatarUrl: viewer.avatarUrl ?? null,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/me/route.ts
git commit -m "feat: /api/me route"
```

---

## Phase 3 · Graph layout core (pure functions)

### Task 16: Topological "ready" detection

**Files:**
- Create: `lib/graph/topo.ts`
- Test: `tests/graph/topo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { computeReady, computeRanks, downstreamCount } from "@/lib/graph/topo";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, partial: Partial<Issue> = {}): Issue => ({
  id, identifier: id, title: id, url: "", priority: 2, estimate: null,
  state: { id: "s", name: "Todo", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true, ...partial,
});

describe("computeReady", () => {
  it("returns ids whose blockers are completed/canceled or absent", () => {
    const issues = [mk("a"), mk("b"), mk("c", { state: { id: "s", name: "Done", type: "completed", color: "#aaa" } })];
    const edges: Edge[] = [{ kind: "blocks", from: "c", to: "b" }];
    expect(computeReady(issues, edges).sort()).toEqual(["a", "b"]);
  });

  it("excludes done/canceled themselves", () => {
    const issues = [mk("a", { state: { id: "s", name: "x", type: "completed", color: "#aaa" } })];
    expect(computeReady(issues, [])).toEqual([]);
  });
});

describe("computeRanks", () => {
  it("assigns layer 0 to ready issues, +1 per dependency depth", () => {
    const issues = [mk("a"), mk("b"), mk("c")];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
    ];
    const ranks = computeRanks(issues, edges);
    expect(ranks.get("a")).toBe(0);
    expect(ranks.get("b")).toBe(1);
    expect(ranks.get("c")).toBe(2);
  });

  it("breaks cycles by demoting the lower-priority node", () => {
    const issues = [mk("a", { priority: 1 }), mk("b", { priority: 3 })];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "a" },
    ];
    const ranks = computeRanks(issues, edges);
    expect(ranks.get("a")).toBe(0);
    expect(ranks.get("b")).toBe(1);
  });
});

describe("downstreamCount", () => {
  it("counts transitive descendants reachable through blocks edges", () => {
    const issues = [mk("a"), mk("b"), mk("c"), mk("d")];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
      { kind: "blocks", from: "a", to: "d" },
    ];
    expect(downstreamCount("a", issues, edges)).toBe(3);
    expect(downstreamCount("b", issues, edges)).toBe(1);
    expect(downstreamCount("c", issues, edges)).toBe(0);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/graph/topo.ts`**

```ts
import type { Issue, Edge } from "@/lib/linear/types";

const isDone = (i: Issue) => i.state.type === "completed" || i.state.type === "canceled";

export function computeReady(issues: Issue[], edges: Edge[]): string[] {
  const issueById = new Map(issues.map((i) => [i.id, i]));
  const incoming = new Map<string, string[]>();
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    incoming.get(e.to)!.push(e.from);
  }
  return issues
    .filter((i) => !isDone(i))
    .filter((i) => {
      const blockers = incoming.get(i.id) ?? [];
      return blockers.every((bid) => {
        const b = issueById.get(bid);
        return !b || isDone(b);
      });
    })
    .map((i) => i.id);
}

export function computeRanks(issues: Issue[], edges: Edge[]): Map<string, number> {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    incoming.set(e.to, [...(incoming.get(e.to) ?? []), e.from]);
    outgoing.set(e.from, [...(outgoing.get(e.from) ?? []), e.to]);
  }

  // Cycle break: drop the edge whose target has higher priority number (lower priority).
  const priorityOf = new Map(issues.map((i) => [i.id, i.priority]));
  const blocksEdges = edges.filter((e) => e.kind === "blocks") as Extract<Edge, { kind: "blocks" }>[];
  const trimmed: Extract<Edge, { kind: "blocks" }>[] = [];
  const seen = new Set<string>();
  for (const e of blocksEdges) {
    const reverse = blocksEdges.find((x) => x.from === e.to && x.to === e.from);
    if (reverse && !seen.has(`${e.from}|${e.to}`)) {
      const keep = (priorityOf.get(e.from) ?? 4) <= (priorityOf.get(e.to) ?? 4) ? e : reverse;
      trimmed.push(keep);
      seen.add(`${e.from}|${e.to}`); seen.add(`${e.to}|${e.from}`);
    } else if (!seen.has(`${e.from}|${e.to}`)) {
      trimmed.push(e);
    }
  }

  const incoming2 = new Map<string, string[]>();
  for (const e of trimmed) incoming2.set(e.to, [...(incoming2.get(e.to) ?? []), e.from]);

  const rank = new Map<string, number>();
  const queue: string[] = issues.filter((i) => (incoming2.get(i.id)?.length ?? 0) === 0).map((i) => i.id);
  for (const id of queue) rank.set(id, 0);
  while (queue.length) {
    const id = queue.shift()!;
    const r = rank.get(id)!;
    const next = trimmed.filter((e) => e.from === id).map((e) => e.to);
    for (const n of next) {
      const candidate = r + 1;
      if (candidate > (rank.get(n) ?? -1)) rank.set(n, candidate);
      const stillBlocked = (incoming2.get(n) ?? []).some((b) => !rank.has(b));
      if (!stillBlocked && !queue.includes(n)) queue.push(n);
    }
  }
  for (const i of issues) if (!rank.has(i.id)) rank.set(i.id, 0);
  return rank;
}

export function downstreamCount(id: string, _issues: Issue[], edges: Edge[]): number {
  const out = new Map<string, string[]>();
  for (const e of edges) if (e.kind === "blocks") out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const seen = new Set<string>();
  const stack = [...(out.get(id) ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const c of out.get(n) ?? []) stack.push(c);
  }
  return seen.size;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/graph/topo.ts tests/graph/topo.test.ts
git commit -m "feat(graph): topo, ready detection, downstream count"
```

---

### Task 17: Ready scoring formula

**Files:**
- Create: `lib/graph/score.ts`
- Test: `tests/graph/score.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { scoreReady } from "@/lib/graph/score";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, p: Issue["priority"] = 2): Issue => ({
  id, identifier: id, title: id, url: "", priority: p, estimate: null,
  state: { id: "s", name: "T", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true,
});

describe("scoreReady", () => {
  it("orders by downstream-unblock count first, then priority", () => {
    const issues = [mk("a", 2), mk("b", 0), mk("c", 1)];
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "a", to: "c" },
      { kind: "blocks", from: "c", to: "b" },
    ];
    const ready = ["a", "c"];
    const ranked = scoreReady(ready, issues, edges);
    expect(ranked[0].id).toBe("a"); // unblocks 2
    expect(ranked[1].id).toBe("c"); // unblocks 1, P1 still beats anyone else with 1
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/graph/score.ts`**

```ts
import type { Issue, Edge } from "@/lib/linear/types";
import { downstreamCount } from "./topo";

export type ScoredIssue = { id: string; unblocks: number; priority: Issue["priority"]; issue: Issue };

export function scoreReady(readyIds: string[], issues: Issue[], edges: Edge[]): ScoredIssue[] {
  const byId = new Map(issues.map((i) => [i.id, i]));
  return readyIds
    .map((id) => {
      const issue = byId.get(id)!;
      return { id, unblocks: downstreamCount(id, issues, edges), priority: issue.priority, issue };
    })
    .sort((a, b) => {
      if (b.unblocks !== a.unblocks) return b.unblocks - a.unblocks;
      // P0 = 0 in Linear, so smaller wins
      return a.priority - b.priority;
    });
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/graph/score.ts tests/graph/score.test.ts
git commit -m "feat(graph): scoreReady ranks by unblock count then priority"
```

---

### Task 18: Dagre layered layout helper

**Files:**
- Create: `lib/graph/layout.ts`
- Test: `tests/graph/layout.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { layoutGraph } from "@/lib/graph/layout";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string): Issue => ({
  id, identifier: id, title: id, url: "", priority: 2, estimate: null,
  state: { id: "s", name: "T", type: "unstarted", color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine: true,
});

describe("layoutGraph", () => {
  it("returns a position for every issue", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const positions = layoutGraph(issues, edges);
    expect(positions.get("a")).toBeDefined();
    expect(positions.get("b")).toBeDefined();
  });

  it("places blocked issues below their blockers (higher y)", () => {
    const issues = [mk("a"), mk("b")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const positions = layoutGraph(issues, edges);
    expect(positions.get("b")!.y).toBeGreaterThan(positions.get("a")!.y);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/graph/layout.ts`**

```ts
import dagre from "dagre";
import type { Issue, Edge } from "@/lib/linear/types";

export type NodePosition = { x: number; y: number };
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 96;

export function layoutGraph(issues: Issue[], edges: Edge[]): Map<string, NodePosition> {
  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({ rankdir: "TB", nodesep: 36, ranksep: 60, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const i of issues) g.setNode(i.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const e of edges) {
    if (e.kind !== "blocks") continue;
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  }

  dagre.layout(g);

  const out = new Map<string, NodePosition>();
  for (const i of issues) {
    const n = g.node(i.id);
    out.set(i.id, { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 });
  }
  return out;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/graph/layout.ts tests/graph/layout.test.ts
git commit -m "feat(graph): dagre layered layout helper"
```

---

### Task 19: Filter helpers

**Files:**
- Create: `lib/graph/filter.ts`
- Test: `tests/graph/filter.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { applyFilters, type Filters, defaultFilters } from "@/lib/graph/filter";
import type { Issue, Edge } from "@/lib/linear/types";

const mk = (id: string, p: Issue["priority"] = 2, type: Issue["state"]["type"] = "unstarted", isMine = true): Issue => ({
  id, identifier: id, title: id, url: "", priority: p, estimate: null,
  state: { id: "s", name: "T", type, color: "#aaa" },
  team: { key: "X", name: "X", color: "#888" }, project: null, cycle: null, assignee: null, isMine,
});

describe("applyFilters", () => {
  it("hides done/canceled by default", () => {
    const issues = [mk("a"), mk("b", 2, "completed")];
    const out = applyFilters(issues, [], defaultFilters);
    expect(out.issues.map(i => i.id)).toEqual(["a"]);
  });

  it("respects scope=My Work by filtering to isMine plus blockers", () => {
    const issues = [mk("a", 2, "unstarted", true), mk("b", 2, "unstarted", false)];
    const edges: Edge[] = [{ kind: "blocks", from: "b", to: "a" }];
    const out = applyFilters(issues, edges, { ...defaultFilters, scope: "my-work" });
    expect(out.issues.map(i => i.id).sort()).toEqual(["a", "b"]); // b kept because it blocks a
  });

  it("keeps edges only between issues that survived", () => {
    const issues = [mk("a"), mk("b", 2, "completed")];
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    const out = applyFilters(issues, edges, { ...defaultFilters, showDone: false });
    expect(out.edges).toEqual([]);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/graph/filter.ts`**

```ts
import type { Issue, Edge } from "@/lib/linear/types";

export type Scope = "my-work" | "cycle" | "project" | "team";

export type Filters = {
  scope: Scope;
  cycleId: string | null;
  projectId: string | null;
  teamKey: string | null;
  priorities: Array<0 | 1 | 2 | 3 | 4>;
  assigneeIds: string[];
  showDone: boolean;
};

export const defaultFilters: Filters = {
  scope: "my-work",
  cycleId: null,
  projectId: null,
  teamKey: null,
  priorities: [],
  assigneeIds: [],
  showDone: false,
};

export function applyFilters(issues: Issue[], edges: Edge[], f: Filters): { issues: Issue[]; edges: Edge[] } {
  const allowedByScope = new Set(issues.filter((i) => {
    if (f.scope === "my-work") return i.isMine;
    if (f.scope === "cycle") return f.cycleId ? i.cycle?.id === f.cycleId : true;
    if (f.scope === "project") return f.projectId ? i.project?.id === f.projectId : true;
    if (f.scope === "team") return f.teamKey ? i.team.key === f.teamKey : true;
    return true;
  }).map((i) => i.id));

  // For "my-work", also include direct blockers of allowed issues so users see context.
  if (f.scope === "my-work") {
    for (const e of edges) if (e.kind === "blocks" && allowedByScope.has(e.to)) allowedByScope.add(e.from);
  }

  const kept = issues.filter((i) => {
    if (!allowedByScope.has(i.id)) return false;
    if (!f.showDone && (i.state.type === "completed" || i.state.type === "canceled")) return false;
    if (f.priorities.length && !f.priorities.includes(i.priority)) return false;
    if (f.assigneeIds.length && !(i.assignee && f.assigneeIds.includes(i.assignee.id))) return false;
    return true;
  });
  const keptIds = new Set(kept.map((i) => i.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to));
  return { issues: kept, edges: keptEdges };
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/graph/filter.ts tests/graph/filter.test.ts
git commit -m "feat(graph): client-side filter pipeline"
```

---

### Task 20: Dependency closure helper (for selection dim)

**Files:**
- Create: `lib/graph/closure.ts`
- Test: `tests/graph/closure.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { dependencyClosure } from "@/lib/graph/closure";
import type { Edge } from "@/lib/linear/types";

describe("dependencyClosure", () => {
  it("returns the node, all transitive ancestors, and all transitive descendants via blocks", () => {
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "c" },
      { kind: "blocks", from: "x", to: "a" },
    ];
    expect([...dependencyClosure("b", edges)].sort()).toEqual(["a", "b", "c", "x"]);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement `lib/graph/closure.ts`**

```ts
import type { Edge } from "@/lib/linear/types";

export function dependencyClosure(rootId: string, edges: Edge[]): Set<string> {
  const out = new Set<string>([rootId]);
  const blocks = edges.filter((e) => e.kind === "blocks");
  const downstream = (id: string) => blocks.filter((e) => e.from === id).map((e) => e.to);
  const upstream = (id: string) => blocks.filter((e) => e.to === id).map((e) => e.from);
  const stack: string[] = [rootId];
  while (stack.length) {
    const n = stack.pop()!;
    for (const next of [...downstream(n), ...upstream(n)]) {
      if (!out.has(next)) { out.add(next); stack.push(next); }
    }
  }
  return out;
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/graph/closure.ts tests/graph/closure.test.ts
git commit -m "feat(graph): dependency closure for selection dim"
```

---

### Task 21: Avatar hue hash

**Files:**
- Create: `lib/avatar.ts`
- Test: `tests/avatar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { avatarBucket } from "@/lib/avatar";

describe("avatarBucket", () => {
  it("returns 1 | 2 | 3 deterministically per id", () => {
    expect(avatarBucket("u1")).toBe(avatarBucket("u1"));
    expect([1, 2, 3]).toContain(avatarBucket("anything"));
  });
});
```

- [ ] **Step 2: Implement `lib/avatar.ts`**

```ts
export function avatarBucket(id: string): 1 | 2 | 3 {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 3) + 1) as 1 | 2 | 3;
}

export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length ? trimmed[0]!.toUpperCase() : "?";
}
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/avatar.ts tests/avatar.test.ts
git commit -m "feat: deterministic avatar hue bucket"
```

---

## Phase 4 · Client store and graph rendering

### Task 22: Zustand store

**Files:**
- Create: `lib/store.ts`
- Test: `tests/store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { useGraphStore } from "@/lib/store";

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
```

- [ ] **Step 2: Implement `lib/store.ts`**

```ts
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
```

Run: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/store.ts tests/store.test.ts
git commit -m "feat: zustand store"
```

---

### Task 23: TanStack Query provider

**Files:**
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement provider**

`app/providers.tsx`:
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Wrap in root layout**

In `app/layout.tsx`, wrap `{children}` with `<Providers>{children}</Providers>` (import added).

- [ ] **Step 3: Commit**

```bash
git add app/providers.tsx app/layout.tsx
git commit -m "feat: tanstack-query provider"
```

---

### Task 24: `IssueNode` component

**Files:**
- Create: `components/graph/IssueNode.tsx`
- Test: `tests/components/IssueNode.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IssueNode } from "@/components/graph/IssueNode";

const issue = {
  id: "i1", identifier: "ENG-642", title: "Set up Linear OAuth callback", url: "https://linear.app/x",
  priority: 1 as const, estimate: null,
  state: { id: "s", name: "Todo", type: "unstarted" as const, color: "#aaa" },
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

  it("applies the ready visual when ready=true", () => {
    const { container } = render(<IssueNode issue={issue} ready={true} dimmed={false} onClick={() => {}} />);
    expect(container.firstChild).toHaveClass("border-line-ink");
  });
});
```

- [ ] **Step 2: Implement `components/graph/IssueNode.tsx`**

```tsx
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
        "w-[220px] text-left rounded-[5px] bg-surface px-3 py-[10px]",
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
```

Run test. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/graph/IssueNode.tsx tests/components/IssueNode.test.tsx
git commit -m "feat(ui): IssueNode with ready and dimmed states"
```

---

### Task 25: `DependencyGraph` component

**Files:**
- Create: `components/graph/DependencyGraph.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useMemo } from "react";
import { ReactFlow, type Node, type Edge as RFEdge, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IssueNode } from "./IssueNode";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { layoutGraph, NODE_WIDTH, NODE_HEIGHT } from "@/lib/graph/layout";
import { dependencyClosure } from "@/lib/graph/closure";

const NODE_TYPES = {
  issue: ({ data }: { data: { issue: ReturnType<typeof issueProps>; ready: boolean; dimmed: boolean; onClick: () => void } }) => (
    <IssueNode {...data} />
  ),
};
function issueProps(_: unknown) { return _ as never; } // type helper

export function DependencyGraph() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const selection = useGraphStore((s) => s.selection);
  const setSelection = useGraphStore((s) => s.setSelection);
  const clearSelection = useGraphStore((s) => s.clearSelection);

  const view = useMemo(() => {
    if (!graph) return null;
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const ready = new Set(computeReady(filtered.issues, filtered.edges));
    const positions = layoutGraph(filtered.issues, filtered.edges);
    const closure = selection ? dependencyClosure(selection, filtered.edges) : null;

    const nodes: Node[] = filtered.issues.map((issue) => {
      const pos = positions.get(issue.id) ?? { x: 0, y: 0 };
      const dimmed = closure ? !closure.has(issue.id) : false;
      return {
        id: issue.id, type: "issue", position: pos, draggable: false, selectable: false,
        data: { issue, ready: ready.has(issue.id), dimmed, onClick: () => setSelection(issue.id) },
        width: NODE_WIDTH, height: NODE_HEIGHT,
      };
    });
    const edges: RFEdge[] = filtered.edges
      .filter((e) => e.kind === "blocks")
      .map((e) => ({ id: `${e.from}->${e.to}`, source: e.from, target: e.to, type: "step", style: { stroke: "var(--color-line-strong)", strokeWidth: 1.25 } }));

    return { nodes, edges };
  }, [graph, filters, selection, setSelection]);

  if (!view) return null;

  return (
    <div className="w-full h-full" onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}>
      <ReactFlow
        nodes={view.nodes}
        edges={view.edges}
        nodeTypes={NODE_TYPES as never}
        proOptions={{ hideAttribution: true }}
        fitView
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{ type: "step" }}
      >
        <Background gap={0} color="transparent" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 2: Smoke check (skipped if no test)**

Will be exercised in Task 28 by `/graph` page integration.

- [ ] **Step 3: Commit**

```bash
git add components/graph/DependencyGraph.tsx
git commit -m "feat(ui): DependencyGraph (React Flow + dagre)"
```

---

### Task 26: `ReadyPanel` component

**Files:**
- Create: `components/graph/ReadyPanel.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useMemo } from "react";
import { useGraphStore } from "@/lib/store";
import { applyFilters } from "@/lib/graph/filter";
import { computeReady } from "@/lib/graph/topo";
import { scoreReady } from "@/lib/graph/score";
import { avatarBucket, avatarInitial } from "@/lib/avatar";

const AV: Record<1 | 2 | 3, string> = { 1: "bg-av-1", 2: "bg-av-2", 3: "bg-av-3" };

export function ReadyPanel() {
  const graph = useGraphStore((s) => s.graph);
  const filters = useGraphStore((s) => s.filters);
  const setSelection = useGraphStore((s) => s.setSelection);

  const { ready, blocked } = useMemo(() => {
    if (!graph) return { ready: [], blocked: [] };
    const filtered = applyFilters(graph.issues, graph.edges, filters);
    const readyIds = computeReady(filtered.issues, filtered.edges);
    const ranked = scoreReady(readyIds, filtered.issues, filtered.edges);
    const readySet = new Set(readyIds);
    const blockedIssues = filtered.issues.filter((i) => !readySet.has(i.id));
    return { ready: ranked, blocked: blockedIssues };
  }, [graph, filters]);

  if (!graph) return null;

  return (
    <aside className="w-[305px] border-l border-line bg-app flex flex-col">
      <section className="px-[18px] pt-5 pb-3">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Ready to work <span className="font-mono text-muted-2">{ready.length}</span>
        </h2>
        {ready.length === 0 && <p className="text-sm text-ink-2">Nothing ready right now. Resolve any blocker to unblock work.</p>}
        {ready.map((r) => (
          <button key={r.id} onClick={() => setSelection(r.id)} className="w-full text-left py-3 border-b border-line last:border-b-0 cursor-pointer">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted">{r.issue.identifier}</span>
              <span className="text-sm font-medium text-ink leading-snug">{r.issue.title}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="font-mono text-base font-medium text-ink tracking-tight">{r.unblocks}</span>
              <span className="text-sm text-ink-2">issues unblock</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-mono text-muted">
              {r.issue.assignee && (
                <span className={`inline-flex items-center justify-center w-[14px] h-[14px] rounded-full font-mono text-[8px] font-medium text-ink ${AV[avatarBucket(r.issue.assignee.id)]}`}>
                  {avatarInitial(r.issue.assignee.name)}
                </span>
              )}
              {r.issue.assignee?.name && <span>{r.issue.assignee.name}</span>}
              <span>·</span><span>P{r.issue.priority}</span>
              <span>·</span><span>{r.issue.team.name}</span>
            </div>
          </button>
        ))}
      </section>
      <section className="px-[18px] py-[18px] border-t border-line">
        <h2 className="text-xs uppercase tracking-[0.09em] text-muted font-medium mb-4 flex items-center justify-between">
          Blocked <span className="font-mono text-muted-2">{blocked.length}</span>
        </h2>
        {blocked.map((i) => (
          <div key={i.id} className="py-3 border-b border-line last:border-b-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-muted-2">{i.identifier}</span>
              <span className="text-sm text-ink-2">{i.title}</span>
            </div>
          </div>
        ))}
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/graph/ReadyPanel.tsx
git commit -m "feat(ui): ReadyPanel with scoring and avatars"
```

---

## Phase 5 · Toolbar

### Task 27: Topbar with scope switcher and sub-picker

**Files:**
- Create: `components/toolbar/Toolbar.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useGraphStore } from "@/lib/store";
import type { Scope } from "@/lib/graph/filter";

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "my-work", label: "My Work" },
  { value: "project", label: "Project" },
  { value: "cycle", label: "Cycle" },
  { value: "team", label: "Team" },
];

export function Toolbar({ onRefresh }: { onRefresh: () => void }) {
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const graph = useGraphStore((s) => s.graph);

  const projects = graph ? Array.from(new Map(graph.issues.flatMap((i) => i.project ? [[i.project.id, i.project]] : [])).values()) : [];
  const cycles = graph ? Array.from(new Map(graph.issues.flatMap((i) => i.cycle ? [[i.cycle.id, i.cycle]] : [])).values()) : [];
  const teams = graph ? Array.from(new Map(graph.issues.map((i) => [i.team.key, i.team])).values()) : [];

  return (
    <div className="flex items-center justify-between px-[14px] border-b border-line h-[46px] text-sm">
      <div className="flex items-center gap-4">
        <span className="font-semibold tracking-tight text-sm">better-linear</span>
        <div className="flex gap-0.5">
          {SCOPES.map((s) => (
            <button key={s.value}
              onClick={() => setFilters({ scope: s.value })}
              className={`px-2.5 py-1 rounded text-sm ${filters.scope === s.value ? "bg-hover text-ink font-medium" : "text-muted hover:bg-hover hover:text-ink"}`}>
              {s.label}
            </button>
          ))}
        </div>
        {filters.scope !== "my-work" && (
          <div className="flex items-center gap-1.5 pl-3 ml-1.5 border-l border-line text-ink-2">
            <span className="text-muted">{filters.scope === "project" ? "Project" : filters.scope === "cycle" ? "Cycle" : "Team"}</span>
            <select
              className="bg-transparent rounded px-1.5 py-1 hover:bg-hover cursor-pointer text-sm"
              value={filters.scope === "project" ? filters.projectId ?? "" : filters.scope === "cycle" ? filters.cycleId ?? "" : filters.teamKey ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (filters.scope === "project") setFilters({ projectId: v || null });
                else if (filters.scope === "cycle") setFilters({ cycleId: v || null });
                else setFilters({ teamKey: v || null });
              }}
            >
              <option value="">All</option>
              {filters.scope === "project" && projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              {filters.scope === "cycle" && cycles.map((c) => <option key={c.id} value={c.id}>{`Cycle ${c.number}`}</option>)}
              {filters.scope === "team" && teams.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-muted">
        <button onClick={() => setFilters({ showDone: !filters.showDone })}
          className={`inline-flex items-center justify-center w-7 h-7 rounded ${filters.showDone ? "bg-hover text-ink" : "hover:bg-hover hover:text-ink"}`}
          title="Show done">
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" />
            <path d="M5 7 L6.5 8.5 L9 5.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>
        <button onClick={onRefresh} className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-hover hover:text-ink" title="Refresh">
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
            <path d="M11.5 5 A4.5 4.5 0 1 0 12 7" stroke="currentColor" strokeLinecap="round" />
            <path d="M11.5 2.5 V5 H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/toolbar/Toolbar.tsx
git commit -m "feat(ui): Toolbar with scope switcher, sub-picker, refresh"
```

---

## Phase 6 · Pages

### Task 28: `/graph` page wiring

**Files:**
- Create: `app/graph/page.tsx`
- Create: `components/graph/GraphView.tsx`

- [ ] **Step 1: Implement `components/graph/GraphView.tsx`** (client wrapper that fetches and hydrates the store)

```tsx
"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGraphStore } from "@/lib/store";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { DependencyGraph } from "./DependencyGraph";
import { ReadyPanel } from "./ReadyPanel";
import type { IssueGraph } from "@/lib/linear/types";

async function fetchGraph(): Promise<IssueGraph> {
  const res = await fetch("/api/issues", { cache: "no-store" });
  if (res.status === 401) { window.location.href = "/api/auth/login"; throw new Error("redirecting"); }
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export function GraphView() {
  const setGraph = useGraphStore((s) => s.setGraph);
  const { data, refetch, isLoading, isError, error, dataUpdatedAt } = useQuery({ queryKey: ["graph"], queryFn: fetchGraph });

  useEffect(() => { if (data) setGraph(data); }, [data, setGraph]);

  return (
    <div className="w-full max-w-[1180px] mx-auto my-7 rounded-[10px] overflow-hidden bg-app shadow-[0_1px_0_oklch(0.18_0.012_80/0.02),0_30px_80px_-36px_oklch(0.18_0.012_80/0.18)]">
      <Toolbar onRefresh={() => refetch()} />
      <div className="grid grid-cols-[1fr_305px] min-h-[540px]">
        <div className="relative bg-app">
          {isLoading && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">Loading…</div>}
          {isError && <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">Failed to load: {(error as Error).message}</div>}
          {data && data.issues.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <p className="text-sm text-ink">Nothing assigned to you.</p>
              <p className="text-sm text-ink-2">Switch scope or pick a project.</p>
            </div>
          )}
          {data && data.issues.length > 0 && <DependencyGraph />}
        </div>
        <ReadyPanel />
      </div>
      <Footer issues={data?.issues.length ?? 0} dataUpdatedAt={dataUpdatedAt} />
    </div>
  );
}

function Footer({ issues, dataUpdatedAt }: { issues: number; dataUpdatedAt: number }) {
  const ago = dataUpdatedAt ? Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000)) : 0;
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-line text-xs text-muted font-mono">
      <div className="flex gap-3.5">
        <span>{issues} issues</span>
        <span>updated {ago}s ago</span>
      </div>
      <span className="inline-flex items-center gap-1.5">
        <kbd className="font-mono text-xs px-1.5 rounded bg-hover text-ink-2">?</kbd>
        shortcuts
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Implement `app/graph/page.tsx`** (server component, gates the route on auth)

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import { GraphView } from "@/components/graph/GraphView";

export default async function GraphPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return <GraphView />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/graph/page.tsx components/graph/GraphView.tsx
git commit -m "feat: /graph page wires store, toolbar, graph, panel"
```

---

### Task 29: Marketing landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[520px] text-center">
        <h1 className="text-2xl font-semibold tracking-tight">better-linear</h1>
        <p className="mt-3 text-base text-ink-2 leading-relaxed">
          A graph view for your Linear issues. See what blocks what, and what to work on next.
        </p>
        <Link href="/api/auth/login"
          className="inline-block mt-6 px-4 py-2 rounded text-sm bg-ink text-paper hover:bg-ink-2 transition-colors">
          Sign in with Linear
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: marketing landing page"
```

---

## Phase 7 · Polish

### Task 30: Keyboard shortcuts (selection + scope + refresh)

**Files:**
- Create: `components/keyboard/useShortcuts.ts`
- Modify: `components/graph/GraphView.tsx`

- [ ] **Step 1: Implement `components/keyboard/useShortcuts.ts`**

```ts
"use client";
import { useEffect } from "react";
import { useGraphStore } from "@/lib/store";
import type { Scope } from "@/lib/graph/filter";

const SCOPE_BY_KEY: Record<string, Scope> = { "1": "my-work", "2": "project", "3": "cycle", "4": "team" };

export function useShortcuts({ onRefresh }: { onRefresh: () => void }) {
  const setFilters = useGraphStore((s) => s.setFilters);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.isContentEditable)) return;
      if (e.key === "Escape") clearSelection();
      else if (e.key === "r" || e.key === "R") onRefresh();
      else if (SCOPE_BY_KEY[e.key]) setFilters({ scope: SCOPE_BY_KEY[e.key] });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setFilters, clearSelection, onRefresh]);
}
```

- [ ] **Step 2: Wire in GraphView**

In `components/graph/GraphView.tsx`, import and call:
```tsx
import { useShortcuts } from "@/components/keyboard/useShortcuts";
// inside GraphView, after refetch:
useShortcuts({ onRefresh: () => refetch() });
```

- [ ] **Step 3: Commit**

```bash
git add components/keyboard/useShortcuts.ts components/graph/GraphView.tsx
git commit -m "feat: keyboard shortcuts (Esc, r, 1-4 scopes)"
```

---

### Task 31: 401-aware fetch helper and toast for 429

**Files:**
- Create: `components/system/Toaster.tsx`
- Modify: `components/graph/GraphView.tsx`

- [ ] **Step 1: Implement a tiny toast component**

```tsx
"use client";
import { useEffect, useState } from "react";

export type Toast = { id: number; message: string };

let listeners: ((t: Toast) => void)[] = [];
export function showToast(message: string) {
  listeners.forEach((l) => l({ id: Date.now(), message }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const onAdd = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 6000);
    };
    listeners.push(onAdd);
    return () => { listeners = listeners.filter((l) => l !== onAdd); };
  }, []);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="bg-surface border border-line rounded px-3 py-2 text-sm text-ink shadow">
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Use it on fetch error**

In `components/graph/GraphView.tsx`'s `fetchGraph`, change the non-401 error path to call `showToast`:
```ts
if (!res.ok) {
  const msg = res.status === 429 ? "Linear is rate-limiting us. Try again shortly." : `Failed to fetch: ${res.status}`;
  showToast(msg);
  throw new Error(msg);
}
```

Mount `<Toaster />` once at the top of `app/layout.tsx` (inside `<body>`).

- [ ] **Step 3: Commit**

```bash
git add components/system/Toaster.tsx components/graph/GraphView.tsx app/layout.tsx
git commit -m "feat: toast for 429, 401 redirects to login"
```

---

### Task 32: README + deployment notes

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with a build-ready version**

```markdown
# better-linear

A graph view of your Linear issues that ranks ready-to-work tickets by how much they unblock.

## Local dev

1. Copy env: `cp .env.example .env.local`
2. Register a Linear OAuth app (`https://linear.app/settings/api/applications/new`):
   - Redirect URI: `http://localhost:3000/api/auth/callback`
   - Scopes: `read`
3. Fill `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`, `LINEAR_REDIRECT_URI`, and `SESSION_PASSWORD` (`openssl rand -hex 32`).
4. `npm install && npm run dev` and open `http://localhost:3000`.

## Deploy (Vercel)

- Push to GitHub, import the repo at `https://vercel.com/new`.
- Set the same env vars in the Vercel dashboard. Use the Vercel-issued production URL for `LINEAR_REDIRECT_URI` and add a second OAuth app for production.
- `SESSION_PASSWORD` must be at least 32 chars and must match across deployments.

## Scripts

- `npm run dev` — Next.js dev (Turbopack)
- `npm run build` — production build
- `npm test` — Vitest
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint

## Architecture

Stateless Next.js. Auth via Linear OAuth, encrypted httpOnly cookie. Server fetches from Linear's GraphQL on each request. Client renders a layered DAG (dagre + React Flow). See `docs/superpowers/specs/2026-05-06-better-linear-design.md` and `docs/tech-design/ui-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with local-dev and deploy steps"
```

---

### Task 33: Final typecheck, lint, test sweep

- [ ] **Step 1: Run the full battery**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All must pass.

- [ ] **Step 2: Commit any auto-fixes**

```bash
git status
git add -p
git commit -m "chore: lint and type fixes from final sweep"
```

(Skip if nothing to commit.)

---

## Self-review

| Spec section | Plan task | Status |
|---|---|---|
| §2 Goals 1: sign in, render DAG | Tasks 7, 8, 18, 25 | ✓ |
| §2 Goals 2: "what next" obvious in 2s | Task 26 (ReadyPanel) | ✓ |
| §2 Goals 3: read-only, click → Linear | Note: clicks open detail; we open `issue.url` from inside ReadyPanel? **Gap**: IssueNode currently does `setSelection`, not `window.open`. Decision: clicking selects + dims; the link to Linear lives in a hover-state "open in Linear" affordance. **Add task below.** |
| §2 Goals 4: scope switcher | Task 27 | ✓ |
| §2 Goals 5: stateless on Vercel | Tasks 6, 14, 32 | ✓ |
| §6 No DB | Confirmed across data tasks | ✓ |
| §6.1 GraphQL query | Task 13 | ✓ |
| §6.2 Internal types | Task 11 | ✓ |
| §7.1 Layout (dagre TB) | Task 18 | ✓ |
| §7.2 Node visual | Task 24 | ✓ |
| §7.3 Ready panel + score | Tasks 17, 26 | ✓ |
| §8 Toolbar / filters | Tasks 19, 27 | ✓ |
| §9 Error handling | Tasks 14, 31 | ✓ |
| §10 Security | Tasks 6, 7, 8, 10 | ✓ |
| §11 Testing | Tasks 6, 11, 12, 16-22, 24 | ✓ (E2E deferred per spec) |
| §12 Deployment env | Tasks 5, 32 | ✓ |
| Empty / loading / error states | Tasks 28, 31 | ✓ |
| Cycle detection banner | **Gap** — see below |

### Gap closure tasks

---

### Task 34: "Open in Linear" affordance on hover

**Files:**
- Modify: `components/graph/IssueNode.tsx`

- [ ] **Step 1: Add a hover-revealed external link**

Inside `IssueNode`, add after the avatar block:

```tsx
<a
  href={issue.url} target="_blank" rel="noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="opacity-0 group-hover:opacity-100 ml-1 text-muted hover:text-ink transition-opacity"
  title="Open in Linear"
>↗</a>
```

Add `group` class to the root button: `className={["group", ...].join(" ")}`.

- [ ] **Step 2: Commit**

```bash
git add components/graph/IssueNode.tsx
git commit -m "feat(ui): hover-revealed open-in-Linear link"
```

---

### Task 35: Cycle detection banner

**Files:**
- Create: `lib/graph/cycle-detect.ts`
- Test: `tests/graph/cycle-detect.test.ts`
- Modify: `components/graph/GraphView.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { detectCycles } from "@/lib/graph/cycle-detect";
import type { Edge } from "@/lib/linear/types";

describe("detectCycles", () => {
  it("returns each cycle as an ordered list of node ids", () => {
    const edges: Edge[] = [
      { kind: "blocks", from: "a", to: "b" },
      { kind: "blocks", from: "b", to: "a" },
    ];
    const cycles = detectCycles(edges);
    expect(cycles).toHaveLength(1);
    expect(cycles[0].sort()).toEqual(["a", "b"]);
  });

  it("returns [] when acyclic", () => {
    const edges: Edge[] = [{ kind: "blocks", from: "a", to: "b" }];
    expect(detectCycles(edges)).toEqual([]);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Implement Tarjan's SCC for cycle detection**

```ts
import type { Edge } from "@/lib/linear/types";

export function detectCycles(edges: Edge[]): string[][] {
  const blocks = edges.filter((e) => e.kind === "blocks");
  const nodes = Array.from(new Set(blocks.flatMap((e) => [e.from, e.to])));
  const adj = new Map<string, string[]>();
  for (const e of blocks) adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);

  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const sccs: string[][] = [];

  const strong = (v: string) => {
    idx.set(v, index); low.set(v, index); index++;
    stack.push(v); onStack.add(v);
    for (const w of adj.get(v) ?? []) {
      if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v)!, low.get(w)!)); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v)!, idx.get(w)!));
    }
    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do { w = stack.pop()!; onStack.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  };
  for (const v of nodes) if (!idx.has(v)) strong(v);
  return sccs;
}
```

Run: PASS.

- [ ] **Step 3: Surface in GraphView**

In `components/graph/GraphView.tsx`, after `data` arrives, compute `detectCycles(data.edges)`. If non-empty, render a banner above the toolbar:

```tsx
{cycles.length > 0 && (
  <div className="px-4 py-2 bg-hover border-b border-line text-xs text-ink-2">
    Detected {cycles.length} dependency cycle{cycles.length === 1 ? "" : "s"}: {cycles[0].slice(0, 3).join(" ↔ ")}{cycles[0].length > 3 ? "…" : ""}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add lib/graph/cycle-detect.ts tests/graph/cycle-detect.test.ts components/graph/GraphView.tsx
git commit -m "feat(graph): cycle detection banner"
```

---

## Done. Plan complete.

When all tasks are done, the app:
1. Signs in via Linear OAuth.
2. Pulls assigned issues + immediate blockers.
3. Renders a top-down DAG with status circles, assignee avatars, and Ready border-tint.
4. Ranks Ready issues by `unblocks` count, descending.
5. Click-to-dim selection, ESC to clear.
6. Filter by scope (My Work / Project / Cycle / Team).
7. Refresh re-fetches.
8. Toasts on 429, redirects on 401, banner on cycle.
9. Deploys to Vercel as a stateless Next.js app.
