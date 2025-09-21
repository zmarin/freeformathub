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
    setConfig(example.config);
  };

  const switchMode = () => {
    const newMode = config.mode === 'markdown-to-html' ? 'html-to-markdown' : 'markdown-to-html';
    setConfig({ ...config, mode: newMode });
    
    // Optionally swap input/output when switching modes
    if (output) {
      setInput(output);
    }
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

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
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
        />

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={switchMode}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Switch to {config.mode === 'markdown-to-html' ? 'HTML→MD' : 'MD→HTML'}
            </button>
            {config.mode === 'markdown-to-html' && (
              <button
                onClick={generateSampleMarkdown}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                Sample Markdown
              </button>
            )}
            <button
              onClick={() => setConfig({ ...config, outputFormat: config.outputFormat === 'full-html' ? 'html-fragment' : 'full-html' })}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              disabled={config.mode !== 'markdown-to-html'}
            >
              {config.outputFormat === 'full-html' ? 'Fragment' : 'Full Doc'}
            </button>
          </div>

          {/* Conversion Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Settings:
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Mode: {config.mode === 'markdown-to-html' ? 'Markdown → HTML' : 'HTML → Markdown'}</div>
              {config.mode === 'markdown-to-html' && (
                <div>Output: {config.outputFormat === 'full-html' ? 'Complete HTML document' : 'HTML fragment'}</div>
              )}
              <div>
                Features: {[
                  config.enableTables && 'Tables',
                  config.enableTaskLists && 'Tasks',
                  config.enableStrikethrough && 'Strikethrough',
                  config.enableAutolinks && 'Autolinks',
                  config.generateToc && 'TOC'
                ].filter(Boolean).join(', ') || 'Basic only'}
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Examples:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example.name}
                  onClick={() => insertExample(example)}
                  className="px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded border transition-colors"
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {example.input.length > 40 ? 
                      example.input.substring(0, 40) + '...' : 
                      example.input
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Statistics:
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Words:</span>
                    <span className="font-mono">{stats.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                    <span className="font-mono">{stats.characterCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lines:</span>
                    <span className="font-mono">{stats.lineCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Headings:</span>
                    <span className="font-mono">{stats.headingCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Links:</span>
                    <span className="font-mono">{stats.linkCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Images:</span>
                    <span className="font-mono">{stats.imageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Code Blocks:</span>
                    <span className="font-mono">{stats.codeBlockCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tables:</span>
                    <span className="font-mono">{stats.tableCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Size Change:</span>
                  <span className="font-mono">{stats.originalSize} → {stats.processedSize}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Output Panel */}
      <OutputPanel
        value={output}
        error={error}
        isLoading={isLoading}
        label={outputLabel}
        syntax={outputSyntax}
        downloadFilename={`converted.${config.mode === 'markdown-to-html' ? 'html' : 'md'}`}
        downloadContentType={config.mode === 'markdown-to-html' ? 'text/html' : 'text/markdown'}
      />
    </div>
  );
}