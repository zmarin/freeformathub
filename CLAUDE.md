# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FreeFormatHub is a privacy-first developer tools platform built with Astro + React Islands. It currently provides **101 comprehensive developer tools** for formatting, converting, encoding, and validating data. All processing happens client-side with no data leaving the browser, ensuring complete privacy and offline functionality.

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

# Testing
npm run test         # Run unit tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once (CI mode)

# Production Deployment
sudo ./scripts/production-deploy.sh yourdomain.com email@domain.com
sudo ./scripts/deploy.sh                    # Local deployment on port 4600
sudo ./scripts/force-deploy.sh             # Replace existing deployment
```

## Architecture & Core Patterns

### Tool Implementation Pattern
Every tool follows a consistent 4-file pattern:

1. **Tool Definition** (`src/tools/tool-name.ts`):
   - Export tool configuration object with metadata, examples, FAQs
   - Export processing function with ToolResult return type

2. **React Component** (`src/components/tools/ToolName.tsx`):
   - Interactive UI using shared components (InputPanel, OutputPanel, OptionsPanel)
   - Zustand store for state management

3. **Routing**: No per-tool Astro page. The dynamic route `src/pages/[category]/[slug].astro` renders tools using ToolShell + React component based on the registry.

4. **Registration** (`src/lib/tools/index.ts`):
   - Import and register tool in TOOL_REGISTRY

### Key Components

**ToolShell.astro**: Universal wrapper providing:
- SEO optimization (meta tags, structured data, OpenGraph)
- Consistent page layout and navigation
- Analytics and performance tracking

**UI Components** (`src/components/ui/`):
- `InputPanel.tsx`: Syntax highlighting, line numbers, validation
- `OutputPanel.tsx`: Copy functionality, download options
- `OptionsPanel.tsx`: Collapsible tool configuration

**Tool Registry** (`src/lib/tools/registry.ts`):
- Central registry for all tools with category organization
- Search functionality across tools
- Type-safe tool metadata management

### State Management
- **Zustand stores** in `src/lib/store/` for complex tool state
- **localStorage utilities** in `src/lib/storage/` for persistence
- **Tool history** and preferences automatically managed

### Content Architecture
- **Tools**: Self-contained in `src/tools/` with full metadata (currently 101 tools)
- **Categories**: 10 predefined categories in registry (formatters, converters, encoders, text, crypto, web, color, generators, network, validators)
- **SEO Content**: Each tool includes examples, use cases, FAQs, and related tools

## Adding New Tools

1. **Create tool definition** following the existing pattern in `src/tools/`
2. **Implement React component** using shared UI components
3. **No per-tool Astro page**; verify component name matches the route mapping
4. **Register in tool registry** for discoverability
5. **Add tests** in `src/test/` following existing patterns

The tool registry automatically handles:
- SEO metadata generation
- Category organization
- Search indexing
- Related tool suggestions

## Performance Considerations

- **Bundle targets**: <100KB per tool page, <30KB CSS
- **Core Web Vitals**: <1s LCP, optimized for 4G networks
- **Client-side processing**: All tools work offline, no server dependencies
- **Web Workers**: Ready for heavy computations (not yet implemented)

## Deployment Architecture

**Production**: Nginx + SSL with Let's Encrypt
- Files served from `/var/www/freeformathub/`
- SSL certificates managed by Certbot
- HTTP→HTTPS redirects automatically configured

**Development**: Local Nginx on port 4600
- Bypasses domain requirements for local testing
- Production-like environment for deployment testing

## Testing Strategy

- **Unit tests**: Tool logic and utility functions using Vitest
- **Component tests**: React component behavior with Testing Library
- **Integration tests**: Tool end-to-end workflows
- **Test environment**: jsdom with Vitest globals and UI mode available
- **Test commands**: `npm run test` (watch), `npm run test:ui` (UI), `npm run test:run` (CI)

## Storage & Privacy

- **No server storage**: All data processing client-side only
- **localStorage**: User preferences, recent tools, basic history
- **IndexedDB**: Large tool results and extended history
- **Privacy-first**: No analytics tracking, no data collection

The architecture prioritizes tool discoverability through SEO while maintaining fast, privacy-focused client-side processing.

## Current Tool Count & Distribution

The platform currently has **101 tools** across 10 categories:
- **Formatters & Validators**: JSON, XML, YAML, HTML, CSS, SQL formatters
- **Data Converters**: Format conversion, data transformation tools  
- **Encoding & Decoding**: Base64, Base32, URL, JWT, HTML entities
- **Text & String Tools**: Case conversion, diff, escape, statistics
- **Cryptography & Security**: Hash generation, encryption, password tools
- **Web Development**: Beautifiers, minifiers, selectors, API tools
- **Color & Design**: Palette generators, converters, accessibility tools
- **Code Generators**: UUID, QR codes, mock data, cron expressions
- **Network Tools**: IP calculator, DNS lookup, port scanner
- **Validators**: Email, phone, credit card, IBAN validation

## Tool Implementation Status

All 101 tools follow the complete 4-file architecture and are fully functional with:
- ✅ Tool logic implementation (`src/tools/*.ts`)
- ✅ React component UI (`src/components/tools/*.tsx`) 
- ✅ Astro page routing (`src/pages/tools/*.astro`)
- ✅ Registry integration (`src/lib/tools/index.ts`)

## Port Configuration

### Allocated Ports
- **Port 4600**: Main application server
- **Port 4601**: Prometheus metrics collection  
- **Port 4602**: Grafana monitoring dashboard
- **Port 4603**: Redis caching service

### Port Management Integration
```bash
# Before making any port-related changes:
# 1. Check PORT-CONFIG.md in this directory
# 2. Validate ports: /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub
# 3. Get suggestions: node /home/projects/suggest-port.js suggest-for freeformathub
# Never hardcode ports without checking: /home/projects/apps_ports_map.json
```

### System Message for LLMs
```
This project uses the centralized port management system.
Allocated ports: 4600 (main), 4601 (prometheus), 4602 (grafana), 4603 (redis)
Before changing ports:
1. Check PORT-CONFIG.md in this directory
2. Validate with: /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub
3. Get suggestions: node /home/projects/suggest-port.js suggest-for freeformathub
Never hardcode ports without checking the registry at /home/projects/apps_ports_map.json

Project-specific notes:
- Astro static site with monitoring stack
- Uses port range 4600-4603 for all services
- Docker Compose manages service orchestration
- Main app on 4600, monitoring services on 4601-4603
- Always use production builds (per global CLAUDE.md instructions)
```

- follow instructions in Claude folder files design.md, requierements.md and follow asks and update them in tasks.md
