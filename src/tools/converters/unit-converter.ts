import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface UnitConverterConfig {
  category: 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'time' | 'speed' | 'pressure' | 'energy' | 'digital';
  fromUnit: string;
  toUnit: string;
  precision: number;
  showFormula: boolean;
  bulkMode: boolean;
  outputFormat: 'detailed' | 'simple' | 'table';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  conversions?: ConversionResult[];
}

interface ConversionResult {
  input: number;
  output: number;
  inputUnit: string;
  outputUnit: string;
  formula?: string;
  category: string;
}

interface Unit {
  name: string;
  abbreviation: string;
  toBase: number; // multiplier to convert to base unit
  baseUnit: string;
  type: 'linear' | 'temperature';
  offset?: number; // for temperature conversions
}

// Unit definitions
const UNIT_CATEGORIES = {
  length: {
    name: 'Length',
    baseUnit: 'meter',
    units: {
      // Metric
      'kilometer': { name: 'Kilometer', abbreviation: 'km', toBase: 1000, baseUnit: 'meter', type: 'linear' },
      'meter': { name: 'Meter', abbreviation: 'm', toBase: 1, baseUnit: 'meter', type: 'linear' },
      'centimeter': { name: 'Centimeter', abbreviation: 'cm', toBase: 0.01, baseUnit: 'meter', type: 'linear' },
      'millimeter': { name: 'Millimeter', abbreviation: 'mm', toBase: 0.001, baseUnit: 'meter', type: 'linear' },
      'micrometer': { name: 'Micrometer', abbreviation: 'μm', toBase: 0.000001, baseUnit: 'meter', type: 'linear' },
      'nanometer': { name: 'Nanometer', abbreviation: 'nm', toBase: 0.000000001, baseUnit: 'meter', type: 'linear' },
      
      // Imperial
      'mile': { name: 'Mile', abbreviation: 'mi', toBase: 1609.344, baseUnit: 'meter', type: 'linear' },
      'yard': { name: 'Yard', abbreviation: 'yd', toBase: 0.9144, baseUnit: 'meter', type: 'linear' },
      'foot': { name: 'Foot', abbreviation: 'ft', toBase: 0.3048, baseUnit: 'meter', type: 'linear' },
      'inch': { name: 'Inch', abbreviation: 'in', toBase: 0.0254, baseUnit: 'meter', type: 'linear' },
      
      // Other
      'nautical-mile': { name: 'Nautical Mile', abbreviation: 'nmi', toBase: 1852, baseUnit: 'meter', type: 'linear' },
      'light-year': { name: 'Light Year', abbreviation: 'ly', toBase: 9.461e15, baseUnit: 'meter', type: 'linear' },
      'astronomical-unit': { name: 'Astronomical Unit', abbreviation: 'AU', toBase: 1.496e11, baseUnit: 'meter', type: 'linear' },
    }
  },
  
  weight: {
    name: 'Weight/Mass',
    baseUnit: 'kilogram',
    units: {
      // Metric
      'kilogram': { name: 'Kilogram', abbreviation: 'kg', toBase: 1, baseUnit: 'kilogram', type: 'linear' },
      'gram': { name: 'Gram', abbreviation: 'g', toBase: 0.001, baseUnit: 'kilogram', type: 'linear' },
      'milligram': { name: 'Milligram', abbreviation: 'mg', toBase: 0.000001, baseUnit: 'kilogram', type: 'linear' },
      'microgram': { name: 'Microgram', abbreviation: 'μg', toBase: 0.000000001, baseUnit: 'kilogram', type: 'linear' },
      'metric-ton': { name: 'Metric Ton', abbreviation: 't', toBase: 1000, baseUnit: 'kilogram', type: 'linear' },
      
      // Imperial
      'pound': { name: 'Pound', abbreviation: 'lb', toBase: 0.453592, baseUnit: 'kilogram', type: 'linear' },
      'ounce': { name: 'Ounce', abbreviation: 'oz', toBase: 0.0283495, baseUnit: 'kilogram', type: 'linear' },
      'stone': { name: 'Stone', abbreviation: 'st', toBase: 6.35029, baseUnit: 'kilogram', type: 'linear' },
      'ton-us': { name: 'US Ton', abbreviation: 'ton', toBase: 907.185, baseUnit: 'kilogram', type: 'linear' },
      'ton-uk': { name: 'UK Ton', abbreviation: 'ton', toBase: 1016.05, baseUnit: 'kilogram', type: 'linear' },
    }
  },
  
  temperature: {
    name: 'Temperature',
    baseUnit: 'celsius',
    units: {
      'celsius': { name: 'Celsius', abbreviation: '°C', toBase: 1, baseUnit: 'celsius', type: 'temperature' },
      'fahrenheit': { name: 'Fahrenheit', abbreviation: '°F', toBase: 1, baseUnit: 'celsius', type: 'temperature' },
      'kelvin': { name: 'Kelvin', abbreviation: 'K', toBase: 1, baseUnit: 'celsius', type: 'temperature' },
      'rankine': { name: 'Rankine', abbreviation: '°R', toBase: 1, baseUnit: 'celsius', type: 'temperature' },
    }
  },
  
  volume: {
    name: 'Volume',
    baseUnit: 'liter',
    units: {
      // Metric
      'liter': { name: 'Liter', abbreviation: 'L', toBase: 1, baseUnit: 'liter', type: 'linear' },
      'milliliter': { name: 'Milliliter', abbreviation: 'mL', toBase: 0.001, baseUnit: 'liter', type: 'linear' },
      'cubic-meter': { name: 'Cubic Meter', abbreviation: 'm³', toBase: 1000, baseUnit: 'liter', type: 'linear' },
      'cubic-centimeter': { name: 'Cubic Centimeter', abbreviation: 'cm³', toBase: 0.001, baseUnit: 'liter', type: 'linear' },
      
      // Imperial
      'gallon-us': { name: 'US Gallon', abbreviation: 'gal', toBase: 3.78541, baseUnit: 'liter', type: 'linear' },
      'gallon-uk': { name: 'UK Gallon', abbreviation: 'gal', toBase: 4.54609, baseUnit: 'liter', type: 'linear' },
      'quart-us': { name: 'US Quart', abbreviation: 'qt', toBase: 0.946353, baseUnit: 'liter', type: 'linear' },
      'pint-us': { name: 'US Pint', abbreviation: 'pt', toBase: 0.473176, baseUnit: 'liter', type: 'linear' },
      'cup-us': { name: 'US Cup', abbreviation: 'cup', toBase: 0.236588, baseUnit: 'liter', type: 'linear' },
      'fluid-ounce-us': { name: 'US Fluid Ounce', abbreviation: 'fl oz', toBase: 0.0295735, baseUnit: 'liter', type: 'linear' },
      'tablespoon-us': { name: 'US Tablespoon', abbreviation: 'tbsp', toBase: 0.0147868, baseUnit: 'liter', type: 'linear' },
      'teaspoon-us': { name: 'US Teaspoon', abbreviation: 'tsp', toBase: 0.00492892, baseUnit: 'liter', type: 'linear' },
    }
  },
  
  area: {
    name: 'Area',
    baseUnit: 'square-meter',
    units: {
      // Metric
      'square-kilometer': { name: 'Square Kilometer', abbreviation: 'km²', toBase: 1000000, baseUnit: 'square-meter', type: 'linear' },
      'square-meter': { name: 'Square Meter', abbreviation: 'm²', toBase: 1, baseUnit: 'square-meter', type: 'linear' },
      'square-centimeter': { name: 'Square Centimeter', abbreviation: 'cm²', toBase: 0.0001, baseUnit: 'square-meter', type: 'linear' },
      'square-millimeter': { name: 'Square Millimeter', abbreviation: 'mm²', toBase: 0.000001, baseUnit: 'square-meter', type: 'linear' },
      'hectare': { name: 'Hectare', abbreviation: 'ha', toBase: 10000, baseUnit: 'square-meter', type: 'linear' },
      
      // Imperial
      'square-mile': { name: 'Square Mile', abbreviation: 'mi²', toBase: 2589988.11, baseUnit: 'square-meter', type: 'linear' },
      'acre': { name: 'Acre', abbreviation: 'ac', toBase: 4046.86, baseUnit: 'square-meter', type: 'linear' },
      'square-yard': { name: 'Square Yard', abbreviation: 'yd²', toBase: 0.836127, baseUnit: 'square-meter', type: 'linear' },
      'square-foot': { name: 'Square Foot', abbreviation: 'ft²', toBase: 0.092903, baseUnit: 'square-meter', type: 'linear' },
      'square-inch': { name: 'Square Inch', abbreviation: 'in²', toBase: 0.00064516, baseUnit: 'square-meter', type: 'linear' },
    }
  },
  
  time: {
    name: 'Time',
    baseUnit: 'second',
    units: {
      'nanosecond': { name: 'Nanosecond', abbreviation: 'ns', toBase: 0.000000001, baseUnit: 'second', type: 'linear' },
      'microsecond': { name: 'Microsecond', abbreviation: 'μs', toBase: 0.000001, baseUnit: 'second', type: 'linear' },
      'millisecond': { name: 'Millisecond', abbreviation: 'ms', toBase: 0.001, baseUnit: 'second', type: 'linear' },
      'second': { name: 'Second', abbreviation: 's', toBase: 1, baseUnit: 'second', type: 'linear' },
      'minute': { name: 'Minute', abbreviation: 'min', toBase: 60, baseUnit: 'second', type: 'linear' },
      'hour': { name: 'Hour', abbreviation: 'h', toBase: 3600, baseUnit: 'second', type: 'linear' },
      'day': { name: 'Day', abbreviation: 'd', toBase: 86400, baseUnit: 'second', type: 'linear' },
      'week': { name: 'Week', abbreviation: 'wk', toBase: 604800, baseUnit: 'second', type: 'linear' },
      'month': { name: 'Month', abbreviation: 'mo', toBase: 2629746, baseUnit: 'second', type: 'linear' }, // average month
      'year': { name: 'Year', abbreviation: 'yr', toBase: 31556952, baseUnit: 'second', type: 'linear' }, // average year
    }
  },
  
  digital: {
    name: 'Digital Storage',
    baseUnit: 'byte',
    units: {
      // Binary (base 2)
      'bit': { name: 'Bit', abbreviation: 'bit', toBase: 0.125, baseUnit: 'byte', type: 'linear' },
      'byte': { name: 'Byte', abbreviation: 'B', toBase: 1, baseUnit: 'byte', type: 'linear' },
      'kilobyte': { name: 'Kilobyte', abbreviation: 'KB', toBase: 1024, baseUnit: 'byte', type: 'linear' },
      'megabyte': { name: 'Megabyte', abbreviation: 'MB', toBase: 1024 * 1024, baseUnit: 'byte', type: 'linear' },
      'gigabyte': { name: 'Gigabyte', abbreviation: 'GB', toBase: 1024 * 1024 * 1024, baseUnit: 'byte', type: 'linear' },
      'terabyte': { name: 'Terabyte', abbreviation: 'TB', toBase: 1024 * 1024 * 1024 * 1024, baseUnit: 'byte', type: 'linear' },
      'petabyte': { name: 'Petabyte', abbreviation: 'PB', toBase: Math.pow(1024, 5), baseUnit: 'byte', type: 'linear' },
      
      // Decimal (base 10)
      'kilobit': { name: 'Kilobit', abbreviation: 'Kbit', toBase: 125, baseUnit: 'byte', type: 'linear' },
      'megabit': { name: 'Megabit', abbreviation: 'Mbit', toBase: 125000, baseUnit: 'byte', type: 'linear' },
      'gigabit': { name: 'Gigabit', abbreviation: 'Gbit', toBase: 125000000, baseUnit: 'byte', type: 'linear' },
    }
  }
} as const;

function convertTemperature(value: number, fromUnit: string, toUnit: string): number {
  // Convert to Celsius first
  let celsius: number;
  
  switch (fromUnit) {
    case 'celsius':
      celsius = value;
      break;
    case 'fahrenheit':
      celsius = (value - 32) * 5/9;
      break;
    case 'kelvin':
      celsius = value - 273.15;
      break;
    case 'rankine':
      celsius = (value - 491.67) * 5/9;
      break;
    default:
      throw new Error(`Unknown temperature unit: ${fromUnit}`);
  }
  
  // Convert from Celsius to target unit
  switch (toUnit) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return celsius * 9/5 + 32;
    case 'kelvin':
      return celsius + 273.15;
    case 'rankine':
      return (celsius + 273.15) * 9/5;
    default:
      throw new Error(`Unknown temperature unit: ${toUnit}`);
  }
}

function convertLinear(value: number, fromUnit: Unit, toUnit: Unit): number {
  // Convert to base unit first, then to target unit
  const baseValue = value * fromUnit.toBase;
  return baseValue / toUnit.toBase;
}

function getTemperatureFormula(fromUnit: string, toUnit: string): string {
  const formulas: { [key: string]: string } = {
    'celsius-fahrenheit': '°F = °C × 9/5 + 32',
    'fahrenheit-celsius': '°C = (°F - 32) × 5/9',
    'celsius-kelvin': 'K = °C + 273.15',
    'kelvin-celsius': '°C = K - 273.15',
    'fahrenheit-kelvin': 'K = (°F - 32) × 5/9 + 273.15',
    'kelvin-fahrenheit': '°F = (K - 273.15) × 9/5 + 32',
    'celsius-rankine': '°R = (°C + 273.15) × 9/5',
    'rankine-celsius': '°C = (°R × 5/9) - 273.15',
    'fahrenheit-rankine': '°R = °F + 459.67',
    'rankine-fahrenheit': '°F = °R - 459.67',
    'kelvin-rankine': '°R = K × 9/5',
    'rankine-kelvin': 'K = °R × 5/9',
  };
  
  return formulas[`${fromUnit}-${toUnit}`] || `Convert ${fromUnit} to ${toUnit}`;
}

function getLinearFormula(fromUnit: Unit, toUnit: Unit): string {
  if (fromUnit.toBase === toUnit.toBase) {
    return `${toUnit.abbreviation} = ${fromUnit.abbreviation}`;
  }
  
  const factor = fromUnit.toBase / toUnit.toBase;
  return `${toUnit.abbreviation} = ${fromUnit.abbreviation} × ${factor}`;
}

function validateInput(input: string, category: string): string | null {
  if (!input.trim()) {
    return 'Please provide a value to convert';
  }
  
  const value = parseFloat(input.trim());
  if (isNaN(value)) {
    return 'Please provide a valid number';
  }
  
  // Temperature validation
  if (category === 'temperature') {
    if (value < -273.15 && input.toLowerCase().includes('celsius')) {
      return 'Temperature cannot be below absolute zero (-273.15°C)';
    }
    if (value < -459.67 && input.toLowerCase().includes('fahrenheit')) {
      return 'Temperature cannot be below absolute zero (-459.67°F)';
    }
    if (value < 0 && input.toLowerCase().includes('kelvin')) {
      return 'Kelvin temperature cannot be negative';
    }
  }
  
  // Digital storage validation
  if (category === 'digital' && value < 0) {
    return 'Digital storage size cannot be negative';
  }
  
  return null;
}

function formatOutput(results: ConversionResult[], config: UnitConverterConfig): string {
  if (results.length === 0) {
    return 'No conversions to display.';
  }
  
  if (config.outputFormat === 'simple') {
    return formatSimpleOutput(results, config);
  } else if (config.outputFormat === 'table') {
    return formatTableOutput(results, config);
  }
  
  return formatDetailedOutput(results, config);
}

function formatDetailedOutput(results: ConversionResult[], config: UnitConverterConfig): string {
  let output = `# Unit Conversion Results\n\n`;
  output += `**Category**: ${UNIT_CATEGORIES[config.category].name}\n\n`;
  
  results.forEach((result, index) => {
    if (index > 0) output += '\n---\n\n';
    
    output += `## Conversion ${index + 1}\n\n`;
    output += `**Input**: ${result.input.toLocaleString()} ${result.inputUnit}\n`;
    output += `**Output**: ${result.output.toFixed(config.precision).toLocaleString()} ${result.outputUnit}\n\n`;
    
    if (config.showFormula && result.formula) {
      output += `**Formula**: ${result.formula}\n\n`;
    }
    
    // Add context for some conversions
    if (config.category === 'temperature' && Math.abs(result.output) > 1000) {
      output += `*Note: This is an extreme temperature value*\n\n`;
    }
    
    if (config.category === 'length' && result.outputUnit === 'light-year') {
      output += `*Note: Light travels this distance in ${result.output.toFixed(2)} year(s)*\n\n`;
    }
  });
  
  output += `---\n*Converted by FreeFormatHub Unit Converter*`;
  
  return output;
}

function formatSimpleOutput(results: ConversionResult[], config: UnitConverterConfig): string {
  let output = '';
  
  results.forEach((result, index) => {
    if (index > 0) output += '\n';
    
    const inputUnit = UNIT_CATEGORIES[config.category].units[result.inputUnit]?.abbreviation || result.inputUnit;
    const outputUnit = UNIT_CATEGORIES[config.category].units[result.outputUnit]?.abbreviation || result.outputUnit;
    
    output += `${result.input} ${inputUnit} = ${result.output.toFixed(config.precision)} ${outputUnit}`;
  });
  
  return output;
}

function formatTableOutput(results: ConversionResult[], config: UnitConverterConfig): string {
  let output = `| Input | Output | Units |\n`;
  output += `|-------|--------|-------|\n`;
  
  results.forEach(result => {
    const inputUnit = UNIT_CATEGORIES[config.category].units[result.inputUnit]?.abbreviation || result.inputUnit;
    const outputUnit = UNIT_CATEGORIES[config.category].units[result.outputUnit]?.abbreviation || result.outputUnit;
    
    output += `| ${result.input.toLocaleString()} ${inputUnit} | ${result.output.toFixed(config.precision).toLocaleString()} ${outputUnit} | ${inputUnit} → ${outputUnit} |\n`;
  });
  
  return output;
}

export function processUnitConverter(input: string, config: UnitConverterConfig): ToolResult {
  try {
    const error = validateInput(input, config.category);
    if (error) {
      return { success: false, error };
    }
    
    const category = UNIT_CATEGORIES[config.category];
    if (!category) {
      return { success: false, error: 'Invalid category selected' };
    }
    
    const fromUnit = category.units[config.fromUnit];
    const toUnit = category.units[config.toUnit];
    
    if (!fromUnit) {
      return { success: false, error: `Invalid from unit: ${config.fromUnit}` };
    }
    
    if (!toUnit) {
      return { success: false, error: `Invalid to unit: ${config.toUnit}` };
    }
    
    const inputValues = config.bulkMode 
      ? input.split(/[,\n]/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
      : [parseFloat(input.trim())];
    
    const results: ConversionResult[] = [];
    
    for (const value of inputValues) {
      let convertedValue: number;
      let formula: string | undefined;
      
      if (config.category === 'temperature') {
        convertedValue = convertTemperature(value, config.fromUnit, config.toUnit);
        formula = config.showFormula ? getTemperatureFormula(config.fromUnit, config.toUnit) : undefined;
      } else {
        convertedValue = convertLinear(value, fromUnit, toUnit);
        formula = config.showFormula ? getLinearFormula(fromUnit, toUnit) : undefined;
      }
      
      results.push({
        input: value,
        output: convertedValue,
        inputUnit: fromUnit.abbreviation,
        outputUnit: toUnit.abbreviation,
        formula,
        category: category.name
      });
    }
    
    const output = formatOutput(results, config);
    
    return {
      success: true,
      output,
      conversions: results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert units'
    };
  }
}

export const UNIT_CONVERTER_TOOL: Tool = {
  id: 'unit-converter',
  name: 'Unit Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'numbers-units')!,
  slug: 'unit-converter',
  icon: '📏',
  keywords: ['unit converter', 'measurement converter', 'length converter', 'weight converter', 'mass converter', 'distance converter', 'height converter', 'temperature converter', 'volume converter', 'area converter', 'time converter', 'digital storage converter', 'metric to imperial', 'imperial to metric', 'meters to feet', 'kg to pounds', 'celsius to fahrenheit', 'inches to cm', 'miles to km', 'liters to gallons', 'pounds to kg', 'feet to meters', 'cm to inches', 'fahrenheit to celsius', 'kg to lbs', 'meter', 'foot', 'inch', 'yard', 'mile', 'kilometer', 'centimeter', 'millimeter', 'kilogram', 'gram', 'pound', 'ounce', 'stone', 'ton', 'celsius', 'fahrenheit', 'kelvin', 'liter', 'gallon', 'cup', 'measurement', 'conversion', 'calculator', 'metric system', 'imperial system', 'scientific units', 'engineering units'],
  seoTitle: 'Unit Converter - Length, Weight, Temperature, Volume & Area Calculator | Metric & Imperial',
  seoDescription: 'Free unit converter for length (meters, feet, inches), weight (kg, pounds, ounces), temperature (°C, °F, K), volume, area, time & digital storage. Convert between metric and imperial systems instantly.',
  description: 'Professional unit converter and measurement calculator supporting length (meters, feet, inches, miles, km), weight/mass (kg, pounds, ounces, grams), temperature (Celsius, Fahrenheit, Kelvin), volume (liters, gallons, cups), area, time, and digital storage conversions. Convert between metric, imperial, and scientific measurement systems with precision formulas.',
  
  examples: [
    {
      title: 'Length Conversion',
      input: '100',
      output: `# Unit Conversion Results

**Category**: Length

## Conversion 1

**Input**: 100 m
**Output**: 328.084 ft

**Formula**: ft = m × 3.28084`,
      description: 'Convert 100 meters to feet with formula'
    },
    {
      title: 'Temperature Conversion',
      input: '32',
      output: `# Unit Conversion Results

**Category**: Temperature

## Conversion 1

**Input**: 32 °F
**Output**: 0.00 °C

**Formula**: °C = (°F - 32) × 5/9`,
      description: 'Convert 32°F to Celsius (freezing point of water)'
    },
    {
      title: 'Digital Storage',
      input: '1',
      output: `# Unit Conversion Results

**Category**: Digital Storage

## Conversion 1

**Input**: 1 GB
**Output**: 1,024.00 MB

**Formula**: MB = GB × 1024`,
      description: 'Convert 1 GB to MB using binary calculation'
    }
  ],
  
  useCases: [
    'Engineering and construction project measurements',
    'Cooking and recipe conversions (cups to ml, oz to grams)',
    'International shipping and logistics (kg to lbs, cm to inches)',
    'Scientific calculations and research (Celsius to Kelvin)',
    'Digital storage capacity planning (GB to TB, MB to KB)',
    'Travel and distance planning (miles to km, feet to meters)',
    'Fitness and health tracking (weight conversion, height conversion)',
    'Real estate and property measurements (sq ft to sq meters)',
    'Academic homework and educational projects',
    'DIY home improvement and crafting projects',
    'Weather and climate data analysis',
    'Sports and athletics measurements',
    'Medical and pharmaceutical dosage calculations',
    'Automotive specifications and repairs'
  ],
  
  faq: [
    {
      question: 'How do I convert meters to feet and inches?',
      answer: 'Enter your meter value, select "meter" as from unit and "foot" as to unit. The converter shows: 1 meter = 3.28084 feet or 1 meter = 39.3701 inches using precise conversion formulas.'
    },
    {
      question: 'How do I convert kg to pounds and ounces?',
      answer: 'Select weight category, enter kg value, choose "pound" or "ounce" as target unit. 1 kg = 2.20462 pounds or 1 kg = 35.274 ounces. Perfect for cooking, fitness, and shipping calculations.'
    },
    {
      question: 'How do I convert Celsius to Fahrenheit?',
      answer: 'Use the temperature category: °F = (°C × 9/5) + 32. For example: 20°C = 68°F. Also supports Kelvin and Rankine for scientific applications.'
    },
    {
      question: 'What measurement categories are supported?',
      answer: 'Length (meters, feet, inches, miles, km), Weight (kg, pounds, ounces, grams), Temperature (°C, °F, K), Volume (liters, gallons, cups), Area (sq meters, sq feet), Time, and Digital Storage (GB, MB, TB).'
    },
    {
      question: 'Can I convert between metric and imperial systems?',
      answer: 'Yes! The converter seamlessly handles metric ↔ imperial conversions: meters ↔ feet, kg ↔ pounds, Celsius ↔ Fahrenheit, liters ↔ gallons, and more with high precision.'
    },
    {
      question: 'Is this converter accurate for engineering and scientific use?',
      answer: 'Yes, uses internationally recognized conversion factors with configurable precision. Suitable for engineering, construction, scientific research, and professional applications.'
    },
    {
      question: 'Can I convert multiple values at once?',
      answer: 'Yes! Enable bulk mode and separate multiple values with commas or line breaks to convert several measurements simultaneously.'
    },
    {
      question: 'How precise are the conversions?',
      answer: 'Conversions use precise conversion factors and you can adjust decimal precision. Temperature conversions are accurate to scientific standards.'
    }
  ],
  
  commonErrors: [
    'Invalid temperature below absolute zero - check your input values',
    'Negative values for measurements that cannot be negative',
    'Mixed unit types - ensure from and to units are in the same category',
    'Very large numbers may lose precision in extreme conversions',
    'Empty or non-numeric input values'
  ],

  relatedTools: ['number-base-converter', 'timestamp-converter', 'color-converter']
};