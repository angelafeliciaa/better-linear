# better-linear

A graph view of your Linear issues that ranks ready-to-work tickets by how much they unblock.

## Local dev

1. Copy env: `cp .env.example .env.local`
2. Set `SESSION_PASSWORD` (generate with `openssl rand -hex 32`).
3. `npm install && npm run dev` and open http://localhost:3000.
4. Click **Connect with Linear**. Paste a personal API key from https://linear.app/settings/api &rsaquo; **Personal API keys** &rsaquo; **New key** (read scope is enough). Anyone in any workspace can mint one — no admin needed.

The key is encrypted with `iron-session` and stored only in an httpOnly cookie on your device. We never persist it.

## Deploy (Vercel)

- Push to GitHub, import the repo at https://vercel.com/new.
- Set `SESSION_PASSWORD` (32+ chars) and `NEXT_PUBLIC_APP_URL` in the Vercel dashboard.
- Each visitor brings their own Linear personal API key, pasted at `/settings`. No shared OAuth app, no admin gate.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Next.js dev (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Architecture

Stateless Next.js. Auth via Linear OAuth, encrypted httpOnly cookie. Server fetches from Linear's GraphQL on each request. Client renders a layered DAG (dagre + React Flow). See `docs/superpowers/specs/2026-05-06-better-linear-design.md` and `docs/tech-design/ui-design.md`.
