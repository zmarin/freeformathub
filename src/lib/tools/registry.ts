import type { Tool, ToolCategory, ToolSubcategory } from '../../types';

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'formatters',
    name: 'Data Formatters & Validators',
    description: 'Format, validate, and beautify data in various formats',
    icon: 'FileText',
    color: 'blue',
    subcategories: [
      {
        id: 'json-formatting',
        name: 'JSON Tools',
        description: 'Format, validate, and beautify JSON data',
        icon: '📊',
        keywords: ['json', 'format', 'validate', 'beautify'],
        seoTitle: 'JSON Formatting & Validation Tools',
        seoDescription: 'Professional JSON formatting, validation, and beautification tools for developers'
      },
      {
        id: 'xml-formatting',
        name: 'XML Tools',
        description: 'Format, validate, and process XML documents',
        icon: '📄',
        keywords: ['xml', 'format', 'validate', 'parse'],
        seoTitle: 'XML Formatting & Validation Tools',
        seoDescription: 'Format, validate, and beautify XML documents with professional tools'
      },
      {
        id: 'css-formatting',
        name: 'CSS Tools',
        description: 'Format, minify, and optimize CSS stylesheets',
        icon: '🎨',
        keywords: ['css', 'format', 'beautify', 'minify'],
        seoTitle: 'CSS Formatting & Optimization Tools',
        seoDescription: 'Format, beautify, and optimize CSS stylesheets for better performance'
      },
      {
        id: 'code-formatting',
        name: 'Code Formatters',
        description: 'Format and beautify various programming languages',
        icon: '💻',
        keywords: ['code', 'format', 'beautify', 'programming'],
        seoTitle: 'Code Formatting & Beautification Tools',
        seoDescription: 'Format and beautify code in multiple programming languages'
      }
    ]
  },
  {
    id: 'converters',
    name: 'Data Converters',
    description: 'Convert data between different formats and structures',
    icon: 'RefreshCw',
    color: 'green',
    subcategories: [
      {
        id: 'data-formats',
        name: 'Data Formats',
        description: 'Convert between JSON, CSV, XML, YAML, and other data formats',
        icon: '📊',
        keywords: ['json', 'csv', 'xml', 'yaml', 'convert'],
        seoTitle: 'Data Format Conversion Tools | JSON, CSV, XML, YAML',
        seoDescription: 'Convert data between popular formats: JSON to CSV, XML to JSON, YAML conversions and more'
      },
      {
        id: 'images-media',
        name: 'Images & Media',
        description: 'Convert image formats, resize, and optimize media files',
        icon: '🖼️',
        keywords: ['image', 'convert', 'resize', 'webp', 'base64'],
        seoTitle: 'Image Format Conversion & Optimization Tools',
        seoDescription: 'Convert images between formats, encode to Base64, WebP conversion, and image optimization'
      },
      {
        id: 'colors-design',
        name: 'Colors & Design',
        description: 'Convert between color formats: HEX, RGB, HSL, and more',
        icon: '🎨',
        keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
        seoTitle: 'Color Format Conversion Tools | HEX, RGB, HSL',
        seoDescription: 'Convert colors between HEX, RGB, HSL, and other formats for design and development'
      },
      {
        id: 'numbers-units',
        name: 'Numbers & Units',
        description: 'Convert number bases, units, and measurements',
        icon: '🔢',
        keywords: ['number', 'base', 'unit', 'convert', 'measurement'],
        seoTitle: 'Number Base & Unit Conversion Tools',
        seoDescription: 'Convert between number bases, units of measurement, and mathematical formats'
      },
      {
        id: 'code-development',
        name: 'Code & Development',
        description: 'Convert between code formats and generate type definitions',
        icon: '💻',
        keywords: ['code', 'typescript', 'css', 'tailwind', 'convert'],
        seoTitle: 'Code Format Conversion Tools | TypeScript, CSS, Tailwind',
        seoDescription: 'Convert JSON to TypeScript, CSS to Tailwind, and other development format conversions'
      },
      {
        id: 'documents',
        name: 'Document Formats',
        description: 'Convert between document formats and markup languages',
        icon: '📄',
        keywords: ['document', 'markdown', 'html', 'convert'],
        seoTitle: 'Document Format Conversion Tools | Markdown, HTML',
        seoDescription: 'Convert between document formats: Markdown to HTML, data URI conversions, and more'
      }
    ]
  },
  {
    id: 'encoders',
    name: 'Encoding & Decoding',
    description: 'Encode and decode text in various formats',
    icon: 'Lock',
    color: 'purple',
    subcategories: [
      {
        id: 'base-encoding',
        name: 'Base Encoding',
        description: 'Base64, Base32, and other base encoding/decoding',
        icon: '🔐',
        keywords: ['base64', 'base32', 'encode', 'decode'],
        seoTitle: 'Base Encoding Tools | Base64, Base32 Encoder/Decoder',
        seoDescription: 'Encode and decode text with Base64, Base32, and other base encoding formats'
      },
      {
        id: 'url-encoding',
        name: 'URL & Web',
        description: 'URL encoding, HTML entities, and web-safe encoding',
        icon: '🌐',
        keywords: ['url', 'encode', 'html', 'entities', 'web'],
        seoTitle: 'URL & HTML Encoding Tools | Web-Safe Text Encoding',
        seoDescription: 'Encode URLs, HTML entities, and create web-safe text for applications'
      },
      {
        id: 'text-encoding',
        name: 'Text & Strings',
        description: 'String escaping, character encoding, and text transformation',
        icon: '📝',
        keywords: ['string', 'escape', 'text', 'encode', 'unicode'],
        seoTitle: 'Text Encoding & String Escape Tools',
        seoDescription: 'Escape strings, encode text, and handle character encoding for programming'
      },
      {
        id: 'crypto-encoding',
        name: 'Cryptographic',
        description: 'JWT decoding, certificate parsing, and crypto formats',
        icon: '🔑',
        keywords: ['jwt', 'token', 'certificate', 'crypto', 'decode'],
        seoTitle: 'Cryptographic Decoding Tools | JWT, Certificates',
        seoDescription: 'Decode JWT tokens, parse certificates, and handle cryptographic formats'
      }
    ]
  },
  {
    id: 'text',
    name: 'Text & String Tools',
    description: 'Manipulate and transform text and strings',
    icon: 'Type',
    color: 'orange',
    subcategories: [
      {
        id: 'text-transformation',
        name: 'Text Transform',
        description: 'Change text case, format, and structure',
        icon: '🔄',
        keywords: ['text', 'case', 'transform', 'format', 'convert'],
        seoTitle: 'Text Transformation Tools | Case Conversion, Formatting',
        seoDescription: 'Transform text case, format strings, and manipulate text structure'
      },
      {
        id: 'text-analysis',
        name: 'Text Analysis',
        description: 'Analyze text statistics, readability, and content metrics',
        icon: '📊',
        keywords: ['text', 'analysis', 'statistics', 'count', 'readability'],
        seoTitle: 'Text Analysis Tools | Statistics, Word Count, Readability',
        seoDescription: 'Analyze text statistics, word count, readability scores, and content metrics'
      },
      {
        id: 'text-comparison',
        name: 'Text Comparison',
        description: 'Compare text, find differences, and merge content',
        icon: '🔍',
        keywords: ['text', 'diff', 'compare', 'merge', 'difference'],
        seoTitle: 'Text Comparison Tools | Diff Checker, Text Merge',
        seoDescription: 'Compare text files, find differences, and merge content with visual diff tools'
      },
      {
        id: 'text-generation',
        name: 'Text Generation',
        description: 'Generate Lorem Ipsum, placeholder text, and content',
        icon: '📝',
        keywords: ['lorem', 'ipsum', 'generate', 'placeholder', 'text'],
        seoTitle: 'Text Generation Tools | Lorem Ipsum, Placeholder Content',
        seoDescription: 'Generate Lorem Ipsum, placeholder text, and sample content for design and development'
      },
      {
        id: 'regex-tools',
        name: 'Regex & Patterns',
        description: 'Test regular expressions and analyze text patterns',
        icon: '🔣',
        keywords: ['regex', 'regexp', 'pattern', 'test', 'match'],
        seoTitle: 'Regular Expression Tools | Regex Tester, Pattern Analyzer',
        seoDescription: 'Test regular expressions, analyze patterns, and debug regex with visual tools'
      }
    ]
  },
  {
    id: 'crypto',
    name: 'Cryptography & Security',
    description: 'Hash, encrypt, and secure your data',
    icon: 'Shield',
    color: 'red',
    subcategories: [
      {
        id: 'hashing',
        name: 'Hash Generation',
        description: 'Generate MD5, SHA-1, SHA-256, and other hash algorithms',
        icon: '#️⃣',
        keywords: ['hash', 'md5', 'sha1', 'sha256', 'checksum'],
        seoTitle: 'Hash Generation Tools | MD5, SHA-1, SHA-256 Generator',
        seoDescription: 'Generate secure hashes with MD5, SHA-1, SHA-256, and other algorithms'
      },
      {
        id: 'passwords',
        name: 'Password Tools',
        description: 'Generate secure passwords and check password strength',
        icon: '🔑',
        keywords: ['password', 'generate', 'strength', 'security', 'policy'],
        seoTitle: 'Password Security Tools | Generator, Strength Checker',
        seoDescription: 'Generate secure passwords, check password strength, and create password policies'
      },
      {
        id: 'encryption',
        name: 'Encryption & Security',
        description: 'Encrypt, decrypt, and secure sensitive data',
        icon: '🔐',
        keywords: ['encrypt', 'decrypt', 'security', 'aes', 'rsa'],
        seoTitle: 'Encryption & Security Tools | AES, RSA Encryption',
        seoDescription: 'Encrypt and decrypt data with AES, RSA, and other security algorithms'
      },
      {
        id: 'integrity',
        name: 'Data Integrity',
        description: 'Verify file integrity and data authenticity',
        icon: '✅',
        keywords: ['integrity', 'checksum', 'verify', 'file', 'hash'],
        seoTitle: 'Data Integrity Tools | File Verification, Checksums',
        seoDescription: 'Verify file integrity, check data authenticity, and generate checksums'
      }
    ]
  },
  {
    id: 'web',
    name: 'Web Development',
    description: 'Tools for frontend and backend development',
    icon: 'Code',
    color: 'indigo',
    subcategories: [
      {
        id: 'html-tools',
        name: 'HTML Tools',
        description: 'Beautify, minify, and validate HTML documents',
        icon: '🌐',
        keywords: ['html', 'beautify', 'minify', 'validate', 'format'],
        seoTitle: 'HTML Development Tools | Beautifier, Minifier, Validator',
        seoDescription: 'Beautify, minify, and validate HTML documents for web development'
      },
      {
        id: 'css-tools',
        name: 'CSS Tools',
        description: 'CSS optimization, minification, and selector generation',
        icon: '🎨',
        keywords: ['css', 'minify', 'optimize', 'selector', 'generator'],
        seoTitle: 'CSS Development Tools | Minifier, Selector Generator',
        seoDescription: 'Optimize CSS, generate selectors, and enhance stylesheet performance'
      },
      {
        id: 'javascript-tools',
        name: 'JavaScript Tools',
        description: 'Minify, beautify, and optimize JavaScript code',
        icon: '⚡',
        keywords: ['javascript', 'js', 'minify', 'beautify', 'optimize'],
        seoTitle: 'JavaScript Development Tools | Minifier, Beautifier',
        seoDescription: 'Minify, beautify, and optimize JavaScript code for better performance'
      },
      {
        id: 'api-tools',
        name: 'API Development',
        description: 'API testing, documentation, and response formatting',
        icon: '🔌',
        keywords: ['api', 'test', 'documentation', 'response', 'request'],
        seoTitle: 'API Development Tools | Testing, Documentation, Formatting',
        seoDescription: 'Test APIs, generate documentation, and format responses for development'
      },
      {
        id: 'security-headers',
        name: 'Web Security',
        description: 'Analyze security headers and web application security',
        icon: '🛡️',
        keywords: ['security', 'headers', 'analyze', 'web', 'protection'],
        seoTitle: 'Web Security Tools | Security Headers, Analysis',
        seoDescription: 'Analyze web security headers and improve application security'
      },
      {
        id: 'svg-tools',
        name: 'SVG & Graphics',
        description: 'Optimize SVG files and work with vector graphics',
        icon: '📐',
        keywords: ['svg', 'optimize', 'vector', 'graphics', 'editor'],
        seoTitle: 'SVG Tools | Optimizer, Editor, Vector Graphics',
        seoDescription: 'Optimize SVG files, edit vector graphics, and enhance performance'
      }
    ]
  },
  {
    id: 'color',
    name: 'Color & Design',
    description: 'Work with colors, gradients, and design elements',
    icon: 'Palette',
    color: 'pink',
    subcategories: [
      {
        id: 'color-conversion',
        name: 'Color Conversion',
        description: 'Convert between color formats and systems',
        icon: '🎨',
        keywords: ['color', 'convert', 'hex', 'rgb', 'hsl'],
        seoTitle: 'Color Conversion Tools | HEX, RGB, HSL Converter',
        seoDescription: 'Convert colors between HEX, RGB, HSL, and other formats'
      },
      {
        id: 'palette-generation',
        name: 'Palette Generation',
        description: 'Generate color palettes and schemes',
        icon: '🌈',
        keywords: ['palette', 'generate', 'color', 'scheme', 'harmony'],
        seoTitle: 'Color Palette Generator | Color Schemes, Harmony',
        seoDescription: 'Generate beautiful color palettes and harmonious color schemes'
      },
      {
        id: 'accessibility',
        name: 'Color Accessibility',
        description: 'Test color contrast and accessibility compliance',
        icon: '♿',
        keywords: ['accessibility', 'contrast', 'wcag', 'color', 'compliance'],
        seoTitle: 'Color Accessibility Tools | Contrast Checker, WCAG',
        seoDescription: 'Check color contrast, test accessibility, and ensure WCAG compliance'
      }
    ]
  },
  {
    id: 'datetime',
    name: 'Date & Time',
    description: 'Convert and calculate dates, times, and timezones',
    icon: 'Clock',
    color: 'cyan',
    subcategories: [
      {
        id: 'timestamp-tools',
        name: 'Timestamp Tools',
        description: 'Convert and format Unix timestamps',
        icon: '⏰',
        keywords: ['timestamp', 'unix', 'convert', 'format', 'epoch'],
        seoTitle: 'Timestamp Conversion Tools | Unix Timestamp Converter',
        seoDescription: 'Convert Unix timestamps, format dates, and work with epoch time'
      },
      {
        id: 'date-formatting',
        name: 'Date Formatting',
        description: 'Format dates and times in various formats',
        icon: '📅',
        keywords: ['date', 'format', 'time', 'iso', 'custom'],
        seoTitle: 'Date Formatting Tools | Custom Date Formats',
        seoDescription: 'Format dates and times in various formats including ISO, custom patterns'
      },
      {
        id: 'timezone-tools',
        name: 'Timezone Tools',
        description: 'Convert between timezones and handle timezone data',
        icon: '🌍',
        keywords: ['timezone', 'convert', 'utc', 'local', 'zone'],
        seoTitle: 'Timezone Conversion Tools | UTC, Local Time',
        seoDescription: 'Convert between timezones, handle UTC, and work with timezone data'
      },
      {
        id: 'cron-scheduling',
        name: 'Cron & Scheduling',
        description: 'Generate and validate cron expressions',
        icon: '📋',
        keywords: ['cron', 'schedule', 'generate', 'validate', 'expression'],
        seoTitle: 'Cron Expression Tools | Generator, Validator',
        seoDescription: 'Generate and validate cron expressions for scheduling tasks'
      }
    ]
  },
  {
    id: 'math',
    name: 'Number & Math',
    description: 'Mathematical calculations and number conversions',
    icon: 'Calculator',
    color: 'yellow',
    subcategories: [
      {
        id: 'calculations',
        name: 'Calculations',
        description: 'Perform mathematical calculations and evaluations',
        icon: '🧮',
        keywords: ['calculate', 'math', 'evaluate', 'expression', 'formula'],
        seoTitle: 'Math Calculation Tools | Expression Evaluator',
        seoDescription: 'Calculate mathematical expressions, evaluate formulas, and perform computations'
      },
      {
        id: 'number-conversion',
        name: 'Number Systems',
        description: 'Convert between different number bases and systems',
        icon: '🔢',
        keywords: ['number', 'base', 'binary', 'hex', 'octal'],
        seoTitle: 'Number Base Conversion | Binary, Hex, Decimal, Octal',
        seoDescription: 'Convert numbers between binary, hexadecimal, decimal, octal, and other bases'
      },
      {
        id: 'unit-conversion',
        name: 'Unit Conversion',
        description: 'Convert between units of measurement',
        icon: '📏',
        keywords: ['unit', 'convert', 'measurement', 'metric', 'imperial'],
        seoTitle: 'Unit Conversion Tools | Metric, Imperial, Measurements',
        seoDescription: 'Convert between metric and imperial units, measurements, and quantities'
      }
    ]
  },
  {
    id: 'network',
    name: 'Network & API',
    description: 'Network utilities and API development tools',
    icon: 'Globe',
    color: 'teal',
    subcategories: [
      {
        id: 'ip-tools',
        name: 'IP & Networking',
        description: 'IP calculations, subnet tools, and network utilities',
        icon: '🌐',
        keywords: ['ip', 'subnet', 'network', 'cidr', 'calculator'],
        seoTitle: 'IP & Network Tools | Subnet Calculator, IP Utilities',
        seoDescription: 'Calculate subnets, work with IP addresses, and use network utilities'
      },
      {
        id: 'dns-tools',
        name: 'DNS & Lookup',
        description: 'DNS lookup, WHOIS, and domain information tools',
        icon: '🔍',
        keywords: ['dns', 'lookup', 'whois', 'domain', 'resolve'],
        seoTitle: 'DNS & Domain Tools | Lookup, WHOIS, Domain Info',
        seoDescription: 'Perform DNS lookups, WHOIS queries, and get domain information'
      },
      {
        id: 'port-scanning',
        name: 'Port & Security',
        description: 'Port scanning and network security testing',
        icon: '🔒',
        keywords: ['port', 'scan', 'security', 'network', 'test'],
        seoTitle: 'Network Security Tools | Port Scanner, Security Testing',
        seoDescription: 'Scan ports, test network security, and analyze connections'
      },
      {
        id: 'monitoring',
        name: 'Network Monitoring',
        description: 'Monitor network performance and connectivity',
        icon: '📊',
        keywords: ['monitor', 'network', 'performance', 'ping', 'traceroute'],
        seoTitle: 'Network Monitoring Tools | Performance, Connectivity',
        seoDescription: 'Monitor network performance, test connectivity, and analyze network health'
      },
      {
        id: 'rate-limiting',
        name: 'Rate Limiting',
        description: 'Calculate and configure API rate limits',
        icon: '⚡',
        keywords: ['rate', 'limit', 'api', 'throttle', 'quota'],
        seoTitle: 'Rate Limiting Tools | API Throttling, Quota Calculator',
        seoDescription: 'Calculate rate limits, configure API throttling, and manage quotas'
      }
    ]
  },
  {
    id: 'generators',
    name: 'Generators & Creators',
    description: 'Generate content, data, and code automatically',
    icon: 'Zap',
    color: 'violet',
    subcategories: [
      {
        id: 'qr-barcodes',
        name: 'QR & Barcodes',
        description: 'Generate QR codes and barcodes',
        icon: '📱',
        keywords: ['qr', 'code', 'barcode', 'generate', 'scan'],
        seoTitle: 'QR Code & Barcode Generator | Free QR Code Creator',
        seoDescription: 'Generate QR codes and barcodes for URLs, text, and data with customization options'
      },
      {
        id: 'data-generation',
        name: 'Mock Data',
        description: 'Generate mock data, UUIDs, and test data',
        icon: '🎲',
        keywords: ['mock', 'data', 'uuid', 'generate', 'test'],
        seoTitle: 'Mock Data Generator | UUID, Test Data Creation',
        seoDescription: 'Generate mock data, UUIDs, and test datasets for development'
      },
      {
        id: 'content-generation',
        name: 'Content Generation',
        description: 'Generate Lorem Ipsum, ASCII art, and text content',
        icon: '📝',
        keywords: ['lorem', 'ipsum', 'ascii', 'art', 'generate'],
        seoTitle: 'Content Generation Tools | Lorem Ipsum, ASCII Art',
        seoDescription: 'Generate Lorem Ipsum text, ASCII art, and placeholder content'
      },
      {
        id: 'table-generation',
        name: 'Tables & Markdown',
        description: 'Generate Markdown tables and structured content',
        icon: '📊',
        keywords: ['table', 'markdown', 'generate', 'structure', 'format'],
        seoTitle: 'Table Generation Tools | Markdown Table Generator',
        seoDescription: 'Generate Markdown tables, structured content, and formatted data'
      }
    ]
  },
  {
    id: 'development',
    name: 'Development Tools',
    description: 'Tools for software development and coding',
    icon: 'Code',
    color: 'emerald',
    subcategories: [
      {
        id: 'json-tools',
        name: 'JSON Tools',
        description: 'JSON processing, validation, and manipulation tools',
        icon: '📊',
        keywords: ['json', 'flatten', 'path', 'schema', 'validate'],
        seoTitle: 'JSON Development Tools | Path Extractor, Schema Validator',
        seoDescription: 'Process JSON data with flattening, path extraction, and schema validation'
      },
      {
        id: 'database-tools',
        name: 'Database Tools',
        description: 'Database query optimization and schema tools',
        icon: '🗃️',
        keywords: ['database', 'query', 'optimize', 'schema', 'sql'],
        seoTitle: 'Database Development Tools | Query Optimizer, Schema Visualizer',
        seoDescription: 'Optimize database queries, visualize schemas, and improve database performance'
      },
      {
        id: 'config-tools',
        name: 'Configuration',
        description: 'Validate and manage configuration files',
        icon: '⚙️',
        keywords: ['config', 'validate', 'yaml', 'toml', 'env'],
        seoTitle: 'Configuration Tools | Config Validator, File Manager',
        seoDescription: 'Validate configuration files, manage YAML, TOML, and environment settings'
      },
      {
        id: 'version-control',
        name: 'Version Control',
        description: 'Git diff visualization and version control tools',
        icon: '🔄',
        keywords: ['git', 'diff', 'version', 'control', 'visualize'],
        seoTitle: 'Version Control Tools | Git Diff Visualizer',
        seoDescription: 'Visualize Git diffs, compare versions, and manage code changes'
      },
      {
        id: 'performance',
        name: 'Performance',
        description: 'Performance analysis and optimization tools',
        icon: '🚀',
        keywords: ['performance', 'budget', 'optimize', 'analyze', 'speed'],
        seoTitle: 'Performance Tools | Budget Calculator, Optimization',
        seoDescription: 'Calculate performance budgets, analyze speed, and optimize applications'
      },
      {
        id: 'testing-tools',
        name: 'Testing & QA',
        description: 'Load testing, configuration generation, and QA tools',
        icon: '🧪',
        keywords: ['test', 'load', 'qa', 'config', 'generate'],
        seoTitle: 'Testing & QA Tools | Load Testing, Configuration',
        seoDescription: 'Generate load testing configurations, perform QA, and test applications'
      },
      {
        id: 'log-analysis',
        name: 'Logging & Analysis',
        description: 'Analyze logs and application monitoring data',
        icon: '📋',
        keywords: ['log', 'analyze', 'monitor', 'debug', 'trace'],
        seoTitle: 'Log Analysis Tools | Monitoring, Debugging',
        seoDescription: 'Analyze application logs, monitor systems, and debug issues'
      }
    ]
  },
  {
    id: 'data',
    name: 'Data Analysis',
    description: 'Analyze and process data files and content',
    icon: 'Database',
    color: 'blue',
    subcategories: [
      {
        id: 'file-analysis',
        name: 'File Analysis',
        description: 'Analyze file content, metadata, and structure',
        icon: '📁',
        keywords: ['file', 'analyze', 'metadata', 'structure', 'content'],
        seoTitle: 'File Analysis Tools | Metadata, Content Analysis',
        seoDescription: 'Analyze file metadata, extract content information, and examine file structure'
      },
      {
        id: 'binary-tools',
        name: 'Binary & Hex',
        description: 'View and analyze binary data and hex dumps',
        icon: '🔢',
        keywords: ['binary', 'hex', 'dump', 'view', 'analyze'],
        seoTitle: 'Binary Analysis Tools | Hex Viewer, Binary Data',
        seoDescription: 'View binary data, analyze hex dumps, and examine raw file content'
      },
      {
        id: 'image-analysis',
        name: 'Image Processing',
        description: 'Compress, analyze, and process image files',
        icon: '🖼️',
        keywords: ['image', 'compress', 'analyze', 'metadata', 'optimize'],
        seoTitle: 'Image Analysis Tools | Compression, Metadata Extraction',
        seoDescription: 'Compress images, extract metadata, and optimize image files'
      },
      {
        id: 'document-tools',
        name: 'Document Processing',
        description: 'Process PDF and document files',
        icon: '📄',
        keywords: ['pdf', 'document', 'process', 'extract', 'merge'],
        seoTitle: 'Document Processing Tools | PDF Tools, Document Analysis',
        seoDescription: 'Process PDF files, extract content, merge documents, and analyze structure'
      }
    ]
  },
  {
    id: 'validators',
    name: 'Data Validators',
    description: 'Validate data formats, contacts, and input fields',
    icon: 'ShieldCheck',
    color: 'rose',
    subcategories: [
      {
        id: 'contact-validation',
        name: 'Contact Validation',
        description: 'Validate email addresses, phone numbers, and contact information',
        icon: '📧',
        keywords: ['email', 'phone', 'validate', 'contact', 'format'],
        seoTitle: 'Contact Validation Tools | Email, Phone Number Validation',
        seoDescription: 'Validate email addresses, phone numbers, and contact information formats'
      },
      {
        id: 'financial-validation',
        name: 'Financial Validation',
        description: 'Validate credit cards, IBAN, and financial data formats',
        icon: '💳',
        keywords: ['credit', 'card', 'iban', 'financial', 'validate'],
        seoTitle: 'Financial Validation Tools | Credit Card, IBAN Validation',
        seoDescription: 'Validate credit card numbers, IBAN codes, and financial data formats'
      },
      {
        id: 'web-validation',
        name: 'Web Validation',
        description: 'Validate URLs, domains, and web-related data',
        icon: '🌐',
        keywords: ['url', 'domain', 'web', 'validate', 'link'],
        seoTitle: 'Web Validation Tools | URL, Domain Validation',
        seoDescription: 'Validate URLs, domain names, and web-related data formats'
      },
      {
        id: 'format-validation',
        name: 'Format Validation',
        description: 'Validate file formats and data structure integrity',
        icon: '📝',
        keywords: ['format', 'file', 'validate', 'structure', 'integrity'],
        seoTitle: 'Format Validation Tools | File Format, Data Structure Validation',
        seoDescription: 'Validate file formats, data structures, and content integrity'
      },
      {
        id: 'identity-validation',
        name: 'Identity Validation',
        description: 'Validate identity documents and personal information',
        icon: '🆔',
        keywords: ['identity', 'personal', 'validate', 'document', 'id'],
        seoTitle: 'Identity Validation Tools | Document, Personal Data Validation',
        seoDescription: 'Validate identity documents, personal information, and ID formats'
      }
    ]
  }
];

// Tool registry - will be populated as we add tools
export const TOOL_REGISTRY: Record<string, Tool> = {};

export function registerTool(tool: Tool): void {
  TOOL_REGISTRY[tool.id] = tool;
}

export function getTool(id: string): Tool | undefined {
  return TOOL_REGISTRY[id];
}

export function getToolsByCategory(categoryId: string): Tool[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.category.id === categoryId);
}

export function getAllTools(): Tool[] {
  return Object.values(TOOL_REGISTRY);
}

export function searchTools(query: string): Tool[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(TOOL_REGISTRY).filter(tool => 
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
}

export function getCategory(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find(cat => cat.id === id);
}

export function getSubcategory(categoryId: string, subcategoryId: string): ToolSubcategory | undefined {
  const category = getCategory(categoryId);
  return category?.subcategories?.find(sub => sub.id === subcategoryId);
}

export function getToolsBySubcategory(categoryId: string, subcategoryId: string): Tool[] {
  return Object.values(TOOL_REGISTRY).filter(tool => 
    tool.category.id === categoryId && tool.subcategory?.id === subcategoryId
  );
}

export function getAllSubcategories(): Array<{ category: ToolCategory; subcategory: ToolSubcategory }> {
  const result: Array<{ category: ToolCategory; subcategory: ToolSubcategory }> = [];
  TOOL_CATEGORIES.forEach(category => {
    category.subcategories?.forEach(subcategory => {
      result.push({ category, subcategory });
    });
  });
  return result;
}