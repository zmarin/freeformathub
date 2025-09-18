import React, { useState, useEffect } from 'react';
import { InputPanel } from '../../ui/InputPanel';
import { OutputPanel } from '../../ui/OutputPanel';
import { OptionsPanel } from '../../ui/OptionsPanel';
import { processIpRange, type IpRangeConfig } from '../../../tools/network/ip-range-calculator';

export function IpRangeCalculator() {
  const [input, setInput] = useState('192.168.1.0/24');
  const [output, setOutput] = useState('');
  const [config, setConfig] = useState<IpRangeConfig>({
    mode: 'calculate',
    showBinary: false,
    showHostCount: true,
    includePrivateInfo: true,
    outputFormat: 'detailed'
  });

  const processInput = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const result = processIpRange(input, config);

    if (result.success) {
      setOutput(result.output || '');
    } else {
      setOutput(`❌ Error: ${result.error}`);
    }
  };

  useEffect(() => {
    processInput();
  }, [input, config]);

  const examples = [
    {
      label: 'Class C Network',
      value: '192.168.1.0/24',
      description: 'Standard home/office network (254 usable IPs)'
    },
    {
      label: 'Small Office /28',
      value: '10.1.1.16/28',
      description: 'Small subnet (14 usable IPs)'
    },
    {
      label: 'Large Private /16',
      value: '172.16.0.0/16',
      description: 'Large enterprise network (65,534 usable IPs)'
    },
    {
      label: 'Very Small /30',
      value: '203.0.113.0/30',
      description: 'Point-to-point link (2 usable IPs)'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <InputPanel
          title="Network Address (CIDR)"
          value={input}
          onChange={setInput}
          placeholder="Enter IP/CIDR (e.g., 192.168.1.0/24)"
          examples={examples}
        />

        <OptionsPanel title="Calculator Options">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <select
                value={config.mode}
                onChange={(e) => setConfig({...config, mode: e.target.value as 'calculate' | 'validate'})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="calculate">Calculate Range</option>
                <option value="validate">Validate Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={config.outputFormat}
                onChange={(e) => setConfig({...config, outputFormat: e.target.value as 'simple' | 'detailed' | 'table'})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="detailed">Detailed Report</option>
                <option value="simple">Simple Range</option>
                <option value="table">Table Format</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showBinary}
                  onChange={(e) => setConfig({...config, showBinary: e.target.checked})}
                  className="mr-2"
                />
                Show Binary Representation
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includePrivateInfo}
                  onChange={(e) => setConfig({...config, includePrivateInfo: e.target.checked})}
                  className="mr-2"
                />
                Include Network Classification
              </label>
            </div>
          </div>
        </OptionsPanel>
      </div>

      <div>
        <OutputPanel
          title="Usable IP Range"
          output={output}
          language="markdown"
        />
      </div>
    </div>
  );
}