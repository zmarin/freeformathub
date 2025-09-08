import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface JsonPathExtractorConfig {
  jsonData: string;
  pathExpression: string;
  outputFormat: 'values' | 'paths' | 'both' | 'json';
  flattenArrays: boolean;
  includeMetadata: boolean;
  batchMode: boolean;
  validateJson: boolean;
  validatePath: boolean;
  showExamples: boolean;
  maxResults: number;
  sortResults: boolean;
  uniqueOnly: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  results?: JsonPathResult[];
  error?: string;
  stats?: {
    jsonValid: boolean;
    pathValid: boolean;
    resultsCount: number;
    jsonSize: number;
    processingTime: number;
    pathComplexity: 'Simple' | 'Medium' | 'Complex';
    dataStructure: string;
    maxDepth: number;
  };
}

export interface JsonPathResult {
  path: string;
  value: any;
  type: string;
  index?: number;
}

// Simplified JSONPath implementation
// Production apps should use a robust JSONPath library like jsonpath-plus

const JSONPATH_OPERATORS = {
  ROOT: '$',
  CURRENT: '@',
  RECURSIVE_DESCENT: '..',
  WILDCARD: '*',
  BRACKET_NOTATION: /\[([^\]]+)\]/g,
  DOT_NOTATION: /\.([^.\[\]]+)/g,
  ARRAY_SLICE: /\[(\d*):(\d*)\]/g,
  FILTER_EXPRESSION: /\[\?([^\]]+)\]/g,
  UNION: /,/g
};

function parseJsonPath(path: string): PathNode[] {
  if (!path.startsWith('$')) {
    throw new Error('JSONPath must start with $');
  }

  const nodes: PathNode[] = [{ type: 'root', value: '$' }];
  let remaining = path.slice(1); // Remove $

  while (remaining.length > 0) {
    // Handle recursive descent
    if (remaining.startsWith('..')) {
      nodes.push({ type: 'recursive_descent', value: '..' });
      remaining = remaining.slice(2);
      continue;
    }

    // Handle dot notation
    if (remaining.startsWith('.')) {
      const match = remaining.match(/^\.([^.\[\]]+)/);
      if (match) {
        nodes.push({ type: 'property', value: match[1] });
        remaining = remaining.slice(match[0].length);
        continue;
      }
    }

    // Handle bracket notation
    if (remaining.startsWith('[')) {
      const bracketMatch = remaining.match(/^\[([^\]]+)\]/);
      if (bracketMatch) {
        const bracketContent = bracketMatch[1];
        
        // Check for array slice [start:end]
        if (bracketContent.includes(':')) {
          const [start, end] = bracketContent.split(':');
          nodes.push({ 
            type: 'slice', 
            value: { start: start ? parseInt(start) : 0, end: end ? parseInt(end) : undefined }
          });
        }
        // Check for filter expression [?(...)]
        else if (bracketContent.startsWith('?')) {
          nodes.push({ type: 'filter', value: bracketContent.slice(1) });
        }
        // Check for wildcard
        else if (bracketContent === '*') {
          nodes.push({ type: 'wildcard', value: '*' });
        }
        // Check for union (multiple values separated by comma)
        else if (bracketContent.includes(',')) {
          const values = bracketContent.split(',').map(v => v.trim().replace(/['"]/g, ''));
          nodes.push({ type: 'union', value: values });
        }
        // Regular property or index
        else {
          const value = bracketContent.replace(/['"]/g, '');
          const numValue = parseInt(value);
          nodes.push({ 
            type: isNaN(numValue) ? 'property' : 'index', 
            value: isNaN(numValue) ? value : numValue 
          });
        }
        
        remaining = remaining.slice(bracketMatch[0].length);
        continue;
      }
    }

    // Handle wildcard
    if (remaining.startsWith('*')) {
      nodes.push({ type: 'wildcard', value: '*' });
      remaining = remaining.slice(1);
      continue;
    }

    // If we can't parse further, break
    break;
  }

  return nodes;
}

interface PathNode {
  type: 'root' | 'property' | 'index' | 'wildcard' | 'recursive_descent' | 'slice' | 'filter' | 'union';
  value: any;
}

function executeJsonPath(data: any, nodes: PathNode[], currentPath: string = '$'): JsonPathResult[] {
  const results: JsonPathResult[] = [];
  
  function traverse(current: any, nodeIndex: number, path: string) {
    if (nodeIndex >= nodes.length) {
      results.push({
        path,
        value: current,
        type: getValueType(current)
      });
      return;
    }

    const node = nodes[nodeIndex];

    switch (node.type) {
      case 'root':
        traverse(current, nodeIndex + 1, path);
        break;

      case 'property':
        if (current && typeof current === 'object' && !Array.isArray(current)) {
          if (node.value in current) {
            traverse(current[node.value], nodeIndex + 1, `${path}.${node.value}`);
          }
        }
        break;

      case 'index':
        if (Array.isArray(current)) {
          const index = node.value;
          if (index >= 0 && index < current.length) {
            traverse(current[index], nodeIndex + 1, `${path}[${index}]`);
          } else if (index < 0 && Math.abs(index) <= current.length) {
            const actualIndex = current.length + index;
            traverse(current[actualIndex], nodeIndex + 1, `${path}[${actualIndex}]`);
          }
        }
        break;

      case 'wildcard':
        if (Array.isArray(current)) {
          current.forEach((item, index) => {
            traverse(item, nodeIndex + 1, `${path}[${index}]`);
          });
        } else if (current && typeof current === 'object') {
          Object.keys(current).forEach(key => {
            traverse(current[key], nodeIndex + 1, `${path}.${key}`);
          });
        }
        break;

      case 'recursive_descent':
        // Recursive descent - find all nodes that match the next pattern
        function recursiveSearch(obj: any, currentPath: string) {
          // Try to match from current position
          traverse(obj, nodeIndex + 1, currentPath);
          
          // Recurse into children
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              recursiveSearch(item, `${currentPath}[${index}]`);
            });
          } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
              recursiveSearch(obj[key], `${currentPath}.${key}`);
            });
          }
        }
        recursiveSearch(current, path);
        break;

      case 'slice':
        if (Array.isArray(current)) {
          const { start, end } = node.value;
          const sliced = current.slice(start, end);
          sliced.forEach((item, index) => {
            const actualIndex = (start || 0) + index;
            traverse(item, nodeIndex + 1, `${path}[${actualIndex}]`);
          });
        }
        break;

      case 'union':
        if (Array.isArray(current)) {
          node.value.forEach((index: number) => {
            if (index >= 0 && index < current.length) {
              traverse(current[index], nodeIndex + 1, `${path}[${index}]`);
            }
          });
        } else if (current && typeof current === 'object') {
          node.value.forEach((key: string) => {
            if (key in current) {
              traverse(current[key], nodeIndex + 1, `${path}.${key}`);
            }
          });
        }
        break;

      case 'filter':
        // Simplified filter - just check for existence of properties
        const filterExpr = node.value;
        if (Array.isArray(current)) {
          current.forEach((item, index) => {
            if (evaluateFilter(item, filterExpr)) {
              traverse(item, nodeIndex + 1, `${path}[${index}]`);
            }
          });
        }
        break;
    }
  }

  traverse(data, 0, currentPath);
  return results;
}

function evaluateFilter(item: any, filterExpr: string): boolean {
  // Simplified filter evaluation
  // Production implementation would need a full expression parser
  
  if (filterExpr.includes('==')) {
    const [left, right] = filterExpr.split('==').map(s => s.trim());
    const leftValue = getNestedValue(item, left.replace('@.', ''));
    const rightValue = right.replace(/['"]/g, '');
    return leftValue == rightValue;
  }
  
  if (filterExpr.includes('!=')) {
    const [left, right] = filterExpr.split('!=').map(s => s.trim());
    const leftValue = getNestedValue(item, left.replace('@.', ''));
    const rightValue = right.replace(/['"]/g, '');
    return leftValue != rightValue;
  }
  
  if (filterExpr.includes('>')) {
    const [left, right] = filterExpr.split('>').map(s => s.trim());
    const leftValue = getNestedValue(item, left.replace('@.', ''));
    const rightValue = parseFloat(right);
    return !isNaN(rightValue) && !isNaN(leftValue) && leftValue > rightValue;
  }
  
  if (filterExpr.includes('<')) {
    const [left, right] = filterExpr.split('<').map(s => s.trim());
    const leftValue = getNestedValue(item, left.replace('@.', ''));
    const rightValue = parseFloat(right);
    return !isNaN(rightValue) && !isNaN(leftValue) && leftValue < rightValue;
  }
  
  // Default: check if property exists
  const prop = filterExpr.replace('@.', '');
  return getNestedValue(item, prop) !== undefined;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key];
  }, obj);
}

function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

function calculatePathComplexity(path: string): 'Simple' | 'Medium' | 'Complex' {
  let complexity = 0;
  
  if (path.includes('..')) complexity += 3; // Recursive descent
  if (path.includes('*')) complexity += 2; // Wildcards
  if (path.includes('[?')) complexity += 3; // Filters
  if (path.includes(':')) complexity += 2; // Slices
  if (path.includes(',')) complexity += 1; // Unions
  
  const segments = path.split(/[.\[]/).length - 1;
  complexity += Math.floor(segments / 3);
  
  if (complexity === 0) return 'Simple';
  if (complexity <= 3) return 'Medium';
  return 'Complex';
}

function analyzeDataStructure(data: any): { type: string; maxDepth: number } {
  let maxDepth = 0;
  
  function getDepth(obj: any, depth: number = 0): number {
    if (depth > maxDepth) maxDepth = depth;
    
    if (Array.isArray(obj)) {
      return Math.max(...obj.map(item => getDepth(item, depth + 1)), depth);
    } else if (obj && typeof obj === 'object') {
      return Math.max(...Object.values(obj).map(value => getDepth(value, depth + 1)), depth);
    }
    return depth;
  }
  
  getDepth(data);
  
  const type = Array.isArray(data) ? 'Array' : 
               data && typeof data === 'object' ? 'Object' :
               typeof data;
               
  return { type, maxDepth };
}

function formatResults(results: JsonPathResult[], config: JsonPathExtractorConfig): string {
  if (results.length === 0) {
    return 'No matches found for the given JSONPath expression.';
  }
  
  let output = '';
  
  // Apply sorting if requested
  let processedResults = [...results];
  if (config.sortResults) {
    processedResults.sort((a, b) => a.path.localeCompare(b.path));
  }
  
  // Apply uniqueness filter if requested
  if (config.uniqueOnly) {
    const seen = new Set();
    processedResults = processedResults.filter(result => {
      const key = JSON.stringify(result.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  // Apply max results limit
  if (config.maxResults > 0) {
    processedResults = processedResults.slice(0, config.maxResults);
  }
  
  switch (config.outputFormat) {
    case 'values':
      processedResults.forEach((result, index) => {
        output += `${index + 1}. ${JSON.stringify(result.value, null, 2)}\n\n`;
      });
      break;
      
    case 'paths':
      processedResults.forEach((result, index) => {
        output += `${index + 1}. ${result.path}\n`;
      });
      break;
      
    case 'both':
      processedResults.forEach((result, index) => {
        output += `${index + 1}. Path: ${result.path}\n`;
        output += `   Value: ${JSON.stringify(result.value)}\n`;
        output += `   Type: ${result.type}\n\n`;
      });
      break;
      
    case 'json':
      const jsonOutput = processedResults.map(result => ({
        path: result.path,
        value: result.value,
        type: result.type
      }));
      output = JSON.stringify(jsonOutput, null, 2);
      break;
  }
  
  return output;
}

const COMMON_EXAMPLES = {
  simpleObject: {
    json: `{
  "name": "John Doe",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001"
  }
}`,
    paths: [
      { path: '$.name', description: 'Get the name field' },
      { path: '$.address.city', description: 'Get the city from address' },
      { path: '$.address.*', description: 'Get all address fields' }
    ]
  },
  
  arrayData: {
    json: `{
  "users": [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"},
    {"id": 3, "name": "Charlie", "role": "admin"}
  ]
}`,
    paths: [
      { path: '$.users[0]', description: 'Get the first user' },
      { path: '$.users[*].name', description: 'Get all user names' },
      { path: '$.users[?(@.role=="admin")].name', description: 'Get names of admin users' },
      { path: '$.users[1:3]', description: 'Get users at index 1-2' }
    ]
  },
  
  nestedArray: {
    json: `{
  "orders": [
    {
      "id": "001",
      "items": [
        {"product": "laptop", "price": 999},
        {"product": "mouse", "price": 25}
      ]
    },
    {
      "id": "002", 
      "items": [
        {"product": "keyboard", "price": 75}
      ]
    }
  ]
}`,
    paths: [
      { path: '$..product', description: 'Get all product names (recursive)' },
      { path: '$.orders[*].items[*].price', description: 'Get all prices' },
      { path: '$.orders[0].items[?(@.price>50)].product', description: 'Get expensive products from first order' }
    ]
  }
};

export function processJsonPathExtractor(input: string, config: JsonPathExtractorConfig): ToolResult {
  try {
    const startTime = performance.now();
    
    // Parse input - first line is JSON, second line is path (or use config values)
    const lines = input.trim().split('\n').filter(line => line !== undefined);
    const jsonData = config.jsonData || (lines.length > 0 ? lines[0] : '');
    let pathExpressions: string[] = [];
    
    if (config.batchMode) {
      // Multiple paths
      pathExpressions = config.pathExpression ? 
        [config.pathExpression] : 
        (lines.slice(1) || []).filter(line => line && line.trim().startsWith('$'));
    } else {
      // Single path
      pathExpressions = [config.pathExpression || (lines.length > 1 ? lines[1] || '' : '')];
    }
    
    if (!jsonData.trim()) {
      return {
        success: false,
        error: 'Please provide JSON data to query'
      };
    }
    
    if (pathExpressions.length === 0 || !pathExpressions[0].trim()) {
      return {
        success: false,
        error: 'Please provide at least one JSONPath expression'
      };
    }
    
    // Validate and parse JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonData);
    } catch (error) {
      if (config.validateJson) {
        return {
          success: false,
          error: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`
        };
      }
    }
    
    let allResults: JsonPathResult[] = [];
    let output = '';
    
    // Process each path expression
    for (let i = 0; i < pathExpressions.length; i++) {
      const pathExpression = pathExpressions[i].trim();
      
      if (config.batchMode) {
        output += `Query ${i + 1}: ${pathExpression}\n`;
        output += '='.repeat(40 + pathExpression.length) + '\n';
      }
      
      try {
        // Validate path
        const pathNodes = parseJsonPath(pathExpression);
        
        // Execute JSONPath query
        const results = executeJsonPath(parsedJson, pathNodes);
        allResults.push(...results);
        
        // Format results for this query
        const queryOutput = formatResults(results, config);
        output += queryOutput;
        
        if (config.batchMode) {
          output += `\nFound ${results.length} result(s)\n\n`;
        }
        
      } catch (error) {
        const errorMsg = `Invalid JSONPath expression: ${error instanceof Error ? error.message : 'Parse error'}`;
        if (config.validatePath) {
          return {
            success: false,
            error: errorMsg
          };
        } else {
          output += `Error: ${errorMsg}\n\n`;
        }
      }
    }
    
    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) * 100) / 100;
    
    // Calculate statistics
    const dataStructure = analyzeDataStructure(parsedJson);
    const firstPath = pathExpressions[0];
    
    const stats = {
      jsonValid: true,
      pathValid: true,
      resultsCount: allResults.length,
      jsonSize: jsonData.length,
      processingTime,
      pathComplexity: calculatePathComplexity(firstPath),
      dataStructure: dataStructure.type,
      maxDepth: dataStructure.maxDepth
    };
    
    return {
      success: true,
      output,
      results: allResults,
      stats
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process JSONPath query'
    };
  }
}

// Lightweight public helper for other tools/components
export function runJsonPath(json: any, pathExpression: string): JsonPathResult[] {
  const nodes = parseJsonPath(pathExpression);
  return executeJsonPath(json, nodes);
}

export const JSON_PATH_EXTRACTOR_TOOL: Tool = {
  id: 'json-path-extractor',
  name: 'JSON Path Extractor',
  description: 'Extract specific values from JSON data using JSONPath expressions. Supports complex queries, filtering, and multiple output formats for data analysis and processing.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'json-tools')!,
  slug: 'json-path-extractor',
  icon: '🔍',
  keywords: ['json', 'jsonpath', 'query', 'extract', 'data', 'json query', 'json filter'],
  seoTitle: 'JSON Path Extractor - Query JSON Data Online | FreeFormatHub',
  seoDescription: 'Extract and query JSON data using JSONPath expressions. Free online tool with support for filters, recursive search, array slicing, and multiple output formats.',
  
  examples: [
    {
      title: 'Basic Property Access',
      input: `{"name": "John", "age": 30, "city": "New York"}
$.name`,
      description: 'Extract a simple property value from JSON object'
    },
    {
      title: 'Array Element Access',
      input: `{"users": [{"name": "Alice", "role": "admin"}, {"name": "Bob", "role": "user"}]}
$.users[0].name`,
      description: 'Access specific array elements and their properties'
    },
    {
      title: 'Wildcard and Filtering',
      input: `{"products": [{"name": "laptop", "price": 999}, {"name": "mouse", "price": 25}]}
$.products[?(@.price > 50)].name`,
      description: 'Use filters to find items matching conditions'
    },
    {
      title: 'Recursive Search',
      input: `{"data": {"users": {"active": [{"id": 1, "name": "John"}]}}}
$..name`,
      description: 'Recursively find all occurrences of a property'
    }
  ],
  
  useCases: [
    'API response data extraction and transformation',
    'Configuration file value retrieval',
    'Log file analysis and data mining',
    'Database query result processing',
    'JSON document validation and testing',
    'Data pipeline filtering and mapping'
  ],
  
  faq: [
    {
      question: 'What is JSONPath and how does it work?',
      answer: 'JSONPath is a query language for JSON, similar to XPath for XML. It uses expressions like $.store.book[*].author to navigate and extract data from JSON structures.'
    },
    {
      question: 'What JSONPath operators are supported?',
      answer: 'The tool supports root ($), current node (@), recursive descent (..), wildcards (*), array indexing [n], slicing [start:end], filtering [?()], and unions [item1,item2].'
    },
    {
      question: 'How do filters work in JSONPath expressions?',
      answer: 'Filters use [?(...)] syntax to test conditions. For example, [?(@.price > 100)] finds items where price is greater than 100. Supports ==, !=, <, >, and existence checks.'
    },
    {
      question: 'Can I extract multiple values at once?',
      answer: 'Yes! Use wildcards (*), recursive descent (..), or enable batch mode to process multiple JSONPath expressions against the same JSON data.'
    },
    {
      question: 'What output formats are available?',
      answer: 'Choose from values only, paths only, both paths and values, or structured JSON format. Results can be sorted, deduplicated, and limited.'
    }
  ],
  
  commonErrors: [
    'JSONPath must start with $',
    'Invalid JSON data format',
    'Property does not exist',
    'Array index out of bounds'
  ],
  
  relatedTools: ['json-formatter', 'json-validator', 'xml-formatter'],
  
  // Include common examples for quick access
  commonExamples: COMMON_EXAMPLES
};
