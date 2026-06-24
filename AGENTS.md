# Athenaeum — project notes

## Build & dev commands
- `bun run dev` — start dev server
- `bun run build` — production build (must pass before committing)
- `bun run lint` — ESLint
- `bun run format` — Prettier

## Key conventions
- All routes live in `src/routes/`. File-based routing via TanStack Router.
- Shared UI components: `src/components/ui/` (shadcn/ui primitives).
- App-level components: `src/components/` (e.g. `page-shell`, `data-pagination`).
- Mock data: `src/lib/mock-data.ts` — single source of truth for all in-memory data.
- Report engine: `src/lib/report-engine.ts` — pure-TS compute layer, no UI deps.
- Auth context: `src/lib/auth.tsx`. Theme context: `src/lib/theme.tsx`.
- Always run `bun run build` after changes to verify no TypeScript or bundler errors.
- Do not rewrite published (pushed) git history.
