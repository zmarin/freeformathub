# Repository Guidelines

## Project Structure & Module Organization
- Build Astro routes under `src/pages/` using kebab-case filenames for both pages and API endpoints (e.g. `sitemap.xml.ts`).
- Author React UI in `src/components/` with PascalCase `.tsx` modules; co-locate related stories or hooks when useful.
- Keep shared logic in `src/lib/` and reusable tools in `src/tools/`, exporting each tool as a `CONST_TOOL` plus pure helpers.
- Mirror features in `src/test/` with Vitest specs named `*.test.ts`; serve static assets from `public/` and deployment scripts from `deployment/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Astro dev server with hot reload for local work.
- `npm run build` compiles the production bundle into `dist/` and should stay green before PRs ship.
- `npm run preview` serves the built output to validate production routing and environment flags.
- `npm test`, `npm run test:run`, and `npm run test:ui` cover watch, CI, and dashboard flows respectively.

## Coding Style & Naming Conventions
- Use TypeScript, Astro, and React with 2-space indentation, semicolons, and single quotes; run Prettier and ESLint before commits.
- Prefer PascalCase for components, camelCase for utilities, kebab-case for routes, and suffix tools with `-formatter`, `-parser`, etc. inside domain folders.
- Keep imports relative within a feature and elevate cross-cutting helpers into `src/lib/`.

## Testing Guidelines
- Write Vitest suites with Testing Library (`jsdom`); focus on accessible queries and behavioral assertions.
- Cover edge cases, error branches, and Astro/React integration points; ensure new logic has at least one regression test.
- Use `npm run test:run` locally for CI parity, and snapshot only deterministic UI states.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) and scope messages to a single concern.
- Open PRs with concise summaries, linked issues, screenshots for UI changes, and verification steps (`npm run build`, `npm test`).
- Keep branches rebased on main, respond quickly to review feedback, and update docs when behavior or APIs shift.

## Security & Configuration Tips
- Never commit secrets; prefer environment variables managed outside the repo.
- Test with `NODE_ENV=production` via `npm run preview` and honor `DEPLOY_TARGET=github-pages` in `astro.config.mjs`.
- Monitor dependency updates and audit results; document any new configuration flags in `README.md` or `AGENTS.md`.
