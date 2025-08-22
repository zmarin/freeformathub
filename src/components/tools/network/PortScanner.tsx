import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processPortScanning, type PortScannerConfig } from '../../../tools/network/port-scanner';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface PortScannerProps {
  className?: string;
}

const DEFAULT_CONFIG: PortScannerConfig = {
  scanType: 'common',
  startPort: 1,
  endPort: 1000,
  specificPorts: '21,22,23,25,53,80,110,143,443,993,995',
  timeout: 5000,
  threads: 10,
  includeServices: true,
  showClosed: false,
  outputFormat: 'detailed',
  skipPing: false,
};

const BASIC_OPTIONS = [
  {
    key: 'scanType',
    label: 'Scan Type',
    type: 'select' as const,
    default: 'common',
    options: [
      { value: 'common', label: '🔍 Common Ports - Top 20 ports' },
      { value: 'range', label: '📏 Port Range - Specify start/end' },
      { value: 'specific', label: '🎯 Specific Ports - Custom list' },
      { value: 'service', label: '🛠️ Service Ports - Database/Web' },
    ],
    description: 'Choose the type of port scan to perform',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Analysis' },
      { value: 'simple', label: 'Simple Summary' },
      { value: 'json', label: 'JSON Format' },
    ],
    description: 'Choose how to display scan results',
  },
  {
    key: 'includeServices',
    label: 'Service Detection',
    type: 'checkbox' as const,
    default: true,
    description: 'Attempt to identify services running on open ports',
  },
  {
    key: 'showClosed',
    label: 'Show Filtered Ports',
    type: 'checkbox' as const,
    default: false,
    description: 'Display filtered/blocked ports in results',
  },
] as const;

const RANGE_OPTIONS = [
  {
    key: 'startPort',
    label: 'Start Port',
    type: 'number' as const,
    default: 1,
    min: 1,
    max: 65535,
    description: 'Starting port number for range scan',
  },
  {
    key: 'endPort',
    label: 'End Port',
    type: 'number' as const,
    default: 1000,
    min: 1,
    max: 65535,
    description: 'Ending port number for range scan',
  },
] as const;

const SPECIFIC_OPTION = {
  key: 'specificPorts',
  label: 'Port List',
  type: 'text' as const,
  default: '21,22,23,25,53,80,110,143,443,993,995',
  description: 'Comma-separated ports or ranges (e.g., 80,443,8000-8080)',
};

const ADVANCED_OPTIONS = [
  {
    key: 'timeout',
    label: 'Timeout (ms)',
    type: 'range' as const,
    default: 5000,
    min: 1000,
    max: 30000,
    step: 1000,
    description: 'Connection timeout in milliseconds',
  },
  {
    key: 'threads',
    label: 'Concurrent Threads',
    type: 'range' as const,
    default: 10,
    min: 1,
    max: 50,
    step: 1,
    description: 'Number of concurrent port scans',
  },
] as const;

export function PortScanner({ className = '' }: PortScannerProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<PortScannerConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: PortScannerConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setScanResults(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await processPortScanning(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setScanResults(result.scanResults);
          
          // Add to history
          addToHistory({
            toolId: 'port-scanner',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to perform port scan');
          setOutput('');
          setScanResults(null);
        }
      } catch (err) {
        setError('An unexpected error occurred during port scanning');
        setOutput('');
        setScanResults(null);
      } finally {
        setIsProcessing(false);
      }
    }, 2000), // Longer delay for port scanning
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('port-scanner');
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

  // Target examples for scanning
  const examples = [
    {
      label: 'Local Router',
      value: '192.168.1.1',
    },
    {
      label: 'Localhost',
      value: '127.0.0.1',
    },
    {
      label: 'Example Domain',
      value: 'example.com',
    },
    {
      label: 'Google DNS',
      value: '8.8.8.8',
    },
    {
      label: 'Local Network Host',
      value: '192.168.1.100',
    },
  ];

  // Build conditional options based on scan type
  const getConditionalOptions = () => {
    const options = [...BASIC_OPTIONS];
    
    if (config.scanType === 'range') {
      options.push(...RANGE_OPTIONS);
    } else if (config.scanType === 'specific') {
      options.push(SPECIFIC_OPTION);
    }
    
    return [...options, ...ADVANCED_OPTIONS];
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Target Host"
          value={input}
          onChange={setInput}
          placeholder="hostname.com, example.com, or IP address (192.168.1.1)"
          description="Enter a hostname or IP address to scan for open ports"
          examples={examples}
          onExampleClick={handleExample}
          rows={2}
        />
        
        <OptionsPanel
          title="Scan Configuration"
          options={getConditionalOptions()}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Scan Statistics */}
        {scanResults && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Scan Summary</h3>
            <div className="p-3 bg-gray-50 rounded-lg text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Target:</span>
                  <div className="font-medium">{scanResults[0]?.host}</div>
                </div>
                <div>
                  <span className="text-gray-600">Ports Scanned:</span>
                  <div className="font-medium">{scanResults.length}</div>
                </div>
                <div>
                  <span className="text-gray-600">Open:</span>
                  <div className="font-medium text-green-600">
                    {scanResults.filter((r: any) => r.status === 'open').length}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Filtered:</span>
                  <div className="font-medium text-yellow-600">
                    {scanResults.filter((r: any) => r.status === 'filtered').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Scan Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                scanType: 'common', 
                includeServices: true,
                showClosed: false 
              }))}
              className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              🔍 Quick Scan
            </button>
            <button
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                scanType: 'service',
                includeServices: true,
                showClosed: true 
              }))}
              className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              🛠️ Service Scan
            </button>
            <button
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                scanType: 'range',
                startPort: 1,
                endPort: 100,
                showClosed: false 
              }))}
              className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
            >
              📏 Top 100
            </button>
            <button
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                scanType: 'specific',
                specificPorts: '80,443,8080,8443,3000,3001',
                includeServices: true 
              }))}
              className="px-3 py-2 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
            >
              🌐 Web Ports
            </button>
          </div>
        </div>

        {/* Security Warning */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <div className="font-medium text-yellow-800">Security Notice</div>
              <div className="text-yellow-700 mt-1">
                This is a simulated port scanner for educational purposes. Real port scanning requires appropriate tools and permissions. Only scan networks you own or have explicit permission to test.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Port Scan Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language={config.outputFormat === 'json' ? 'json' : 'markdown'}
          placeholder="Enter a hostname or IP address to start port scanning..."
          processingMessage="Scanning ports... This may take a moment..."
          customActions={
            scanResults ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const openPorts = scanResults.filter((r: any) => r.status === 'open');
                    const portList = openPorts.map((r: any) => r.port).join(', ');
                    navigator.clipboard?.writeText(portList);
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  disabled={!scanResults.some((r: any) => r.status === 'open')}
                >
                  📋 Copy Open Ports
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(output)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📄 Copy Report
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}