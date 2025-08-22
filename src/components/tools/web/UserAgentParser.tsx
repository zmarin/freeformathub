import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUserAgent, type UserAgentConfig } from '../../../tools/web/user-agent-parser';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UserAgentParserProps {
  className?: string;
}

const DEFAULT_CONFIG: UserAgentConfig = {
  outputFormat: 'detailed',
  showFeatures: true,
  detectBots: true,
  includeVersionHistory: false,
  bulkMode: false,
  showRawData: false,
};

const OPTIONS = [
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Analysis' },
      { value: 'simple', label: 'Simple Format' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose how to display the parsing results',
  },
  {
    key: 'detectBots',
    label: 'Bot Detection',
    type: 'checkbox' as const,
    default: true,
    description: 'Identify bots, crawlers, and automated tools',
  },
  {
    key: 'showFeatures',
    label: 'Show Features',
    type: 'checkbox' as const,
    default: true,
    description: 'Display detected browser features and capabilities',
  },
  {
    key: 'showRawData',
    label: 'Show Raw User Agent',
    type: 'checkbox' as const,
    default: false,
    description: 'Include the original user agent string in output',
  },
  {
    key: 'bulkMode',
    label: 'Bulk Mode',
    type: 'checkbox' as const,
    default: false,
    description: 'Parse multiple user agent strings (one per line)',
  },
] as const;

export function UserAgentParser({ className = '' }: UserAgentParserProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<UserAgentConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: UserAgentConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processUserAgent(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'user-agent-parser',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to parse user agent');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during user agent parsing');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('user-agent-parser');
  }, [setCurrentTool]);

  useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExample = (exampleInput: string) => {
    setInput(exampleInput);
  };

  // Get current browser's user agent for quick testing
  const getCurrentUserAgent = () => {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return '';
  };

  const examples = [
    {
      label: 'Current Browser',
      value: getCurrentUserAgent(),
    },
    {
      label: 'Chrome Desktop',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    {
      label: 'iPhone Safari',
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    },
    {
      label: 'Android Chrome',
      value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    },
    {
      label: 'Firefox Desktop',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    },
    {
      label: 'Edge Browser',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    },
    {
      label: 'Googlebot',
      value: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    },
    {
      label: 'Facebook Crawler',
      value: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    },
    {
      label: 'cURL Command Line',
      value: 'curl/7.68.0',
    },
    {
      label: 'Old IE Browser',
      value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)',
    },
    {
      label: 'Bulk Example',
      value: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1
Googlebot/2.1 (+http://www.google.com/bot.html)`,
    },
  ].filter(example => example.value); // Filter out empty current user agent

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={config.bulkMode ? 'User Agent Strings' : 'User Agent String'}
          value={input}
          onChange={setInput}
          placeholder={
            config.bulkMode 
              ? "Enter multiple user agent strings (one per line)..." 
              : "Paste a user agent string here..."
          }
          description={
            config.bulkMode
              ? "Enter up to 20 user agent strings, one per line"
              : "Enter a user agent string to analyze browser, OS, and device information"
          }
          examples={examples}
          onExampleClick={handleExample}
          rows={config.bulkMode ? 8 : 4}
        />
        
        <OptionsPanel
          title="Parser Options"
          options={OPTIONS}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Parsed Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a user agent string to see the parsed information..."
        />
      </div>
    </div>
  );
}