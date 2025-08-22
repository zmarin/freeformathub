import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processSubnetCalculator, type SubnetCalculatorConfig } from '../../../tools/network/ip-subnet-calculator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface IpSubnetCalculatorProps {
  className?: string;
}

const DEFAULT_CONFIG: SubnetCalculatorConfig = {
  mode: 'calculate',
  includePrivateInfo: true,
  includeBroadcast: true,
  includeWildcard: false,
  showBinary: false,
  splitIntoSubnets: 4,
  outputFormat: 'detailed',
};

const OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'calculate',
    options: [
      { value: 'calculate', label: 'Calculate Subnet Info' },
      { value: 'validate', label: 'Validate Only' },
      { value: 'split', label: 'Split into Subnets' },
    ],
    description: 'Choose calculation mode: full analysis, validation only, or subnet splitting',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'compact', label: 'Compact Summary' },
      { value: 'table', label: 'Table Format' },
    ],
    description: 'Choose output format for subnet information',
  },
  {
    key: 'includePrivateInfo',
    label: 'Network Classification',
    type: 'checkbox' as const,
    default: true,
    description: 'Include network class and private/public classification',
  },
  {
    key: 'includeBroadcast',
    label: 'Broadcast Address',
    type: 'checkbox' as const,
    default: true,
    description: 'Include broadcast address in output',
  },
  {
    key: 'includeWildcard',
    label: 'Wildcard Mask',
    type: 'checkbox' as const,
    default: false,
    description: 'Include wildcard mask (inverse of subnet mask)',
  },
  {
    key: 'showBinary',
    label: 'Binary Representation',
    type: 'checkbox' as const,
    default: false,
    description: 'Show binary representation of addresses and masks',
  },
] as const;

const SUBNET_SPLIT_OPTIONS = [
  {
    key: 'splitIntoSubnets',
    label: 'Number of Subnets',
    type: 'select' as const,
    default: 4,
    options: [
      { value: 2, label: '2 Subnets' },
      { value: 4, label: '4 Subnets' },
      { value: 8, label: '8 Subnets' },
      { value: 16, label: '16 Subnets' },
      { value: 32, label: '32 Subnets' },
      { value: 64, label: '64 Subnets' },
      { value: 128, label: '128 Subnets' },
      { value: 256, label: '256 Subnets' },
    ],
    description: 'Number of subnets to split the network into',
  },
] as const;

export function IpSubnetCalculator({ className = '' }: IpSubnetCalculatorProps) {
  const [input, setInput] = useState('192.168.1.0/24');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<SubnetCalculatorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: SubnetCalculatorConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processSubnetCalculator(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'ip-subnet-calculator',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process subnet calculation');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during subnet calculation');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('ip-subnet-calculator');
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

  const examples = [
    { label: 'Class C Network', value: '192.168.1.0/24' },
    { label: 'Class B Network', value: '172.16.0.0/16' },
    { label: 'Class A Network', value: '10.0.0.0/8' },
    { label: 'Small Subnet', value: '192.168.1.0/28' },
    { label: 'Large Subnet', value: '172.16.0.0/12' },
    { label: 'Single Host', value: '192.168.1.100/32' },
  ];

  // Filter options based on mode
  const visibleOptions = config.mode === 'split' 
    ? [...OPTIONS, ...SUBNET_SPLIT_OPTIONS]
    : OPTIONS;

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="IP Address with CIDR"
          value={input}
          onChange={setInput}
          placeholder="192.168.1.0/24"
          description="Enter IP address with CIDR notation (e.g., 192.168.1.0/24)"
          examples={examples}
          onExampleClick={handleExample}
        />
        
        <OptionsPanel
          title="Calculator Options"
          options={visibleOptions}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Subnet Information"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter an IP address with CIDR notation to see subnet calculation results..."
        />
      </div>
    </div>
  );
}