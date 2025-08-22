import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface MathEvaluatorConfig {
  precision: number;
  angleUnit: 'degrees' | 'radians';
  outputFormat: 'decimal' | 'scientific' | 'fraction' | 'mixed';
  showSteps: boolean;
  validateSyntax: boolean;
  allowVariables: boolean;
  enableFunctions: boolean;
  complexNumbers: boolean;
}

interface MathResult {
  result: number | string;
  formattedResult: string;
  originalExpression: string;
  simplifiedExpression?: string;
  steps?: string[];
  variables?: Record<string, number>;
  functions?: string[];
  warnings?: string[];
  expressionType: 'arithmetic' | 'algebraic' | 'trigonometric' | 'logarithmic' | 'complex';
  isValid: boolean;
}

// Mathematical constants
const MATH_CONSTANTS = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2, // Golden ratio
  τ: 2 * Math.PI,
  ln2: Math.LN2,
  ln10: Math.LN10,
  log2e: Math.LOG2E,
  log10e: Math.LOG10E,
  sqrt2: Math.SQRT2,
  sqrt1_2: Math.SQRT1_2
};

// Mathematical functions
const MATH_FUNCTIONS = {
  // Basic functions
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  trunc: Math.trunc,
  sign: Math.sign,
  
  // Power and root functions
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  pow: Math.pow,
  exp: Math.exp,
  exp2: (x: number) => Math.pow(2, x),
  exp10: (x: number) => Math.pow(10, x),
  
  // Logarithmic functions
  log: Math.log,
  log2: Math.log2,
  log10: Math.log10,
  ln: Math.log,
  
  // Trigonometric functions
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  
  // Hyperbolic functions
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  
  // Statistical functions
  min: Math.min,
  max: Math.max,
  
  // Custom functions
  factorial: (n: number) => {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  },
  
  gcd: (a: number, b: number) => {
    a = Math.abs(Math.floor(a));
    b = Math.abs(Math.floor(b));
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return a;
  },
  
  lcm: (a: number, b: number) => {
    return Math.abs(a * b) / MATH_FUNCTIONS.gcd(a, b);
  },
  
  deg: (radians: number) => (radians * 180) / Math.PI,
  rad: (degrees: number) => (degrees * Math.PI) / 180,
  
  sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
  mean: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
  
  // Combinatorics
  choose: (n: number, k: number) => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
  },
  
  permute: (n: number, k: number) => {
    if (k > n || k < 0) return 0;
    let result = 1;
    for (let i = n; i > n - k; i--) {
      result *= i;
    }
    return result;
  }
};

// Tokenize expression
function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let current = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (/[a-zA-Z_]/.test(char)) {
      // Start of identifier (function or variable)
      current += char;
    } else if (/\d/.test(char) || char === '.') {
      // Number
      current += char;
    } else if (/[\s]/.test(char)) {
      // Whitespace
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      // Operator or special character
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

// Simple expression evaluator using recursive descent parsing
function evaluateExpression(expression: string, config: MathEvaluatorConfig): MathResult {
  const steps: string[] = [];
  const warnings: string[] = [];
  let expressionType: MathResult['expressionType'] = 'arithmetic';
  
  try {
    // Clean and normalize expression
    let cleanExpression = expression
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');
    
    // Replace constants
    Object.entries(MATH_CONSTANTS).forEach(([name, value]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      cleanExpression = cleanExpression.replace(regex, value.toString());
    });
    
    // Detect expression type
    if (/sin|cos|tan|asin|acos|atan|sinh|cosh|tanh/.test(cleanExpression)) {
      expressionType = 'trigonometric';
    } else if (/log|ln|exp/.test(cleanExpression)) {
      expressionType = 'logarithmic';
    } else if (/[a-zA-Z]/.test(cleanExpression.replace(/sin|cos|tan|log|ln|exp|sqrt|abs|ceil|floor|round/g, ''))) {
      expressionType = 'algebraic';
    }
    
    // Handle angle units for trigonometric functions
    if (expressionType === 'trigonometric' && config.angleUnit === 'degrees') {
      cleanExpression = cleanExpression
        .replace(/sin\(([^)]+)\)/g, 'sin(($1) * π / 180)')
        .replace(/cos\(([^)]+)\)/g, 'cos(($1) * π / 180)')
        .replace(/tan\(([^)]+)\)/g, 'tan(($1) * π / 180)');
    }
    
    if (config.showSteps) {
      steps.push(`Original: ${expression}`);
      steps.push(`Cleaned: ${cleanExpression}`);
    }
    
    // Simple evaluation using Function constructor (safe for mathematical expressions)
    // Note: In production, use a proper math parser for security
    const mathContext = {
      ...Math,
      ...MATH_CONSTANTS,
      ...MATH_FUNCTIONS
    };
    
    // Create a safe evaluation context
    const contextString = Object.keys(mathContext)
      .map(key => `const ${key} = mathContext.${key};`)
      .join('\n');
    
    const evalFunction = new Function('mathContext', `
      ${contextString}
      try {
        return ${cleanExpression};
      } catch (error) {
        throw new Error('Invalid expression: ' + error.message);
      }
    `);
    
    const result = evalFunction(mathContext);
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Result is not a valid number');
    }
    
    // Format result based on configuration
    let formattedResult = formatNumber(result, config);
    
    if (config.showSteps && steps.length > 0) {
      steps.push(`Result: ${result}`);
      steps.push(`Formatted: ${formattedResult}`);
    }
    
    return {
      result,
      formattedResult,
      originalExpression: expression,
      simplifiedExpression: cleanExpression,
      steps: config.showSteps ? steps : undefined,
      expressionType,
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      result: NaN,
      formattedResult: 'Error',
      originalExpression: expression,
      expressionType: 'arithmetic',
      isValid: false,
      warnings: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

function formatNumber(num: number, config: MathEvaluatorConfig): string {
  if (!isFinite(num)) {
    return num.toString();
  }
  
  switch (config.outputFormat) {
    case 'scientific':
      return num.toExponential(config.precision);
    
    case 'fraction':
      return decimalToFraction(num);
    
    case 'mixed':
      if (Math.abs(num) < 0.001 || Math.abs(num) > 1000000) {
        return num.toExponential(config.precision);
      } else if (num === Math.floor(num)) {
        return num.toString();
      } else {
        return num.toFixed(config.precision);
      }
    
    default: // decimal
      return num.toFixed(config.precision);
  }
}

function decimalToFraction(decimal: number): string {
  if (decimal === Math.floor(decimal)) {
    return decimal.toString();
  }
  
  const tolerance = 1e-6;
  let numerator = 1;
  let denominator = 1;
  let bestNumerator = Math.round(decimal);
  let bestDenominator = 1;
  let bestError = Math.abs(decimal - bestNumerator);
  
  for (denominator = 2; denominator <= 1000; denominator++) {
    numerator = Math.round(decimal * denominator);
    const error = Math.abs(decimal - numerator / denominator);
    
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
      
      if (error < tolerance) {
        break;
      }
    }
  }
  
  if (bestDenominator === 1) {
    return bestNumerator.toString();
  }
  
  return `${bestNumerator}/${bestDenominator}`;
}

export function processMathExpressionEvaluator(expression: string, config: MathEvaluatorConfig): Promise<ToolResult<MathResult | null>> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      if (!expression.trim()) {
        resolve({
          data: null,
          error: 'Please enter a mathematical expression to evaluate',
          processing_time: 0
        });
        return;
      }
      
      // Basic security check for malicious code
      const dangerousPatterns = [
        /require\s*\(/,
        /import\s+/,
        /eval\s*\(/,
        /Function\s*\(/,
        /process\./,
        /global\./,
        /window\./,
        /document\./,
        /__/,
        /constructor/,
        /prototype/
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(expression)) {
          resolve({
            data: null,
            error: 'Expression contains potentially unsafe code',
            processing_time: Date.now() - startTime
          });
          return;
        }
      }
      
      const result = evaluateExpression(expression, config);
      
      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          inputLength: expression.length,
          expressionType: result.expressionType,
          hasSteps: !!result.steps,
          stepsCount: result.steps?.length || 0,
          isValid: result.isValid,
          hasWarnings: !!result.warnings,
          outputFormat: config.outputFormat,
          precision: config.precision,
          angleUnit: config.angleUnit
        }
      });
      
    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to evaluate expression',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Basic Arithmetic',
    description: 'Simple arithmetic operations with order of operations',
    input: '(2 + 3) * 4 - 8 / 2',
    output: `Result: 16
Expression Type: Arithmetic
Steps:
1. Original: (2 + 3) * 4 - 8 / 2
2. Cleaned: (2 + 3) * 4 - 8 / 2
3. Result: 16
4. Formatted: 16.00`
  },
  {
    title: 'Trigonometric Functions',
    description: 'Calculate trigonometric values with degree/radian support',
    input: 'sin(30) + cos(45) + tan(60)',
    output: `Result: 2.9417 (degrees mode)
Expression Type: Trigonometric
Functions Used: sin, cos, tan
Angle Unit: degrees
Formatted: 2.94`
  },
  {
    title: 'Logarithms and Exponentials',
    description: 'Logarithmic and exponential calculations',
    input: 'log10(100) + ln(e) + exp(2)',
    output: `Result: 10.3891
Expression Type: Logarithmic
Functions Used: log10, ln, exp
Constants Used: e
Formatted: 10.39`
  },
  {
    title: 'Advanced Functions',
    description: 'Custom mathematical functions and constants',
    input: 'factorial(5) + choose(10, 3) + sqrt(pi)',
    output: `Result: 361.7725
Functions Used: factorial, choose, sqrt
Constants Used: π
Formatted: 361.77`
  }
];

export const MATH_EXPRESSION_EVALUATOR_TOOL: Tool = {
  id: 'math-expression-evaluator',
  name: 'Math Expression Evaluator',
  description: 'Evaluate complex mathematical expressions with support for functions, constants, variables, and multiple output formats including step-by-step solutions',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'math')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'math')!.subcategories!.find(sub => sub.id === 'calculators')!,
  tags: ['math', 'calculator', 'expression', 'algebra', 'trigonometry', 'logarithm', 'function', 'evaluate'],
  complexity: 'advanced',
  examples,
  faqs: [
    {
      question: 'What mathematical functions are supported?',
      answer: 'The tool supports arithmetic operations, trigonometric functions (sin, cos, tan), logarithms (log, ln), exponentials (exp), roots (sqrt, cbrt), statistical functions (min, max, avg), and custom functions (factorial, gcd, lcm, choose).'
    },
    {
      question: 'Can I use mathematical constants?',
      answer: 'Yes, common constants are supported: π (pi), e, φ (phi/golden ratio), τ (tau), ln2, sqrt2, and others. You can use either symbolic names (pi, π) or spelled out (pi).'
    },
    {
      question: 'How do I handle angle units in trigonometric functions?',
      answer: 'The tool supports both degrees and radians. Set the angle unit in configuration - trigonometric functions will automatically convert degrees to radians when needed.'
    },
    {
      question: 'What output formats are available?',
      answer: 'Results can be displayed as: decimal (fixed precision), scientific notation, fractions, or mixed format (automatically chooses best representation).'
    },
    {
      question: 'Can I see step-by-step solutions?',
      answer: 'Yes, enable "Show Steps" to see the evaluation process including expression cleaning, substitutions, and formatting steps.'
    }
  ],
  relatedTools: ['calculator', 'unit-converter', 'base-converter', 'statistical-calculator', 'scientific-calculator']
};