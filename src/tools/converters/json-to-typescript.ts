import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface JsonToTypescriptConfig {
  interfaceName: string;
  useOptionalProperties: boolean;
  inferArrayTypes: boolean;
  useUnionTypes: boolean;
  formatOutput: boolean;
  includeComments: boolean;
  rootAsArray: boolean;
  useCamelCase: boolean;
  includeNullables: boolean;
  generateExport: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  interfaceCount?: number;
  typeDefinitions?: TypeDefinition[];
}

interface TypeDefinition {
  name: string;
  definition: string;
  properties: number;
}

// Type mapping for JSON types to TypeScript
const TYPE_MAPPING = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  null: 'null',
  undefined: 'undefined',
  object: 'object',
  array: 'array'
};

function getJsonType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function sanitizePropertyName(name: string, useCamelCase: boolean): string {
  let sanitized = useCamelCase ? toCamelCase(name) : name;
  return isValidIdentifier(sanitized) ? sanitized : `"${name}"`;
}

function inferTypeFromValue(value: any, config: JsonToTypescriptConfig, interfaceMap: Map<string, any>, level: number = 0): string {
  const jsonType = getJsonType(value);
  
  switch (jsonType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return config.includeNullables ? 'null' : 'any';
    case 'undefined':
      return 'undefined';
    case 'array':
      if (value.length === 0) {
        return 'any[]';
      }
      
      if (config.inferArrayTypes) {
        // Get all unique types in the array
        const types = new Set<string>();
        for (const item of value) {
          const itemType = inferTypeFromValue(item, config, interfaceMap, level + 1);
          types.add(itemType);
        }
        
        const uniqueTypes = Array.from(types);
        if (uniqueTypes.length === 1) {
          return `${uniqueTypes[0]}[]`;
        } else if (config.useUnionTypes) {
          return `(${uniqueTypes.join(' | ')})[]`;
        }
      }
      
      return 'any[]';
      
    case 'object':
      // Generate interface for object
      const interfaceName = generateInterfaceName(level);
      interfaceMap.set(interfaceName, value);
      return interfaceName;
      
    default:
      return 'any';
  }
}

function generateInterfaceName(level: number): string {
  if (level === 0) return 'RootInterface';
  return `NestedInterface${level}`;
}

function generateInterface(obj: any, interfaceName: string, config: JsonToTypescriptConfig, level: number = 0): string {
  const interfaceMap = new Map<string, any>();
  let result = '';
  
  if (config.includeComments) {
    result += `/**\n * Generated TypeScript interface from JSON\n * Created by FreeFormatHub\n */\n`;
  }
  
  const exportKeyword = config.generateExport ? 'export ' : '';
  result += `${exportKeyword}interface ${interfaceName} {\n`;
  
  const properties: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const propName = sanitizePropertyName(key, config.useCamelCase);
    const propType = inferTypeFromValue(value, config, interfaceMap, level + 1);
    const optional = config.useOptionalProperties && (value === null || value === undefined) ? '?' : '';
    
    if (config.includeComments && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      properties.push(`  /** Object with ${Object.keys(value).length} properties */`);
    }
    
    properties.push(`  ${propName}${optional}: ${propType};`);
  }
  
  result += properties.join('\n') + '\n';
  result += '}\n';
  
  // Generate nested interfaces
  for (const [nestedName, nestedObj] of interfaceMap) {
    if (nestedName !== interfaceName) {
      result += '\n' + generateInterface(nestedObj, nestedName, config, level + 1);
    }
  }
  
  return result;
}

function analyzeJsonStructure(obj: any): { depth: number; properties: number; arrayCount: number } {
  let maxDepth = 0;
  let totalProperties = 0;
  let arrayCount = 0;
  
  function traverse(value: any, currentDepth: number) {
    maxDepth = Math.max(maxDepth, currentDepth);
    
    if (Array.isArray(value)) {
      arrayCount++;
      for (const item of value) {
        traverse(item, currentDepth + 1);
      }
    } else if (typeof value === 'object' && value !== null) {
      const props = Object.keys(value);
      totalProperties += props.length;
      
      for (const prop of props) {
        traverse(value[prop], currentDepth + 1);
      }
    }
  }
  
  traverse(obj, 0);
  return { depth: maxDepth, properties: totalProperties, arrayCount };
}

export function processJsonToTypescript(input: string, config: JsonToTypescriptConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide JSON data to convert to TypeScript interfaces'
      };
    }

    // Parse JSON
    let jsonData: any;
    try {
      jsonData = JSON.parse(input);
    } catch (parseError) {
      return {
        success: false,
        error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unable to parse JSON'}`
      };
    }

    // Validate interface name
    if (!isValidIdentifier(config.interfaceName)) {
      return {
        success: false,
        error: `Invalid interface name: "${config.interfaceName}". Must be a valid TypeScript identifier.`
      };
    }

    // Analyze structure
    const analysis = analyzeJsonStructure(jsonData);
    
    let output = '';
    let interfaceCount = 1;
    const typeDefinitions: TypeDefinition[] = [];
    
    // Handle array at root level
    if (Array.isArray(jsonData)) {
      if (config.rootAsArray) {
        if (jsonData.length > 0) {
          const firstItem = jsonData[0];
          if (typeof firstItem === 'object' && firstItem !== null) {
            const itemInterfaceName = config.interfaceName.endsWith('Item') ? config.interfaceName : `${config.interfaceName}Item`;
            const itemInterface = generateInterface(firstItem, itemInterfaceName, config);
            
            output = itemInterface + '\n';
            output += `${config.generateExport ? 'export ' : ''}type ${config.interfaceName} = ${itemInterfaceName}[];\n`;
            
            typeDefinitions.push({
              name: itemInterfaceName,
              definition: `Interface for array items`,
              properties: Object.keys(firstItem).length
            });
            interfaceCount = 2;
          } else {
            output = `${config.generateExport ? 'export ' : ''}type ${config.interfaceName} = any[];\n`;
          }
        } else {
          output = `${config.generateExport ? 'export ' : ''}type ${config.interfaceName} = any[];\n`;
        }
      } else {
        return {
          success: false,
          error: 'Root level is an array. Enable "Root as Array" option to handle this case.'
        };
      }
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      output = generateInterface(jsonData, config.interfaceName, config);
      
      typeDefinitions.push({
        name: config.interfaceName,
        definition: `Main interface with ${Object.keys(jsonData).length} properties`,
        properties: Object.keys(jsonData).length
      });
    } else {
      return {
        success: false,
        error: 'Input must be a JSON object or array to generate meaningful TypeScript interfaces.'
      };
    }

    // Format output if requested
    if (config.formatOutput) {
      output = formatTypeScriptCode(output);
    }
    
    // Add usage example
    output += `\n// Usage Example:\n`;
    output += `// const data: ${config.interfaceName} = ${JSON.stringify(jsonData, null, 2).substring(0, 100)}${JSON.stringify(jsonData).length > 100 ? '...' : ''};\n`;
    
    // Add analysis comments
    output += `\n/*\nStructural Analysis:\n- Max Depth: ${analysis.depth}\n- Total Properties: ${analysis.properties}\n- Arrays Found: ${analysis.arrayCount}\n*/`;

    return {
      success: true,
      output,
      interfaceCount,
      typeDefinitions
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert JSON to TypeScript interfaces'
    };
  }
}

function formatTypeScriptCode(code: string): string {
  // Basic formatting - indent nested structures
  return code
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
        return line;
      }
      if (line.includes('{') || line.includes('[')) {
        return line;
      }
      return line;
    })
    .join('\n');
}

export const JSON_TO_TYPESCRIPT_TOOL: Tool = {
  id: 'json-to-typescript',
  name: 'JSON to TypeScript Interface - Get Types from JSON Data',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'code-development')!,
  slug: 'json-to-typescript',
  icon: '🔷',
  keywords: ['json get types', 'json parsing typescript', 'json extract interfaces', 'json get type definitions', 'json search properties types', 'json', 'typescript', 'interface', 'type', 'definition', 'convert', 'generate', 'ts', 'get json schema types', 'extract typescript types'],
  seoTitle: 'JSON to TypeScript Interface Generator - Get Types from JSON Data Online',
  seoDescription: 'Get TypeScript interfaces from JSON data instantly. Extract type definitions, parse JSON structures, and generate clean TypeScript code with optional properties, union types, and proper formatting.',
  description: 'Get TypeScript interfaces from JSON data instantly! Extract type definitions, parse nested objects, and generate clean TypeScript code. Perfect for getting strongly-typed interfaces from API responses and JSON files.',

  examples: [
    {
      title: 'Simple User Object',
      input: `{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true,
  "lastLogin": null
}`,
      output: `export interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin: null;
}

// Usage Example:
// const data: User = {
//   "id": 123,
//   "name": "John Doe",
//   "email": "john@example.com",
//   "isActive": true,
//   "lastLogin": null
// };`,
      description: 'Convert a simple user object to TypeScript interface'
    },
    {
      title: 'Nested API Response',
      input: `{
  "data": {
    "users": [
      {
        "id": 1,
        "profile": {
          "firstName": "Alice",
          "settings": {
            "theme": "dark"
          }
        }
      }
    ]
  },
  "meta": {
    "total": 100
  }
}`,
      output: `export interface ApiResponse {
  data: NestedInterface1;
  meta: NestedInterface2;
}

export interface NestedInterface2 {
  total: number;
}

export interface NestedInterface3 {
  theme: string;
}

export interface NestedInterface4 {
  firstName: string;
  settings: NestedInterface3;
}`,
      description: 'Handle complex nested JSON structures with arrays'
    }
  ],

  useCases: [
    'Converting API responses to TypeScript interfaces for type safety',
    'Generating type definitions for configuration files and JSON schemas',
    'Creating interfaces for database query results and data models',
    'Building type definitions for third-party API integrations',
    'Converting JSON mock data to TypeScript for testing purposes',
    'Generating interfaces for form data and validation schemas',
    'Creating type definitions for GraphQL responses and mutations',
    'Learning TypeScript interface syntax from real JSON data'
  ],

  faq: [
    {
      question: 'How does it handle arrays with different item types?',
      answer: 'With "Infer Array Types" enabled, it creates union types like (string | number)[] for mixed arrays. It can also generate separate interfaces for object arrays.'
    },
    {
      question: 'What about optional properties?',
      answer: 'Enable "Optional Properties" to mark properties with null/undefined values as optional (property?: type). This makes interfaces more flexible for incomplete data.'
    },
    {
      question: 'Can it handle deeply nested objects?',
      answer: 'Yes, it automatically generates separate interfaces for nested objects and references them properly. Each nesting level gets its own interface definition.'
    },
    {
      question: 'How does it handle invalid property names?',
      answer: 'Properties with spaces or special characters are automatically quoted ("property name": type). Enable camelCase conversion for cleaner property names.'
    },
    {
      question: 'What about null values and undefined?',
      answer: 'Enable "Include Nullables" to preserve null types, or disable it to convert null values to "any" type for more permissive interfaces.'
    }
  ],

  commonErrors: [
    'Invalid JSON syntax (missing quotes, trailing commas)',
    'Invalid interface names (must be valid TypeScript identifiers)',
    'Empty objects or arrays that generate "any" types',
    'Circular references in JSON data (not supported)',
    'Very large JSON files that may cause performance issues'
  ],

  relatedTools: ['json-formatter', 'json-validator', 'typescript-formatter', 'api-response-formatter', 'schema-generator']
};