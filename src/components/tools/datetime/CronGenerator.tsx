import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processCronExpression, type CronGeneratorConfig } from '../../../tools/datetime/cron-generator';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CronGeneratorProps {
  className?: string;
}

const DEFAULT_CONFIG: CronGeneratorConfig = {
  mode: 'parse',
  format: 'standard',
  includeSeconds: false,
  includeYear: false,
  timezone: 'UTC',
  showExamples: true,
  validateExpression: true,
  showNextRuns: true,
  maxNextRuns: 5,
};

const BASIC_OPTIONS = [
  {
    key: 'mode',
    label: 'Mode',
    type: 'select' as const,
    default: 'parse',
    options: [
      { value: 'parse', label: '🔍 Parse - Analyze existing expression' },
      { value: 'build', label: '🏗️ Build - Create from description (coming soon)' },
    ],
    description: 'Choose to parse an existing expression or build a new one',
  },
  {
    key: 'format',
    label: 'Cron Format',
    type: 'select' as const,
    default: 'standard',
    options: [
      { value: 'standard', label: '⚡ Standard Unix (5 fields)' },
      { value: 'quartz', label: '☕ Quartz Java (6 fields with seconds)' },
      { value: 'aws', label: '☁️ AWS EventBridge (6 fields with year)' },
    ],
    description: 'Select the cron format to use',
  },
  {
    key: 'showNextRuns',
    label: 'Show Next Runs',
    type: 'checkbox' as const,
    default: true,
    description: 'Display upcoming scheduled execution times',
  },
  {
    key: 'showExamples',
    label: 'Show Examples',
    type: 'checkbox' as const,
    default: true,
    description: 'Include common cron expression examples',
  },
  {
    key: 'validateExpression',
    label: 'Validate Syntax',
    type: 'checkbox' as const,
    default: true,
    description: 'Perform syntax validation on expressions',
  },
] as const;

const ADVANCED_OPTIONS = [
  {
    key: 'maxNextRuns',
    label: 'Max Next Runs',
    type: 'range' as const,
    default: 5,
    min: 1,
    max: 20,
    step: 1,
    description: 'Number of next scheduled runs to display',
  },
] as const;

export function CronGenerator({ className = '' }: CronGeneratorProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cronData, setCronData] = useState<any>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<CronGeneratorConfig>(DEFAULT_CONFIG);

  const processInput = useMemo(
    () => debounce(async (inputValue: string, currentConfig: CronGeneratorConfig) => {
      if (!inputValue.trim()) {
        setOutput('');
        setCronData(null);
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processCronExpression(inputValue, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          setCronData(result);
          
          // Add to history
          addToHistory({
            toolId: 'cron-generator',
            input: inputValue,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to process cron expression');
          setOutput('');
          setCronData(null);
        }
      } catch (err) {
        setError('An unexpected error occurred while processing the cron expression');
        setOutput('');
        setCronData(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('cron-generator');
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

  // Cron expression examples based on format
  const getExamples = () => {
    const baseExamples = [
      {
        label: 'Every Minute',
        value: config.format === 'standard' ? '* * * * *' :
               config.format === 'quartz' ? '0 * * * * ?' :
               '* * * * * *',
      },
      {
        label: 'Every Hour at Minute 0',
        value: config.format === 'standard' ? '0 * * * *' :
               config.format === 'quartz' ? '0 0 * * * ?' :
               '0 * * * * *',
      },
      {
        label: 'Daily at Midnight',
        value: config.format === 'standard' ? '0 0 * * *' :
               config.format === 'quartz' ? '0 0 0 * * ?' :
               '0 0 * * * *',
      },
      {
        label: 'Daily at 8:30 AM',
        value: config.format === 'standard' ? '30 8 * * *' :
               config.format === 'quartz' ? '0 30 8 * * ?' :
               '30 8 * * * *',
      },
      {
        label: 'Weekdays at 9 AM',
        value: config.format === 'standard' ? '0 9 * * 1-5' :
               config.format === 'quartz' ? '0 0 9 ? * MON-FRI' :
               '0 9 * * 1-5 *',
      },
      {
        label: 'Every 15 Minutes',
        value: config.format === 'standard' ? '*/15 * * * *' :
               config.format === 'quartz' ? '0 */15 * * * ?' :
               '*/15 * * * * *',
      },
      {
        label: 'First Day of Month',
        value: config.format === 'standard' ? '0 0 1 * *' :
               config.format === 'quartz' ? '0 0 0 1 * ?' :
               '0 0 1 * * *',
      },
      {
        label: 'Every Sunday at Noon',
        value: config.format === 'standard' ? '0 12 * * 0' :
               config.format === 'quartz' ? '0 0 12 ? * SUN' :
               '0 12 * * 0 *',
      },
    ];

    return baseExamples;
  };

  // Build conditional options
  const allOptions = [
    ...BASIC_OPTIONS,
    ...(config.showNextRuns ? [ADVANCED_OPTIONS[0]] : []),
  ];

  const formatHelp = {
    standard: '5 fields: minute hour day-of-month month day-of-week',
    quartz: '6 fields: second minute hour day-of-month month day-of-week',
    aws: '6 fields: minute hour day-of-month month day-of-week year'
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title={config.mode === 'parse' ? 'Cron Expression to Parse' : 'Schedule Description'}
          value={input}
          onChange={setInput}
          placeholder={
            config.mode === 'parse' 
              ? `Enter cron expression (e.g., "0 0 * * *")...` 
              : 'Enter schedule description (e.g., "every day at midnight")...'
          }
          description={
            config.mode === 'parse'
              ? `Enter a ${config.format} format cron expression to analyze`
              : 'Describe when you want your job to run (feature coming soon)'
          }
          examples={getExamples()}
          onExampleClick={handleExample}
          rows={3}
        />
        
        <OptionsPanel
          title="Generator Options"
          options={allOptions}
          values={config}
          onChange={handleConfigChange}
        />

        {/* Format Helper */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Format Guide</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <div className="font-medium text-blue-800 mb-1">{config.format.toUpperCase()} Format</div>
            <div className="text-blue-700">{formatHelp[config.format]}</div>
            <div className="mt-2 space-y-1">
              <div><strong>*</strong> = any value</div>
              <div><strong>?</strong> = no specific value (Quartz)</div>
              <div><strong>/</strong> = step (e.g., */5 = every 5)</div>
              <div><strong>-</strong> = range (e.g., 1-5)</div>
              <div><strong>,</strong> = list (e.g., 1,3,5)</div>
            </div>
          </div>
        </div>

        {/* Cron Analysis Display */}
        {cronData?.parsed && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Quick Analysis</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="font-medium text-green-800 mb-1">Schedule</div>
              <div className="text-green-700 mb-2">{cronData.parsed.description}</div>
              <div className="font-medium text-green-800 mb-1">Frequency</div>
              <div className="text-green-700">{cronData.parsed.frequency}</div>
            </div>
          </div>
        )}

        {/* Format Quick Switcher */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Format Switch</h3>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => handleConfigChange('format', 'standard')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                config.format === 'standard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unix/Linux
            </button>
            <button
              onClick={() => handleConfigChange('format', 'quartz')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                config.format === 'quartz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quartz
            </button>
            <button
              onClick={() => handleConfigChange('format', 'aws')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                config.format === 'aws'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AWS
            </button>
          </div>
        </div>

        {/* Common Patterns */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Common Patterns</h3>
          <div className="space-y-1 text-xs">
            <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => handleExample(getExamples()[2].value)}>
              <div className="font-mono text-blue-600">{getExamples()[2].value}</div>
              <div className="text-gray-600">Daily at midnight</div>
            </div>
            <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => handleExample(getExamples()[4].value)}>
              <div className="font-mono text-blue-600">{getExamples()[4].value}</div>
              <div className="text-gray-600">Weekdays at 9 AM</div>
            </div>
            <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => handleExample(getExamples()[5].value)}>
              <div className="font-mono text-blue-600">{getExamples()[5].value}</div>
              <div className="text-gray-600">Every 15 minutes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Cron Expression Analysis"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter a cron expression to analyze its schedule and timing..."
          processingMessage="Analyzing cron expression..."
          customActions={
            cronData?.cronExpression ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(cronData.cronExpression)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy Expression
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(cronData.parsed?.description || '')}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  📝 Copy Description
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}