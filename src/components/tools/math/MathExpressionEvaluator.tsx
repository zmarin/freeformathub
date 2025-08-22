import React, { useState, useCallback, useMemo } from 'react';
import { Calculator, Code, Settings, Eye, EyeOff, Copy, RotateCcw, Zap, TrendingUp } from 'lucide-react';
import { processMathExpressionEvaluator, MathEvaluatorConfig } from '../../../tools/math/math-expression-evaluator';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { debounce } from '../../../lib/utils';

interface MathExpressionEvaluatorProps {
  className?: string;
}

const DEFAULT_CONFIG: MathEvaluatorConfig = {
  precision: 2,
  angleUnit: 'radians',
  outputFormat: 'decimal',
  showSteps: false,
  validateSyntax: true,
  allowVariables: false,
  enableFunctions: true,
  complexNumbers: false
};

export default function MathExpressionEvaluator({ className = '' }: MathExpressionEvaluatorProps) {
  const [input, setInput] = useState('2 + 3 * 4 - sqrt(16)');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<MathEvaluatorConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<Array<{expression: string, result: string}>>([]);

  const processInput = useMemo(
    () => debounce(async (currentInput: string, currentConfig: MathEvaluatorConfig) => {
      if (!currentInput.trim()) {
        setResult(null);
        setError('');
        return;
      }

      setIsProcessing(true);
      setError('');

      try {
        const toolResult = await processMathExpressionEvaluator(currentInput, currentConfig);
        
        if (toolResult.data && toolResult.data.isValid) {
          setResult(toolResult);
          setError('');
          
          // Add to history if successful
          setHistory(prev => [{
            expression: currentInput,
            result: toolResult.data!.formattedResult
          }, ...prev].slice(0, 10)); // Keep last 10 calculations
        } else {
          setError(toolResult.error || toolResult.data?.warnings?.[0] || 'Invalid expression');
          setResult(null);
        }
      } catch (err) {
        setError('Error evaluating mathematical expression');
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    []
  );

  React.useEffect(() => {
    processInput(input, config);
  }, [input, config, processInput]);

  const handleConfigChange = useCallback((key: keyof MathEvaluatorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleQuickExample = (type: 'arithmetic' | 'trigonometry' | 'logarithm' | 'advanced' | 'statistics' | 'algebra') => {
    const examples = {
      arithmetic: {
        expression: '(15 + 25) * 2 - 30 / 6',
        config: { outputFormat: 'decimal' as const, showSteps: true }
      },
      trigonometry: {
        expression: 'sin(π/6) + cos(π/4) + tan(π/3)',
        config: { angleUnit: 'radians' as const, precision: 4, showSteps: false }
      },
      logarithm: {
        expression: 'log10(1000) + ln(e^2) + exp(1)',
        config: { outputFormat: 'mixed' as const, precision: 3 }
      },
      advanced: {
        expression: 'factorial(6) + choose(10, 3) + sqrt(π)',
        config: { outputFormat: 'decimal' as const, precision: 2, showSteps: true }
      },
      statistics: {
        expression: 'avg(12, 18, 24, 30) + max(5, 15, 25)',
        config: { outputFormat: 'decimal' as const, precision: 1 }
      },
      algebra: {
        expression: 'pow(2, 3) + sqrt(64) + abs(-15)',
        config: { outputFormat: 'mixed' as const, showSteps: false }
      }
    };

    const example = examples[type];
    setInput(example.expression);
    setConfig(prev => ({ ...prev, ...example.config }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const insertExpression = (expr: string) => {
    setInput(prev => prev + expr);
  };

  const clearInput = () => {
    setInput('');
    setResult(null);
    setError('');
  };

  const loadFromHistory = (expression: string) => {
    setInput(expression);
  };

  const getExpressionTypeColor = (type: string) => {
    const colors = {
      arithmetic: 'bg-blue-100 text-blue-800',
      algebraic: 'bg-green-100 text-green-800',
      trigonometric: 'bg-purple-100 text-purple-800',
      logarithmic: 'bg-orange-100 text-orange-800',
      complex: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatistics = () => {
    if (!result?.data) return [];
    
    const stats = [];
    const { data, metadata } = result;
    
    stats.push({ label: 'Result', value: data.formattedResult });
    stats.push({ label: 'Expression Type', value: data.expressionType });
    stats.push({ label: 'Output Format', value: config.outputFormat });
    stats.push({ label: 'Precision', value: config.precision.toString() });
    stats.push({ label: 'Angle Unit', value: config.angleUnit });
    stats.push({ label: 'Processing Time', value: `${result.processing_time}ms` });
    
    if (data.steps) {
      stats.push({ label: 'Solution Steps', value: data.steps.length.toString() });
    }
    
    return stats;
  };

  const formatOutput = () => {
    if (!result?.data) return '';
    
    const { data } = result;
    let output = `Result: ${data.formattedResult}\n`;
    
    if (data.expressionType) {
      output += `Expression Type: ${data.expressionType.charAt(0).toUpperCase() + data.expressionType.slice(1)}\n`;
    }
    
    if (data.steps && config.showSteps) {
      output += `\nStep-by-step Solution:\n`;
      data.steps.forEach((step, index) => {
        output += `${index + 1}. ${step}\n`;
      });
    }
    
    if (data.warnings && data.warnings.length > 0) {
      output += `\nWarnings:\n`;
      data.warnings.forEach(warning => {
        output += `⚠️ ${warning}\n`;
      });
    }
    
    return output;
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-8 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Math Expression Evaluator</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Evaluate complex mathematical expressions with functions, constants, and step-by-step solutions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Input Panel */}
          <InputPanel
            title="Mathematical Expression"
            value={input}
            onChange={setInput}
            placeholder="Enter mathematical expression (e.g., 2 + 3 * sin(π/4))..."
            language="text"
            height="120px"
          />

          {/* Math Buttons Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Insert</h3>
            
            <div className="space-y-3">
              {/* Basic Operations */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Operations</h4>
                <div className="grid grid-cols-8 gap-2">
                  {['+', '-', '*', '/', '^', '(', ')', '='].map((op) => (
                    <button
                      key={op}
                      onClick={() => insertExpression(op)}
                      className="p-2 text-sm font-mono bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Functions */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Functions</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['sin()', 'cos()', 'tan()', 'log()', 'ln()', 'sqrt()', 'abs()', 'exp()'].map((func) => (
                    <button
                      key={func}
                      onClick={() => insertExpression(func)}
                      className="p-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded transition-colors"
                    >
                      {func}
                    </button>
                  ))}
                </div>
              </div>

              {/* Constants */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Constants</h4>
                <div className="grid grid-cols-6 gap-2">
                  {['π', 'e', 'φ', 'τ', 'ln2', 'sqrt2'].map((constant) => (
                    <button
                      key={constant}
                      onClick={() => insertExpression(constant)}
                      className="p-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 rounded transition-colors"
                    >
                      {constant}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearInput}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                
                {result?.data && (
                  <button
                    onClick={() => copyToClipboard(formatOutput())}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Result</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <OutputPanel
            title="Evaluation Result"
            content={formatOutput()}
            isProcessing={isProcessing}
            error={error}
            language="text"
            height="300px"
            showCopy={true}
            showDownload={true}
            downloadFilename="math-result.txt"
          />

          {/* Result Display */}
          {result?.data && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Calculation Result</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getExpressionTypeColor(result.data.expressionType)}`}>
                    {result.data.expressionType}
                  </span>
                  <span className="text-sm text-gray-500">{result.processing_time}ms</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Main Result */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-green-600 mb-1">Result</div>
                    <div className="text-3xl font-bold text-green-800 font-mono">
                      {result.data.formattedResult}
                    </div>
                    {typeof result.data.result === 'number' && result.data.result !== parseFloat(result.data.formattedResult) && (
                      <div className="text-sm text-green-600 mt-1">
                        Exact: {result.data.result}
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps */}
                {result.data.steps && config.showSteps && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Solution Steps
                    </h4>
                    <div className="space-y-1">
                      {result.data.steps.map((step, index) => (
                        <div key={index} className="text-sm text-blue-700 font-mono">
                          <span className="text-blue-500 mr-2">{index + 1}.</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result.data.warnings && result.data.warnings.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                    <div className="space-y-1">
                      {result.data.warnings.map((warning, index) => (
                        <div key={index} className="text-sm text-yellow-700">
                          ⚠️ {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick Examples */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Quick Examples
            </h3>
            
            <div className="space-y-2">
              {[
                { id: 'arithmetic', label: 'Arithmetic', icon: '🔢', desc: 'Basic operations' },
                { id: 'trigonometry', label: 'Trigonometry', icon: '📐', desc: 'Sin, cos, tan' },
                { id: 'logarithm', label: 'Logarithms', icon: '📈', desc: 'Log, ln, exp' },
                { id: 'advanced', label: 'Advanced', icon: '🧮', desc: 'Factorial, choose' },
                { id: 'statistics', label: 'Statistics', icon: '📊', desc: 'Mean, max, min' },
                { id: 'algebra', label: 'Algebra', icon: '𝑥', desc: 'Powers, roots' }
              ].map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => handleQuickExample(id as any)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <OptionsPanel title="Evaluation Settings">
            <div className="space-y-4">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={config.outputFormat}
                  onChange={(e) => handleConfigChange('outputFormat', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="decimal">Decimal</option>
                  <option value="scientific">Scientific</option>
                  <option value="fraction">Fraction</option>
                  <option value="mixed">Mixed (Auto)</option>
                </select>
              </div>

              {/* Precision */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decimal Precision: {config.precision}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={config.precision}
                  onChange={(e) => handleConfigChange('precision', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Angle Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Angle Unit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['radians', 'degrees'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleConfigChange('angleUnit', unit)}
                      className={`p-2 text-sm border rounded transition-colors ${
                        config.angleUnit === unit
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Steps */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showSteps}
                    onChange={(e) => handleConfigChange('showSteps', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Show solution steps</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.enableFunctions}
                    onChange={(e) => handleConfigChange('enableFunctions', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Enable advanced functions</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.validateSyntax}
                    onChange={(e) => handleConfigChange('validateSyntax', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Validate syntax</span>
                </label>
              </div>
            </div>
          </OptionsPanel>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Calculation Statistics</h3>
            <div className="space-y-2">
              {getStatistics().map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stat.label}:</span>
                  <span className="font-medium text-gray-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Recent Calculations
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((calc, index) => (
                  <button
                    key={index}
                    onClick={() => loadFromHistory(calc.expression)}
                    className="w-full p-2 text-left border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xs font-mono text-gray-600 truncate">
                      {calc.expression}
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      = {calc.result}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}