# CLAUDE.md - better-linear

Graph-based dependency view for Linear issues. Read-only Next.js app deployed on Vercel: signs in with Linear OAuth, pulls assigned issues via GraphQL, renders an interactive layered DAG of `blocks` / `blocked-by` + parent relations. Headlines a "Ready to Work" panel scored by downstream unblocked count — the primitive Linear is missing.

Read the relevant rule file **before** starting any task:

| Task | Rule file |
|---|---|
| Frontend: components, hooks, styles, JSX, accessibility | `.claude/rules/frontend.md` |
| Git: commits, branches, PRs, pushing | `.claude/rules/git.md` |
| Tech designs, feature planning, design docs | `.claude/rules/tech-designs.md` |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run Vitest |

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **React 19**
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** with CSS-first configuration
- **shadcn/ui** for primitive components
- **React Flow** + **dagre** for the dependency graph layout
- **Zustand** for client state, **TanStack Query** for fetching
- **@linear/sdk** for Linear's GraphQL API
- **iron-session** for encrypted httpOnly session cookies
- **Vitest** for unit/component tests, **zod** for boundary validation

## Project Context

- **Hosting:** Vercel (stateless functions, no application database in v1)
- **Auth:** Linear OAuth 2.0, scope `read`. Access token stored only in encrypted httpOnly cookie — never sent to the browser.
- **Data flow:** Server route → Linear GraphQL → normalize → JSON → client. Refresh button re-fetches. No webhooks, no DB cache (v1.1 if perf demands).
- **Scope:** v1 is read-only. Click an issue → opens it in Linear in a new tab. Write features (status change, drag-edge to add blocker) are v1.1.

Full design spec: `docs/superpowers/specs/2026-05-06-better-linear-design.md`.

## Architecture Notes

- **Stateless server.** Every request reads the session cookie, calls Linear, returns JSON. No persistence layer.
- **Client owns the graph state.** Zustand holds `{ issues, edges, scope, filters, selection }`. TanStack Query owns server cache + refetch.
- **Layout in a Web Worker** when `nodes.length > 200` to avoid main-thread jank.
- **Topological sort drives the killer feature.** "Ready to Work" = zero unresolved blockers, ranked by `downstream_unblocked_count * 10 + (5 - priority)`.

## Repository Layout

```
app/                          Next.js App Router
├── (marketing)/page.tsx      landing page
├── graph/page.tsx            main app
├── api/auth/[...]/route.ts   Linear OAuth login/callback/logout
├── api/issues/route.ts       GraphQL → JSON
└── api/me/route.ts           viewer info

components/
├── graph/                    DependencyGraph, IssueNode, ReadyPanel
├── toolbar/                  ScopeSwitcher, FilterChips
└── ui/                       shadcn primitives

lib/
├── linear/                   client, queries, normalize
├── graph/                    layout, topo, filter
├── auth/                     session (iron-session), oauth
└── store.ts                  Zustand

docs/superpowers/specs/       design specs
```

## Code Style

- Use `@/*` path alias for imports (maps to `./src/*` or `./` depending on layout)
- Components use PascalCase, hooks use camelCase with `use` prefix
- TypeScript strict mode — no `any`
- Functional components with hooks only
- All API boundaries validated with `zod`
- Server code never imports from `components/` or browser-only modules

## Environment Variables

Create `.env.local` from `.env.example`:

```env
LINEAR_CLIENT_ID=<from linear oauth app>
LINEAR_CLIENT_SECRET=<from linear oauth app>
LINEAR_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_PASSWORD=<32+ byte random secret>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Hard Rules

- Do not use `yarn`. npm only.
- When gathering information from the user, ask **one question at a time**.
- When in doubt, ask before acting.
- Never log, return, or expose the Linear access token to the client.
- Never persist user issue data — v1 is fully ephemeral.
