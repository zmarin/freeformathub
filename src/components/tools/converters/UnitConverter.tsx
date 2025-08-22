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

  const currentUnits = UNIT_OPTIONS[config.category];
  
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

  return (
    <div className={`grid gap-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4 space-y-6">
        <InputPanel
          title="Value to Convert"
          value={input}
          onChange={setInput}
          placeholder={config.bulkMode ? "100, 200, 300" : "100"}
          description={
            config.bulkMode 
              ? "Enter multiple values separated by commas or newlines"
              : "Enter a numeric value to convert"
          }
          examples={examples}
          onExampleClick={handleExample}
        />
        
        <OptionsPanel
          title="Conversion Settings"
          options={[...OPTIONS, ...unitOptions]}
          values={config}
          onChange={handleConfigChange}
        />
      </div>

      <div className="lg:col-span-8">
        <OutputPanel
          title="Conversion Results"
          value={output}
          error={error}
          isProcessing={isProcessing}
          language="markdown"
          placeholder="Enter a value to see the conversion results..."
        />
      </div>
    </div>
  );
}