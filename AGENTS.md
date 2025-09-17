# Repository Guidelines

## Project Structure & Module Organization
- Place Astro routes in `src/pages/` (kebab-case filenames) for both page entries and API routes such as `sitemap.xml.ts`.
- Build UI components in `src/components/` using React `.tsx` and PascalCase filenames; keep shared helpers in `src/lib/`.
- Implement reusable tools in `src/tools/`, grouping by domain (e.g., `formatters/json-formatter.ts`) and exporting a `Tool` config alongside pure helpers.
- Store Vitest specs in `src/test/`, mirroring the feature under test, and keep static assets in `public/`.

## Build, Test, and Development Commands
- `npm run dev` — start the Astro dev server with hot reload.
- `npm run build` — produce the optimized bundle in `dist/` for deployment.
- `npm run preview` — serve the production build locally to validate deployment behavior.
- `npm test` / `npm run test:run` — execute Vitest in watch or CI mode; use `npm run test:ui` for the testing dashboard.

## Coding Style & Naming Conventions
- Write TypeScript, Astro, and React with 2-space indentation, semicolons, and single quotes where possible.
- Use Prettier for formatting and ESLint for linting before submitting changes.
- Prefer PascalCase for React components, kebab-case for routes, camelCase for utilities, and export tools as `CONST_TOOL` constants.

## Testing Guidelines
- Use Vitest with Testing Library (`jsdom` environment) for unit and component coverage.
- Name tests `*.test.ts` under `src/test/`, mirroring the target module (e.g., `json-formatter.test.ts`).
- Cover edge cases and error paths; ensure new logic includes meaningful unit coverage.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (e.g., `feat:`, `fix:`, `chore:`) and keep messages focused.
- Open PRs with a clear summary, linked issues, verification steps, and screenshots for UI changes.
- Run `npm run build` and `npm test` locally before requesting review; update documentation when behavior shifts.

## Security & Configuration Tips
- Avoid committing secrets; all processing should remain client-side.
- Validate behavior with both `npm run dev` and `npm run preview`, honoring `NODE_ENV` and `DEPLOY_TARGET=github-pages` in `astro.config.mjs`.
