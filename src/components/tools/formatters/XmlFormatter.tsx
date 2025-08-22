import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processXml, type XmlFormatterConfig } from '../../../tools/formatters/xml-formatter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface XmlFormatterProps {
  className?: string;
}

const DEFAULT_CONFIG: XmlFormatterConfig = {
  mode: 'format',
  indent: 2,
  sortAttributes: false,
  removeComments: false,
  removeEmptyNodes: false,
  selfClosingTags: true,
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'format',
    options: [
      { value: 'format', label: 'Format XML' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'minify', label: 'Minify XML' },
      { value: 'convert-to-json', label: 'XML → JSON' },
    ],
    description: 'Choose operation mode',
  },
  {
    key: 'indent',
    label: 'Indentation',
    type: 'number' as const,
    default: 2,
    min: 1,
    max: 8,
    description: 'Number of spaces for indentation',
  },
  {
    key: 'sortAttributes',
    label: 'Sort Attributes',
    type: 'boolean' as const,
    default: false,
    description: 'Sort attributes alphabetically',
  },
  {
    key: 'selfClosingTags',
    label: 'Self-Closing Tags',
    type: 'boolean' as const,
    default: true,
    description: 'Use self-closing syntax for empty elements',
  },
  {
    key: 'removeComments',
    label: 'Remove Comments',
    type: 'boolean' as const,
    default: false,
    description: 'Remove XML comments from output',
  },
  {
    key: 'removeEmptyNodes',
    label: 'Remove Empty Nodes',
    type: 'boolean' as const,
    default: false,
    description: 'Remove empty elements without attributes',
  },
];

const EXAMPLES = [
  {
    title: 'Configuration XML',
    value: '<config version="1.0"><database host="localhost" port="5432"><name>myapp</name><user>admin</user></database><logging level="info"><file>/var/log/app.log</file></logging></config>',
  },
  {
    title: 'RSS Feed',
    value: '<rss version="2.0"><channel><title>Example Feed</title><link>https://example.com</link><description>An example RSS feed</description><item><title>First Post</title><link>https://example.com/1</link><description>Content of first post</description></item></channel></rss>',
  },
  {
    title: 'SOAP Envelope',
    value: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header/><soap:Body><GetUserRequest xmlns="http://example.com/user"><UserId>12345</UserId></GetUserRequest></soap:Body></soap:Envelope>',
  },
  {
    title: 'Maven POM',
    value: '<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>my-app</artifactId><version>1.0.0</version><dependencies><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.12</version></dependency></dependencies></project>',
  },
  {
    title: 'SVG Graphics',
    value: '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/><text x="50" y="55" text-anchor="middle" fill="white">SVG</text></svg>',
  },
  {
    title: 'Android Layout',
    value: '<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"><TextView android:layout_width="wrap_content" android:layout_height="wrap_content" android:text="Hello World!"/></LinearLayout>',
  },
];

export function XmlFormatter({ className = '' }: XmlFormatterProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<XmlFormatterConfig>(DEFAULT_CONFIG);

  const { addToHistory } = useToolStore();

  // Debounced processing to avoid excessive re-computation
  const debouncedProcess = useMemo(
    () => debounce((inputText: string, cfg: XmlFormatterConfig) => {
      if (!inputText.trim()) {
        setOutput('');
        setError(undefined);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const result = processXml(inputText, cfg);
        
        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          
          // Add to history for successful operations
          addToHistory({
            toolId: 'xml-formatter',
            input: inputText,
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
        }
        
        setIsLoading(false);
      }, 100);
    }, 300),
    [addToHistory]
  );

  // Process input when it changes
  useEffect(() => {
    debouncedProcess(input, config);
  }, [input, config, debouncedProcess]);

  // Clear input/output when mode changes
  useEffect(() => {
    if (config.mode === 'convert-to-json') {
      // Don't clear for JSON conversion as users might want to keep their XML
    } else {
      // Clear for other mode changes to avoid confusion
    }
  }, [config.mode]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: XmlFormatterConfig) => {
    setConfig(newConfig);
  };

  const getLabelsForMode = () => {
    switch (config.mode) {
      case 'convert-to-json':
        return {
          input: 'XML Input',
          output: 'JSON Output',
          placeholder: 'Paste XML to convert to JSON...',
          inputSyntax: 'xml',
          outputSyntax: 'json',
        };
      case 'validate':
        return {
          input: 'XML Input',
          output: 'Validation Result',
          placeholder: 'Paste XML to validate...',
          inputSyntax: 'xml',
          outputSyntax: 'text',
        };
      case 'minify':
        return {
          input: 'XML Input',
          output: 'Minified XML',
          placeholder: 'Paste XML to minify...',
          inputSyntax: 'xml',
          outputSyntax: 'xml',
        };
      default:
        return {
          input: 'XML Input',
          output: 'Formatted XML',
          placeholder: 'Paste XML to format...',
          inputSyntax: 'xml',
          outputSyntax: 'xml',
        };
    }
  };

  const labels = getLabelsForMode();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-0 ${className}`}>
      {/* Input Panel */}
      <div className="border-r border-gray-200 dark:border-gray-700">
        <InputPanel
          value={input}
          onChange={handleInputChange}
          label={labels.input}
          placeholder={labels.placeholder}
          syntax={labels.inputSyntax}
          examples={EXAMPLES}
          accept=".xml,.svg,.pom,.rss,.atom"
        />
        
        {/* XML Info Panel */}
        {input && !error && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Elements:</span> {(input.match(/<[^\/!?][^>]*>/g) || []).length}
                </div>
                <div>
                  <span className="font-medium">Attributes:</span> {(input.match(/\w+="[^"]*"/g) || []).length}
                </div>
                <div>
                  <span className="font-medium">Comments:</span> {(input.match(/<!--[\s\S]*?-->/g) || []).length}
                </div>
                <div>
                  <span className="font-medium">Namespaces:</span> {(input.match(/xmlns[^=]*="[^"]*"/g) || []).length}
                </div>
              </div>
            </div>
          </div>
        )}
        
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
        label={labels.output}
        syntax={labels.outputSyntax}
        downloadFilename={
          config.mode === 'convert-to-json' ? 'converted.json' : 
          config.mode === 'minify' ? 'minified.xml' : 'formatted.xml'
        }
        downloadContentType={
          config.mode === 'convert-to-json' ? 'application/json' : 'application/xml'
        }
      />
    </div>
  );
}