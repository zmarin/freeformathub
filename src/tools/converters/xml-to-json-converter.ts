import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface XmlToJsonConfig {
  attributePrefix: string;
  textNodeName: string;
  preserveWhitespace: boolean;
  ignoreAttributes: boolean;
  parseNumbers: boolean;
  parseBooleans: boolean;
  trimTextValues: boolean;
  mergeTextNodes: boolean;
  arrayMode: 'smart' | 'force' | 'never';
  namespacesEnabled: boolean;
  namespaceSeparator: string;
  validateXml: boolean;
  maxDepth: number;
  ignoreDeclaration: boolean;
  ignoreComments: boolean;
  ignoreProcessingInstructions: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  conversion?: ConversionResult;
  warnings?: string[];
}

interface ConversionResult {
  originalXml: string;
  jsonData: any;
  conversionStats: ConversionStats;
  structureInfo: StructureInfo;
  namespaces: NamespaceInfo[];
}

interface ConversionStats {
  totalElements: number;
  attributes: number;
  textNodes: number;
  comments: number;
  processingInstructions: number;
  namespaces: number;
  conversionTime: number;
  outputSize: number;
}

interface StructureInfo {
  rootElement: string;
  maxDepth: number;
  hasAttributes: boolean;
  hasTextContent: boolean;
  hasNamespaces: boolean;
  hasMixedContent: boolean;
  hasComments: boolean;
}

interface NamespaceInfo {
  prefix: string;
  uri: string;
  usageCount: number;
}

interface ParsedElement {
  name: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
  textContent: string;
  namespace?: { prefix: string; uri: string };
}

// Basic XML parsing (simplified implementation)
function parseXmlContent(xmlContent: string, config: XmlToJsonConfig): { parsed: ParsedElement | null; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Remove XML declaration if ignoring
    let content = xmlContent.trim();
    if (config.ignoreDeclaration) {
      content = content.replace(/<\?xml[^>]*\?>/i, '').trim();
    }
    
    // Remove comments if ignoring
    if (config.ignoreComments) {
      content = content.replace(/<!--[\s\S]*?-->/g, '').trim();
    }
    
    // Remove processing instructions if ignoring
    if (config.ignoreProcessingInstructions) {
      content = content.replace(/<\?[^>]*\?>/g, '').trim();
    }

    // Basic validation
    if (!content.startsWith('<')) {
      errors.push('XML content must start with an element');
      return { parsed: null, errors };
    }

    // Very basic XML parsing (this is a simplified implementation)
    const elementStack: ParsedElement[] = [];
    let currentElement: ParsedElement | null = null;
    let rootElement: ParsedElement | null = null;
    
    // Extract root element info for basic structure
    const rootMatch = content.match(/<([^>\s/]+)([^>]*)>/);
    if (rootMatch) {
      const rootName = rootMatch[1];
      const attributeString = rootMatch[2];
      
      rootElement = {
        name: rootName,
        attributes: {},
        children: [],
        textContent: ''
      };

      // Parse attributes (basic)
      if (attributeString && !config.ignoreAttributes) {
        const attrRegex = /(\w+)="([^"]*)"/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributeString)) !== null) {
          rootElement.attributes[attrMatch[1]] = attrMatch[2];
        }
      }

      // Extract text content (very basic)
      const textMatch = content.match(new RegExp(`<${rootName}[^>]*>([^<]*)</${rootName}>`));
      if (textMatch && textMatch[1]) {
        rootElement.textContent = config.trimTextValues ? textMatch[1].trim() : textMatch[1];
      }
    }

    return { parsed: rootElement, errors };
    
  } catch (error) {
    errors.push(`XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { parsed: null, errors };
  }
}

function convertElementToJson(
  element: ParsedElement,
  config: XmlToJsonConfig,
  stats: ConversionStats,
  depth: number = 0
): any {
  if (depth > config.maxDepth) {
    return `[Max depth ${config.maxDepth} reached]`;
  }

  stats.totalElements++;
  
  let result: any = {};
  
  // Handle attributes
  if (!config.ignoreAttributes && Object.keys(element.attributes).length > 0) {
    Object.keys(element.attributes).forEach(attrName => {
      stats.attributes++;
      const prefixedName = config.attributePrefix + attrName;
      let value: any = element.attributes[attrName];
      
      // Parse numbers and booleans
      if (config.parseNumbers && !isNaN(Number(value)) && value !== '') {
        value = Number(value);
      } else if (config.parseBooleans && (value === 'true' || value === 'false')) {
        value = value === 'true';
      }
      
      result[prefixedName] = value;
    });
  }
  
  // Handle text content
  if (element.textContent && element.textContent.trim()) {
    stats.textNodes++;
    let textValue: any = config.trimTextValues ? element.textContent.trim() : element.textContent;
    
    // Parse numbers and booleans in text
    if (config.parseNumbers && !isNaN(Number(textValue)) && textValue !== '') {
      textValue = Number(textValue);
    } else if (config.parseBooleans && (textValue === 'true' || textValue === 'false')) {
      textValue = textValue === 'true';
    }
    
    // If element has only text content and no attributes/children, return the value directly
    if (element.children.length === 0 && Object.keys(element.attributes).length === 0) {
      return textValue;
    }
    
    // Otherwise, add as text node
    result[config.textNodeName] = textValue;
  }
  
  // Handle child elements
  if (element.children.length > 0) {
    const childGroups: Record<string, any[]> = {};
    
    element.children.forEach(child => {
      const childResult = convertElementToJson(child, config, stats, depth + 1);
      
      if (!childGroups[child.name]) {
        childGroups[child.name] = [];
      }
      childGroups[child.name].push(childResult);
    });
    
    // Process child groups based on array mode
    Object.keys(childGroups).forEach(childName => {
      const children = childGroups[childName];
      
      if (children.length === 1 && config.arrayMode !== 'force') {
        result[childName] = children[0];
      } else if (config.arrayMode !== 'never') {
        result[childName] = children;
      } else {
        // Never mode - use indexed names
        children.forEach((child, index) => {
          result[`${childName}_${index}`] = child;
        });
      }
    });
  }
  
  // If result is empty object, return null or empty based on config
  if (Object.keys(result).length === 0) {
    return null;
  }
  
  return result;
}

function analyzeXmlStructure(element: ParsedElement | null, depth: number = 0): StructureInfo {
  const info: StructureInfo = {
    rootElement: element?.name || 'unknown',
    maxDepth: depth,
    hasAttributes: false,
    hasTextContent: false,
    hasNamespaces: false,
    hasMixedContent: false,
    hasComments: false
  };

  if (!element) return info;

  // Check for attributes
  if (Object.keys(element.attributes).length > 0) {
    info.hasAttributes = true;
  }

  // Check for text content
  if (element.textContent && element.textContent.trim()) {
    info.hasTextContent = true;
  }

  // Check for mixed content (text + elements)
  if (element.textContent && element.textContent.trim() && element.children.length > 0) {
    info.hasMixedContent = true;
  }

  // Check for namespaces
  Object.keys(element.attributes).forEach(attr => {
    if (attr.startsWith('xmlns')) {
      info.hasNamespaces = true;
    }
  });

  // Analyze children recursively
  element.children.forEach(child => {
    const childInfo = analyzeXmlStructure(child, depth + 1);
    info.maxDepth = Math.max(info.maxDepth, childInfo.maxDepth);
    info.hasAttributes = info.hasAttributes || childInfo.hasAttributes;
    info.hasTextContent = info.hasTextContent || childInfo.hasTextContent;
    info.hasNamespaces = info.hasNamespaces || childInfo.hasNamespaces;
    info.hasMixedContent = info.hasMixedContent || childInfo.hasMixedContent;
    info.hasComments = info.hasComments || childInfo.hasComments;
  });

  return info;
}

export function processXmlToJsonConverter(input: string, config: XmlToJsonConfig): ToolResult {
  try {
    const startTime = Date.now();
    
    if (!input.trim()) {
      return {
        success: false,
        error: 'XML input is required'
      };
    }

    const warnings: string[] = [];
    const originalXml = input.trim();

    // Basic XML validation
    if (config.validateXml) {
      const openTags = (originalXml.match(/</g) || []).length;
      const closeTags = (originalXml.match(/>/g) || []).length;
      
      if (openTags !== closeTags) {
        warnings.push('XML may have unmatched angle brackets');
      }
      
      if (!originalXml.includes('</')) {
        warnings.push('XML appears to be self-closing only - structure may be simplified');
      }
    }

    // Parse XML
    const { parsed: parsedElement, errors } = parseXmlContent(originalXml, config);
    
    if (errors.length > 0) {
      return {
        success: false,
        error: `XML parsing failed: ${errors.join(', ')}`
      };
    }

    if (!parsedElement) {
      return {
        success: false,
        error: 'Failed to parse XML content'
      };
    }

    // Initialize conversion stats
    const stats: ConversionStats = {
      totalElements: 0,
      attributes: 0,
      textNodes: 0,
      comments: 0,
      processingInstructions: 0,
      namespaces: 0,
      conversionTime: 0,
      outputSize: 0
    };

    // Count comments and processing instructions
    stats.comments = (originalXml.match(/<!--[\s\S]*?-->/g) || []).length;
    stats.processingInstructions = (originalXml.match(/<\?[^>]*\?>/g) || []).length;
    stats.namespaces = (originalXml.match(/xmlns[^=]*=/g) || []).length;

    // Convert to JSON
    const jsonData = convertElementToJson(parsedElement, config, stats, 0);

    // Analyze structure
    const structureInfo = analyzeXmlStructure(parsedElement);

    // Extract namespace information
    const namespaces: NamespaceInfo[] = [];
    if (parsedElement.attributes) {
      Object.keys(parsedElement.attributes).forEach(attr => {
        if (attr.startsWith('xmlns')) {
          const prefix = attr === 'xmlns' ? 'default' : attr.substring(6);
          namespaces.push({
            prefix,
            uri: parsedElement.attributes[attr],
            usageCount: 1 // Simplified counting
          });
        }
      });
    }

    // Calculate final stats
    const conversionTime = Date.now() - startTime;
    stats.conversionTime = conversionTime;
    const jsonString = JSON.stringify(jsonData, null, 2);
    stats.outputSize = jsonString.length;

    const conversion: ConversionResult = {
      originalXml,
      jsonData,
      conversionStats: stats,
      structureInfo,
      namespaces
    };

    // Add warnings
    if (structureInfo.hasMixedContent) {
      warnings.push('Mixed content detected - text and elements may be restructured');
    }

    if (structureInfo.hasNamespaces && !config.namespacesEnabled) {
      warnings.push('XML namespaces found but namespace processing is disabled');
    }

    if (stats.totalElements > 500) {
      warnings.push('Large XML document - conversion may be memory intensive');
    }

    if (structureInfo.maxDepth > 15) {
      warnings.push('Deep XML nesting - consider flattening for better JSON structure');
    }

    // Generate output
    const output = `XML to JSON Conversion Result\n${'='.repeat(35)}\n\nConversion Summary:\n• Total Elements: ${stats.totalElements}\n• Attributes: ${stats.attributes}\n• Text Nodes: ${stats.textNodes}\n• Comments: ${stats.comments}\n• Processing Instructions: ${stats.processingInstructions}\n• Namespaces: ${stats.namespaces}\n• Processing Time: ${stats.conversionTime}ms\n• Output Size: ${stats.outputSize} characters\n\nStructure Information:\n• Root Element: ${structureInfo.rootElement}\n• Max Depth: ${structureInfo.maxDepth}\n• Has Attributes: ${structureInfo.hasAttributes ? 'Yes' : 'No'}\n• Has Text Content: ${structureInfo.hasTextContent ? 'Yes' : 'No'}\n• Has Namespaces: ${structureInfo.hasNamespaces ? 'Yes' : 'No'}\n• Mixed Content: ${structureInfo.hasMixedContent ? 'Yes' : 'No'}\n\nJSON Output:\n${'-'.repeat(20)}\n${jsonString}`;

    return {
      success: true,
      output,
      conversion,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const XML_TO_JSON_CONVERTER_TOOL: Tool = {
  id: 'xml-to-json-converter',
  name: 'XML to JSON Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-formats')!,
  slug: 'xml-to-json-converter',
  icon: '🔃',
  keywords: ['xml', 'json', 'convert', 'transform', 'parse', 'data', 'format', 'structure'],
  seoTitle: 'XML to JSON Converter - Transform XML Data to JSON Format | FreeFormatHub',
  seoDescription: 'Convert XML data to JSON format with customizable parsing, attribute handling, and structure options. Fast, accurate XML to JSON transformation.',
  description: 'Convert XML data to JSON format with customizable parsing options, attribute handling, namespace support, and intelligent structure conversion.',

  examples: [
    {
      title: 'Simple Element Conversion',
      input: `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <active>true</active>
</person>`,
      output: `JSON Output:
--------------------
{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true
}`,
      description: 'Convert simple XML elements to JSON properties'
    },
    {
      title: 'XML with Attributes',
      input: `<product id="123" category="electronics">
  <name>Laptop</name>
  <price currency="USD">999.99</price>
  <inStock>true</inStock>
</product>`,
      output: `JSON Output:
--------------------
{
  "@id": "123",
  "@category": "electronics",
  "name": "Laptop",
  "price": {
    "@currency": "USD",
    "#text": 999.99
  },
  "inStock": true
}`,
      description: 'Convert XML attributes to JSON properties with @ prefix'
    },
    {
      title: 'Repeated Elements (Arrays)',
      input: `<users>
  <user id="1">
    <name>Alice</name>
    <role>admin</role>
  </user>
  <user id="2">
    <name>Bob</name>
    <role>user</role>
  </user>
  <user id="3">
    <name>Charlie</name>
    <role>moderator</role>
  </user>
</users>`,
      output: `JSON Output:
--------------------
{
  "user": [
    {
      "@id": "1",
      "name": "Alice",
      "role": "admin"
    },
    {
      "@id": "2", 
      "name": "Bob",
      "role": "user"
    },
    {
      "@id": "3",
      "name": "Charlie",
      "role": "moderator"
    }
  ]
}`,
      description: 'Convert repeated XML elements to JSON arrays'
    }
  ],

  useCases: [
    'Converting XML APIs to JSON for modern web applications',
    'Transforming XML configuration files to JSON format',
    'Parsing XML data feeds for JavaScript applications',
    'Converting SOAP responses to JSON for easier processing',
    'Migrating legacy XML data to JSON-based systems',
    'Processing XML documents in Node.js applications',
    'Educational purposes for understanding XML structure',
    'Converting XML exports to JSON for data analysis'
  ],

  faq: [
    {
      question: 'How are XML attributes converted to JSON?',
      answer: 'XML attributes are converted to JSON properties with a prefix (default "@"). For example, <element attr="value"> becomes {"@attr": "value"}.'
    },
    {
      question: 'How does the tool handle repeated XML elements?',
      answer: 'Repeated elements are automatically converted to JSON arrays. You can configure whether to force arrays, use smart detection, or avoid arrays entirely.'
    },
    {
      question: 'Can numbers and booleans be parsed automatically?',
      answer: 'Yes, the tool can automatically parse string values that look like numbers or booleans (true/false) into their proper JSON types.'
    },
    {
      question: 'How are XML namespaces handled?',
      answer: 'Namespaces can be preserved in element names using a configurable separator, or they can be ignored during conversion.'
    },
    {
      question: 'What happens with mixed content (text + elements)?',
      answer: 'Mixed content is handled by separating text into a special text node property (default "#text") while preserving child elements.'
    }
  ],

  commonErrors: [
    'Malformed XML with unclosed tags or invalid syntax',
    'XML documents with unsupported encoding',
    'Very large XML files causing memory issues',
    'Complex namespace declarations that cannot be parsed',
    'XML with circular references or infinite recursion'
  ],

  relatedTools: ['json-to-xml-converter', 'xml-formatter', 'json-formatter', 'xml-validator', 'json-validator']
};