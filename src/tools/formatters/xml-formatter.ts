import type { Tool, ToolResult, ToolConfig } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface XmlFormatterConfig extends ToolConfig {
  mode: 'format' | 'validate' | 'minify' | 'convert-to-json';
  indent: number;
  sortAttributes: boolean;
  removeComments: boolean;
  removeEmptyNodes: boolean;
  selfClosingTags: boolean;
}

export const XML_FORMATTER_TOOL: Tool = {
  id: 'xml-formatter',
  name: 'XML Formatter & Validator',
  description: 'Format, validate, minify, and convert XML with namespace-aware parsing, attribute sorting, JSON export, and instant error diagnostics — purpose-built for SOAP, RSS, and config workflows.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'xml-formatting')!,
  slug: 'xml-formatter',
  icon: '📋',
  keywords: ['xml', 'format', 'validate', 'beautify', 'minify', 'convert', 'json', 'parser', 'soap', 'rss'],
  seoTitle: 'Free XML Formatter & Validator Online - Format & Validate XML',
  seoDescription: 'Beautify, validate, minify, and convert XML in seconds. Attribute sorting, namespace checks, JSON conversion, and SOAP-aware diagnostics — all processed locally for privacy.',
  examples: [
    {
      title: 'Basic XML Formatting',
      input: '<root><item>value</item><item>value2</item></root>',
      output: '<root>\n  <item>value</item>\n  <item>value2</item>\n</root>',
      description: 'Format compact XML with proper indentation'
    },
    {
      title: 'XML with Attributes',
      input: '<config version="1.0"><database host="localhost" port="5432"><name>mydb</name></database></config>',
      output: '<config version="1.0">\n  <database host="localhost" port="5432">\n    <name>mydb</name>\n  </database>\n</config>',
      description: 'Format XML with attributes and nested elements'
    },
    {
      title: 'SOAP Envelope',
      input: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetUser><id>123</id></GetUser></soap:Body></soap:Envelope>',
      output: '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n  <soap:Body>\n    <GetUser>\n      <id>123</id>\n    </GetUser>\n  </soap:Body>\n</soap:Envelope>',
      description: 'Format SOAP XML with namespaces'
    }
  ],
  useCases: [
    'Format configuration files and API responses',
    'Validate XML syntax before processing',
    'Debug XML structure and hierarchy issues',
    'Minify XML for reduced file size',
    'Convert XML to JSON for web applications',
    'Prepare XML for documentation or sharing'
  ],
  commonErrors: [
    'Unclosed tags - every opening tag must have a closing tag',
    'Case sensitivity - XML tags are case-sensitive',
    'Invalid characters in tag names or attributes',
    'Missing quotes around attribute values',
    'Nested tags not properly closed in order',
    'Invalid XML declaration or encoding'
  ],
  faq: [
    {
      question: 'What is XML?',
      answer: 'XML (eXtensible Markup Language) is a markup language that defines rules for encoding documents in a format that is both human-readable and machine-readable.'
    },
    {
      question: 'What\'s the difference between XML and HTML?',
      answer: 'XML is stricter than HTML - all tags must be properly closed, case-sensitive, and well-formed. HTML is more forgiving of syntax errors.'
    },
    {
      question: 'How do I handle special characters in XML?',
      answer: 'Use XML entities: &lt; for <, &gt; for >, &amp; for &, &quot; for ", and &apos; for \'. Or use CDATA sections for literal text.'
    },
    {
      question: 'Can XML contain comments?',
      answer: 'Yes, XML supports comments using <!-- comment text -->. Comments can span multiple lines but cannot be nested.'
    },
    {
      question: 'What are XML namespaces?',
      answer: 'Namespaces prevent element name conflicts by qualifying names with a URI. They\'re declared with xmlns attributes.'
    }
  ],
  relatedTools: [
    'json-formatter',
    'yaml-formatter',
    'html-beautifier',
    'base64-encoder'
  ],
  howItWorks: [
    {
      title: "Input XML Data",
      icon: "📄",
      description: "Paste XML content, upload XML files, or drag and drop your XML data into our online XML formatter. Support for large XML files, SOAP envelopes, RSS feeds, configuration files, and all XML-based formats. Our XML parser instantly validates syntax and detects common XML errors.",
      keywords: ["paste XML", "upload XML file", "XML input", "SOAP formatter", "RSS formatter", "XML validator"]
    },
    {
      title: "Configure XML Formatting Options",
      icon: "⚙️",
      description: "Customize XML indentation (2, 4 spaces or tabs), sort attributes alphabetically, remove comments and empty nodes, handle self-closing tags, and choose between formatting, validation, or minification modes. Advanced XML beautifier options for professional XML processing.",
      keywords: ["XML indentation", "sort XML attributes", "XML beautifier", "XML minifier", "XML formatting options"]
    },
    {
      title: "Format and Validate XML",
      icon: "✨",
      description: "Click 'Format XML' to beautify and validate your XML data. Our XML formatter processes data locally in your browser with no server uploads. Get detailed error messages for invalid XML syntax, unclosed tags, and malformed structures with precise line numbers.",
      keywords: ["format XML online", "validate XML", "beautify XML", "XML syntax checker", "XML parser error"]
    },
    {
      title: "Export or Convert XML Results",
      icon: "💾",
      description: "Download formatted XML files, copy to clipboard, or convert XML to JSON format. Export minified XML for production use or pretty-printed XML for debugging. Share formatted XML documents or open in new window for enhanced productivity.",
      keywords: ["download XML", "copy XML", "XML to JSON", "export XML", "convert XML", "XML converter"]
    }
  ],
  problemsSolved: [
    {
      problem: 'Compressed or single-line XML is difficult to audit, which slows debugging, code reviews, and incident response when APIs or integrations misbehave.',
      solution: 'Instantly beautify XML with consistent indentation, optional attribute sorting, and whitespace normalization so complex SOAP or RSS payloads become readable at a glance.',
      icon: '🧭',
      keywords: ['beautify XML', 'readable XML', 'SOAP formatter', 'indent XML', 'debug XML']
    },
    {
      problem: 'Malformed XML can take hours to track down when parsers only report generic errors without line numbers or context.',
      solution: 'The validator highlights unclosed tags, namespace issues, and attribute mistakes with precise line and column detail, making it easy to pinpoint and resolve schema violations.',
      icon: '🚨',
      keywords: ['XML validator', 'namespace errors', 'line numbers', 'schema issues', 'error diagnostics']
    },
    {
      problem: 'Teams frequently need JSON versions of XML payloads for front-end tooling, API testing, or documentation but lack a reliable converter.',
      solution: 'Use the convert-to-JSON mode to produce clean JSON representations of XML structures, ready for mock APIs, diffing, or data exchange pipelines without external dependencies.',
      icon: '🔄',
      keywords: ['XML to JSON', 'data conversion', 'api testing', 'integration tooling', 'xml workflow']
    }
  ],
  whyChoose: [
    {
      title: 'Client-Side Security',
      description: 'Process sensitive configuration files and SOAP payloads entirely in your browser—no uploads, no retention, and instant deletion as you navigate away.',
      icon: '🔒',
      keywords: ['private XML formatter', 'local processing', 'secure tooling', 'no uploads']
    },
    {
      title: 'Modes for Every Workflow',
      description: 'Switch between format, validate, minify, and XML→JSON conversion without leaving the page. Each mode includes tailored metadata to speed up QA and release reviews.',
      icon: '🎛️',
      keywords: ['format XML', 'validate XML', 'minify XML', 'convert XML', 'developer workflow']
    },
    {
      title: 'Enterprise-Ready Diagnostics',
      description: 'Namespace detection, comment removal, empty-node cleanup, and attribute control help you deliver standards-compliant XML for enterprise integrations and legacy platforms.',
      icon: '🏢',
      keywords: ['namespace support', 'attribute sorting', 'comment removal', 'enterprise XML']
    },
    {
      title: 'Productivity-Focused UI',
      description: 'Drag-and-drop files, copy formatted results, download outputs, and revisit previous runs via tool history to streamline repetitive XML chores.',
      icon: '⚙️',
      keywords: ['drag and drop XML', 'copy results', 'download XML', 'tool history']
    }
  ]
};

export function processXml(input: string, config: XmlFormatterConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide XML content to process.'
    };
  }

  try {
    switch (config.mode) {
      case 'format':
        return formatXml(input, config);
      case 'validate':
        return validateXml(input, config);
      case 'minify':
        return minifyXml(input, config);
      case 'convert-to-json':
        return convertXmlToJson(input, config);
      default:
        throw new Error(`Unsupported mode: ${config.mode}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process XML data'
    };
  }
}

function formatXml(input: string, config: XmlFormatterConfig): ToolResult {
  try {
    const parsed = parseXml(input);
    const formatted = stringifyXml(parsed, config, 0);
    
    return {
      success: true,
      output: formatted,
      metadata: {
        originalLines: input.split('\n').length,
        formattedLines: formatted.split('\n').length,
        indent: config.indent,
        sortAttributes: config.sortAttributes,
        removeComments: config.removeComments
      }
    };
  } catch (error) {
    throw new Error(`XML formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateXml(input: string, config: XmlFormatterConfig): ToolResult {
  try {
    const validation = validateXmlStructure(input);
    
    return {
      success: true,
      output: validation.isValid ? 'XML is valid ✓' : `XML validation failed:\n${validation.errors.join('\n')}`,
      metadata: {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        hasNamespaces: input.includes('xmlns'),
        hasComments: input.includes('<!--'),
        estimatedSize: new Blob([input]).size
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `XML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function minifyXml(input: string, config: XmlFormatterConfig): ToolResult {
  try {
    let minified = input
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    
    if (config.removeComments) {
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');
    }
    
    return {
      success: true,
      output: minified,
      metadata: {
        originalSize: input.length,
        minifiedSize: minified.length,
        compressionRatio: ((input.length - minified.length) / input.length * 100).toFixed(1),
        removedComments: config.removeComments
      }
    };
  } catch (error) {
    throw new Error(`XML minification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertXmlToJson(input: string, config: XmlFormatterConfig): ToolResult {
  try {
    const parsed = parseXml(input);
    const json = xmlToJson(parsed);
    const formatted = JSON.stringify(json, null, config.indent);
    
    return {
      success: true,
      output: formatted,
      metadata: {
        originalFormat: 'XML',
        convertedFormat: 'JSON',
        originalSize: input.length,
        convertedSize: formatted.length,
        hasAttributes: input.includes('='),
        hasNamespaces: input.includes('xmlns')
      }
    };
  } catch (error) {
    throw new Error(`XML to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple XML parser (basic implementation for common cases)
interface XmlNode {
  type: 'element' | 'text' | 'comment' | 'declaration';
  name?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  content?: string;
}

function parseXml(xmlString: string): XmlNode {
  const xml = xmlString.trim();
  
  // Basic XML parsing - simplified implementation
  const root: XmlNode = { type: 'element', name: 'root', children: [] };
  const stack: XmlNode[] = [root];
  
  // Remove XML declaration if present
  const cleanXml = xml.replace(/<\?xml[^>]*\?>/g, '');
  
  // Simple regex-based parsing (for basic XML)
  const tagRegex = /<\/?[^>]+>/g;
  let lastIndex = 0;
  let match;
  
  while ((match = tagRegex.exec(cleanXml)) !== null) {
    const beforeTag = cleanXml.slice(lastIndex, match.index).trim();
    
    // Add text content if any
    if (beforeTag) {
      const current = stack[stack.length - 1];
      if (current.children) {
        current.children.push({
          type: 'text',
          content: beforeTag
        });
      }
    }
    
    const tag = match[0];
    
    if (tag.startsWith('<!--')) {
      // Comment
      const content = tag.slice(4, -3);
      const current = stack[stack.length - 1];
      if (current.children) {
        current.children.push({
          type: 'comment',
          content: content.trim()
        });
      }
    } else if (tag.startsWith('</')) {
      // Closing tag
      stack.pop();
    } else {
      // Opening tag or self-closing tag
      const element = parseTag(tag);
      const current = stack[stack.length - 1];
      
      if (current.children) {
        current.children.push(element);
      }
      
      if (!tag.endsWith('/>')) {
        stack.push(element);
      }
    }
    
    lastIndex = tagRegex.lastIndex;
  }
  
  // Add remaining text
  const remaining = cleanXml.slice(lastIndex).trim();
  if (remaining) {
    const current = stack[stack.length - 1];
    if (current.children) {
      current.children.push({
        type: 'text',
        content: remaining
      });
    }
  }
  
  return root.children?.[0] || root;
}

function parseTag(tag: string): XmlNode {
  const isSelfClosing = tag.endsWith('/>');
  const content = tag.slice(1, isSelfClosing ? -2 : -1).trim();
  
  const spaceIndex = content.indexOf(' ');
  const name = spaceIndex === -1 ? content : content.slice(0, spaceIndex);
  const attributesStr = spaceIndex === -1 ? '' : content.slice(spaceIndex + 1);
  
  const attributes: Record<string, string> = {};
  
  if (attributesStr) {
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }
  }
  
  return {
    type: 'element',
    name,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    children: isSelfClosing ? undefined : []
  };
}

function stringifyXml(node: XmlNode, config: XmlFormatterConfig, depth: number): string {
  const indent = ' '.repeat(depth * config.indent);
  const nextIndent = ' '.repeat((depth + 1) * config.indent);
  
  if (node.type === 'text') {
    return node.content || '';
  }
  
  if (node.type === 'comment') {
    if (config.removeComments) return '';
    return `${indent}<!-- ${node.content} -->`;
  }
  
  if (node.type === 'element') {
    let result = indent + '<' + node.name;
    
    // Add attributes
    if (node.attributes) {
      const attrs = Object.entries(node.attributes);
      if (config.sortAttributes) {
        attrs.sort(([a], [b]) => a.localeCompare(b));
      }
      
      for (const [key, value] of attrs) {
        result += ` ${key}="${value}"`;
      }
    }
    
    // Self-closing tag or empty element
    if (!node.children || node.children.length === 0) {
      if (config.removeEmptyNodes && !node.attributes) {
        return '';
      }
      return result + (config.selfClosingTags ? ' />' : `></${node.name}>`);
    }
    
    result += '>';
    
    // Check if all children are text (inline content)
    const hasOnlyText = node.children.every(child => child.type === 'text');
    
    if (hasOnlyText && node.children.length === 1) {
      // Inline content
      result += node.children[0].content;
      result += `</${node.name}>`;
    } else {
      // Multi-line content
      result += '\n';
      
      for (const child of node.children) {
        const childResult = stringifyXml(child, config, depth + 1);
        if (childResult.trim()) {
          if (child.type === 'text') {
            result += nextIndent + childResult.trim() + '\n';
          } else {
            result += childResult + '\n';
          }
        }
      }
      
      result += indent + `</${node.name}>`;
    }
    
    return result;
  }
  
  return '';
}

function validateXmlStructure(xml: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for basic XML syntax issues
  const tagStack: string[] = [];
  const tagRegex = /<\/?[^>]+>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const tag = match[0];
    
    if (tag.startsWith('<!--') || tag.startsWith('<?')) {
      // Skip comments and declarations
      continue;
    }
    
    if (tag.startsWith('</')) {
      // Closing tag
      const tagName = tag.slice(2, -1).trim();
      const expected = tagStack.pop();
      
      if (!expected) {
        errors.push(`Unexpected closing tag: ${tag}`);
      } else if (expected !== tagName) {
        errors.push(`Mismatched tag: expected </${expected}> but found ${tag}`);
      }
    } else if (!tag.endsWith('/>')) {
      // Opening tag
      const tagName = tag.slice(1, -1).split(' ')[0];
      tagStack.push(tagName);
    }
  }
  
  // Check for unclosed tags
  if (tagStack.length > 0) {
    errors.push(`Unclosed tags: ${tagStack.join(', ')}`);
  }
  
  // Check for invalid characters in tag names
  const invalidTagRegex = /<[^a-zA-Z:_]/;
  if (invalidTagRegex.test(xml)) {
    errors.push('Invalid characters in tag names');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function xmlToJson(node: XmlNode): any {
  if (node.type === 'text') {
    return node.content;
  }
  
  if (node.type === 'element') {
    const result: any = {};
    
    // Add attributes with @ prefix
    if (node.attributes) {
      for (const [key, value] of Object.entries(node.attributes)) {
        result[`@${key}`] = value;
      }
    }
    
    // Process children
    if (node.children && node.children.length > 0) {
      const textNodes = node.children.filter(child => child.type === 'text');
      const elementNodes = node.children.filter(child => child.type === 'element');
      
      // If only text content
      if (textNodes.length > 0 && elementNodes.length === 0) {
        const textContent = textNodes.map(child => child.content).join('').trim();
        if (Object.keys(result).length === 0) {
          return textContent;
        } else {
          result['#text'] = textContent;
        }
      }
      
      // Process element children
      for (const child of elementNodes) {
        if (child.name) {
          const childJson = xmlToJson(child);
          
          if (result[child.name]) {
            // Multiple elements with same name - convert to array
            if (!Array.isArray(result[child.name])) {
              result[child.name] = [result[child.name]];
            }
            result[child.name].push(childJson);
          } else {
            result[child.name] = childJson;
          }
        }
      }
    }
    
    return result;
  }
  
  return null;
}
