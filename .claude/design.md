# Design Document

## Overview

FreeFormatHub is a high-performance, privacy-first developer tools platform built with Astro SSG and React islands. The platform provides 150+ tools across 12 categories, emphasizing client-side processing, educational content, and exceptional SEO performance. The architecture prioritizes speed, accessibility, and user privacy while maintaining a scalable foundation for rapid tool development.

## Architecture

### High-Level Architecture

The platform follows a static-first approach with selective hydration for interactive components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                           │
│                 (Brotli Compression)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Hostinger VPS                                │
│                   (Nginx)                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Astro SSG App                               │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │   Static Pages  │  React Islands  │  Web Workers    │    │
│  │   (SEO Content) │  (Tool Logic)   │  (Heavy Compute)│    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Astro 4.x with React islands for interactive components
- **Language**: TypeScript throughout (strict mode)
- **Styling**: Tailwind CSS 3.x + CSS Modules for tool-specific styles
- **State Management**: Zustand for complex tools, React Context for simple ones
- **Build Tools**: Vite (via Astro), ESLint, Prettier, Husky
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Performance**: Web Workers for heavy computations, WASM for specific algorithms

### Directory Structure

```
freeformathub/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ToolShell.astro          # Common tool wrapper
│   │   │   ├── SEOHead.astro            # SEO meta tags
│   │   │   ├── Navigation.astro         # Site navigation
│   │   │   └── Footer.astro             # Site footer
│   │   ├── ui/
│   │   │   ├── InputPanel.tsx           # Tool input interface
│   │   │   ├── OutputPanel.tsx          # Tool output interface
│   │   │   ├── OptionsBar.tsx           # Tool options/settings
│   │   │   ├── ExamplesDropdown.tsx     # Sample data loader
│   │   │   ├── HistoryPanel.tsx         # Recent operations
│   │   │   └── ShareButton.tsx          # Deep linking
│   │   └── layout/
│   │       ├── Header.astro
│   │       ├── Sidebar.astro
│   │       └── Breadcrumbs.astro
│   ├── tools/
│   │   ├── data-formatters/
│   │   │   ├── json-formatter/
│   │   │   │   ├── JsonFormatter.tsx    # React component
│   │   │   │   ├── worker.ts            # Web Worker
│   │   │   │   ├── utils.ts             # Utility functions
│   │   │   │   ├── examples.ts          # Sample data
│   │   │   │   └── tests.spec.ts        # Unit tests
│   │   │   └── xml-formatter/
│   │   ├── data-converters/
│   │   ├── encoding-tools/
│   │   ├── text-tools/
│   │   ├── crypto-tools/
│   │   ├── web-dev-tools/
│   │   ├── color-design-tools/
│   │   ├── date-time-tools/
│   │   ├── math-tools/
│   │   ├── network-tools/
│   │   ├── file-tools/
│   │   └── dev-utilities/
│   ├── lib/
│   │   ├── workers/
│   │   │   ├── WorkerManager.ts         # Worker lifecycle
│   │   │   └── WorkerPool.ts            # Worker pooling
│   │   ├── validators/
│   │   │   ├── JsonValidator.ts
│   │   │   ├── XmlValidator.ts
│   │   │   └── BaseValidator.ts
│   │   ├── converters/
│   │   │   ├── JsonConverter.ts
│   │   │   ├── XmlConverter.ts
│   │   │   └── BaseConverter.ts
│   │   ├── storage/
│   │   │   ├── LocalStorage.ts          # Browser storage
│   │   │   └── IndexedDB.ts             # Large data cache
│   │   ├── analytics/
│   │   │   └── Plausible.ts             # Privacy analytics
│   │   └── utils/
│   │       ├── performance.ts           # Performance monitoring
│   │       ├── accessibility.ts         # A11y helpers
│   │       └── seo.ts                   # SEO utilities
│   ├── pages/
│   │   ├── index.astro                  # Homepage
│   │   ├── tools/
│   │   │   ├── [category]/
│   │   │   │   └── index.astro          # Category listing
│   │   │   └── [slug].astro             # Individual tool page
│   │   ├── learn/
│   │   │   ├── index.astro              # Learning hub
│   │   │   └── [topic].mdx              # Tutorial content
│   │   ├── about.astro
│   │   ├── privacy.astro
│   │   └── terms.astro
│   ├── content/
│   │   ├── tools/                       # Tool metadata
│   │   │   ├── data-formatters.json
│   │   │   └── data-converters.json
│   │   ├── tutorials/                   # Educational content
│   │   │   ├── json-basics.mdx
│   │   │   └── xml-fundamentals.mdx
│   │   └── config.ts                    # Content collections
│   └── styles/
│       ├── global.css                   # Global styles
│       ├── components.css               # Component styles
│       └── tools.css                    # Tool-specific styles
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── build-tools.ts                   # Tool generation
    ├── generate-sitemap.ts              # SEO automation
    └── optimize-assets.ts               # Asset optimization
```

## Components and Interfaces

### Core Tool Interface

```typescript
interface ToolConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  examples: ToolExample[];
  options: ToolOption[];
  validation: ValidationRule[];
  processing: ProcessingConfig;
}

interface ToolExample {
  name: string;
  input: string;
  output: string;
  description: string;
}

interface ProcessingConfig {
  useWorker: boolean;
  chunkSize?: number;
  timeout?: number;
  fallback?: boolean;
}
```

### Tool Component Architecture

Each tool follows a consistent component structure:

```typescript
// Tool Component Interface
interface ToolProps {
  config: ToolConfig;
  initialInput?: string;
  initialOptions?: Record<string, any>;
}

// Base Tool Component
const BaseTool: React.FC<ToolProps> = ({ config, initialInput, initialOptions }) => {
  const [input, setInput] = useState(initialInput || '');
  const [output, setOutput] = useState('');
  const [options, setOptions] = useState(initialOptions || {});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Processing logic with Web Worker support
  const processInput = useCallback(async (inputData: string) => {
    if (config.processing.useWorker) {
      return await processWithWorker(inputData, options);
    }
    return await processInMainThread(inputData, options);
  }, [options, config]);
  
  // Real-time processing with debouncing
  useEffect(() => {
    const debounced = debounce(processInput, 300);
    if (input) {
      debounced(input);
    }
  }, [input, processInput]);
  
  return (
    <div className="tool-container">
      <InputPanel 
        value={input}
        onChange={setInput}
        config={config}
        error={error}
      />
      <OptionsBar 
        options={options}
        onChange={setOptions}
        config={config}
      />
      <OutputPanel 
        value={output}
        isProcessing={isProcessing}
        config={config}
      />
    </div>
  );
};
```

### Web Worker Integration

```typescript
// Worker Manager for heavy computations
class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private workerPool: WorkerPool;
  
  constructor() {
    this.workerPool = new WorkerPool(4); // 4 workers max
  }
  
  async processWithWorker<T>(
    toolId: string,
    input: string,
    options: Record<string, any>
  ): Promise<T> {
    const worker = await this.workerPool.getWorker(toolId);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout'));
      }, 10000);
      
      worker.postMessage({ input, options });
      
      worker.onmessage = (event) => {
        clearTimeout(timeout);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };
    });
  }
}
```

## Data Models

### Tool Metadata Model

```typescript
interface ToolMetadata {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  subcategory?: string;
  description: string;
  longDescription: string;
  keywords: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  lastUpdated: Date;
  version: string;
  
  // SEO
  seo: {
    title: string;
    metaDescription: string;
    canonicalUrl: string;
    structuredData: Record<string, any>;
  };
  
  // Content
  content: {
    howItWorks: string;
    useCases: string[];
    examples: ToolExample[];
    commonErrors: ErrorTip[];
    faq: FAQItem[];
    relatedTools: string[];
  };
  
  // Technical
  technical: {
    inputFormats: string[];
    outputFormats: string[];
    maxFileSize: number;
    supportedBrowsers: string[];
    requiresWorker: boolean;
    wasmSupport?: boolean;
  };
}

interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}
```

### User Interaction Model

```typescript
interface UserSession {
  sessionId: string;
  startTime: Date;
  toolsUsed: ToolUsage[];
  preferences: UserPreferences;
  history: HistoryItem[];
}

interface ToolUsage {
  toolId: string;
  startTime: Date;
  endTime?: Date;
  inputSize: number;
  outputSize: number;
  processingTime: number;
  errors: string[];
  options: Record<string, any>;
}

interface HistoryItem {
  id: string;
  toolId: string;
  timestamp: Date;
  input: string;
  output: string;
  options: Record<string, any>;
}
```

## Error Handling

### Error Classification System

```typescript
enum ErrorType {
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  WORKER = 'worker',
  NETWORK = 'network',
  BROWSER = 'browser',
  MEMORY = 'memory'
}

interface ToolError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  suggestions: string[];
  recoverable: boolean;
  context?: Record<string, any>;
}

class ErrorHandler {
  static handle(error: ToolError, toolId: string): void {
    // Log to Sentry
    Sentry.captureException(error, {
      tags: { toolId, errorType: error.type },
      extra: error.context
    });
    
    // Show user-friendly message
    this.showUserError(error);
    
    // Attempt recovery if possible
    if (error.recoverable) {
      this.attemptRecovery(error, toolId);
    }
  }
  
  private static showUserError(error: ToolError): void {
    // Display error with suggestions
    toast.error(error.userMessage, {
      description: error.suggestions.join(' '),
      duration: 5000
    });
  }
}
```

### Fallback Strategies

```typescript
class ProcessingFallback {
  static async processWithFallback(
    input: string,
    options: Record<string, any>,
    toolConfig: ToolConfig
  ): Promise<string> {
    try {
      // Try Web Worker first
      if (toolConfig.processing.useWorker) {
        return await this.processWithWorker(input, options);
      }
    } catch (workerError) {
      console.warn('Worker failed, falling back to main thread:', workerError);
    }
    
    try {
      // Fallback to main thread
      return await this.processInMainThread(input, options);
    } catch (mainThreadError) {
      // Final fallback with reduced functionality
      return await this.processWithReducedFeatures(input, options);
    }
  }
}
```

## Testing Strategy

### Unit Testing Approach

```typescript
// Tool Component Testing
describe('JsonFormatter', () => {
  it('should format valid JSON', async () => {
    const { result } = renderHook(() => useJsonFormatter());
    
    await act(async () => {
      result.current.setInput('{"name":"test"}');
    });
    
    expect(result.current.output).toBe('{\n  "name": "test"\n}');
  });
  
  it('should handle invalid JSON gracefully', async () => {
    const { result } = renderHook(() => useJsonFormatter());
    
    await act(async () => {
      result.current.setInput('invalid json');
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.type).toBe(ErrorType.VALIDATION);
  });
});

// Web Worker Testing
describe('JsonFormatterWorker', () => {
  let worker: Worker;
  
  beforeEach(() => {
    worker = new Worker('/src/tools/data-formatters/json-formatter/worker.ts');
  });
  
  it('should format JSON in worker', (done) => {
    worker.postMessage({ input: '{"test":true}', options: { indent: 2 } });
    
    worker.onmessage = (event) => {
      expect(event.data.result).toBe('{\n  "test": true\n}');
      done();
    };
  });
});
```

### E2E Testing Strategy

```typescript
// Playwright E2E Tests
test.describe('Tool Functionality', () => {
  test('should process data and show results', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    
    // Input data
    await page.fill('[data-testid="input-panel"]', '{"name":"test"}');
    
    // Wait for processing
    await page.waitForSelector('[data-testid="output-panel"]:not(.processing)');
    
    // Verify output
    const output = await page.textContent('[data-testid="output-panel"]');
    expect(output).toContain('"name": "test"');
  });
  
  test('should maintain performance standards', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    
    const metrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
    });
    
    expect(metrics.loadEventEnd - metrics.loadEventStart).toBeLessThan(1000);
  });
});
```

### Performance Testing

```typescript
// Performance Monitoring
class PerformanceMonitor {
  static measureToolPerformance(toolId: string, operation: () => Promise<void>) {
    return new Promise(async (resolve) => {
      const startTime = performance.now();
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      await operation();
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const metrics = {
        toolId,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: new Date()
      };
      
      // Send to analytics
      this.reportMetrics(metrics);
      resolve(metrics);
    });
  }
}
```

This design provides a comprehensive foundation for building the FreeFormatHub platform with emphasis on performance, scalability, and user experience while maintaining the privacy-first approach outlined in the requirements.