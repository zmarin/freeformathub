import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processMarkdownConverter, type MarkdownConverterConfig } from '../../../tools/converters/markdown-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface MarkdownConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: MarkdownConverterConfig = {
  mode: 'markdown-to-html',
  enableSyntaxHighlighting: true,
  enableTables: true,
  enableStrikethrough: true,
  enableTaskLists: true,
  enableAutolinks: true,
  generateToc: false,
  addLineNumbers: false,
  sanitizeHtml: true,
  includeMetadata: false,
  outputFormat: 'html-fragment',
  headingOffset: 0,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Conversion Mode',
    type: 'select' as const,
    default: 'markdown-to-html',
    options: [
      { value: 'markdown-to-html', label: 'Markdown → HTML' },
      { value: 'html-to-markdown', label: 'HTML → Markdown' },
    ],
    description: 'Choose conversion direction',
  },
  {
    key: 'outputFormat',
    label: 'HTML Output Format',
    type: 'select' as const,
    default: 'html-fragment',
    options: [
      { value: 'html-fragment', label: 'HTML Fragment' },
      { value: 'full-html', label: 'Complete HTML Document' },
    ],
    description: 'Output format when converting to HTML',
    showWhen: (config: MarkdownConverterConfig) => config.mode === 'markdown-to-html',
  },
  {
    key: 'enableTables',
    label: 'Enable Tables',
    type: 'boolean' as const,
    default: true,
    description: 'Support GitHub Flavored Markdown tables',
  },
  {
    key: 'enableTaskLists',
    label: 'Enable Task Lists',
    type: 'boolean' as const,
    default: true,
    description: 'Support checkbox task lists [x] and [ ]',
  },
  {
    key: 'enableStrikethrough',
    label: 'Enable Strikethrough',
    type: 'boolean' as const,
    default: true,
    description: 'Support ~~strikethrough~~ text formatting',
  },
  {
    key: 'enableAutolinks',
    label: 'Enable Autolinks',
    type: 'boolean' as const,
    default: true,
    description: 'Automatically convert URLs and email addresses to links',
  },
  {
    key: 'generateToc',
    label: 'Generate Table of Contents',
    type: 'boolean' as const,
    default: false,
    description: 'Generate TOC from headings with anchor links',
    showWhen: (config: MarkdownConverterConfig) => config.mode === 'markdown-to-html',
  },
  {
    key: 'headingOffset',
    label: 'Heading Level Offset',
    type: 'number' as const,
    default: 0,
    min: -3,
    max: 3,
    description: 'Adjust heading levels (0 = no change, +1 = H1→H2, -1 = H2→H1)',
    showWhen: (config: MarkdownConverterConfig) => config.mode === 'markdown-to-html',
  },
  {
    key: 'sanitizeHtml',
    label: 'Sanitize HTML',
    type: 'boolean' as const,
    default: true,
    description: 'Remove potentially harmful HTML tags and attributes',
  },
];

const QUICK_EXAMPLES = [
  {
    name: 'Basic Document',
    input: `# My Document

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

## List Items

- Item 1
- Item 2  
- Item 3`,
    config: { ...DEFAULT_CONFIG, mode: 'markdown-to-html' as const }
  },
  {
    name: 'Table & Tasks',
    input: `# Project Status

## Tasks
- [x] Setup project
- [ ] Write documentation  
- [ ] Deploy to production

## Team Members

| Name | Role | Status |
|------|------|--------|
| John | Developer | Active |
| Jane | Designer | Active |`,
    config: { ...DEFAULT_CONFIG, mode: 'markdown-to-html' as const, enableTables: true, enableTaskLists: true }
  },
  {
    name: 'Full HTML Document',
    input: `# Welcome to My Site

This document will be converted to a complete HTML page with styling.

## Features

- **Responsive design**
- *Beautiful typography*
- Code highlighting
- And much more!

[Visit our website](https://example.com)`,
    config: { ...DEFAULT_CONFIG, mode: 'markdown-to-html' as const, outputFormat: 'full-html' as const, generateToc: true }
  },
  {
    name: 'HTML to Markdown (Enhanced)',
    input: `<h1>Advanced HTML Document</h1>
<p>This demonstrates <strong>enhanced HTML parsing</strong> with <em>complex structures</em>.</p>

<h2>Features</h2>
<ul>
  <li>Basic list item</li>
  <li>Item with <a href="https://example.com" title="Example">link and title</a></li>
  <li>
    Nested list:
    <ul>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ul>
  </li>
</ul>

<h3>Task List Support</h3>
<ul class="task-list">
  <li class="task-list-item"><input type="checkbox" checked disabled> Completed task</li>
  <li class="task-list-item"><input type="checkbox" disabled> Pending task</li>
</ul>

<table>
  <thead>
    <tr><th>Name</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Project A</td><td><strong>Active</strong></td></tr>
    <tr><td>Project B</td><td><em>On Hold</em></td></tr>
  </tbody>
</table>

<blockquote>
  <p>This is a <strong>formatted quote</strong> with styling preserved.</p>
</blockquote>

<pre><code class="language-javascript">function demo() {
  console.log('Syntax highlighting preserved!');
}</code></pre>`,
    config: { ...DEFAULT_CONFIG, mode: 'html-to-markdown' as const, enableTables: true, enableTaskLists: true }
  },
];

export function MarkdownConverter({ className = '' }: MarkdownConverterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<MarkdownConverterConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<{
    originalSize: number;
    processedSize: number;
    wordCount: number;
    characterCount: number;
    lineCount: number;
    headingCount: number;
    linkCount: number;
    imageCount: number;
    codeBlockCount: number;
    tableCount: number;
    listCount: number;
  } | null>(null);

  const { addToHistory } = useToolStore();

  const debouncedProcess = useMemo(
    () => debounce((text: string, cfg: MarkdownConverterConfig) => {
      if (!text.trim()) {
        setOutput('');
        setError(undefined);
        setStats(null);
        return;
      }

      setIsLoading(true);
      
      setTimeout(() => {
        try {
          const result = processMarkdownConverter(text, cfg);
          
          if (result.success) {
            setOutput(result.output || '');
            setError(undefined);
            setStats(result.stats || null);
            
            addToHistory({
              toolId: 'markdown-converter',
              input: text,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } else {
            setOutput('');
            setError(result.error);
            setStats(null);
          }
        } catch (err) {
          setOutput('');
          setError(err instanceof Error ? err.message : 'Failed to convert content');
          setStats(null);
        }
        
        setIsLoading(false);
      }, 200);
    }, 400),
    [addToHistory]
  );

  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: MarkdownConverterConfig) => {
    setConfig(newConfig);
  };

  const insertExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setInput(example.input);
    setConfig({ ...example.config });
  };

  const handleModeSelect = (mode: MarkdownConverterConfig['mode']) => {
    if (mode === config.mode) {
      return;
    }

    setConfig((previous) => ({ ...previous, mode }));

    if (output) {
      setInput(output);
    }
  };

  const handleOutputFormatSelect = (format: MarkdownConverterConfig['outputFormat']) => {
    if (config.mode !== 'markdown-to-html' || format === config.outputFormat) {
      return;
    }

    setConfig((previous) => ({ ...previous, outputFormat: format }));
  };

  const resetTool = () => {
    setInput('');
    setOutput('');
    setError(undefined);
    setStats(null);
    setConfig({ ...DEFAULT_CONFIG });
  };

  const useOutputAsInput = () => {
    if (!output) {
      return;
    }

    setInput(output);
  };

  const generateSampleMarkdown = () => {
    const sampleContent = `# Sample Document

This is a **sample Markdown document** with various elements to demonstrate the converter.

## Features

- *Italic text*
- **Bold text**
- ~~Strikethrough text~~
- \`inline code\`
- [Links](https://example.com)

### Code Block

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Task List

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

### Table

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data |
| Row 2    | Info     | Details   |

> This is a blockquote with some important information.

---

That's the end of our sample document!`;
    
    setInput(sampleContent);
  };

  const inputSyntax = config.mode === 'markdown-to-html' ? 'markdown' : 'html';
  const outputSyntax = config.mode === 'markdown-to-html' ? 'html' : 'markdown';
  const inputLabel = config.mode === 'markdown-to-html' ? 'Markdown Input' : 'HTML Input';
  const outputLabel = config.mode === 'markdown-to-html' ?
    (config.outputFormat === 'full-html' ? 'Complete HTML Document' : 'HTML Fragment') :
    'Markdown Output';
  const activeFeatures = [
    config.enableTables && 'Tables',
    config.enableTaskLists && 'Tasks',
    config.enableStrikethrough && 'Strikethrough',
    config.enableAutolinks && 'Autolinks',
    config.generateToc && 'TOC',
  ].filter(Boolean) as string[];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Markdown & HTML Converter</h2>
            <p className="mt-1 text-sm text-slate-600">
              Convert content instantly between Markdown and HTML. Choose the direction, adjust formatting rules, and review detailed document statistics.
            </p>
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-auto">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</span>
              <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleModeSelect('markdown-to-html')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${config.mode === 'markdown-to-html'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  MD to HTML
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSelect('html-to-markdown')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${config.mode === 'html-to-markdown'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  HTML to MD
                </button>
              </div>
            </div>

            {config.mode === 'markdown-to-html' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output</span>
                <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleOutputFormatSelect('html-fragment')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${config.outputFormat === 'html-fragment'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    HTML Fragment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOutputFormatSelect('full-html')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${config.outputFormat === 'full-html'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    Full Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {config.mode === 'markdown-to-html' ? 'Markdown to HTML' : 'HTML to Markdown'}
          </span>
          {config.mode === 'markdown-to-html' && (
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {config.outputFormat === 'full-html' ? 'Complete HTML document' : 'HTML fragment output'}
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {config.sanitizeHtml ? 'Sanitize HTML enabled' : 'Raw HTML allowed'}
          </span>
          {activeFeatures.length > 0 ? (
            activeFeatures.map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {feature}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Basic conversion only</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          <InputPanel
            value={input}
            onChange={handleInputChange}
            label={inputLabel}
            placeholder={config.mode === 'markdown-to-html' ? 
            `Enter Markdown content:

# Heading
This is a paragraph with **bold** and *italic* text.

## Code Example
\`\`\`javascript
console.log('Hello, World!');
\`\`\`

## List
- Item 1
- Item 2

| Table | Headers |
|-------|---------|
| Cell  | Data    |` :
            `Enter HTML content:

<h1>Heading</h1>
<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<pre><code>console.log('Hello');</code></pre>
<ul>
  <li>List item</li>
</ul>`}
          syntax={inputSyntax}
          examples={[
            {
              title: config.mode === 'markdown-to-html' ? 'Basic Markdown' : 'Basic HTML',
              value: config.mode === 'markdown-to-html' ? 
                '# Title\n\nThis is **bold** and *italic* text.' :
                '<h1>Title</h1>\n<p>This is <strong>bold</strong> and <em>italic</em> text.</p>',
            },
            {
              title: config.mode === 'markdown-to-html' ? 'With Code' : 'With Code Block',
              value: config.mode === 'markdown-to-html' ? 
                '```js\nconsole.log("Hello");\n```' :
                '<pre><code>console.log("Hello");</code></pre>',
            },
            {
              title: config.mode === 'markdown-to-html' ? 'Table' : 'List',
              value: config.mode === 'markdown-to-html' ? 
                '| Header | Value |\n|--------|-------|\n| Cell   | Data  |' :
                '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
            },
          ]}
          className="shadow-sm"
        />
          <div className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Quick actions</p>
                  <p className="text-xs text-slate-500">Jump-start conversions with handy presets.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.mode === 'markdown-to-html' && (
                  <button
                    type="button"
                    onClick={generateSampleMarkdown}
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Sample Markdown
                  </button>
                )}
                <button
                  type="button"
                  onClick={useOutputAsInput}
                  disabled={!output}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition ${output
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500'
                  }`}
                >
                  Use output as input
                </button>
                <button
                  type="button"
                  onClick={resetTool}
                  className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
                >
                  Reset tool
                </button>
              </div>
            </div>

            {stats && (
              <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Document stats</p>
                    <p className="text-xs text-slate-500">Review structure, counts, and size differences.</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    Size {stats.originalSize} → {stats.processedSize}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[{
                    label: 'Words',
                    value: stats.wordCount,
                  }, {
                    label: 'Characters',
                    value: stats.characterCount,
                  }, {
                    label: 'Lines',
                    value: stats.lineCount,
                  }, {
                    label: 'Headings',
                    value: stats.headingCount,
                  }, {
                    label: 'Links',
                    value: stats.linkCount,
                  }, {
                    label: 'Images',
                    value: stats.imageCount,
                  }, {
                    label: 'Code blocks',
                    value: stats.codeBlockCount,
                  }, {
                    label: 'Tables',
                    value: stats.tableCount,
                  }, {
                    label: 'Lists',
                    value: stats.listCount,
                  }].map((metric) => (
                    <div key={metric.label} className="rounded-md border border-slate-200 bg-white/80 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Quick examples</p>
                  <p className="text-xs text-slate-500">Load ready-made content to explore converter behavior.</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {QUICK_EXAMPLES.map((example) => {
                  const preview = example.input.replace(/\s+/g, ' ').trim();
                  const previewText = preview.length > 80 ? `${preview.slice(0, 80)}...` : preview;
                  const isActive = input.trim() === example.input.trim() && config.mode === example.config.mode;

                  return (
                    <button
                      key={example.name}
                      type="button"
                      onClick={() => insertExample(example)}
                      className={`rounded-lg border px-4 py-3 text-left transition ${isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-inner'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-300 hover:text-slate-800 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-sm font-semibold">{example.name}</div>
                      <p className="mt-1 text-xs leading-5">{previewText}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <OptionsPanel
            options={OPTIONS}
            config={config}
            onChange={handleConfigChange}
            className="shadow-sm"
          />
        </div>

        <div className="space-y-6">
          <OutputPanel
            value={output}
            error={error}
            isLoading={isLoading}
            label={outputLabel}
            syntax={outputSyntax}
            downloadFilename={`converted.${config.mode === 'markdown-to-html' ? 'html' : 'md'}`}
            downloadContentType={config.mode === 'markdown-to-html' ? 'text/html' : 'text/markdown'}
            className="shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
