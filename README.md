# better-linear

A graph view of your Linear issues that ranks ready-to-work tickets by how much they unblock.

## Local dev

1. Copy env: `cp .env.example .env.local`
2. Register a Linear OAuth app at https://linear.app/settings/api/applications/new:
   - Redirect URI: `http://localhost:3000/api/auth/callback`
   - Scopes: `read`
3. Fill `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`, `LINEAR_REDIRECT_URI`, and `SESSION_PASSWORD` (generate with `openssl rand -hex 32`).
4. `npm install && npm run dev` and open http://localhost:3000.

## Deploy (Vercel)

- Push to GitHub, import the repo at https://vercel.com/new.
- Set the same env vars in the Vercel dashboard. Use the Vercel-issued production URL for `LINEAR_REDIRECT_URI` and create a separate OAuth app for production.
- `SESSION_PASSWORD` must be at least 32 chars and match across deployments.

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
