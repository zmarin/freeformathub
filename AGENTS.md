# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/`: Astro routes (kebab-case); entry pages like `index.astro` and API routes like `sitemap.xml.ts`.
- `src/components/`: UI components (React `.tsx`, PascalCase filenames).
- `src/tools/`: Tool implementations grouped by domain (e.g., `formatters/json-formatter.ts`, `encoders/base64-image-encoder.ts`) exporting a `Tool` config plus functions.
- `src/lib/`: Shared registries and helpers (e.g., `lib/tools/registry.ts`).
- `src/test/`: Vitest specs (`*.test.ts`) and setup (`test/setup.ts`).
- `public/`: Static assets. `dist/`: Build output (generated). `.astro/`: Astro internals (generated).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with hot reload.
- `npm run build`: Production build to `dist/`.
- `npm run preview`: Preview the production build locally.
- `npm test` / `npm run test:run`: Run Vitest in watch/CI mode.
- `npm run test:ui`: Open Vitest UI.
- `npm run astro`: Access the Astro CLI directly.

## Coding Style & Naming Conventions
- TypeScript + Astro + React (Node >= 20). JSX via `react-jsx`.
- Formatting: Prettier; Linting: ESLint. Use 2-space indentation, semicolons, single quotes in TS when possible.
- Filenames: PascalCase for React components (`MyWidget.tsx`), kebab-case for pages/routes (`json-formatter.astro`), camelCase for utilities.
- Expose tools as `CONST_TOOL` and keep pure functions (e.g., `formatJson`, `processImageToBase64`).

## Testing Guidelines
- Framework: Vitest (`jsdom`) with Testing Library for React components.
- Location: `src/test/*.test.ts` (mirror tool/component names, e.g., `json-formatter.test.ts`).
- Commands: `npm test` locally; `npm run test:run` in CI.
- Aim for meaningful unit coverage on new/changed logic; include edge cases and error paths.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- PRs: Clear description, link related issues, include screenshots for UI changes, and steps to verify.
- Before opening: run `npm run build` and `npm test`; update docs when behavior changes.

## Security & Configuration Tips
- Do not commit secrets. Client-only processing; keep large payloads out of the repo.
- Deployment: `astro.config.mjs` uses `NODE_ENV` for `site` and `DEPLOY_TARGET=github-pages` for `base`—test both `dev` and `preview` locally.
