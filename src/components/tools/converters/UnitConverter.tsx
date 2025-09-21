import { useState, useEffect, useMemo } from 'react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import { processUnitConverter, type UnitConverterConfig } from '../../../tools/converters/unit-converter';
import { useToolStore } from '../../../lib/store';
import { debounce } from '../../../lib/utils';

interface UnitConverterProps {
  className?: string;
}

// Unit definitions for the component
const UNIT_OPTIONS = {
  length: [
    { value: 'meter', label: 'Meter (m)' },
    { value: 'kilometer', label: 'Kilometer (km)' },
    { value: 'centimeter', label: 'Centimeter (cm)' },
    { value: 'millimeter', label: 'Millimeter (mm)' },
    { value: 'foot', label: 'Foot (ft)' },
    { value: 'inch', label: 'Inch (in)' },
    { value: 'yard', label: 'Yard (yd)' },
    { value: 'mile', label: 'Mile (mi)' },
    { value: 'nautical-mile', label: 'Nautical Mile (nmi)' },
  ],
  weight: [
    { value: 'kilogram', label: 'Kilogram (kg)' },
    { value: 'gram', label: 'Gram (g)' },
    { value: 'pound', label: 'Pound (lb)' },
    { value: 'ounce', label: 'Ounce (oz)' },
    { value: 'stone', label: 'Stone (st)' },
    { value: 'metric-ton', label: 'Metric Ton (t)' },
    { value: 'ton-us', label: 'US Ton' },
  ],
  temperature: [
    { value: 'celsius', label: 'Celsius (°C)' },
    { value: 'fahrenheit', label: 'Fahrenheit (°F)' },
    { value: 'kelvin', label: 'Kelvin (K)' },
    { value: 'rankine', label: 'Rankine (°R)' },
  ],
  volume: [
    { value: 'liter', label: 'Liter (L)' },
    { value: 'milliliter', label: 'Milliliter (mL)' },
    { value: 'gallon-us', label: 'US Gallon (gal)' },
    { value: 'gallon-uk', label: 'UK Gallon (gal)' },
    { value: 'quart-us', label: 'US Quart (qt)' },
    { value: 'pint-us', label: 'US Pint (pt)' },
    { value: 'cup-us', label: 'US Cup' },
    { value: 'fluid-ounce-us', label: 'US Fluid Ounce (fl oz)' },
  ],
  area: [
    { value: 'square-meter', label: 'Square Meter (m²)' },
    { value: 'square-kilometer', label: 'Square Kilometer (km²)' },
    { value: 'square-foot', label: 'Square Foot (ft²)' },
    { value: 'square-inch', label: 'Square Inch (in²)' },
    { value: 'acre', label: 'Acre (ac)' },
    { value: 'hectare', label: 'Hectare (ha)' },
    { value: 'square-mile', label: 'Square Mile (mi²)' },
  ],
  time: [
    { value: 'second', label: 'Second (s)' },
    { value: 'minute', label: 'Minute (min)' },
    { value: 'hour', label: 'Hour (h)' },
    { value: 'day', label: 'Day (d)' },
    { value: 'week', label: 'Week (wk)' },
    { value: 'month', label: 'Month (mo)' },
    { value: 'year', label: 'Year (yr)' },
    { value: 'millisecond', label: 'Millisecond (ms)' },
  ],
  digital: [
    { value: 'byte', label: 'Byte (B)' },
    { value: 'kilobyte', label: 'Kilobyte (KB)' },
    { value: 'megabyte', label: 'Megabyte (MB)' },
    { value: 'gigabyte', label: 'Gigabyte (GB)' },
    { value: 'terabyte', label: 'Terabyte (TB)' },
    { value: 'petabyte', label: 'Petabyte (PB)' },
    { value: 'bit', label: 'Bit' },
    { value: 'kilobit', label: 'Kilobit (Kbit)' },
    { value: 'megabit', label: 'Megabit (Mbit)' },
    { value: 'gigabit', label: 'Gigabit (Gbit)' },
  ],
  speed: [
    { value: 'meter_per_second', label: 'Meter per Second (m/s)' },
    { value: 'kilometer_per_hour', label: 'Kilometer per Hour (km/h)' },
    { value: 'mile_per_hour', label: 'Mile per Hour (mph)' },
    { value: 'foot_per_second', label: 'Foot per Second (ft/s)' },
    { value: 'knot', label: 'Knot' },
  ],
  pressure: [
    { value: 'pascal', label: 'Pascal (Pa)' },
    { value: 'kilopascal', label: 'Kilopascal (kPa)' },
    { value: 'bar', label: 'Bar' },
    { value: 'atmosphere', label: 'Atmosphere (atm)' },
    { value: 'psi', label: 'PSI' },
  ],
  energy: [
    { value: 'joule', label: 'Joule (J)' },
    { value: 'kilojoule', label: 'Kilojoule (kJ)' },
    { value: 'calorie', label: 'Calorie (cal)' },
    { value: 'kilocalorie', label: 'Kilocalorie (kcal)' },
    { value: 'watt_hour', label: 'Watt Hour (Wh)' },
    { value: 'kilowatt_hour', label: 'Kilowatt Hour (kWh)' },
  ],
} as const;

const DEFAULT_CONFIG: UnitConverterConfig = {
  category: 'length',
  fromUnit: 'meter',
  toUnit: 'foot',
  precision: 2,
  showFormula: true,
  bulkMode: false,
  outputFormat: 'detailed',
};

const OPTIONS = [
  {
    key: 'category',
    label: 'Category',
    type: 'select' as const,
    default: 'length',
    options: [
      { value: 'length', label: 'Length' },
      { value: 'weight', label: 'Weight/Mass' },
      { value: 'temperature', label: 'Temperature' },
      { value: 'volume', label: 'Volume' },
      { value: 'area', label: 'Area' },
      { value: 'time', label: 'Time' },
      { value: 'digital', label: 'Digital Storage' },
    ],
    description: 'Select the type of measurement to convert',
  },
  {
    key: 'outputFormat',
    label: 'Output Format',
    type: 'select' as const,
    default: 'detailed',
    options: [
      { value: 'detailed', label: 'Detailed Report' },
      { value: 'simple', label: 'Simple Format' },
      { value: 'table', label: 'Table Format' },
    ],
    description: 'Choose output format for conversion results',
  },
  {
    key: 'precision',
    label: 'Decimal Precision',
    type: 'select' as const,
    default: 2,
    options: [
      { value: 0, label: '0 decimals' },
      { value: 1, label: '1 decimal' },
      { value: 2, label: '2 decimals' },
      { value: 3, label: '3 decimals' },
      { value: 4, label: '4 decimals' },
      { value: 6, label: '6 decimals' },
    ],
    description: 'Number of decimal places in the result',
  },
  {
    key: 'showFormula',
    label: 'Show Formula',
    type: 'checkbox' as const,
    default: true,
    description: 'Display the conversion formula used',
  },
  {
    key: 'bulkMode',
    label: 'Bulk Conversion',
    type: 'checkbox' as const,
    default: false,
    description: 'Convert multiple values (separate with commas or newlines)',
  },
] as const;

export function UnitConverter({ className = '' }: UnitConverterProps) {
  const [input, setInput] = useState('100');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentTool, addToHistory } = useToolStore();
  const [config, setConfig] = useState<UnitConverterConfig>(DEFAULT_CONFIG);

  // Update unit options when category changes
  useEffect(() => {
    const categoryUnits = UNIT_OPTIONS[config.category];
    if (categoryUnits && !categoryUnits.find(unit => unit.value === config.fromUnit)) {
      setConfig(prev => ({
        ...prev,
        fromUnit: categoryUnits[0].value,
        toUnit: categoryUnits[1]?.value || categoryUnits[0].value,
      }));
    }
  }, [config.category]);

  const processInput = useMemo(
    () => debounce(async (value: string, currentConfig: UnitConverterConfig) => {
      if (!value.trim()) {
        setOutput('');
        setError(null);
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = processUnitConverter(value, currentConfig);
        
        if (result.success && result.output) {
          setOutput(result.output);
          
          // Add to history
          addToHistory({
            toolId: 'unit-converter',
            input: value,
            output: result.output,
            config: currentConfig,
            timestamp: Date.now(),
          });
        } else {
          setError(result.error || 'Failed to convert units');
          setOutput('');
        }
      } catch (err) {
        setError('An unexpected error occurred during unit conversion');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    }, 300),
    [addToHistory]
  );

  useEffect(() => {
    setCurrentTool('unit-converter');
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

  // Dynamic examples based on category
  const getExamples = () => {
    const examples = {
      length: [
        { label: '100 meters', value: '100' },
        { label: '5.5 feet', value: '5.5' },
        { label: '1000 km', value: '1000' },
        { label: '12 inches', value: '12' },
      ],
      weight: [
        { label: '70 kg', value: '70' },
        { label: '150 lbs', value: '150' },
        { label: '2.5 tons', value: '2.5' },
        { label: '500 grams', value: '500' },
      ],
      temperature: [
        { label: '32°F', value: '32' },
        { label: '0°C', value: '0' },
        { label: '273.15 K', value: '273.15' },
        { label: '98.6°F', value: '98.6' },
      ],
      volume: [
        { label: '1 gallon', value: '1' },
        { label: '3.78 liters', value: '3.78' },
        { label: '16 fl oz', value: '16' },
        { label: '250 mL', value: '250' },
      ],
      area: [
        { label: '1000 m²', value: '1000' },
        { label: '1 acre', value: '1' },
        { label: '100 ft²', value: '100' },
        { label: '1 hectare', value: '1' },
      ],
      time: [
        { label: '3600 seconds', value: '3600' },
        { label: '24 hours', value: '24' },
        { label: '7 days', value: '7' },
        { label: '1000 ms', value: '1000' },
      ],
      digital: [
        { label: '1024 MB', value: '1024' },
        { label: '8 GB', value: '8' },
        { label: '1000000 bytes', value: '1000000' },
        { label: '500 Mbit', value: '500' },
      ],
    };
    return examples[config.category] || [];
  };

  const currentUnits = UNIT_OPTIONS[config.category as keyof typeof UNIT_OPTIONS] || [];
  
  // Create unit selection options
  const unitOptions = [
    {
      key: 'fromUnit',
      label: 'From Unit',
      type: 'select' as const,
      default: currentUnits[0]?.value || '',
      options: currentUnits,
      description: 'Select the unit to convert from',
    },
    {
      key: 'toUnit',
      label: 'To Unit',
      type: 'select' as const,
      default: currentUnits[1]?.value || currentUnits[0]?.value || '',
      options: currentUnits,
      description: 'Select the unit to convert to',
    },
  ];

  const examples = getExamples();

  // Category definitions with icons
  const categories = [
    { id: 'length', name: 'Length', icon: '📏' },
    { id: 'weight', name: 'Weight', icon: '⚖️' },
    { id: 'temperature', name: 'Temperature', icon: '🌡️' },
    { id: 'volume', name: 'Volume', icon: '🧪' },
    { id: 'area', name: 'Area', icon: '⬜' },
    { id: 'time', name: 'Time', icon: '⏱️' },
    { id: 'digital', name: 'Digital', icon: '💾' },
  ];

  const swapUnits = () => {
    const tempFrom = config.fromUnit;
    const tempTo = config.toUnit;
    setConfig(prev => ({
      ...prev,
      fromUnit: tempTo,
      toUnit: tempFrom
    }));
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {/* Stylish Unit Converter Container */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 p-6 rounded-2xl shadow-xl h-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg h-full overflow-y-auto">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🔄 Universal Unit Converter</h1>
            <p className="text-gray-600">Convert between metric, imperial, and other measurement systems</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleConfigChange('category', category.id)}
                className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                  config.category === category.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Precision Control */}
          <div className="flex justify-center items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Decimal Places:</span>
            <select
              value={config.precision}
              onChange={(e) => handleConfigChange('precision', parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              {[0, 1, 2, 3, 4, 6].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 align-items-center">
            {/* From Unit */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">From</div>
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter value"
                className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors mb-3 bg-white"
              />
              <select
                value={config.fromUnit}
                onChange={(e) => handleConfigChange('fromUnit', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
              >
                {currentUnits.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center items-center">
              <button
                onClick={swapUnits}
                className="w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center text-xl shadow-lg hover:shadow-xl"
              >
                ⇄
              </button>
            </div>

            {/* To Unit */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">To</div>
              <div className="relative">
                <input
                  type="number"
                  value={output ? parseFloat(output.split('\n')[0].split(/[*^]/)[1]?.trim()) || '' : ''}
                  readOnly
                  placeholder="Result"
                  className="w-full p-3 text-lg border-2 border-gray-200 rounded-lg bg-white mb-3"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(output ? parseFloat(output.split('\n')[0].split(/[*^]/)[1]?.trim())?.toString() || '' : '')}
                  className="absolute right-2 top-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
              <select
                value={config.toUnit}
                onChange={(e) => handleConfigChange('toUnit', e.target.value)}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
              >
                {currentUnits.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {output ? output.split('\n')[0] : '-'}
            </div>
            <div className="text-gray-600 text-sm">
              {output ? `1 ${config.fromUnit.replace('-', ' ')} × ${(output.includes('×') ? output.split('×')[1]?.split(')')[0]?.trim() : 'Conversion formula')}` : 'Select units and enter a value to convert'}
            </div>
          </div>

          {/* Quick Conversions */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Common Conversions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {examples.slice(0, 8).map((example, index) => (
                <button
                  key={index}
                  onClick={() => setInput(example.value)}
                  className="bg-white p-3 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors text-left"
                >
                  <div className="font-semibold text-blue-600">{example.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Converting...</span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-center">{error}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
