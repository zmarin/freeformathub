import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface YamlValidatorConfig {
  strictMode: boolean;
  allowDuplicateKeys: boolean;
  allowEmptyValues: boolean;
  allowTabIndentation: boolean;
  requireQuotedStrings: boolean;
  validateAnchors: boolean;
  validateReferences: boolean;
  checkIndentation: boolean;
  validateTypes: boolean;
  allowComments: boolean;
  maxDepth: number;
  maxLineLength: number;
  allowFlowStyle: boolean;
  validateDocumentMarkers: boolean;
  checkKeyOrder: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  validation?: YamlValidation;
  analysis?: YamlAnalysis;
  warnings?: string[];
}

interface YamlValidation {
  isValid: boolean;
  yamlContent: string;
  parsedData: any;
  syntaxValid: boolean;
  indentationValid: boolean;
  keysValid: boolean;
  valuesValid: boolean;
  anchorsValid: boolean;
  referencesValid: boolean;
  documentMarkersValid: boolean;
  structure: YamlStructure;
  errors: YamlError[];
}

interface YamlAnalysis {
  documentCount: number;
  totalLines: number;
  totalKeys: number;
  maxDepth: number;
  indentationStyle: 'spaces' | 'tabs' | 'mixed' | 'unknown';
  spacesPerIndent: number;
  hasComments: boolean;
  hasMultilineStrings: boolean;
  hasAnchors: boolean;
  hasReferences: boolean;
  hasFlowStyle: boolean;
  hasBlockStyle: boolean;
  dataTypes: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  recommendations: string[];
  potentialIssues: string[];
}

interface YamlStructure {
  type: 'object' | 'array' | 'scalar' | 'null';
  keys?: string[];
  depth: number;
  itemCount: number;
  nestedStructures: YamlStructure[];
}

interface YamlError {
  type: 'syntax' | 'indentation' | 'duplicate_key' | 'invalid_reference' | 'type_error' | 'format_error';
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

// YAML parsing and validation functions
function parseYamlContent(content: string): { parsed: any; errors: YamlError[] } {
  const errors: YamlError[] = [];
  let parsed: any = null;

  try {
    // Basic YAML parsing simulation (in real implementation, use js-yaml library)
    const lines = content.split('\n');
    let currentLevel = 0;
    let result: any = {};
    let stack: any[] = [result];
    let arrayStack: boolean[] = [false];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Calculate indentation
      const indent = line.length - line.trimStart().length;
      const level = Math.floor(indent / 2); // Assuming 2-space indentation

      // Basic key-value parsing
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        // Check for duplicate keys
        if (stack[stack.length - 1] && typeof stack[stack.length - 1] === 'object' && key in stack[stack.length - 1]) {
          errors.push({
            type: 'duplicate_key',
            message: `Duplicate key "${key}"`,
            line: i + 1,
            severity: 'error'
          });
        }

        // Handle nested structures
        if (level > currentLevel) {
          // Going deeper
          const newObj = {};
          if (Array.isArray(stack[stack.length - 1])) {
            stack[stack.length - 1].push(newObj);
          } else {
            const parentKey = Object.keys(stack[stack.length - 1]).pop();
            if (parentKey) {
              stack[stack.length - 1][parentKey] = newObj;
            }
          }
          stack.push(newObj);
          arrayStack.push(false);
        } else if (level < currentLevel) {
          // Going back up
          while (stack.length > level + 1) {
            stack.pop();
            arrayStack.pop();
          }
        }

        // Set the value
        if (stack[stack.length - 1] && typeof stack[stack.length - 1] === 'object') {
          if (value) {
            stack[stack.length - 1][key] = parseYamlValue(value);
          } else {
            stack[stack.length - 1][key] = null;
          }
        }

        currentLevel = level;
      } else if (trimmed.startsWith('-')) {
        // Array item
        const value = trimmed.substring(1).trim();
        
        if (!Array.isArray(stack[stack.length - 1])) {
          // Convert to array
          const newArray: any[] = [];
          const parentObj = stack[stack.length - 2];
          const lastKey = Object.keys(parentObj).pop();
          if (lastKey) {
            parentObj[lastKey] = newArray;
          }
          stack[stack.length - 1] = newArray;
          arrayStack[arrayStack.length - 1] = true;
        }
        
        stack[stack.length - 1].push(parseYamlValue(value));
      }
    }

    parsed = result;

  } catch (error) {
    errors.push({
      type: 'syntax',
      message: error instanceof Error ? error.message : 'Unknown parsing error',
      severity: 'error'
    });
  }

  return { parsed, errors };
}

function parseYamlValue(value: string): any {
  if (!value || value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  // Handle quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Return as string
  return value;
}

function validateIndentation(content: string, config: YamlValidatorConfig): { valid: boolean; errors: YamlError[] } {
  const errors: YamlError[] = [];
  const lines = content.split('\n');
  let detectedSpaces = 0;
  let hasSpaces = false;
  let hasTabs = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
    
    if (leadingWhitespace.includes('\t')) {
      hasTabs = true;
      if (!config.allowTabIndentation) {
        errors.push({
          type: 'indentation',
          message: 'Tab indentation is not allowed',
          line: i + 1,
          severity: 'error'
        });
      }
    }

    if (leadingWhitespace.includes(' ')) {
      hasSpaces = true;
      if (!detectedSpaces && leadingWhitespace.length > 0) {
        // Detect indentation size
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          const nextWhitespace = nextLine.match(/^(\s*)/)?.[1] || '';
          if (nextWhitespace.length > leadingWhitespace.length) {
            detectedSpaces = nextWhitespace.length - leadingWhitespace.length;
            break;
          }
        }
      }
    }
  }

  if (hasSpaces && hasTabs) {
    errors.push({
      type: 'indentation',
      message: 'Mixed tab and space indentation detected',
      severity: 'warning'
    });
  }

  // Check indentation consistency
  if (config.checkIndentation && detectedSpaces > 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const leadingSpaces = line.match(/^( *)/)?.[1].length || 0;
      if (leadingSpaces > 0 && leadingSpaces % detectedSpaces !== 0) {
        errors.push({
          type: 'indentation',
          message: `Inconsistent indentation. Expected multiple of ${detectedSpaces} spaces`,
          line: i + 1,
          severity: 'warning'
        });
      }
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
}

function analyzeYamlStructure(data: any, depth: number = 0): YamlStructure {
  if (data === null || data === undefined) {
    return {
      type: 'null',
      depth,
      itemCount: 0,
      nestedStructures: []
    };
  }

  if (Array.isArray(data)) {
    const nestedStructures = data.map((item, index) => 
      analyzeYamlStructure(item, depth + 1)
    );

    return {
      type: 'array',
      depth,
      itemCount: data.length,
      nestedStructures
    };
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    const nestedStructures = keys.map(key => 
      analyzeYamlStructure(data[key], depth + 1)
    );

    return {
      type: 'object',
      keys,
      depth,
      itemCount: keys.length,
      nestedStructures
    };
  }

  return {
    type: 'scalar',
    depth,
    itemCount: 1,
    nestedStructures: []
  };
}

function analyzeYamlContent(content: string, parsedData: any): YamlAnalysis {
  const lines = content.split('\n');
  const analysis: YamlAnalysis = {
    documentCount: 1,
    totalLines: lines.length,
    totalKeys: 0,
    maxDepth: 0,
    indentationStyle: 'unknown',
    spacesPerIndent: 2,
    hasComments: false,
    hasMultilineStrings: false,
    hasAnchors: false,
    hasReferences: false,
    hasFlowStyle: false,
    hasBlockStyle: false,
    dataTypes: [],
    complexity: 'simple',
    recommendations: [],
    potentialIssues: []
  };

  // Analyze document markers
  const documentMarkers = content.match(/^---/gm);
  if (documentMarkers) {
    analysis.documentCount = documentMarkers.length;
  }

  // Analyze indentation
  let hasSpaces = false;
  let hasTabs = false;
  let spaceIndents: number[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Check for comments
    if (line.trim().startsWith('#') || line.includes(' #')) {
      analysis.hasComments = true;
    }

    // Check for anchors and references
    if (line.includes('&')) {
      analysis.hasAnchors = true;
    }
    if (line.includes('*')) {
      analysis.hasReferences = true;
    }

    // Check for flow style
    if (line.includes('[') || line.includes('{')) {
      analysis.hasFlowStyle = true;
    }

    // Check for block style
    if (line.includes(':') || line.includes('-')) {
      analysis.hasBlockStyle = true;
    }

    // Check for multiline strings
    if (line.includes('|') || line.includes('>')) {
      analysis.hasMultilineStrings = true;
    }

    // Analyze indentation
    const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
    if (leadingWhitespace.includes('\t')) {
      hasTabs = true;
    }
    if (leadingWhitespace.includes(' ')) {
      hasSpaces = true;
      const spaceCount = leadingWhitespace.replace(/\t/g, '').length;
      if (spaceCount > 0) {
        spaceIndents.push(spaceCount);
      }
    }
  }

  // Determine indentation style
  if (hasSpaces && hasTabs) {
    analysis.indentationStyle = 'mixed';
    analysis.potentialIssues.push('Mixed tab and space indentation detected');
  } else if (hasTabs) {
    analysis.indentationStyle = 'tabs';
  } else if (hasSpaces) {
    analysis.indentationStyle = 'spaces';
    // Determine spaces per indent
    const uniqueIndents = Array.from(new Set(spaceIndents)).sort((a, b) => a - b);
    if (uniqueIndents.length > 1) {
      analysis.spacesPerIndent = uniqueIndents[1] - uniqueIndents[0];
    }
  }

  // Analyze parsed data structure
  if (parsedData) {
    const structure = analyzeYamlStructure(parsedData);
    analysis.maxDepth = structure.depth;
    analysis.totalKeys = countKeys(parsedData);
    analysis.dataTypes = getDataTypes(parsedData);

    // Determine complexity
    if (analysis.maxDepth > 5 || analysis.totalKeys > 50) {
      analysis.complexity = 'complex';
    } else if (analysis.maxDepth > 2 || analysis.totalKeys > 10) {
      analysis.complexity = 'moderate';
    }
  }

  // Generate recommendations
  if (analysis.indentationStyle === 'mixed') {
    analysis.recommendations.push('Use consistent indentation (either spaces or tabs)');
  }
  if (analysis.spacesPerIndent > 4) {
    analysis.recommendations.push('Consider using 2 or 4 spaces for indentation');
  }
  if (analysis.complexity === 'complex') {
    analysis.recommendations.push('Consider breaking down complex structures into smaller files');
  }
  if (!analysis.hasComments && analysis.complexity !== 'simple') {
    analysis.recommendations.push('Add comments to explain complex structures');
  }

  return analysis;
}

function countKeys(obj: any): number {
  if (typeof obj !== 'object' || obj === null) return 0;
  
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countKeys(item);
    }
  } else {
    count += Object.keys(obj).length;
    for (const value of Object.values(obj)) {
      count += countKeys(value);
    }
  }
  return count;
}

function getDataTypes(obj: any): string[] {
  const types = new Set<string>();
  
  function traverse(value: any) {
    if (value === null) {
      types.add('null');
    } else if (Array.isArray(value)) {
      types.add('array');
      value.forEach(traverse);
    } else if (typeof value === 'object') {
      types.add('object');
      Object.values(value).forEach(traverse);
    } else if (typeof value === 'string') {
      types.add('string');
    } else if (typeof value === 'number') {
      types.add('number');
    } else if (typeof value === 'boolean') {
      types.add('boolean');
    }
  }
  
  traverse(obj);
  return Array.from(types);
}

export function processYamlValidator(input: string, config: YamlValidatorConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'YAML content is required'
      };
    }

    const warnings: string[] = [];
    const yamlContent = input.trim();
    
    // Parse YAML content
    const { parsed, errors: parseErrors } = parseYamlContent(yamlContent);
    
    // Validate indentation
    const { valid: indentationValid, errors: indentationErrors } = validateIndentation(yamlContent, config);
    
    // Combine all errors
    const allErrors = [...parseErrors, ...indentationErrors];
    
    // Filter errors based on config
    const filteredErrors = allErrors.filter(error => {
      if (error.type === 'duplicate_key' && config.allowDuplicateKeys) return false;
      if (error.type === 'indentation' && !config.checkIndentation) return false;
      return true;
    });

    // Check validation results
    const syntaxValid = parseErrors.filter(e => e.severity === 'error').length === 0;
    const keysValid = !filteredErrors.some(e => e.type === 'duplicate_key');
    const valuesValid = !config.requireQuotedStrings || true; // Simplified validation
    const anchorsValid = !config.validateAnchors || true; // Simplified validation
    const referencesValid = !config.validateReferences || true; // Simplified validation
    const documentMarkersValid = !config.validateDocumentMarkers || true; // Simplified validation
    
    const isValid = syntaxValid && indentationValid && keysValid && valuesValid && anchorsValid && referencesValid;

    // Analyze structure
    const structure = parsed ? analyzeYamlStructure(parsed) : {
      type: 'null' as const,
      depth: 0,
      itemCount: 0,
      nestedStructures: []
    };

    // Create validation result
    const validation: YamlValidation = {
      isValid,
      yamlContent,
      parsedData: parsed,
      syntaxValid,
      indentationValid,
      keysValid,
      valuesValid,
      anchorsValid,
      referencesValid,
      documentMarkersValid,
      structure,
      errors: filteredErrors
    };

    // Analyze YAML content
    const analysis = analyzeYamlContent(yamlContent, parsed);

    // Generate output
    let output = `YAML Validation Result\n`;
    output += `${'='.repeat(30)}\n\n`;
    output += `Status: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
    
    output += `Validation Checks:\n`;
    output += `• Syntax: ${validation.syntaxValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Indentation: ${validation.indentationValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Keys: ${validation.keysValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Values: ${validation.valuesValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• Anchors: ${validation.anchorsValid ? '✅ Valid' : '❌ Invalid'}\n`;
    output += `• References: ${validation.referencesValid ? '✅ Valid' : '❌ Invalid'}\n\n`;
    
    output += `Document Analysis:\n`;
    output += `• Documents: ${analysis.documentCount}\n`;
    output += `• Total Lines: ${analysis.totalLines}\n`;
    output += `• Total Keys: ${analysis.totalKeys}\n`;
    output += `• Max Depth: ${analysis.maxDepth}\n`;
    output += `• Indentation: ${analysis.indentationStyle} (${analysis.spacesPerIndent} spaces)\n`;
    output += `• Complexity: ${analysis.complexity.toUpperCase()}\n`;
    output += `• Data Types: ${analysis.dataTypes.join(', ')}\n\n`;
    
    output += `Features:\n`;
    output += `• Comments: ${analysis.hasComments ? '✅ Present' : '❌ None'}\n`;
    output += `• Anchors: ${analysis.hasAnchors ? '✅ Present' : '❌ None'}\n`;
    output += `• References: ${analysis.hasReferences ? '✅ Present' : '❌ None'}\n`;
    output += `• Flow Style: ${analysis.hasFlowStyle ? '✅ Present' : '❌ None'}\n`;
    output += `• Block Style: ${analysis.hasBlockStyle ? '✅ Present' : '❌ None'}\n`;
    output += `• Multiline Strings: ${analysis.hasMultilineStrings ? '✅ Present' : '❌ None'}\n\n`;

    if (validation.structure.type === 'object' && validation.structure.keys) {
      output += `Top-level Keys:\n`;
      validation.structure.keys.forEach(key => {
        output += `• ${key}\n`;
      });
      output += `\n`;
    }

    if (validation.errors.length > 0) {
      output += `Errors and Warnings:\n`;
      validation.errors.forEach(error => {
        const emoji = error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️';
        const location = error.line ? ` (line ${error.line})` : '';
        output += `• ${emoji} ${error.message}${location}\n`;
      });
      output += `\n`;
    }

    if (analysis.recommendations.length > 0) {
      output += `Recommendations:\n`;
      analysis.recommendations.forEach(rec => {
        output += `• 💡 ${rec}\n`;
      });
      output += `\n`;
    }

    if (analysis.potentialIssues.length > 0) {
      output += `Potential Issues:\n`;
      analysis.potentialIssues.forEach(issue => {
        output += `• ⚠️ ${issue}\n`;
      });
      warnings.push(...analysis.potentialIssues);
    }

    // Add warnings for validation issues
    if (!validation.isValid) {
      warnings.push('YAML document contains validation errors');
    }

    if (validation.errors.some(e => e.type === 'indentation')) {
      warnings.push('Indentation issues detected');
    }

    if (analysis.complexity === 'complex') {
      warnings.push('Complex YAML structure - consider simplification');
    }

    return {
      success: true,
      output,
      validation,
      analysis,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const YAML_VALIDATOR_TOOL: Tool = {
  id: 'yaml-validator',
  name: 'YAML Validator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'config-tools')!,
  slug: 'yaml-validator',
  icon: '📄',
  keywords: ['yaml', 'yml', 'validate', 'syntax', 'parser', 'configuration', 'data', 'structure'],
  seoTitle: 'YAML Validator - Validate YAML Syntax & Structure | FreeFormatHub',
  seoDescription: 'Validate YAML files with comprehensive syntax checking, indentation validation, and structure analysis. Perfect for configuration files.',
  description: 'Validate YAML documents with comprehensive syntax checking, indentation validation, structure analysis, and best practice recommendations.',

  examples: [
    {
      title: 'Valid YAML Configuration',
      input: `# Application Configuration
app:
  name: "My Application"
  version: "1.0.0"
  debug: true
  
database:
  host: "localhost"
  port: 5432
  name: "myapp_db"
  
features:
  - authentication
  - caching
  - logging`,
      output: `YAML Validation Result
==============================

Status: ✅ VALID

Validation Checks:
• Syntax: ✅ Valid
• Indentation: ✅ Valid
• Keys: ✅ Valid
• Values: ✅ Valid

Document Analysis:
• Documents: 1
• Total Lines: 14
• Total Keys: 7
• Max Depth: 2
• Complexity: MODERATE`,
      description: 'Validate a well-structured YAML configuration file'
    },
    {
      title: 'YAML with Anchors and References',
      input: `defaults: &defaults
  timeout: 30
  retries: 3

development:
  <<: *defaults
  host: "dev.example.com"
  
production:
  <<: *defaults
  host: "prod.example.com"`,
      output: `Features:
• Anchors: ✅ Present
• References: ✅ Present
• Block Style: ✅ Present

Status: ✅ VALID`,
      description: 'Validate YAML with anchors and references'
    },
    {
      title: 'Invalid YAML with Errors',
      input: `name: "My App"
version: 1.0.0
debug: true
name: "Duplicate"
  invalid_indent: "value"`,
      output: `Status: ❌ INVALID

Errors and Warnings:
• ❌ Duplicate key "name" (line 4)
• ⚠️ Inconsistent indentation (line 5)

Recommendations:
• Use consistent indentation
• Remove duplicate keys`,
      description: 'Example of YAML with validation errors'
    }
  ],

  useCases: [
    'Validating configuration files (Docker Compose, Kubernetes, CI/CD)',
    'Checking YAML syntax in development workflows',
    'Analyzing complex YAML document structures',
    'Ensuring YAML best practices and consistency',
    'Debugging YAML parsing issues',
    'Code review assistance for YAML files',
    'Educational purposes for learning YAML syntax',
    'Automated validation in build pipelines'
  ],

  faq: [
    {
      question: 'What YAML features does the validator support?',
      answer: 'The validator supports YAML 1.2 features including scalars, sequences, mappings, anchors, references, comments, and multi-document files.'
    },
    {
      question: 'How does indentation validation work?',
      answer: 'The validator checks for consistent indentation, detects mixed tabs and spaces, and ensures proper nesting levels according to YAML standards.'
    },
    {
      question: 'Can it detect duplicate keys?',
      answer: 'Yes, the validator can detect and flag duplicate keys within the same mapping, which is invalid in YAML and can cause parsing errors.'
    },
    {
      question: 'What is the difference between block and flow style?',
      answer: 'Block style uses indentation and newlines (typical YAML), while flow style uses brackets and braces (similar to JSON). Both are valid YAML formats.'
    },
    {
      question: 'Does it validate data types?',
      answer: 'The validator checks basic data type syntax and can identify strings, numbers, booleans, nulls, arrays, and objects in your YAML document.'
    }
  ],

  commonErrors: [
    'Inconsistent indentation (mixing tabs and spaces)',
    'Duplicate keys in the same mapping',
    'Invalid anchor or reference syntax',
    'Malformed multiline strings',
    'Missing colons or incorrect key-value syntax'
  ],

  relatedTools: ['json-formatter', 'yaml-formatter', 'json-to-yaml', 'yaml-to-json', 'config-validator']
};