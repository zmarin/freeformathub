# FreeFormatHub

> Privacy-first developer tools that work entirely in your browser

## 🚀 Overview

FreeFormatHub is a comprehensive collection of free online developer tools designed for formatting, converting, encoding, and validating data. Built with privacy in mind, all processing happens client-side with no data ever leaving your browser.

## ✨ Features

- **🔒 Privacy First** - All operations happen in your browser, no data uploaded
- **⚡ Lightning Fast** - Optimized for speed with instant results
- **📱 Mobile Friendly** - Fully responsive design for all devices  
- **🎨 Dark Mode** - Beautiful interface with dark/light theme support
- **💾 Smart Caching** - Client-side history and favorites with localStorage
- **🔧 Extensible** - Modular architecture for easy tool addition
- **♿ Accessible** - WCAG 2.1 AA compliant with keyboard navigation

## 🛠 Tech Stack

- **Framework**: Astro + React Islands
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Storage**: localStorage + IndexedDB
- **Build**: Vite
- **Testing**: Vitest + Playwright

## 🎯 Available Tools

### Data Formatters & Validators
- ✅ JSON Formatter & Validator
- 🔄 XML Formatter & Validator (Coming Soon)
- 📝 YAML Formatter & Validator (Coming Soon)

### Encoding & Decoding
- ✅ Base64 Encoder & Decoder
- 🔗 URL Encoder & Decoder (Coming Soon)
- 🎫 JWT Decoder (Coming Soon)

### Text & String Tools
- 📋 Text Case Converter (Coming Soon)
- 🔍 Text Diff & Compare (Coming Soon)
- 🎲 Random Generator Tools (Coming Soon)

*50+ more tools planned - see roadmap below*

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`

### Building for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
freeformathub/
├── src/
│   ├── components/
│   │   ├── common/        # Shared components
│   │   ├── tools/         # Tool-specific components
│   │   └── ui/           # Reusable UI components
│   ├── layouts/          # Page layouts
│   ├── lib/
│   │   ├── storage/      # Client-side storage
│   │   ├── store/        # State management
│   │   ├── tools/        # Tool registry
│   │   └── utils/        # Utility functions
│   ├── pages/           # Astro pages
│   ├── tools/           # Tool implementations
│   └── types/           # TypeScript definitions
├── public/              # Static assets
└── tests/              # Test files
```

## 🔧 Adding New Tools

1. **Create Tool Definition** (`src/tools/your-tool.ts`):
```typescript
export const YOUR_TOOL: Tool = {
  id: 'your-tool',
  name: 'Your Tool Name',
  description: 'What your tool does',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'category')!,
  // ... other properties
};

export function processYourTool(input: string, config: YourToolConfig): ToolResult {
  // Tool logic here
}
```

2. **Create React Component** (`src/components/tools/YourTool.tsx`):
```typescript
export function YourTool() {
  // Component implementation
}
```

3. **Routing**: No per-tool Astro page. Tools are rendered by the dynamic route `src/pages/[category]/[slug].astro` using the registry and a component in `src/components/tools/<category>/<ComponentName>.tsx` where `<ComponentName>` is derived from `tool.name` (PascalCase, non-alphanumeric removed).

4. **Register Tool** (`src/lib/tools/index.ts`):
```typescript
import { YOUR_TOOL } from '../../tools/your-tool';
registerTool(YOUR_TOOL);
```

## 📈 Performance

- **Target**: < 1s LCP on 4G networks
- **Bundle Size**: < 100KB gzipped per tool page
- **Core Web Vitals**: Optimized for 90+ Lighthouse scores
- **Caching**: Smart client-side caching with IndexedDB

## 🎯 Roadmap

- [x] Core architecture with Astro + React
- [x] JSON Formatter & Validator
- [x] Base64 Encoder & Decoder
- [ ] URL Encoder & Decoder
- [ ] JWT Decoder & Validator
- [ ] Hash Generators (MD5, SHA-1, SHA-256)
- [ ] UUID/GUID Generator
- [ ] Color Format Converter
- [ ] Text Case Converter
- [ ] And 40+ more tools...

## 🚀 Deployment

### Production Deployment with SSL (Recommended)

```bash
# Complete production deployment with SSL
sudo ./scripts/production-deploy.sh yourdomain.com admin@yourdomain.com

# With monitoring (Prometheus + Grafana)
sudo ./scripts/production-deploy.sh yourdomain.com admin@yourdomain.com true

# Access your site
# https://yourdomain.com
```

### Local Development Deployment (Port 4600)

```bash
# 1. Setup Nginx and system (run as root)
sudo ./scripts/setup-nginx.sh

# 2. Deploy FreeFormatHub locally
sudo ./scripts/deploy.sh

# 3. Access your site
# http://localhost:4600
# http://your-server-ip:4600
```

### Docker Deployment

```bash
# Basic deployment
./scripts/docker-deploy.sh

# With monitoring (Prometheus + Grafana)
./scripts/docker-deploy.sh deploy-monitor

# Check status and URLs
./scripts/docker-deploy.sh status
```

### Development Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run test`            | Run unit tests with Vitest                      |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

### Deployment Commands

| Command                          | Action                                     |
| :------------------------------- | :----------------------------------------- |
| `sudo ./scripts/deploy.sh`       | Full deployment (build + deploy + restart) |
| `sudo ./scripts/deploy.sh build` | Build project only                         |
| `sudo ./scripts/deploy.sh status`| Check deployment status                    |
| `./scripts/docker-deploy.sh`     | Docker deployment                          |

---

Made with ❤️ for the developer community. **Privacy-first, always free, no ads.**
