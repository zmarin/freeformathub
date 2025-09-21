# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FreeFormatHub is a privacy-first business and developer tools platform built with Astro + React Islands. It provides **119 comprehensive business and developer tools** for formatting, converting, encoding, and validating data. All processing happens client-side with no data leaving the browser, ensuring complete privacy and offline functionality.

**Tech Stack:**
- **Framework**: Astro (SSG) with React Islands for interactive components
- **Language**: TypeScript throughout
- **Styling**: Tailwind CSS with utility-first approach
- **State**: Zustand for tool state management
- **Storage**: localStorage + IndexedDB for user preferences and history
- **Testing**: Vitest for unit tests, jsdom environment
- **Build**: Vite (integrated with Astro)

## Common Development Commands

```bash
# Development
npm run dev          # Start dev server at localhost:4321
npm run build        # Build static site to ./dist/
npm run preview      # Preview production build

# Type-checking and Linting
npx astro check      # TypeScript type-checking for Astro files
npx tsc --noEmit     # TypeScript compilation check only
npx eslint .         # Run ESLint linting
npx prettier --write . # Format code with Prettier

# Testing
npm run test         # Run unit tests with Vitest (watch mode)
npm run test:ui      # Run tests with Vitest UI
npm run test:run     # Run tests once (CI mode)
npx vitest run --reporter=verbose src/test/specific-test.test.ts # Single test file

# Deployment (Auto-Deploy via Git)
git push origin master  # Auto-triggers deployment
```

## Architecture & Core Patterns

### Tool Implementation Pattern
Every tool follows a consistent 4-file pattern:

1. **Tool Definition** (`src/tools/[category]/tool-name.ts`):
   - Export tool configuration object with metadata, examples, FAQs
   - Export processing function with ToolResult return type
   - **CRITICAL**: Must include `slug` property matching the filename

2. **React Component** (`src/components/tools/[category]/ToolName.tsx`):
   - Interactive UI using shared components (InputPanel, OutputPanel, OptionsPanel)
   - Component name derived from tool.name (PascalCase, non-alphanumeric removed)
   - Zustand store for state management

3. **Dynamic Routing**: `src/pages/[category]/[slug].astro` renders all tools using ToolShell + ToolRenderer
   - No individual tool pages needed
   - Component discovery via `src/lib/component-map.ts`

4. **Registration** (`src/lib/tools/index.ts`):
   - Import and register tool in TOOL_REGISTRY
   - **Must call `registerTool(TOOL_NAME)`**

### Critical Architecture Components

**ToolShell.astro**: Universal wrapper providing:
- SEO optimization (meta tags, structured data, OpenGraph)
- Consistent page layout and navigation
- Google Analytics (GA4) and AdSense integration
- Cookie consent management

**Dynamic Component Loading** (`src/lib/component-map.ts`):
- Maps tool IDs to React components for production builds
- Handles tree-shaking and code splitting
- Fallback loading strategies for missing components

**Tool Registry** (`src/lib/tools/registry.ts`):
- Central registry for all 119 tools with category organization
- Search functionality across tools
- Type-safe tool metadata management
- Sitemap generation

**UI Components** (`src/components/ui/`):
- `InputPanel.tsx`: Syntax highlighting, line numbers, validation
- `OutputPanel.tsx`: Copy functionality, download options
- `OptionsPanel.tsx`: Collapsible tool configuration

### State Management
- **Zustand stores** in `src/lib/store/` for complex tool state
- **localStorage utilities** in `src/lib/storage/` for persistence
- **Tool history** and preferences automatically managed

## Adding New Tools

1. **Create tool definition** in `src/tools/[category]/tool-name.ts`:
   ```typescript
   export const TOOL_NAME_TOOL: Tool = {
     id: 'tool-name',
     name: 'Tool Display Name',
     slug: 'tool-name', // REQUIRED - must match filename
     category: TOOL_CATEGORIES.find(cat => cat.id === 'category')!,
     // ... other required properties
   };
   ```

2. **Create React component** in `src/components/tools/[category]/ToolName.tsx`:
   - Component name must be PascalCase version of tool.name
   - Use shared UI components (InputPanel, OutputPanel, OptionsPanel)

3. **Register tool** in `src/lib/tools/index.ts`:
   ```typescript
   import { TOOL_NAME_TOOL } from '../../tools/category/tool-name';
   registerTool(TOOL_NAME_TOOL);
   ```

4. **Add to component map** in `src/lib/component-map.ts` for production builds

5. **Add tests** in `src/test/` following existing patterns

The registry automatically handles SEO metadata, category organization, search indexing, and related tool suggestions.

## Tool Categories & Distribution

**Current Tools: 119 across 14 categories:**
- **Formatters** (8): JSON, XML, YAML, CSS, HTML, JS, SQL, CSV formatters
- **Converters** (15): Format conversion, data transformation tools
- **Encoders** (11): Base64, Base32, URL, JWT, HTML entities, certificates
- **Text** (10): Case conversion, diff, regex, Lorem ipsum, ASCII art
- **Crypto** (7): Hash generation, encryption, password tools, JWT generator
- **Web** (15): Minifiers, CSS tools, API builders, webhooks, security analyzers
- **Color** (2): Palette generators, color blindness simulator
- **DateTime** (4): Timestamp conversion, cron generator, time tools
- **Math** (1): Expression evaluator
- **Network** (7): IP calculators, DNS lookup, port scanner, monitoring
- **Generators** (5): UUID, QR codes, barcodes, mock data
- **Development** (12): Git diff, JSON tools, database tools, performance
- **Data** (5): Binary viewer, image tools, PDF tools, CSV splitter
- **Validators** (6): Email, phone, credit card, IBAN, URL, HTML5

## SEO & Analytics Architecture

**Privacy-First Analytics**:
- Google Analytics (GA4) with consent-based tracking
- Google AdSense integration with consent management
- Cookie consent via `CookieConsent.tsx` component
- Default deny all tracking (GDPR compliant)

**SEO Optimization**:
- Structured data (JSON-LD) for each tool page
- OpenGraph and Twitter Card meta tags
- Canonical URLs with normalized paths
- Tool-specific meta descriptions and keywords
- Automatic sitemap generation

## Deployment Architecture

**Production Environment**:
- Auto-deploy from GitHub pushes to master branch
- Static site generation via Astro build
- Environment variables managed externally
- SSL certificates automatically managed
- Domain: `https://freeformathub.com`

**Development Environment**:
- `npm run dev` starts server at `localhost:4321`
- Hot reload and TypeScript checking enabled
- Uses `.env` file for local environment variables

## Performance Optimization

- **Bundle targets**: <100KB per tool page, <30KB CSS
- **Core Web Vitals**: <1s LCP, optimized for 4G networks
- **Client-side processing**: All tools work offline, no server dependencies
- **Dynamic imports**: Component-level code splitting
- **Tree-shaking**: Optimized component registration

## Testing Strategy

- **Unit tests**: Tool logic and utility functions using Vitest
- **Component tests**: React component behavior with Testing Library
- **Integration tests**: Tool end-to-end workflows
- **Test environment**: jsdom with Vitest globals and UI mode
- **Commands**: `npm run test` (watch), `npm run test:ui` (UI), `npm run test:run` (CI)

## Privacy & Storage

- **Client-side processing**: All tool operations happen in browser
- **localStorage**: User preferences, consent choices, tool history
- **IndexedDB**: Large tool results and extended history
- **No server storage**: No user data sent to servers
- **Consent management**: Analytics only with explicit user consent

## Critical Requirements

### Tool Definition Requirements
- **MUST** include `slug` property matching filename
- **MUST** be registered in `src/lib/tools/index.ts`
- **MUST** have corresponding React component with correct naming

### Component Naming Convention
- Tool name "JSON Formatter" → Component "JsonFormatter"
- Tool name "Base64 Encoder" → Component "Base64Encoder"
- Remove non-alphanumeric characters, use PascalCase

### Build Verification
- Always run `npm run build` after adding/modifying tools
- Check sitemap.xml for any "undefined" entries (indicates missing slug)
- Verify all 119 tools appear in sitemap with priority 0.9

The platform maintains strict privacy standards while providing comprehensive developer tools with excellent SEO and performance optimization.