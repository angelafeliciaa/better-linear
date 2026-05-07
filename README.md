# better-linear

A graph-based dependency view for Linear issues. Sign in with Linear, see your work as an interactive top-down DAG of `blocks` / `blocked-by` relationships, and let a "Ready to Work" panel rank issues by **how many other issues completing each one would unblock**.

The primitive Linear is missing.

## Status

In design. v1 spec lives at [`docs/superpowers/specs/2026-05-06-better-linear-design.md`](docs/superpowers/specs/2026-05-06-better-linear-design.md).

## Stack (v1)

- Next.js 15 (App Router) on Vercel — stateless functions, no DB
- TypeScript strict, Tailwind CSS, shadcn/ui
- React Flow + dagre for the layered DAG
- Zustand + TanStack Query
- `@linear/sdk` for Linear's GraphQL API
- `iron-session` for encrypted httpOnly session cookies

## Getting started

```bash
cp .env.example .env.local
# fill in LINEAR_CLIENT_ID / LINEAR_CLIENT_SECRET / SESSION_PASSWORD
npm install
npm run dev
```

Then open http://localhost:3000.

## License

MIT (pending).
