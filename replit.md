# Visagram

A visa explorer website where travelers discover visa requirements, read community reviews, ask questions, and track their travel map — all in one place.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: Replit Auth (OIDC + PKCE), `@workspace/replit-auth-web` hook

## Where things live

- `lib/db/src/schema.ts` — DB schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for codegen)
- `lib/api-client-react/src/generated/` — Orval-generated hooks + Zod schemas
- `artifacts/visa-explorer/src/` — React + Vite frontend
- `artifacts/api-server/src/` — Express 5 API server
- `artifacts/visa-explorer/src/index.css` — Midnight Rose theme (CSS variables)

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validators. Never write fetch calls by hand.
- **`FeedItemData` is `{ [key: string]: unknown }`**: The community feed's `data` field is generic. Always use `typeof item.data.field === "type"` narrowing before rendering, never cast directly.
- **`useAuth()` needs no Provider**: `@workspace/replit-auth-web` uses SWR internally — call the hook anywhere, no Context needed.
- **`export type *` breaks barrel re-exports**: The `lib/api-zod` barrel must use explicit named re-exports for types; `export type *` creates duplicate identifier conflicts when multiple generated files export the same type name.
- **API paths not rewritten by proxy**: Services handle their full base path (e.g. `/api/...`). Never add Vite proxy configs to reach the API.

## Product

- **Explore** — browse 190+ countries with visa requirements per passport
- **Passport Power** — compare how powerful different passports are (visa-free access score)
- **Country pages** — detailed visa rules, community reviews with star ratings, Q&A, travel map quick-add
- **Community feed** — global stream of reviews and questions from all travelers
- **Profile / Travel Map** — mark countries visited or want-to-visit, view your travel stats
- **Auth** — Replit Auth OIDC login, sign-in gating for write actions

## User preferences

_Populate as you build._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before editing frontend code
- Run `pnpm --filter @workspace/db run push` after any schema change in `lib/db/src/schema.ts`
- `pnpm run typecheck` runs libs first (`tsc --build`) then leaf packages — trust this over LSP if they disagree
- Do NOT run `pnpm run dev` at the workspace root — use `restart_workflow` or the preview pane

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `replit-auth` skill for auth route patterns and session middleware setup
