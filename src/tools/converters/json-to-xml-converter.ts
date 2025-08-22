import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface JsonToXmlConfig {
  rootElementName: string;
  arrayElementName: string;
  includeXmlDeclaration: boolean;
  prettyPrint: boolean;
  indentSize: number;
  attributePrefix: string;
  textNodeName: string;
  handleNullValues: 'omit' | 'empty' | 'null';
  convertNumbers: boolean;
  convertBooleans: boolean;
  validateXmlNames: boolean;
  maxDepth: number;
  customNamespaces: { prefix: string; uri: string }[];
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  conversion?: ConversionResult;
  warnings?: string[];
}

interface ConversionResult {
  originalJson: any;
  xmlDocument: string;
  conversionStats: ConversionStats;
  structureInfo: StructureInfo;
  namespaces: NamespaceInfo[];
}

interface ConversionStats {
  totalNodes: number;
  attributes: number;
  textNodes: number;
  arrayElements: number;
  objectElements: number;
  nullValues: number;
  conversionTime: number;
  outputSize: number;
}

interface StructureInfo {
  maxDepth: number;
  rootElement: string;
  hasArrays: boolean;
  hasObjects: boolean;
  hasAttributes: boolean;
  hasTextContent: boolean;
}

interface NamespaceInfo {
  prefix: string;
  uri: string;
  usageCount: number;
}

// Valid XML name pattern
const XML_NAME_PATTERN = /^[a-zA-Z_:][\w.-]*$/;

function sanitizeXmlName(name: string, config: JsonToXmlConfig): string {
  if (!config.validateXmlNames) {
    return name;
  }

  // Replace invalid characters with underscores
  let sanitized = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // Ensure it starts with a valid character
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }

  // Handle empty or reserved names
  if (!sanitized || sanitized === 'xml' || sanitized.toLowerCase().startsWith('xml')) {
    sanitized = 'element_' + sanitized;
  }

  return sanitized;
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeXmlAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
    .replace(/\t/g, '&#9;');
}

function isValidXmlName(name: string): boolean {
  return XML_NAME_PATTERN.test(name);
}

function convertValueToString(value: any, config: JsonToXmlConfig): string {
  if (value === null) {
    switch (config.handleNullValues) {
      case 'omit': return '';
      case 'empty': return '';
      case 'null': return 'null';
      default: return '';
    }
  }

  if (typeof value === 'boolean') {
    return config.convertBooleans ? value.toString() : value.toString();
  }

  if (typeof value === 'number') {
    return config.convertNumbers ? value.toString() : value.toString();
  }

  return escapeXmlText(String(value));
}

function buildNamespaceDeclarations(namespaces: { prefix: string; uri: string }[]): string {
  if (namespaces.length === 0) return '';
  
  return namespaces
    .map(ns => `xmlns:${ns.prefix}="${escapeXmlAttribute(ns.uri)}"`)
    .join(' ');
}

function convertJsonToXml(
  obj: any, 
  elementName: string, 
  config: JsonToXmlConfig, 
  stats: ConversionStats,
  depth: number = 0
): string {
  if (depth > config.maxDepth) {
    return `<!-- Max depth reached for element: ${elementName} -->`;
  }

  stats.totalNodes++;
  const indent = config.prettyPrint ? '  '.repeat(depth * (config.indentSize || 2) / 2) : '';
  const newline = config.prettyPrint ? '\n' : '';

  // Handle primitive values
  if (obj === null) {
    stats.nullValues++;
    switch (config.handleNullValues) {
      case 'omit': return '';
      case 'empty': return `${indent}<${elementName}/>${newline}`;
      case 'null': return `${indent}<${elementName}>null</${elementName}>${newline}`;
      default: return '';
    }
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    stats.textNodes++;
    const content = convertValueToString(obj, config);
    if (content === '') {
      return `${indent}<${elementName}/>${newline}`;
    }
    return `${indent}<${elementName}>${content}</${elementName}>${newline}`;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    stats.arrayElements++;
    let xml = '';
    
    if (obj.length === 0) {
      return `${indent}<${elementName}/>${newline}`;
    }

    obj.forEach((item, index) => {
      const itemElementName = config.arrayElementName || 'item';
      xml += convertJsonToXml(item, itemElementName, config, stats, depth + 1);
    });

    return `${indent}<${elementName}>${newline}${xml}${indent}</${elementName}>${newline}`;
  }

  // Handle objects
  if (typeof obj === 'object') {
    stats.objectElements++;
    let xml = '';
    let attributes = '';
    let content = '';
    
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return `${indent}<${elementName}/>${newline}`;
    }

    // Separate attributes from content
    keys.forEach(key => {
      const value = obj[key];
      const sanitizedKey = sanitizeXmlName(key, config);

      // Check if this should be an attribute (starts with prefix)
      if (key.startsWith(config.attributePrefix) && typeof value !== 'object') {
        stats.attributes++;
        const attrName = key.substring(config.attributePrefix.length);
        const sanitizedAttrName = sanitizeXmlName(attrName, config);
        attributes += ` ${sanitizedAttrName}="${escapeXmlAttribute(String(value))}"`;
      }
      // Check if this is text content
      else if (key === config.textNodeName) {
        stats.textNodes++;
        content += convertValueToString(value, config);
      }
      // Regular elements
      else {
        content += convertJsonToXml(value, sanitizedKey, config, stats, depth + 1);
      }
    });

    // Build the element
    if (content === '') {
      if (attributes) {
        return `${indent}<${elementName}${attributes}/>${newline}`;
      } else {
        return `${indent}<${elementName}/>${newline}`;
      }
    } else {
      const hasChildElements = content.includes('<');
      if (hasChildElements) {
        return `${indent}<${elementName}${attributes}>${newline}${content}${indent}</${elementName}>${newline}`;
      } else {
        return `${indent}<${elementName}${attributes}>${content}</${elementName}>${newline}`;
      }
    }
  }

  return '';
}

function analyzeStructure(obj: any, depth: number = 0): StructureInfo {
  const info: StructureInfo = {
    maxDepth: depth,
    rootElement: 'root',
    hasArrays: false,
    hasObjects: false,
    hasAttributes: false,
    hasTextContent: false
  };

  if (Array.isArray(obj)) {
    info.hasArrays = true;
    obj.forEach(item => {
      const childInfo = analyzeStructure(item, depth + 1);
      info.maxDepth = Math.max(info.maxDepth, childInfo.maxDepth);
      info.hasObjects = info.hasObjects || childInfo.hasObjects;
      info.hasAttributes = info.hasAttributes || childInfo.hasAttributes;
      info.hasTextContent = info.hasTextContent || childInfo.hasTextContent;
    });
  } else if (typeof obj === 'object' && obj !== null) {
    info.hasObjects = true;
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (key.startsWith('@')) {
        info.hasAttributes = true;
      } else if (key === '#text') {
        info.hasTextContent = true;
      } else {
        const childInfo = analyzeStructure(value, depth + 1);
        info.maxDepth = Math.max(info.maxDepth, childInfo.maxDepth);
        info.hasArrays = info.hasArrays || childInfo.hasArrays;
        info.hasObjects = info.hasObjects || childInfo.hasObjects;
        info.hasAttributes = info.hasAttributes || childInfo.hasAttributes;
        info.hasTextContent = info.hasTextContent || childInfo.hasTextContent;
      }
    });
  } else {
    info.hasTextContent = true;
  }

  return info;
}

export function processJsonToXmlConverter(input: string, config: JsonToXmlConfig): ToolResult {
  try {
    const startTime = Date.now();
    
    if (!input.trim()) {
      return {
        success: false,
        error: 'JSON input is required'
      };
    }

    // Parse JSON
    let jsonData: any;
    try {
      jsonData = JSON.parse(input.trim());
    } catch (e) {
      return {
        success: false,
        error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown parsing error'}`
      };
    }

    const warnings: string[] = [];
    
    // Validate configuration
    if (!config.rootElementName || !isValidXmlName(config.rootElementName)) {
      warnings.push('Invalid root element name, using default "root"');
      config.rootElementName = 'root';
    }

    if (!config.arrayElementName || !isValidXmlName(config.arrayElementName)) {
      warnings.push('Invalid array element name, using default "item"');
      config.arrayElementName = 'item';
    }

    // Initialize conversion stats
    const stats: ConversionStats = {
      totalNodes: 0,
      attributes: 0,
      textNodes: 0,
      arrayElements: 0,
      objectElements: 0,
      nullValues: 0,
      conversionTime: 0,
      outputSize: 0
    };

    // Analyze structure
    const structureInfo = analyzeStructure(jsonData);
    structureInfo.rootElement = config.rootElementName;

    // Build XML declaration
    let xmlOutput = '';
    if (config.includeXmlDeclaration) {
      xmlOutput += '<?xml version="1.0" encoding="UTF-8"?>';
      if (config.prettyPrint) xmlOutput += '\n';
    }

    // Build root element with namespaces
    const namespaceDeclarations = buildNamespaceDeclarations(config.customNamespaces);
    const rootElementName = sanitizeXmlName(config.rootElementName, config);
    
    if (jsonData === null || jsonData === undefined) {
      xmlOutput += `<${rootElementName}${namespaceDeclarations ? ' ' + namespaceDeclarations : ''}/>`;
    } else if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      // For objects, merge their properties into the root element
      let rootAttributes = '';
      let rootContent = '';
      
      Object.keys(jsonData).forEach(key => {
        const value = jsonData[key];
        const sanitizedKey = sanitizeXmlName(key, config);

        if (key.startsWith(config.attributePrefix) && typeof value !== 'object') {
          stats.attributes++;
          const attrName = key.substring(config.attributePrefix.length);
          const sanitizedAttrName = sanitizeXmlName(attrName, config);
          rootAttributes += ` ${sanitizedAttrName}="${escapeXmlAttribute(String(value))}"`;
        } else if (key === config.textNodeName) {
          stats.textNodes++;
          rootContent += convertValueToString(value, config);
        } else {
          rootContent += convertJsonToXml(value, sanitizedKey, config, stats, 1);
        }
      });

      const allAttributes = namespaceDeclarations 
        ? namespaceDeclarations + rootAttributes 
        : rootAttributes.trim();

      if (rootContent === '') {
        xmlOutput += `<${rootElementName}${allAttributes ? ' ' + allAttributes : ''}/>`;
      } else {
        const hasChildElements = rootContent.includes('<');
        if (hasChildElements && config.prettyPrint) {
          xmlOutput += `<${rootElementName}${allAttributes ? ' ' + allAttributes : ''}>\n${rootContent}</${rootElementName}>`;
        } else {
          xmlOutput += `<${rootElementName}${allAttributes ? ' ' + allAttributes : ''}>${rootContent}</${rootElementName}>`;
        }
      }
    } else {
      // For primitive values or arrays, wrap in root element
      const content = convertJsonToXml(jsonData, 'content', config, stats, 1);
      if (content.trim() === '') {
        xmlOutput += `<${rootElementName}${namespaceDeclarations ? ' ' + namespaceDeclarations : ''}/>`;
      } else {
        xmlOutput += `<${rootElementName}${namespaceDeclarations ? ' ' + namespaceDeclarations : ''}>\n${content}</${rootElementName}>`;
      }
    }

    // Calculate final stats
    const conversionTime = Date.now() - startTime;
    stats.conversionTime = conversionTime;
    stats.outputSize = xmlOutput.length;

    // Create namespace info
    const namespaces: NamespaceInfo[] = config.customNamespaces.map(ns => ({
      prefix: ns.prefix,
      uri: ns.uri,
      usageCount: (xmlOutput.match(new RegExp(`${ns.prefix}:`, 'g')) || []).length
    }));

    const conversion: ConversionResult = {
      originalJson: jsonData,
      xmlDocument: xmlOutput,
      conversionStats: stats,
      structureInfo,
      namespaces
    };

    // Add warnings
    if (stats.maxDepth > 10) {
      warnings.push('Deep nesting detected - consider flattening the structure');
    }

    if (stats.totalNodes > 1000) {
      warnings.push('Large document - consider splitting into smaller chunks');
    }

    if (config.customNamespaces.length > 0) {
      const unusedNamespaces = namespaces.filter(ns => ns.usageCount === 0);
      if (unusedNamespaces.length > 0) {
        warnings.push(`Unused namespaces: ${unusedNamespaces.map(ns => ns.prefix).join(', ')}`);
      }
    }

    // Generate output
    const output = `JSON to XML Conversion Result\n${'='.repeat(35)}\n\nConversion Summary:\n• Total Nodes: ${stats.totalNodes}\n• Attributes: ${stats.attributes}\n• Text Nodes: ${stats.textNodes}\n• Array Elements: ${stats.arrayElements}\n• Object Elements: ${stats.objectElements}\n• Processing Time: ${stats.conversionTime}ms\n• Output Size: ${stats.outputSize} characters\n\nStructure Information:\n• Max Depth: ${structureInfo.maxDepth}\n• Root Element: ${structureInfo.rootElement}\n• Contains Arrays: ${structureInfo.hasArrays ? 'Yes' : 'No'}\n• Contains Objects: ${structureInfo.hasObjects ? 'Yes' : 'No'}\n• Has Attributes: ${structureInfo.hasAttributes ? 'Yes' : 'No'}\n• Has Text Content: ${structureInfo.hasTextContent ? 'Yes' : 'No'}\n\nXML Output:\n${'-'.repeat(20)}\n${xmlOutput}`;

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

export const JSON_TO_XML_CONVERTER_TOOL: Tool = {
  id: 'json-to-xml-converter',
  name: 'JSON to XML Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'data-formats')!,
  slug: 'json-to-xml-converter',
  icon: '🔄',
  keywords: ['json', 'xml', 'convert', 'transform', 'data', 'format', 'structure', 'interchange'],
  seoTitle: 'JSON to XML Converter - Transform JSON Data to XML Format | FreeFormatHub',
  seoDescription: 'Convert JSON data to XML format with customizable formatting, namespaces, and structure options. Fast, accurate JSON to XML transformation.',
  description: 'Convert JSON data to well-formed XML with customizable formatting, attribute handling, namespace support, and structure validation.',

  examples: [
    {
      title: 'Simple Object Conversion',
      input: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true
}`,
      output: `XML Output:
--------------------
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <active>true</active>
</root>`,
      description: 'Convert a simple JSON object to XML format'
    },
    {
      title: 'Array Conversion',
      input: `{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "name": "Charlie"}
  ]
}`,
      output: `XML Output:
--------------------
<root>
  <users>
    <item>
      <id>1</id>
      <name>Alice</name>
    </item>
    <item>
      <id>2</id>
      <name>Bob</name>
    </item>
    <item>
      <id>3</id>
      <name>Charlie</name>
    </item>
  </users>
</root>`,
      description: 'Convert JSON arrays to XML with customizable item element names'
    },
    {
      title: 'Complex Nested Structure',
      input: `{
  "@id": "123",
  "product": {
    "@category": "electronics",
    "name": "Laptop",
    "price": 999.99,
    "specs": {
      "cpu": "Intel i7",
      "ram": "16GB",
      "storage": "512GB SSD"
    }
  }
}`,
      output: `XML Output:
--------------------
<root id="123">
  <product category="electronics">
    <name>Laptop</name>
    <price>999.99</price>
    <specs>
      <cpu>Intel i7</cpu>
      <ram>16GB</ram>
      <storage>512GB SSD</storage>
    </specs>
  </product>
</root>`,
      description: 'Convert complex nested JSON with attributes using @ prefix'
    }
  ],

  useCases: [
    'Converting JSON APIs to XML for legacy system integration',
    'Transforming configuration files between JSON and XML formats',
    'Preparing data for XML-based web services and SOAP APIs',
    'Converting NoSQL document data to XML for processing',
    'Migrating data between JSON and XML-based applications',
    'Creating XML feeds from JSON data sources',
    'Educational purposes for understanding data format differences',
    'Generating XML configuration from JSON templates'
  ],

  faq: [
    {
      question: 'How are JSON attributes handled in XML conversion?',
      answer: 'JSON properties starting with @ are converted to XML attributes. For example, "@id": "123" becomes id="123" in the XML element.'
    },
    {
      question: 'Can I customize the XML element names?',
      answer: 'Yes, you can set custom root element names, array item names, and configure attribute prefixes. The tool also sanitizes invalid XML names automatically.'
    },
    {
      question: 'How are JSON arrays converted to XML?',
      answer: 'Arrays are converted to XML elements containing multiple child elements. You can customize the name used for array items (default is "item").'
    },
    {
      question: 'Does the tool support XML namespaces?',
      answer: 'Yes, you can define custom XML namespaces that will be included in the root element and used throughout the document as needed.'
    },
    {
      question: 'How are null values and special characters handled?',
      answer: 'Null values can be omitted, converted to empty elements, or explicit "null" text. Special characters are properly escaped for valid XML output.'
    }
  ],

  commonErrors: [
    'Invalid JSON syntax in the input data',
    'Circular references in JSON objects (not supported)',
    'Invalid XML element names requiring sanitization',
    'JSON structures too deep exceeding maximum depth limits',
    'Reserved XML names or namespace conflicts'
  ],

  relatedTools: ['xml-to-json-converter', 'json-formatter', 'xml-formatter', 'json-validator', 'xml-validator']
};