import { useState, useEffect, useMemo } from 'react';
import {
  processCurrencyConverter,
  type CurrencyConverterConfig,
  CURRENCY_DATABASE,
  POPULAR_CURRENCIES
} from '../../../tools/converters/currency-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface CurrencyConverterProps {
  className?: string;
}

const DEFAULT_CONFIG: CurrencyConverterConfig = {
  fromCurrency: 'USD',
  toCurrency: 'EUR',
  amount: 100,
  showChart: false,
  showHistory: false,
  chartPeriod: '30d',
  precision: 2,
  autoUpdate: true,
  comparisonMode: false,
  targetCurrencies: ['GBP', 'JPY', 'CAD', 'AUD']
};

const OPTIONS = [
  {
    key: 'precision',
    label: 'Decimal Precision',
    type: 'select' as const,
    default: 2,
    options: [
      { value: 0, label: '0 decimals' },
      { value: 2, label: '2 decimals' },
      { value: 4, label: '4 decimals' },
      { value: 6, label: '6 decimals' }
    ],
    description: 'Number of decimal places to show',
  },
  {
    key: 'showChart',
    label: 'Show Historical Chart',
    type: 'boolean' as const,
    default: false,
    description: 'Display exchange rate trends over time',
  },
  {
    key: 'chartPeriod',
    label: 'Chart Period',
    type: 'select' as const,
    default: '30d',
    options: [
      { value: '7d', label: '7 days' },
      { value: '30d', label: '30 days' },
      { value: '90d', label: '90 days' },
      { value: '1y', label: '1 year' }
    ],
    description: 'Historical data timeframe',
  },
  {
    key: 'comparisonMode',
    label: 'Multi-Currency Comparison',
    type: 'boolean' as const,
    default: false,
    description: 'Compare against multiple currencies',
  },
  {
    key: 'autoUpdate',
    label: 'Auto-Update Rates',
    type: 'boolean' as const,
    default: true,
    description: 'Automatically refresh exchange rates',
  }
];

export function CurrencyConverter({ className = '' }: CurrencyConverterProps) {
  const [input, setInput] = useState('100');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<CurrencyConverterConfig>(DEFAULT_CONFIG);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [filteredFromCurrencies, setFilteredFromCurrencies] = useState(Object.keys(CURRENCY_DATABASE));
  const [filteredToCurrencies, setFilteredToCurrencies] = useState(Object.keys(CURRENCY_DATABASE));
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  const { addToHistory } = useToolStore();

  // Filter currencies based on search
  useEffect(() => {
    const filterCurrencies = (search: string) => {
      if (!search) return Object.keys(CURRENCY_DATABASE);

      return Object.keys(CURRENCY_DATABASE).filter(code => {
        const currency = CURRENCY_DATABASE[code];
        return (
          code.toLowerCase().includes(search.toLowerCase()) ||
          currency.name.toLowerCase().includes(search.toLowerCase())
        );
      });
    };

    setFilteredFromCurrencies(filterCurrencies(searchFrom));
    setFilteredToCurrencies(filterCurrencies(searchTo));
  }, [searchFrom, searchTo]);

  const debouncedProcess = useMemo(
    () => debounce(async (amount: number, cfg: CurrencyConverterConfig) => {
      if (!amount || amount <= 0) {
        setOutput('');
        setError(undefined);
        return;
      }

      setIsLoading(true);

      try {
        const result = await processCurrencyConverter({ ...cfg, amount });

        if (result.success) {
          setOutput(result.output || '');
          setError(undefined);
          setLastUpdateTime(new Date().toLocaleTimeString());

          // Add to conversion history
          if (result.conversion) {
            setConversionHistory(prev => [
              {
                ...result.conversion,
                id: Date.now(),
                timestamp: Date.now()
              },
              ...prev.slice(0, 4) // Keep last 5 conversions
            ]);
          }

          addToHistory({
            toolId: 'currency-converter',
            input: amount.toString(),
            output: result.output || '',
            config: cfg,
            timestamp: Date.now(),
          });
        } else {
          setOutput('');
          setError(result.error);
        }
      } catch (err) {
        setOutput('');
        setError(err instanceof Error ? err.message : 'Failed to convert currency');
      }

      setIsLoading(false);
    }, 500),
    [addToHistory]
  );

  useEffect(() => {
    const amount = parseFloat(input) || 0;
    debouncedProcess(amount, config);
  }, [input, config, debouncedProcess]);

  // Auto-update every 5 minutes if enabled
  useEffect(() => {
    if (!config.autoUpdate) return;

    const interval = setInterval(() => {
      const amount = parseFloat(input) || 0;
      if (amount > 0) {
        debouncedProcess(amount, config);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [config.autoUpdate, input, debouncedProcess]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleConfigChange = (newConfig: CurrencyConverterConfig) => {
    setConfig(newConfig);
  };

  const handleCurrencyChange = (type: 'from' | 'to', currency: string) => {
    setConfig(prev => ({
      ...prev,
      [type === 'from' ? 'fromCurrency' : 'toCurrency']: currency
    }));
  };

  const swapCurrencies = () => {
    setConfig(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency
    }));
  };

  const setQuickAmount = (amount: number) => {
    setInput(amount.toString());
  };

  const addToComparison = (currency: string) => {
    if (!config.targetCurrencies.includes(currency) && currency !== config.fromCurrency && currency !== config.toCurrency) {
      setConfig(prev => ({
        ...prev,
        targetCurrencies: [...prev.targetCurrencies, currency].slice(0, 6) // Max 6 comparison currencies
      }));
    }
  };

  const removeFromComparison = (currency: string) => {
    setConfig(prev => ({
      ...prev,
      targetCurrencies: prev.targetCurrencies.filter(c => c !== currency)
    }));
  };

  const getCurrencyDisplay = (code: string) => {
    const currency = CURRENCY_DATABASE[code];
    return currency ? `${currency.flag} ${code} - ${currency.name}` : code;
  };

  const formatCurrency = (amount: number, code: string) => {
    const currency = CURRENCY_DATABASE[code];
    if (!currency) return amount.toString();

    return `${currency.symbol}${amount.toFixed(config.precision)}`;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Stylish Currency Converter Container */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 p-8 rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">💱 Currency Converter</h1>
            <p className="text-gray-600 text-lg">Real-time exchange rates powered by ECB</p>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">Amount</label>
            <input
              type="number"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              className="w-full px-6 py-4 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white shadow-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const amount = parseFloat(input) || 0;
                  if (amount > 0) debouncedProcess(amount, config);
                }
              }}
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 10, 100, 500, 1000, 5000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setQuickAmount(amount)}
                  className="px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors duration-200 border border-gray-200 hover:border-blue-300"
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* From Currency */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">From</label>
              <select
                value={config.fromCurrency}
                onChange={(e) => handleCurrencyChange('from', e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white cursor-pointer shadow-sm"
              >
                {Object.entries(CURRENCY_DATABASE).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {code} - {info.name}
                  </option>
                ))}
              </select>

              {/* Popular From Currencies */}
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-600 mb-2">Popular:</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CURRENCIES.map(code => (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange('from', code)}
                      className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                        config.fromCurrency === code
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {CURRENCY_DATABASE[code]?.flag} {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* To Currency */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">To</label>
              <select
                value={config.toCurrency}
                onChange={(e) => handleCurrencyChange('to', e.target.value)}
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 bg-white cursor-pointer shadow-sm"
              >
                {Object.entries(CURRENCY_DATABASE).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {code} - {info.name}
                  </option>
                ))}
              </select>

              {/* Popular To Currencies */}
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-600 mb-2">Popular:</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CURRENCIES.map(code => (
                    <button
                      key={code}
                      onClick={() => handleCurrencyChange('to', code)}
                      className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                        config.toCurrency === code
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 hover:bg-blue-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {CURRENCY_DATABASE[code]?.flag} {code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={swapCurrencies}
              className="p-4 bg-gray-100 hover:bg-blue-500 hover:text-white rounded-full transition-all duration-300 transform hover:rotate-180 focus:outline-none shadow-lg hover:shadow-xl"
              title="Swap currencies"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Convert Button */}
          <button
            onClick={() => {
              const amount = parseFloat(input) || 0;
              if (amount > 0) debouncedProcess(amount, config);
            }}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none"
          >
            Convert Currency
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Result Display */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl min-h-[120px] flex flex-col justify-center items-center shadow-inner">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Converting...</span>
              </div>
            ) : output ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {output.split('=')[1]?.split('\n')[0]?.trim() || 'Converted amount will appear here'}
                </div>
                <div className="text-lg text-gray-600">
                  {formatCurrency(parseFloat(input) || 0, config.fromCurrency)} equals
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <div className="text-lg">Enter an amount and click Convert</div>
              </div>
            )}
          </div>

          {/* Exchange Rate Display */}
          {output && !error && !isLoading && (
            <div className="mt-4 text-center text-gray-600">
              {output.split('\n').find(line => line.includes('Exchange Rate:'))}
            </div>
          )}

          {/* Popular Currency Pairs */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Quick Select</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['USD', 'EUR'], ['EUR', 'USD'], ['USD', 'GBP'],
                ['USD', 'JPY'], ['EUR', 'GBP'], ['USD', 'CNY']
              ].map(([from, to]) => (
                <button
                  key={`${from}-${to}`}
                  onClick={() => {
                    setConfig(prev => ({ ...prev, fromCurrency: from, toCurrency: to }));
                    if (parseFloat(input) > 0) {
                      setTimeout(() => debouncedProcess(parseFloat(input), { ...config, fromCurrency: from, toCurrency: to }), 100);
                    }
                  }}
                  className="px-4 py-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                >
                  {CURRENCY_DATABASE[from]?.flag} {from} → {CURRENCY_DATABASE[to]?.flag} {to}
                </button>
              ))}
            </div>
          </div>

          {/* Last Update Time */}
          {lastUpdateTime && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Last updated: {lastUpdateTime}
            </div>
          )}

          {/* Conversion History */}
          {conversionHistory.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-700 mb-3">Recent Conversions</h4>
              <div className="space-y-2">
                {conversionHistory.slice(0, 3).map(conversion => (
                  <div
                    key={conversion.id}
                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <span className="font-medium">
                      {formatCurrency(conversion.amount, conversion.from.code)} = {' '}
                      {formatCurrency(conversion.result, conversion.to.code)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(conversion.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}