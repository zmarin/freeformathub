import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCssSelectorGenerator, type CssSelectorGeneratorConfig, HTML_ELEMENTS, PSEUDO_CLASSES } from '../../../tools/web/css-selector-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CssSelectorGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: CssSelectorGeneratorConfig = {
  targetType: 'element',
  specificity: 'medium',
  includeTagName: true,
  includeParents: false,
  maxParentLevels: 2,
  preferClasses: true,
  preferIds: false,
  useNthChild: false,
  generateMultiple: true,
  outputFormat: 'css',
  includeComments: true,
  minifyOutput: false,
};

const TARGET_OPTIONS = [
  {
    key: 'targetType',
    label: 'Selector Type',
    type: 'select' as const,
    default: 'element',
    options: [
      { value: 'element', label: '🏷️ Element - HTML tag selectors' },
      { value: 'class', label: '📦 Class - Class-based selectors' },
      { value: 'id', label: '🆔 ID - Unique identifier selectors' },
      { value: 'attribute', label: '🔧 Attribute - Attribute-based selectors' },
      { value: 'pseudo', label: '✨ Pseudo - Pseudo-class selectors' },
      { value: 'combined', label: '🔗 Combined - Complex combinatorial selectors' },
    ],
    description: 'Type of CSS selector to generate',
  },
] as const;

const SPECIFICITY_OPTIONS = [
  {
    key: 'specificity',
    label: 'Specificity Level',
    type: 'select' as const,
    default: 'medium',
    options: [
      { value: 'low', label: '⬇️ Low - Simple selectors (≤20)' },
      { value: 'medium', label: '➡️ Medium - Balanced selectors (10-50)' },
      { value: 'high', label: '⬆️ High - Specific selectors (>30)' },
    ],
    description: 'CSS specificity level for generated selectors',
  },
] as const;

const OUTPUT_OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'css',
    options: [
      { value: 'css', label: '🎨 CSS - Stylesheet format' },
      { value: 'javascript', label: '⚡ JavaScript - Object format for JS' },
      { value: 'xpath', label: '🗂️ XPath - XML/HTML path expressions' },
    ],
    description: 'Format for the generated output',
  },
  {
    key: 'generateMultiple',
    label: 'Generate Multiple',
    type: 'checkbox' as const,
    default: true,
    description: 'Generate multiple selector variations',
  },
  {
    key: 'includeComments',
    label: 'Include Comments',
    type: 'checkbox' as const,
    default: true,
    description: 'Add explanatory comments to output',
  },
  {
    key: 'minifyOutput',
    label: 'Minify Output',
    type: 'checkbox' as const,
    default: false,
    description: 'Remove extra whitespace for compact output',
  },
] as const;

const SELECTOR_OPTIONS = [
  {
    key: 'includeTagName',
    label: 'Include Tag Names',
    type: 'checkbox' as const,
    default: true,
    description: 'Include HTML element names in selectors',
  },
  {
    key: 'preferClasses',
    label: 'Prefer Classes',
    type: 'checkbox' as const,
    default: true,
    description: 'Generate class-based selector variants',
  },
  {
    key: 'preferIds',
    label: 'Prefer IDs',
    type: 'checkbox' as const,
    default: false,
    description: 'Generate ID-based selector variants',
  },
  {
    key: 'useNthChild',
    label: 'Use nth-child',
    type: 'checkbox' as const,
    default: false,
    description: 'Include positional pseudo-class selectors',
  },
] as const;

export function CssSelectorGenerator({ className = '' }: CssSelectorGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectors, setSelectors] = useState<any[]>([]);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CssSelectorGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce((currentInput: string, currentConfig: CssSelectorGeneratorConfig) => {
      // Some selector types don't require input
      if (!currentInput.trim() && !['pseudo', 'combined', 'attribute'].includes(currentConfig.targetType)) {
        setOutput('');
        setSelectors([]);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processCssSelectorGenerator(currentInput, currentConfig);
        
        if (result.success && result.output !== undefined) {
          setOutput(result.output);
          setSelectors(result.selectors || []);
          
          // Add to history
          addToHistory({
            toolId: 'css-selector-generator',
            input: currentInput || `${currentConfig.targetType} selectors`,
            output: result.output.substring(0, 200) + (result.output.length > 200 ? '...' : ''),
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to generate CSS selectors');
          setOutput('');
          setSelectors([]);
        }
      } catch (err) {
        setError('An unexpected error occurred while generating selectors');
        setOutput('');
        setSelectors([]);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('css-selector-generator');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickExample = (type: 'button' | 'nav-item' | 'modal' | 'form-input' | 'pseudo' | 'combined') => {
    const examples = {
      button: { input: 'button', config: { targetType: 'element' as const } },
      'nav-item': { input: 'nav-item', config: { targetType: 'class' as const } },
      modal: { input: 'modal', config: { targetType: 'id' as const } },
      'form-input': { input: '', config: { targetType: 'attribute' as const } },
      pseudo: { input: '', config: { targetType: 'pseudo' as const } },
      combined: { input: '', config: { targetType: 'combined' as const } }
    };
    
    const example = examples[type];
    setInput(example.input);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const handleElementSelect = (element: string) => {
    setInput(element);
    setConfig(prev => ({ ...prev, targetType: 'element' }));
  };

  const handlePseudoSelect = (pseudo: string) => {
    setInput(`element${pseudo}`);
    setConfig(prev => ({ ...prev, targetType: 'pseudo' }));
  };

  // Build conditional options
  const allOptions = [
    ...TARGET_OPTIONS,
    ...SPECIFICITY_OPTIONS,
    ...OUTPUT_OPTIONS,
    ...(config.targetType === 'element' || config.targetType === 'class' ? SELECTOR_OPTIONS.filter(opt => {
      // Show tag name option for class selectors
      if (opt.key === 'includeTagName' && config.targetType === 'class') return true;
      // Show all options for element selectors
      if (config.targetType === 'element') return true;
      return false;
    }) : []),
  ];

  const inputPlaceholder = {
    element: 'Enter HTML element name (e.g., div, button, nav)...',
    class: 'Enter class name (e.g., nav-item, btn-primary)...',
    id: 'Enter ID name (e.g., header, modal, main-content)...',
    attribute: 'Attribute selectors will be generated automatically',
    pseudo: 'Pseudo-class selectors will be generated automatically',
    combined: 'Complex selectors will be generated automatically'
  }[config.targetType];

  const needsInput = !['pseudo', 'combined', 'attribute'].includes(config.targetType);

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Examples</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickExample('button')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
            >
              🏷️ Button Element
            </button>
            <button
              onClick={() => handleQuickExample('nav-item')}
              className="px-3 py-2 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
            >
              📦 Nav Class
            </button>
            <button
              onClick={() => handleQuickExample('modal')}
              className="px-3 py-2 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
            >
              🆔 Modal ID
            </button>
            <button
              onClick={() => handleQuickExample('pseudo')}
              className="px-3 py-2 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition-colors"
            >
              ✨ Pseudo Classes
            </button>
          </div>
        </div>

        <OptionsPanel
          title="Generator Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* HTML Elements Reference */}
        {config.targetType === 'element' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Common HTML Elements</h3>
            <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
              {HTML_ELEMENTS.map(element => (
                <button
                  key={element}
                  onClick={() => handleElementSelect(element)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    input === element
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {element}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pseudo-classes Reference */}
        {config.targetType === 'pseudo' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Common Pseudo-classes</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {PSEUDO_CLASSES.map(pseudo => (
                <button
                  key={pseudo}
                  onClick={() => handlePseudoSelect(pseudo)}
                  className="w-full px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-left"
                >
                  <code>{pseudo}</code>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector Information */}
        {selectors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Generated Selectors</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectors.slice(0, 5).map((sel, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-mono text-blue-600">{sel.selector}</div>
                  <div className="text-gray-600 mt-1">{sel.description}</div>
                  <div className="text-gray-500">Specificity: {sel.specificity}</div>
                </div>
              ))}
              {selectors.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{selectors.length - 5} more selectors in output
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSS Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">CSS Selector Tips</h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-800">Specificity Order</div>
              <div className="text-blue-700">IDs (100) &gt; Classes (10) &gt; Elements (1)</div>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <div className="font-medium text-green-800">Performance</div>
              <div className="text-green-700">Short selectors are faster than complex ones</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="font-medium text-purple-800">Best Practice</div>
              <div className="text-purple-700">Use classes for styling, IDs for unique elements</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {needsInput && (
          <InputPanel
            title="Target Element or Name"
            value={input}
            onChange={setInput}
            placeholder={inputPlaceholder}
            language="text"
          />
        )}

        <OutputPanel
          title={`Generated ${config.outputFormat.toUpperCase()} Selectors`}
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'css' ? 'css' : config.outputFormat === 'javascript' ? 'javascript' : 'xml'}
          placeholder="Configure options and input to generate CSS selectors..."
          processingMessage="Generating CSS selectors..."
          customActions={
            output ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Selectors
                </button>
                <button
                  onClick={() => {
                    const extension = config.outputFormat === 'css' ? 'css' : 
                                     config.outputFormat === 'javascript' ? 'js' : 'txt';
                    const mimeType = config.outputFormat === 'css' ? 'text/css' : 
                                    config.outputFormat === 'javascript' ? 'application/javascript' : 'text/plain';
                    const blob = new Blob([output], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `selectors.${extension}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  💾 Download File
                </button>
                {selectors.length > 0 && (
                  <button
                    onClick={() => {
                      const selectorList = selectors.map(s => 
                        `${s.selector} (Specificity: ${s.specificity})\n${s.description}`
                      ).join('\n\n');
                      navigator.clipboard?.writeText(selectorList);
                    }}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    📊 Copy Selector List
                  </button>
                )}
                <button
                  onClick={() => {
                    const testHtml = `<!DOCTYPE html>
<html>
<head>
  <title>CSS Selector Test</title>
  <style>
${output.replace(/\/\* Add your styles here \*\//g, 'background: yellow; border: 2px solid red;')}
  </style>
</head>
<body>
  <h1>Test your selectors with this HTML</h1>
  <div class="container">
    <nav class="nav">
      <ul>
        <li><a href="#" class="nav-item">Home</a></li>
        <li><a href="#" class="nav-item active">About</a></li>
      </ul>
    </nav>
    <main id="main-content">
      <p>Sample paragraph text</p>
      <button class="btn btn-primary">Click me</button>
    </main>
  </div>
</body>
</html>`;
                    const blob = new Blob([testHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'selector-test.html';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  🧪 Test HTML
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}