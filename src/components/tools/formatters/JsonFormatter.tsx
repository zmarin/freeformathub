import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { formatJson, type JsonFormatterConfig } from '../../../tools/formatters/json-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard } from '../../../lib/utils';
import { runJsonPath, type JsonPathResult } from '../../../tools/development/json-path-extractor';
import { validateJsonAgainstSchema } from '../../../lib/utils/jsonSchema';

interface JsonFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: JsonFormatterConfig = {
  indent: 2,
  sortKeys: false,
  removeComments: true,
  validateOnly: false,
  useTabs: false,
  sortKeysCaseInsensitive: false,
  allowSingleQuotes: true,
  replaceSpecialNumbers: 'none',
  inlineShortArrays: true,
  inlineArrayMaxLength: 5,
  inlineArrayMaxLineLength: 80,
  escapeUnicode: false,
  ensureFinalNewline: false,
  detectDuplicateKeys: true,
};

const OPTIONS = [
  {
    key: 'indent',
    label: 'Indentation',
    type: 'select' as const,
    default: 2,
    options: [
      { value: '0', label: 'Minified (no spaces)' },
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '8', label: '8 spaces' },
    ],
    description: 'Number of spaces for indentation (0 for minified)',
  },
  {
    key: 'useTabs',
    label: 'Use Tabs for Indent',
    type: 'boolean' as const,
    default: false,
    description: 'Indent with tabs instead of spaces (ignored when minified)',
    showWhen: (cfg) => Number(cfg.indent ?? 2) > 0,
  },
  {
    key: 'sortKeys',
    label: 'Sort Keys',
    type: 'boolean' as const,
    default: false,
    description: 'Alphabetically sort object keys',
  },
  {
    key: 'sortKeysCaseInsensitive',
    label: 'Case-Insensitive Sort',
    type: 'boolean' as const,
    default: false,
    description: 'Sort keys without case sensitivity',
    showWhen: (cfg) => !!cfg.sortKeys,
  },
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: true,
    description: 'Strip // and /* */ comments (makes invalid JSON valid)',
  },
  {
    key: 'allowSingleQuotes',
    label: 'Allow Single Quotes',
    type: 'boolean' as const,
    default: true,
    description: 'Convert single-quoted strings to JSON-safe double quotes',
  },
  {
    key: 'replaceSpecialNumbers',
    label: 'Special Numbers (NaN/Infinity)',
    type: 'select' as const,
    default: 'none',
    options: [
      { value: 'none', label: 'Leave as-is (may error)' },
      { value: 'null', label: 'Replace with null' },
      { value: 'string', label: 'Replace with strings' },
    ],
    description: 'Handle NaN/Infinity tokens outside of strings',
  },
  {
    key: 'inlineShortArrays',
    label: 'Inline Short Arrays',
    type: 'boolean' as const,
    default: true,
    description: 'Keep short arrays of primitives on one line',
    showWhen: (cfg) => Number(cfg.indent ?? 2) > 0,
  },
  {
    key: 'inlineArrayMaxLength',
    label: 'Inline Array Max Items',
    type: 'select' as const,
    default: 5,
    options: [
      { value: '3', label: '3' },
      { value: '5', label: '5' },
      { value: '8', label: '8' },
      { value: '12', label: '12' },
    ],
    description: 'Max number of primitive items to inline',
    showWhen: (cfg) => !!cfg.inlineShortArrays && Number(cfg.indent ?? 2) > 0,
  },
  {
    key: 'inlineArrayMaxLineLength',
    label: 'Inline Array Max Line Length',
    type: 'number' as const,
    default: 80,
    min: 20,
    max: 200,
    description: 'Limit the inline array length (characters)',
    showWhen: (cfg) => !!cfg.inlineShortArrays && Number(cfg.indent ?? 2) > 0,
  },
  {
    key: 'escapeUnicode',
    label: 'Escape Non-ASCII (Unicode)',
    type: 'boolean' as const,
    default: false,
    description: 'Escape all non-ASCII characters as Unicode sequences',
  },
  {
    key: 'ensureFinalNewline',
    label: 'Final Newline',
    type: 'boolean' as const,
    default: false,
    description: 'Ensure a trailing newline at end of file',
  },
  {
    key: 'validateOnly',
    label: 'Validate Only',
    type: 'boolean' as const,
    default: false,
    description: 'Only validate JSON without formatting output',
  },
  {
    key: 'detectDuplicateKeys',
    label: 'Detect Duplicate Keys',
    type: 'boolean' as const,
    default: true,
    description: 'Report duplicate object keys (may indicate data issues)',
  },
];

const EXAMPLES = [
  {
    title: 'Basic Object',
    value: '{"name":"John","age":30,"city":"New York"}',
  },
  {
    title: 'Nested Structure',
    value: '{"user":{"profile":{"name":"Jane","settings":{"theme":"dark","notifications":true}},"posts":[{"id":1,"title":"Hello World"},{"id":2,"title":"Getting Started"}]}}',
  },
  {
    title: 'Array of Objects',
    value: '[{"id":1,"name":"Item 1","active":true},{"id":2,"name":"Item 2","active":false}]',
  },
  {
    title: 'With Comments (Invalid JSON)',
    value: `{
  // User information
  "name": "John",
  "age": 30, // Age in years
  "city": "New York"
}`,
  },
];

export function JsonFormatter({ className = '' }: JsonFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<JsonFormatterConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [activeTab, setActiveTab] = useState<'formatted' | 'tree' | 'jsonpath' | 'schema'>('formatted');
  // JSONPath
  const [pathExpr, setPathExpr] = useState<string>('$');
  const [pathResults, setPathResults] = useState<JsonPathResult[]>([]);
  const [pathError, setPathError] = useState<string | undefined>();
  // Schema
  const [schemaText, setSchemaText] = useState<string>('');
  const [schemaResult, setSchemaResult] = useState<{ valid: boolean; errors: Array<{ path: string; message: string }> } | undefined>();
  const [schemaParseError, setSchemaParseError] = useState<string | undefined>();
  // Tree controls
  const [treeExpandAllTick, setTreeExpandAllTick] = useState(0);
  const [treeCollapseAllTick, setTreeCollapseAllTick] = useState(0);
  const [collapseToMatchesTick, setCollapseToMatchesTick] = useState(0);
  // Toast queue
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
  const enqueueToast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1600);
  }, []);

  const { addToHistory } = useToolStore();

  // Convert string values from select to numbers for indent
  const processedConfig = useMemo(() => ({
    ...config,
    indent: parseInt(String(config.indent)) || 2,
  }), [config]);

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: JsonFormatterConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setMetadata(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = formatJson(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          setMetadata(result.metadata);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'json-formatter',
            input: inputText,
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
          setMetadata(undefined);
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, processedConfig);
  }, [input, processedConfig, debouncedProcess]);

  // Parsed data for Tree/JSONPath/Schema panels
  const parsedData = useMemo(() => {
    try {
      if (!error && output) {
        return JSON.parse(output);
      }
    } catch {}
    return undefined;
  }, [output, error]);

  // JSONPath evaluation (debounced)
  const runPathDebounced = useMemo(
    () => debounce((expr: string, data: any) => {
      if (!data || !expr || !expr.trim()) {
        setPathResults([]);
        setPathError(undefined);
        return;
      }
      try {
        const results = runJsonPath(data, expr.trim());
        setPathResults(results);
        setPathError(undefined);
      } catch (e: any) {
        setPathResults([]);
        setPathError(e?.message || 'Invalid JSONPath');
      }
    }, 200),
    []
  );

  useEffect(() => {
    // Keep results up-to-date even across tabs for highlighting
    runPathDebounced(pathExpr, parsedData);
  }, [pathExpr, parsedData, runPathDebounced]);

  // Set of matched paths for highlighting in tree
  const matchedPaths = useMemo(() => {
    if (!parsedData || !pathExpr || !pathExpr.trim().startsWith('$')) return new Set<string>();
    try {
      const results = runJsonPath(parsedData, pathExpr.trim());
      return new Set(results.map(r => r.path));
    } catch {
      return new Set<string>();
    }
  }, [parsedData, pathExpr]);

  // Schema validation
  const parseSchema = useCallback((text: string) => {
    try {
      const s = JSON.parse(text);
      setSchemaParseError(undefined);
      return s;
    } catch (e: any) {
      setSchemaParseError(e?.message || 'Invalid schema JSON');
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'schema') return;
    if (!schemaText || !parsedData) {
      setSchemaResult(undefined);
      return;
    }
    const s = parseSchema(schemaText);
    if (!s) {
      setSchemaResult(undefined);
      return;
    }
    const res = validateJsonAgainstSchema(parsedData, s);
    setSchemaResult(res);
  }, [schemaText, parsedData, parseSchema, activeTab]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: JsonFormatterConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label="JSON Input"
          placeholder="Paste your JSON here..."
          syntax="json"
          examples={EXAMPLES}
          accept=".json,.txt"
        />
        
        {/* Options */}
        <OptionsPanel
          options={OPTIONS}
          config={config}
          onChange={handleConfigChange}
        />
      </div>

      {/* Right Side: Tabs */}
      <div className="flex flex-col h-full relative">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
          {[
            { id: 'formatted', label: 'Formatted' },
            { id: 'tree', label: 'Tree' },
            { id: 'jsonpath', label: 'JSONPath' },
            { id: 'schema', label: 'Schema' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'formatted' && (
          <div>
            <OutputPanel
              value={output}
              error={error}
              isLoading={isLoading}
              label="Formatted JSON"
              syntax="json"
              showLineNumbers={true}
              downloadFilename="formatted.json"
              downloadContentType="application/json"
              onOpenInNewTab={() => {
                try {
                  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  sessionStorage.setItem(`ffh.json.${id}`, output || '');
                  const base = (import.meta as any).env?.BASE_URL || '/';
                  const url = `${base.replace(/\/$/, '')}/viewer/json?id=${encodeURIComponent(id)}`;
                  window.open(url, '_blank');
                } catch (e) {
                  // no-op
                }
              }}
              openButtonLabel="Open viewer"
            />

            {/* Analysis panel */}
            {metadata && !error && !isLoading && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {metadata.type && <span><strong>Type:</strong> {metadata.type}</span>}
                  {typeof metadata.depth === 'number' && <span><strong>Depth:</strong> {metadata.depth}</span>}
                  {typeof metadata.originalSize === 'number' && typeof metadata.formattedSize === 'number' && (
                    <span>
                      <strong>Size:</strong> {metadata.formattedSize} chars ({metadata.compressionRatio}% delta)
                    </span>
                  )}
                  {typeof metadata.duplicateCount === 'number' && (
                    <span className={metadata.duplicateCount > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                      <strong>Duplicate keys:</strong> {metadata.duplicateCount}
                    </span>
                  )}
                  {typeof metadata.processingTimeMs === 'number' && (
                    <span><strong>Processed:</strong> {Math.round(metadata.processingTimeMs)} ms</span>
                  )}
                </div>
                {Array.isArray(metadata.duplicates) && metadata.duplicates.length > 0 && (
                  <div className="mt-2 text-[11px] text-red-700 dark:text-red-300">
                    <div className="font-medium">Duplicate keys detected (last occurrence wins):</div>
                    <ul className="list-disc ml-5 mt-1 space-y-0.5">
                      {metadata.duplicates.slice(0, 5).map((d: any, idx: number) => (
                        <li key={idx}>{d.path ? d.path + '.' : ''}{d.key} @ line {d.line}, col {d.column}</li>
                      ))}
                      {metadata.duplicates.length > 5 && (
                        <li>...and {metadata.duplicates.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 text-xs">
              <div className="flex items-center gap-2">
                <button onClick={() => setTreeExpandAllTick(t => t + 1)} className="px-2 py-1 rounded border bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Expand all</button>
                <button onClick={() => setTreeCollapseAllTick(t => t + 1)} className="px-2 py-1 rounded border bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Collapse all</button>
                <button
                  onClick={() => setCollapseToMatchesTick(t => t + 1)}
                  disabled={!parsedData || matchedPaths.size === 0}
                  className={`px-2 py-1 rounded border ${matchedPaths.size === 0 ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  title="Collapse all non-matching branches"
                >
                  Collapse to matches
                </button>
              </div>
              <div className="text-gray-500 dark:text-gray-400">Matches: {matchedPaths.size}</div>
            </div>
            {parsedData ? (
              <JsonTree
                data={parsedData}
                highlightPaths={matchedPaths}
                expandAllSignal={treeExpandAllTick}
                collapseAllSignal={treeCollapseAllTick}
                focusSignal={collapseToMatchesTick}
                focusPaths={matchedPaths}
                onCopyFeedback={(msg) => {
                  enqueueToast(msg || 'Copied!');
                }}
              />
            ) : (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Provide valid JSON to view the tree.</div>
            )}
          </div>
        )}

        {activeTab === 'jsonpath' && (
          <div className="bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
              <label className="text-sm text-gray-700 dark:text-gray-300">Path:</label>
              <input
                value={pathExpr}
                onChange={(e) => setPathExpr(e.target.value)}
                placeholder="$.store.book[*].author"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">{pathResults.length} result(s)</span>
            </div>
            {!parsedData && (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Provide valid JSON to run queries.</div>
            )}
            {parsedData && pathError && (
              <div className="p-4 text-sm text-red-600 dark:text-red-400">{pathError}</div>
            )}
            {parsedData && !pathError && (
              <div className="p-2">
                {pathResults.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No results.</div>
                ) : (
                  <div className="max-h-[480px] overflow-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {pathResults.slice(0, 500).map((r, idx) => (
                      <div key={idx} className="p-3 text-sm font-mono">
                        <div className="text-blue-700 dark:text-blue-300 break-all">{r.path}</div>
                        <pre className="mt-1 text-xs whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">{JSON.stringify(r.value, null, 2)}</pre>
                      </div>
                    ))}
                    {pathResults.length > 500 && (
                      <div className="p-2 text-xs text-gray-500">Showing first 500 of {pathResults.length} results</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">Paste a JSON Schema to validate the current JSON.</div>
              <label className="text-xs cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded border text-gray-700 dark:text-gray-300">
                Upload Schema
                <input type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const text = await f.text();
                    setSchemaText(text);
                  } catch {}
                }} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="border-r border-gray-200 dark:border-gray-700">
                <textarea
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  placeholder={`{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  },
  "required": ["name"]
}`}
                  rows={14}
                  className="w-full p-3 text-sm font-mono bg-transparent border-none resize-none text-gray-900 dark:text-gray-100 focus:outline-none"
                />
                {schemaParseError && (
                  <div className="px-3 pb-3 text-xs text-red-600 dark:text-red-400">Schema parse error: {schemaParseError}</div>
                )}
              </div>
              <div>
                {!parsedData ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Provide valid JSON to validate.</div>
                ) : !schemaText ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Paste or upload a JSON Schema.</div>
                ) : schemaResult ? (
                  <div className="p-3 text-sm">
                    {schemaResult.valid ? (
                      <div className="text-green-700 dark:text-green-400">Valid ✓</div>
                    ) : (
                      <div>
                        <div className="text-red-700 dark:text-red-400 mb-2">{schemaResult.errors.length} error(s):</div>
                        <ul className="text-xs space-y-1">
                          {schemaResult.errors.slice(0, 200).map((e, idx) => (
                            <li key={idx} className="break-words"><span className="text-gray-500">{e.path}:</span> {e.message}</li>
                          ))}
                          {schemaResult.errors.length > 200 && (
                            <li>...and {schemaResult.errors.length - 200} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Validating...</div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Toast */}
        {toasts.length > 0 && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            {toasts.map((t) => (
              <div key={t.id} className="px-3 py-2 rounded shadow bg-gray-900 text-white text-xs flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a1 1 0 00-1.414-1.414L9 10.586 7.557 9.143a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4.3-4.366z" clipRule="evenodd"/></svg>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple collapsible JSON tree view
function JsonTree({ data, highlightPaths, expandAllSignal, collapseAllSignal, focusPaths, focusSignal, onCopyFeedback }: { data: any; highlightPaths?: Set<string>; expandAllSignal?: number; collapseAllSignal?: number; focusPaths?: Set<string>; focusSignal?: number; onCopyFeedback?: (msg: string) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Expand/collapse all via signals
  useEffect(() => {
    // expand all
    setCollapsed(new Set());
  }, [expandAllSignal]);

  useEffect(() => {
    // collapse all: collect container paths
    const all = new Set<string>();
    const walk = (node: any, path: string) => {
      if (node && typeof node === 'object') {
        all.add(path);
        if (Array.isArray(node)) {
          for (let i = 0; i < node.length; i++) walk(node[i], `${path}[${i}]`);
        } else {
          for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
        }
      }
    };
    walk(data, '$');
    setCollapsed(all);
  }, [collapseAllSignal, data]);

  // Collapse to focus (matches)
  useEffect(() => {
    if (!focusPaths || focusPaths.size === 0) return;
    // Start collapsed on all containers
    const all = new Set<string>();
    const walk = (node: any, path: string) => {
      if (node && typeof node === 'object') {
        all.add(path);
        if (Array.isArray(node)) {
          for (let i = 0; i < node.length; i++) walk(node[i], `${path}[${i}]`);
        } else {
          for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
        }
      }
    };
    walk(data, '$');

    const open = new Set<string>();
    const addAncestors = (p: string) => {
      let cur = p;
      while (cur && cur !== '$') {
        open.add(cur);
        // parent
        if (cur.endsWith(']')) {
          const i = cur.lastIndexOf('[');
          cur = i > -1 ? cur.slice(0, i) : '$';
          continue;
        }
        const j = cur.lastIndexOf('.');
        cur = j > -1 ? cur.slice(0, j) : '$';
      }
      open.add('$');
    };
    focusPaths.forEach((p) => addAncestors(p));

    // Remove all open paths from collapsed set
    open.forEach((p) => all.delete(p));
    setCollapsed(all);
  }, [focusSignal, focusPaths, data]);

  const toggle = (p: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  return (
    <div className="p-3 max-h-[640px] overflow-auto text-sm font-mono">
      <TreeNode data={data} path="$" level={0} collapsed={collapsed} toggle={toggle} highlightPaths={highlightPaths} onCopyFeedback={onCopyFeedback} />
    </div>
  );
}

function TreeNode({ data, path, level, collapsed, toggle, highlightPaths, onCopyFeedback }: { data: any; path: string; level: number; collapsed: Set<string>; toggle: (p: string) => void; highlightPaths?: Set<string>; onCopyFeedback?: (msg: string) => void }) {
  const isObj = data && typeof data === 'object' && !Array.isArray(data);
  const isArr = Array.isArray(data);
  const indent = { paddingLeft: `${level * 16}px` } as const;
  const isCollapsed = collapsed.has(path);
  const isHighlighted = !!highlightPaths && highlightPaths.has(path);
  const copyPath = async (p: string) => {
    try { await copyToClipboard(p); onCopyFeedback?.('Path copied'); } catch { onCopyFeedback?.('Copy failed'); }
  };
  const copyValue = async (v: any) => {
    try { await copyToClipboard(safeStringify(v)); onCopyFeedback?.('Value copied'); } catch { onCopyFeedback?.('Copy failed'); }
  };
  const pressTimer = useRef<any>(null);
  const longPressFired = useRef(false);
  const startLongPress = (val: any) => {
    clearTimeout(pressTimer.current);
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      copyValue(val);
    }, 600);
  };
  const endLongPress = () => {
    clearTimeout(pressTimer.current);
    // No action here; click handler will check longPressFired
  };

  if (!isObj && !isArr) {
    return (
      <div style={indent} className={`py-0.5 ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}>
        <span
          className="text-gray-500 cursor-pointer hover:underline"
          title="Click to copy path (long-press to copy value)"
          onMouseDown={() => startLongPress(data)}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={() => startLongPress(data)}
          onTouchEnd={endLongPress}
          onTouchCancel={endLongPress}
          onClick={() => {
            if (longPressFired.current) { longPressFired.current = false; return; }
            copyPath(path);
          }}
        >
          {formatKey(path)}
        </span>: <Value value={data} />
        <span className="ml-2 inline-flex gap-1">
          <SmallBtn onClick={() => copyPath(path)}>Copy path</SmallBtn>
          <SmallBtn onClick={() => copyValue(data)}>Copy value</SmallBtn>
        </span>
      </div>
    );
  }

  const entries = isArr ? data.map((v: any, i: number) => [i, v]) : Object.entries(data);
  const summary = isArr ? `[${entries.length}]` : `{${entries.length}}`;

  return (
    <div>
      <div style={indent} className={`py-0.5 ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}>
        <button onClick={() => toggle(path)} className="mr-1 text-xs w-5 inline-flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
          {isCollapsed ? '+' : '-'}
        </button>
        <span
          className="text-blue-700 dark:text-blue-300 cursor-pointer hover:underline"
          title="Click to copy path (long-press to copy value)"
          onMouseDown={() => startLongPress(data)}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={() => startLongPress(data)}
          onTouchEnd={endLongPress}
          onTouchCancel={endLongPress}
          onClick={() => {
            if (longPressFired.current) { longPressFired.current = false; return; }
            copyPath(path);
          }}
        >
          {formatKey(path)}
        </span> <span className="text-gray-500">{summary}</span>
        <span className="ml-2 inline-flex gap-1">
          <SmallBtn onClick={() => copyPath(path)}>Copy path</SmallBtn>
          <SmallBtn onClick={() => copyValue(data)}>Copy value</SmallBtn>
        </span>
      </div>
      {!isCollapsed && (
        <div>
          {entries.map(([k, v]: any) => (
            <div key={k}>
              {(() => {
                const childPath = `${path}${isArr ? `[${k}]` : `.${k}`}`;
                const childHighlighted = !!highlightPaths && highlightPaths.has(childPath);
                return (
                  <div style={{ paddingLeft: `${(level + 1) * 16}px` }} className={`py-0.5 ${childHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}>
                    <span
                      className="text-gray-500 cursor-pointer hover:underline"
                      title="Click to copy path (long-press to copy value)"
                      onMouseDown={() => startLongPress(v)}
                      onMouseUp={endLongPress}
                      onMouseLeave={endLongPress}
                      onTouchStart={() => startLongPress(v)}
                      onTouchEnd={endLongPress}
                      onTouchCancel={endLongPress}
                      onClick={() => {
                        if (longPressFired.current) { longPressFired.current = false; return; }
                        copyPath(childPath);
                      }}
                    >
                      {String(k)}
                    </span>
                    {isPrimitive(v) ? (
                      <span>: <Value value={v} /></span>
                    ) : null}
                    <span className="ml-2 inline-flex gap-1">
                      <SmallBtn onClick={() => copyPath(childPath)}>Copy path</SmallBtn>
                      <SmallBtn onClick={() => copyValue(v)}>Copy value</SmallBtn>
                    </span>
                  </div>
                );
              })()}
              {!isPrimitive(v) && (
                <TreeNode data={v} path={`${path}${isArr ? `[${k}]` : `.${k}`}`} level={level + 1} collapsed={collapsed} toggle={toggle} highlightPaths={highlightPaths} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isPrimitive(v: any) { return v === null || typeof v !== 'object'; }
function formatKey(path: string) {
  if (path === '$') return '$';
  const m = path.match(/[^.\[]+$/);
  return m ? m[0] : path;
}
function Value({ value }: { value: any }) {
  if (value === null) return <span className="text-purple-600">null</span> as any;
  switch (typeof value) {
    case 'string': return <span className="text-green-700 dark:text-green-400">"{value}"</span> as any;
    case 'number': return <span className="text-orange-600">{String(value)}</span> as any;
    case 'boolean': return <span className="text-indigo-600">{String(value)}</span> as any;
    default: return <span>{String(value)}</span> as any;
  }
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: any }) {
  return (
    <button onClick={onClick} className="px-1.5 py-0.5 text-[10px] rounded border bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
      {children}
    </button>
  ) as any;
}

function safeStringify(v: any): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    try { return String(v); } catch { return ''; }
  }
}
