import { useState, useEffect, useMemo, useCallback } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { validateHtml5, type Html5ValidatorConfig } from '../../../tools/validators/html5-validator';
import { useToolStore } from '../../../lib/store';
import { debounce, copyToClipboard, downloadFile } from '../../../lib/utils';

interface Html5ValidatorProps {
  className?: string;
}

const DEFAULT_CONFIG: Html5ValidatorConfig = {
  includeWarnings: true,
  prettifyOutput: true,
  indentSize: 2,
};

const OPTIONS = [
  {
    key: 'includeWarnings',
    label: 'Show Warnings',
    type: 'boolean' as const,
    default: true,
    description: 'Display advisory messages alongside blocking errors',
  },
  {
    key: 'prettifyOutput',
    label: 'Prettify Valid HTML',
    type: 'boolean' as const,
    default: true,
    description: 'Generate formatted HTML output when validation succeeds',
  },
  {
    key: 'indentSize',
    label: 'Indent Size',
    type: 'select' as const,
    default: '2',
    options: [
      { value: '2', label: '2 spaces' },
      { value: '4', label: '4 spaces' },
      { value: '0', label: 'Minified' },
    ],
    description: 'Spacing for optional prettified output',
    showWhen: (cfg: Html5ValidatorConfig) => cfg.prettifyOutput,
  },
];

const HTML_EXAMPLES = [
  {
    title: 'Unclosed paragraph',
    value: `<section>
  <h2>Announcement</h2>
  <p>This paragraph is missing its closing tag
  <div class="cta">Read more</div>
</section>`,
  },
  {
    title: 'Valid layout',
    value: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Landing Page</title>
  </head>
  <body>
    <header>
      <nav>...</nav>
    </header>
    <main>
      <article>
        <h1>Headline</h1>
        <p>Intro content</p>
      </article>
    </main>
    <footer>© 2025 Example Inc.</footer>
  </body>
</html>`,
  },
];

export function Html5Validator({ className = '' }: Html5ValidatorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [config, setConfig] = useState<Html5ValidatorConfig>(DEFAULT_CONFIG);
  const [metadata, setMetadata] = useState<Record<string, any> | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [autoValidate, setAutoValidate] = useState(true);

  const { addToHistory, getConfig: getSavedConfig, updateConfig: updateSavedConfig } = useToolStore();

  useEffect(() => {
    try {
      const saved = (getSavedConfig?.('html5-validator') as Partial<Html5ValidatorConfig & {
        input: string;
        autoValidate: boolean;
      }>) || {};

      if (saved && Object.keys(saved).length > 0) {
        setConfig(prev => ({ ...prev, ...saved }));
        if (typeof saved.input === 'string') {
          setInput(saved.input);
        }
        if (typeof saved.autoValidate === 'boolean') {
          setAutoValidate(saved.autoValidate);
        }
      }
    } catch {}
  }, [getSavedConfig]);

  const processedConfig = useMemo(() => ({ ...config }), [config]);
  const optionsState = useMemo(
    () => ({
      ...config,
      indentSize: String(config.indentSize ?? DEFAULT_CONFIG.indentSize),
    }),
    [config]
  );

  const runValidation = useCallback(
    (html: string = input, cfg: Html5ValidatorConfig = processedConfig) => {
      if (!html.trim()) {
        setOutput('');
        setError('Paste HTML to validate.');
        setMetadata(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const result = validateHtml5(html, cfg);

      if (result.success || typeof result.success === 'boolean') {
        setOutput(result.output || '');
        setError(result.error);
        setMetadata(result.metadata as Record<string, any> | undefined);

        if (!result.error) {
          try {
            addToHistory({
              toolId: 'html5-validator',
              input: html,
              output: result.output || '',
              config: cfg,
              timestamp: Date.now(),
            });
          } catch {}
        }
      }

      setIsLoading(false);
    },
    [input, processedConfig, addToHistory]
  );

  const debouncedValidate = useMemo(() => debounce(runValidation, 400), [runValidation]);

  useEffect(() => {
    if (autoValidate) {
      debouncedValidate(input, processedConfig);
    }
  }, [input, processedConfig, debouncedValidate, autoValidate]);

  const handleValidateClick = useCallback(() => {
    runValidation(input, processedConfig);
  }, [runValidation, input, processedConfig]);

  const handleConfigChange = useCallback(
    (incomingConfig: Html5ValidatorConfig) => {
      const newConfig: Html5ValidatorConfig = {
        ...incomingConfig,
        indentSize: Number((incomingConfig as any).indentSize ?? DEFAULT_CONFIG.indentSize),
      };

      setConfig(newConfig);
      try {
        updateSavedConfig?.('html5-validator', {
          ...newConfig,
          input,
          autoValidate,
        });
      } catch {}

      if (autoValidate) {
        debouncedValidate(input, newConfig);
      }
    },
    [updateSavedConfig, input, autoValidate, debouncedValidate]
  );

  const handleToggleAuto = useCallback(() => {
    const next = !autoValidate;
    setAutoValidate(next);
    try {
      updateSavedConfig?.('html5-validator', {
        ...processedConfig,
        input,
        autoValidate: next,
      });
    } catch {}

    if (next) {
      runValidation(input, processedConfig);
    }
  }, [autoValidate, updateSavedConfig, processedConfig, input, runValidation]);

  const handleCopyPrettified = useCallback(async () => {
    if (!metadata?.prettified) return;
    try {
      await copyToClipboard(metadata.prettified as string);
      alert('Prettified HTML copied to clipboard.');
    } catch {
      alert('Failed to copy prettified HTML.');
    }
  }, [metadata]);

  const handleDownloadPrettified = useCallback(() => {
    if (!metadata?.prettified) return;
    downloadFile(metadata.prettified as string, 'validated.html', 'text/html');
  }, [metadata]);

  return (
    <div className={className}>
      <InputPanel
        label="HTML Input"
        placeholder="Paste or drop HTML5 markup to validate..."
        value={input}
        onChange={(value) => {
          setInput(value);
          try {
            updateSavedConfig?.('html5-validator', {
              ...processedConfig,
              input: value,
              autoValidate,
            });
          } catch {}
        }}
        rows={20}
        examples={HTML_EXAMPLES}
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoValidate}
              onChange={handleToggleAuto}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
            />
            Auto-validate
          </label>
          <button
            onClick={handleValidateClick}
            className="ml-auto text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Validate HTML
          </button>
        </div>

        <OptionsPanel
          options={OPTIONS as any}
          config={optionsState as any}
          onChange={cfg => handleConfigChange(cfg as Html5ValidatorConfig)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        />
      </div>

      <div className="mt-6">
        <OutputPanel
          label="Validation Report"
          value={output}
          error={error}
          isLoading={isLoading}
          syntax="markdown"
          downloadFilename="html5-validation.txt"
        />
      </div>

      {metadata?.prettified && (
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Prettified HTML</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrettified}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded border text-gray-700 dark:text-gray-300 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={handleDownloadPrettified}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded border text-gray-700 dark:text-gray-300 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
          <pre className="overflow-auto p-4 text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900/50 whitespace-pre">
            <code>{metadata.prettified}</code>
          </pre>
        </div>
      )}

      {metadata && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs uppercase text-blue-600 dark:text-blue-300 tracking-wide">Status</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {metadata.valid ? 'Valid' : 'Invalid'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide">Errors</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {metadata.errorCount}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide">Warnings</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {metadata.warningCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
