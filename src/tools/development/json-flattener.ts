import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JSONFlattenerConfig {
  delimiter: string;
  preserveArrays: boolean;
  preserveEmptyObjects: boolean;
  maxDepth: number;
  includeTypeInfo: boolean;
  sortKeys: boolean;
  handleNullValues: 'keep' | 'skip' | 'convert';
  arrayIndexing: 'numeric' | 'brackets' | 'dots';
  customPrefix: string;
  caseSensitive: boolean;
}

interface FlattenResult {
  flattened: Record<string, any>;
  unflatten?: Record<string, any>;
  metadata: {
    originalKeys: number;
    flattenedKeys: number;
    maxDepth: number;
    arrayCount: number;
    objectCount: number;
    nullCount: number;
    typeDistribution: Record<string, number>;
  };
  keyMap?: Record<string, string>;
  reversible: boolean;
}

function getTypeOf(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function flattenObject(
  obj: any, 
  config: JSONFlattenerConfig, 
  prefix = '', 
  depth = 0,
  stats = {
    originalKeys: 0,
    flattenedKeys: 0,
    maxDepth: 0,
    arrayCount: 0,
    objectCount: 0,
    nullCount: 0,
    typeDistribution: {} as Record<string, number>
  }
): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (depth > config.maxDepth) {
    const key = prefix || 'root';
    result[key] = '[Max depth exceeded]';
    stats.flattenedKeys++;
    return result;
  }
  
  stats.maxDepth = Math.max(stats.maxDepth, depth);
  
  if (obj === null || obj === undefined) {
    const key = prefix || 'value';
    if (config.handleNullValues === 'keep') {
      result[key] = obj;
      stats.flattenedKeys++;
      stats.nullCount++;
    } else if (config.handleNullValues === 'convert') {
      result[key] = obj === null ? 'null' : 'undefined';
      stats.flattenedKeys++;
    }
    // 'skip' means don't add the key at all
    return result;
  }
  
  if (typeof obj !== 'object') {
    const key = prefix || 'value';
    result[key] = config.includeTypeInfo ? { value: obj, type: typeof obj } : obj;
    stats.flattenedKeys++;
    
    const type = typeof obj;
    stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
    return result;
  }
  
  if (Array.isArray(obj)) {
    stats.arrayCount++;
    
    if (config.preserveArrays && depth > 0) {
      const key = prefix || 'array';
      result[key] = config.includeTypeInfo ? { value: obj, type: 'array' } : obj;
      stats.flattenedKeys++;
      stats.typeDistribution.array = (stats.typeDistribution.array || 0) + 1;
      return result;
    }
    
    obj.forEach((item, index) => {
      let key;
      switch (config.arrayIndexing) {
        case 'brackets':
          key = prefix ? `${prefix}[${index}]` : `[${index}]`;
          break;
        case 'dots':
          key = prefix ? `${prefix}.${index}` : index.toString();
          break;
        default: // numeric
          key = prefix ? `${prefix}${config.delimiter}${index}` : index.toString();
      }
      
      const flattened = flattenObject(item, config, key, depth + 1, stats);
      Object.assign(result, flattened);
    });
    
    stats.typeDistribution.array = (stats.typeDistribution.array || 0) + 1;
  } else {
    stats.objectCount++;
    const keys = Object.keys(obj);
    stats.originalKeys += keys.length;
    
    if (keys.length === 0 && !config.preserveEmptyObjects) {
      return result;
    }
    
    if (keys.length === 0 && config.preserveEmptyObjects) {
      const key = prefix || 'empty';
      result[key] = config.includeTypeInfo ? { value: {}, type: 'object' } : {};
      stats.flattenedKeys++;
      stats.typeDistribution.object = (stats.typeDistribution.object || 0) + 1;
      return result;
    }
    
    const sortedKeys = config.sortKeys ? keys.sort() : keys;
    
    sortedKeys.forEach(key => {
      const value = obj[key];
      const newKey = prefix 
        ? `${prefix}${config.delimiter}${key}`
        : config.customPrefix 
          ? `${config.customPrefix}${config.delimiter}${key}`
          : key;
      
      const flattened = flattenObject(value, config, newKey, depth + 1, stats);
      Object.assign(result, flattened);
    });
    
    stats.typeDistribution.object = (stats.typeDistribution.object || 0) + 1;
  }
  
  return result;
}

function unflattenObject(
  flattened: Record<string, any>, 
  config: JSONFlattenerConfig
): Record<string, any> {
  const result: any = {};
  
  Object.keys(flattened).forEach(key => {
    const value = flattened[key];
    const parts = key.split(config.delimiter);
    
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // Handle array indexing
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        const arrayIndex = parseInt(index, 10);
        
        if (!(arrayKey in current)) {
          current[arrayKey] = [];
        }
        
        if (!current[arrayKey][arrayIndex]) {
          current[arrayKey][arrayIndex] = {};
        }
        
        current = current[arrayKey][arrayIndex];
      } else {
        // Handle numeric keys (potential array indices)
        const numericIndex = parseInt(part, 10);
        if (!isNaN(numericIndex) && numericIndex.toString() === part) {
          if (!Array.isArray(current)) {
            // Convert to array if needed
            const temp = current;
            current = [];
            Object.keys(temp).forEach(k => {
              const idx = parseInt(k, 10);
              if (!isNaN(idx)) {
                current[idx] = temp[k];
              }
            });
          }
          
          if (!current[numericIndex]) {
            current[numericIndex] = {};
          }
          
          current = current[numericIndex];
        } else {
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }
    
    // Set the final value
    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/^(.+)\[(\d+)\]$/);
    
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      const arrayIndex = parseInt(index, 10);
      
      if (!(arrayKey in current)) {
        current[arrayKey] = [];
      }
      
      current[arrayKey][arrayIndex] = config.includeTypeInfo && value?.type ? value.value : value;
    } else {
      const numericIndex = parseInt(lastPart, 10);
      if (!isNaN(numericIndex) && numericIndex.toString() === lastPart) {
        if (!Array.isArray(current)) {
          const temp = current;
          current = [];
          Object.keys(temp).forEach(k => {
            const idx = parseInt(k, 10);
            if (!isNaN(idx)) {
              current[idx] = temp[k];
            }
          });
        }
        current[numericIndex] = config.includeTypeInfo && value?.type ? value.value : value;
      } else {
        current[lastPart] = config.includeTypeInfo && value?.type ? value.value : value;
      }
    }
  });
  
  return result;
}

function generateKeyMap(
  obj: any,
  flattened: Record<string, any>,
  config: JSONFlattenerConfig
): Record<string, string> {
  const keyMap: Record<string, string> = {};
  
  function traverse(current: any, path: string[] = []): void {
    if (typeof current !== 'object' || current === null) {
      return;
    }
    
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const newPath = [...path, index.toString()];
        const flatKey = newPath.join(config.delimiter);
        keyMap[flatKey] = `Array index ${index} at ${path.join('.')}`;
        traverse(item, newPath);
      });
    } else {
      Object.keys(current).forEach(key => {
        const newPath = [...path, key];
        const flatKey = newPath.join(config.delimiter);
        keyMap[flatKey] = `Object key '${key}' at ${path.join('.') || 'root'}`;
        traverse(current[key], newPath);
      });
    }
  }
  
  traverse(obj);
  return keyMap;
}

export function processJSONFlattener(
  input: string,
  config: JSONFlattenerConfig,
  operation: 'flatten' | 'unflatten'
): Promise<ToolResult<FlattenResult | null>> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      if (!input.trim()) {
        resolve({
          data: null,
          error: 'Please provide JSON data to process',
          processing_time: 0
        });
        return;
      }
      
      let jsonData: any;
      try {
        jsonData = JSON.parse(input);
      } catch (parseError) {
        resolve({
          data: null,
          error: 'Invalid JSON format. Please provide valid JSON data.',
          processing_time: Date.now() - startTime
        });
        return;
      }
      
      const stats = {
        originalKeys: 0,
        flattenedKeys: 0,
        maxDepth: 0,
        arrayCount: 0,
        objectCount: 0,
        nullCount: 0,
        typeDistribution: {} as Record<string, number>
      };
      
      let result: FlattenResult;
      
      if (operation === 'flatten') {
        const flattened = flattenObject(jsonData, config, '', 0, stats);
        const keyMap = generateKeyMap(jsonData, flattened, config);
        
        // Try to unflatten to test reversibility
        let reversible = true;
        let unflattenedTest: any = null;
        
        try {
          unflattenedTest = unflattenObject(flattened, config);
          // Simple check - compare JSON strings
          const originalStr = JSON.stringify(jsonData);
          const unflattedStr = JSON.stringify(unflattenedTest);
          reversible = originalStr === unflattedStr;
        } catch (error) {
          reversible = false;
        }
        
        result = {
          flattened,
          metadata: stats,
          keyMap,
          reversible,
          unflatten: reversible ? unflattenedTest : undefined
        };
      } else {
        // Unflatten operation
        const unflattened = unflattenObject(jsonData, config);
        
        result = {
          flattened: jsonData, // Original flattened data
          unflatten: unflattened,
          metadata: {
            originalKeys: Object.keys(jsonData).length,
            flattenedKeys: Object.keys(jsonData).length,
            maxDepth: 0,
            arrayCount: 0,
            objectCount: 0,
            nullCount: 0,
            typeDistribution: {}
          },
          reversible: true
        };
      }
      
      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          operation,
          delimiter: config.delimiter,
          preserveArrays: config.preserveArrays,
          maxDepth: config.maxDepth,
          inputSize: input.length,
          outputSize: JSON.stringify(result.flattened).length,
          keyCount: stats.flattenedKeys,
          reversible: result.reversible,
          hasArrays: stats.arrayCount > 0,
          hasObjects: stats.objectCount > 0
        }
      });
      
    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process JSON',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Flatten Nested Object',
    description: 'Convert nested JSON object to flat key-value pairs',
    input: `{
  "user": {
    "name": "John Doe",
    "age": 30,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "coordinates": [40.7128, -74.0060]
    }
  },
  "active": true
}`,
    output: `{
  "user.name": "John Doe",
  "user.age": 30,
  "user.address.street": "123 Main St",
  "user.address.city": "New York",
  "user.address.coordinates.0": 40.7128,
  "user.address.coordinates.1": -74.0060,
  "active": true
}`
  },
  {
    title: 'Flatten Array Data',
    description: 'Handle arrays with different indexing options',
    input: `{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "specs": {
        "cpu": "Intel i7",
        "ram": "16GB"
      }
    },
    {
      "id": 2,
      "name": "Mouse",
      "price": 29.99
    }
  ]
}`,
    output: `{
  "products[0].id": 1,
  "products[0].name": "Laptop",
  "products[0].specs.cpu": "Intel i7",
  "products[0].specs.ram": "16GB",
  "products[1].id": 2,
  "products[1].name": "Mouse",
  "products[1].price": 29.99
}`
  },
  {
    title: 'Unflatten to Nested',
    description: 'Convert flat structure back to nested JSON',
    input: `{
  "config.database.host": "localhost",
  "config.database.port": 5432,
  "config.database.name": "myapp",
  "config.api.version": "v1",
  "config.api.timeout": 30000
}`,
    output: `{
  "config": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "myapp"
    },
    "api": {
      "version": "v1",
      "timeout": 30000
    }
  }
}`
  }
];

export const JSON_FLATTENER_TOOL: Tool = {
  id: 'json-flattener',
  name: 'JSON Flattener',
  description: 'Flatten nested JSON objects to flat key-value pairs or unflatten back to nested structure with customizable delimiters and array handling',
  icon: '🗂️',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'json-tools')!,
  tags: ['json', 'flatten', 'unflatten', 'nested', 'object', 'array', 'key-value', 'transform'],
  complexity: 'intermediate',
  examples,
  faqs: [
    {
      question: 'What is JSON flattening?',
      answer: 'JSON flattening converts nested JSON objects into a flat structure where nested keys are combined using a delimiter (like dots). For example, {"a": {"b": 1}} becomes {"a.b": 1}.'
    },
    {
      question: 'How are arrays handled during flattening?',
      answer: 'Arrays can be flattened using different indexing styles: numeric (key.0, key.1), brackets (key[0], key[1]), or dots (key.0). You can also choose to preserve arrays as-is.'
    },
    {
      question: 'Can flattened JSON be converted back to nested?',
      answer: 'Yes, the tool supports both flattening and unflattening operations. The process is reversible when using consistent delimiters and array indexing settings.'
    },
    {
      question: 'What happens to null values and empty objects?',
      answer: 'You can configure how null values are handled (keep, skip, or convert to string) and whether to preserve empty objects in the flattened result.'
    },
    {
      question: 'Is there a limit to nesting depth?',
      answer: 'You can set a maximum depth limit to prevent infinite recursion with circular references or extremely deep nesting. Objects beyond this depth are marked with a placeholder.'
    }
  ],
  relatedTools: ['json-formatter', 'json-validator', 'object-transformer', 'json-to-csv', 'key-value-converter']
};