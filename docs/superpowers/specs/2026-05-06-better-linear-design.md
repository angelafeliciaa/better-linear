# better-linear — Design Spec

**Date:** 2026-05-06
**Status:** Draft for review
**Owner:** angelafeliciaa

## 1. Problem

Linear's "My Issues" view is a flat, dense list. To figure out *what to work on next*, the user has to open every issue individually and read its blockers / blocked-by. Linear has no graph view, no topological ordering, and no "ready to work" primitive (research: `.research/linear-features.md`). For users with 20+ assigned issues across multiple projects, sequencing decisions become guesswork.

## 2. Goals (v1)

1. Sign in with Linear, see your issues as an interactive **dependency graph**.
2. Make the answer to *"what should I work on next?"* visually obvious in under 2 seconds.
3. Read-only — every issue card click opens the original issue in Linear (new tab).
4. Multiple scopes — My Work (default), Active Cycle, Project, Team — switchable from the toolbar.
5. Deployable on Vercel as a stateless Next.js app.

## 3. Non-Goals (v1)

- Editing issues, statuses, comments, or relations from inside better-linear.
- Custom fields, triage queue, initiatives, SLAs, or any non-issue Linear surface.
- Persisting Linear data in our own database (we live-query, see §6).
- Real-time updates / webhooks — refresh button is enough.
- Mobile-optimized layout.
- Multi-workspace switcher (one workspace per session is fine).

## 4. User Flow

1. User visits `better-linear.vercel.app`. Sees a marketing-light landing page with a "Sign in with Linear" button.
2. OAuth 2.0 redirect to `linear.app/oauth/authorize` with scope `read`.
3. Linear redirects back to `/api/auth/callback` with a code; we exchange it for a token, set an httpOnly cookie, redirect to `/graph`.
4. `/graph` fetches the user's issues via Linear's GraphQL API (server-side), sends the dataset to the client, renders the DAG.
5. Toolbar lets the user switch scope (My Work / Cycle / Project / Team), filter (status, priority, assignee, team), and refresh.
6. Clicking an issue node opens the original Linear URL in a new tab.

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (Next.js client)                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /graph page                                              │  │
│  │   ├─ <Toolbar/>           scope + filter UI               │  │
│  │   ├─ <ReadyPanel/>        ranked list of unblocked issues │  │
│  │   ├─ <DependencyGraph/>   React Flow canvas               │  │
│  │   └─ <IssueDetail/>       hover/click side panel (read)   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Zustand store: { issues, edges, scope, filters, selection }    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ fetch /api/issues?scope=...
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Next.js server (Vercel functions)                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/auth/login      → redirect to Linear OAuth          │  │
│  │  /api/auth/callback   → exchange code, set cookie         │  │
│  │  /api/auth/logout     → clear cookie                      │  │
│  │  /api/issues          → GraphQL → normalize → return JSON │  │
│  │  /api/me              → viewer + teams + projects          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Token: httpOnly + Secure cookie, encrypted with iron-session    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ GraphQL (Bearer token)
                             ▼
                   ┌──────────────────────┐
                   │  Linear GraphQL API  │
                   └──────────────────────┘
```

**Stack:**
- **Framework:** Next.js 15 (App Router) on Vercel
- **Language:** TypeScript (strict)
- **UI:** Tailwind CSS, shadcn/ui for primitives
- **Graph:** React Flow + dagre (layered DAG layout)
- **State:** Zustand for client store, TanStack Query for fetch/cache
- **Linear client:** `@linear/sdk` (official GraphQL SDK)
- **Auth:** Linear OAuth 2.0, sessions via `iron-session` (encrypted httpOnly cookie)
- **Validation:** zod for API boundaries

## 6. Data Layer

**No application database in v1.** Vercel functions are stateless. Per request:

1. Read encrypted session cookie → get user's Linear access token.
2. Call Linear GraphQL with one batched query (see §6.1).
3. Normalize response into our internal shape.
4. Return JSON to the client.
5. Client caches in TanStack Query (memory) + sessionStorage; manual refresh re-fetches.

If a workspace ever exceeds Linear's response size or rate limits, v1.1 adds a Postgres cache (Vercel Postgres) populated via webhook + periodic sync. Out of scope for v1.

### 6.1 The query

One GraphQL query per scope, paginated only if `>250` issues:

```graphql
query MyIssues {
  viewer {
    id
    assignedIssues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 250) {
      nodes {
        id identifier title url priority estimate
        state { id name type color }
        team { id key name }
        project { id name }
        cycle { id name number }
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
```

Then a second query for any *blocker* issues that aren't in the user's assigned set (so the graph is closed under "blocked-by"). One hop only.

### 6.2 Internal types

```ts
type Issue = {
  id: string;
  identifier: string;       // "ENG-123"
  title: string;
  url: string;              // linear.app/...
  priority: 0|1|2|3|4;
  estimate: number | null;
  state: { name: string; type: 'backlog'|'unstarted'|'started'|'completed'|'canceled'; color: string };
  team: { key: string; name: string };
  project: { id: string; name: string } | null;
  cycle: { id: string; number: number } | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  isMine: boolean;          // assigned to viewer
};

type Edge =
  | { kind: 'blocks';   from: string; to: string }   // from blocks to
  | { kind: 'parent';   from: string; to: string };  // from is parent of to
```

## 7. Graph Component

### 7.1 Layout

- Library: **React Flow** (pan/zoom/minimap/edge-routing built-in)
- Layout: **dagre** with `rankdir=TB` (top-to-bottom = topological order). Recompute on every dataset change. Layout runs in a Web Worker if `nodes.length > 200` to avoid jank.
- Sub-issue (parent → child) edges rendered dashed grey; blocks edges rendered solid with arrowhead.

### 7.2 Node visual

```
┌────────────────────────────────┐
│ ENG-123     P1  • In Progress  │  ← identifier, priority dot, state pill
│ Implement OAuth callback       │  ← title (1 line, ellipsis)
│ @angela  •  Auth Project       │  ← assignee + project chip
└────────────────────────────────┘
   (green ring if "ready to work")
```

- Color of left border = team color (Linear convention).
- Priority dot: P0 red, P1 orange, P2 yellow, P3 grey, P4 none.
- "Ready" ring: green 2px outline if `unresolved_blockers === 0` AND state is `backlog` or `unstarted`.
- Done/canceled issues hidden by default (toolbar toggle to show).

### 7.3 "Ready" panel (the differentiator)

A right-side collapsible panel listing all "ready to work" issues, sorted by:

```
score = (count of downstream issues this unblocks if completed) * 10
      + (5 - priority)   // P0 = 5, P4 = 1
      + (recency tiebreak)
```

Top of the list = "doing this unlocks the most work." Clicking a row pans/zooms the graph to that node.

## 8. Toolbar & Filters

- **Scope switcher** (segmented control): `My Work` | `Cycle` | `Project` | `Team`
- **Sub-pickers** appear conditionally:
  - Cycle → cycle dropdown (current cycle pre-selected)
  - Project → project dropdown
  - Team → team dropdown
- **Filters** (chip row): status (multi), priority (multi), assignee (multi). All client-side on loaded set.
- **Display**: show/hide done, show/hide sub-issue edges, density (compact/comfortable).
- **Refresh** button → re-runs the GraphQL query.

## 9. Error Handling

| Scenario | Behavior |
|----------|----------|
| Token expired / revoked | 401 from Linear → API route returns 401 → client redirects to `/api/auth/login` |
| Linear rate limit (429) | Show toast "Linear's rate-limited us — retry in N seconds." Disable refresh button until retry-after. |
| GraphQL partial errors | Log server-side, surface a toast with first error message, render whatever data did come back |
| Empty result (zero assigned issues) | Empty state: "Nothing assigned to you. Pick a different scope or go enjoy the day." |
| Cycle in graph (A blocks B blocks A — Linear shouldn't allow but…) | Detect, break the lower-priority edge, surface a banner "Detected a dependency cycle: ENG-1 ↔ ENG-2" |
| Layout perf (>500 nodes) | Show a "filter to narrow this down" hint; layout still runs in worker |

## 10. Security

- Linear access token never sent to the browser. Stored only in encrypted session cookie (`iron-session`, 32-byte secret in `SESSION_PASSWORD` env).
- OAuth `state` parameter validated on callback (CSRF).
- All API routes check session before issuing GraphQL calls.
- No CORS — same-origin only.
- No analytics that capture issue content. (Vercel Analytics for page-level only is OK.)

## 11. Testing

- **Unit:** `lib/graph/topo.ts` (topo sort, ready detection, score), `lib/linear/normalize.ts` (GraphQL → internal types). Vitest.
- **Component:** `<DependencyGraph/>` smoke test with React Testing Library — renders nodes, no crash on cycle.
- **E2E (later):** Playwright against a fake Linear server. Out of scope for v1; v1.1.
- **Type safety:** `tsc --noEmit` in CI. Strict mode on.

## 12. Deployment

- **Hosting:** Vercel (zero-config Next.js)
- **Domain:** `better-linear.vercel.app` for v1, custom domain later
- **Env vars (Vercel project settings):**
  - `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET` (from Linear OAuth app)
  - `LINEAR_REDIRECT_URI` = `https://better-linear.vercel.app/api/auth/callback`
  - `SESSION_PASSWORD` (32-byte random)
  - `NEXT_PUBLIC_APP_URL`
- **CI:** GitHub Actions — `tsc`, `vitest`, `eslint` on every PR. Vercel deploys on push to `main`.

## 13. Repository Layout

```
better-linear/
├── app/                              Next.js App Router
│   ├── (marketing)/page.tsx          landing
│   ├── graph/page.tsx                main app
│   ├── api/
│   │   ├── auth/[...].ts             login, callback, logout
│   │   ├── issues/route.ts           GraphQL → JSON
│   │   └── me/route.ts               viewer info
│   └── layout.tsx
├── components/
│   ├── graph/
│   │   ├── DependencyGraph.tsx
│   │   ├── IssueNode.tsx
│   │   └── ReadyPanel.tsx
│   ├── toolbar/
│   │   ├── ScopeSwitcher.tsx
│   │   └── FilterChips.tsx
│   └── ui/                           shadcn primitives
├── lib/
│   ├── linear/
│   │   ├── client.ts                 SDK wrapper
│   │   ├── queries.ts                GraphQL strings
│   │   └── normalize.ts              raw → Issue/Edge
│   ├── graph/
│   │   ├── layout.ts                 dagre wrapper
│   │   ├── topo.ts                   ready detection, scoring
│   │   └── filter.ts                 client-side filter logic
│   ├── auth/
│   │   ├── session.ts                iron-session config
│   │   └── oauth.ts                  Linear OAuth helpers
│   └── store.ts                      Zustand
├── docs/superpowers/specs/           (this file)
├── .research/                        Linear feature research
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 14. Milestones (rough)

- **M0 — Skeleton (day 1):** Next.js scaffold, Tailwind, shadcn, push to GitHub, deploy to Vercel.
- **M1 — Auth (day 2):** Linear OAuth, session cookie, `/api/me`, redirect-to-graph.
- **M2 — Data (day 3):** `/api/issues`, normalize, Zustand store, raw JSON dump on `/graph`.
- **M3 — Graph (day 4-5):** React Flow + dagre, node component, basic interactions.
- **M4 — Ready feature (day 6):** topo, scoring, ready panel, green ring.
- **M5 — Toolbar (day 7):** scope switcher, filters.
- **M6 — Polish (day 8):** error states, empty state, refresh, density toggle, cycle detection banner.

(Calendar days assume focused work; not a commitment.)

## 15. Open Questions / Future Work (v1.1+)

- Persisted DB cache + webhook sync for large workspaces.
- Write features: drag-edge to add `blocks`, click-to-change-status.
- Saved custom views (named filter/scope combos).
- Workspace-wide graph (not just per-user).
- Critical path highlighting (longest dependency chain to a milestone).
- Mobile layout.
