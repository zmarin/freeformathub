# Repository Guidelines

## Project Structure & Module Organization
- Build Astro routes under `src/pages/` using kebab-case filenames for pages and API endpoints (e.g., `sitemap.xml.ts`).
- Author React UI in `src/components/` with PascalCase `.tsx` modules; co-locate related stories or hooks when useful.
- Keep shared logic in `src/lib/` and reusable tools in `src/tools/`, exporting each tool as a `CONST_TOOL` plus pure helpers.
- Mirror features in `src/test/` with Vitest specs named `*.test.ts`; serve static assets from `public/` and deployment scripts from `deployment/`.

## Build, Test, and Development Commands
- `npm run dev` — starts the Astro dev server with hot reload.
- `npm run build` — compiles the production bundle into `dist/`; must be green before PRs ship.
- `npm run preview` — serves the built output to validate routing and environment flags.
- `npm test` — watch mode; `npm run test:run` — CI-style; `npm run test:ui` — dashboard.

## Coding Style & Naming Conventions
- Use TypeScript, Astro, and React with 2-space indentation, semicolons, and single quotes.
- Prefer PascalCase for components, camelCase for utilities, and kebab-case for routes; suffix tools with `-formatter`, `-parser`, etc.
- Run Prettier and ESLint before commits. Keep imports relative within a feature; elevate cross-cutting helpers into `src/lib/`.

## Testing Guidelines
- Vitest with Testing Library (`jsdom`). Favor accessible queries and behavioral assertions.
- Cover edge cases, error branches, and Astro/React integration points.
- Ensure new logic has at least one regression test. Use `npm run test:run` for CI parity; snapshot only deterministic UI.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) and scope messages to a single concern.
- PRs include a concise summary, linked issues, screenshots for UI changes, and verification steps (`npm run build`, `npm test`).
- Keep branches rebased on `main`, respond quickly to review feedback, and update docs when behavior or APIs shift.

## Security & Configuration Tips
- Never commit secrets; prefer environment variables managed outside the repo.
- Test with `NODE_ENV=production` via `npm run preview` and honor `DEPLOY_TARGET=github-pages` in `astro.config.mjs`.
- Monitor dependency updates and audit results; document new configuration flags in `README.md` or this file.

