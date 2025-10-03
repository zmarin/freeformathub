# Repository Guidelines

## Project Structure & Module Organization
Source lives under `src/`, with Astro routes in `src/pages/` (kebab-case filenames such as `sitemap.xml.ts`) and React components in `src/components/` using PascalCase `.tsx`. Shared logic belongs in `src/lib/`, while reusable utilities go in `src/tools/` and export a `CONST_TOOL` plus helper functions. Co-locate Vitest specs in `src/test/` with `*.test.ts` names, keep static assets in `public/`, and place deployment scripts under `deployment/`.

## Build, Test, and Development Commands
Run `npm run dev` for a hot-reloading Astro dev server. Use `npm run build` to create the production bundle in `dist/` and verify it before shipping a PR. Validate the built output with `npm run preview`, and exercise the test suite via `npm test` (watch), `npm run test:run` (CI parity), or `npm run test:ui` (dashboard).

## Coding Style & Naming Conventions
Write TypeScript, Astro, and React with 2-space indentation, semicolons, and single quotes. Components stay PascalCase, utilities use camelCase, and routes plus API handlers follow kebab-case. Run Prettier and ESLint prior to commits, prefer relative imports within a feature, and lift shared helpers into `src/lib/`.

## Testing Guidelines
Tests rely on Vitest with Testing Library (`jsdom`). Cover behavioral paths, error handling, and integration across Astro and React boundaries; every new logic branch needs regression coverage. Use accessible queries, avoid brittle snapshots, and run `npm run test:run` before requesting review.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`) with scope-limited changes. Pull requests should summarize intent, link relevant issues, attach UI screenshots when visuals change, and list verification steps such as `npm run build` and `npm run test:run`. Keep branches rebased on `main`, respond quickly to feedback, and update docs when APIs or config flags shift.

## Security & Configuration Tips
Do not commit secrets; rely on external environment configuration. Test production parity by running `NODE_ENV=production npm run preview`, and honor `DEPLOY_TARGET=github-pages` in `astro.config.mjs` when targeting GitHub Pages. Monitor dependency updates and record new configuration switches in `README.md` or `AGENTS.md`.
