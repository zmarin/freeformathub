import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CssSelectorGeneratorConfig {
  targetType: 'element' | 'class' | 'id' | 'attribute' | 'pseudo' | 'combined';
  specificity: 'low' | 'medium' | 'high';
  includeTagName: boolean;
  includeParents: boolean;
  maxParentLevels: number;
  preferClasses: boolean;
  preferIds: boolean;
  useNthChild: boolean;
  generateMultiple: boolean;
  outputFormat: 'css' | 'javascript' | 'xpath';
  includeComments: boolean;
  minifyOutput: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  selectors?: SelectorInfo[];
}

interface SelectorInfo {
  selector: string;
  specificity: number;
  description: string;
  usage: string;
  matches?: number;
}

// Common HTML elements for selector generation
export const HTML_ELEMENTS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'input', 'button', 'select', 'option', 'textarea',
  'header', 'nav', 'main', 'section', 'article', 'aside', 'footer'
];

// Common CSS attributes for targeting
export const COMMON_ATTRIBUTES = [
  'class', 'id', 'data-*', 'type', 'name', 'value', 'href',
  'src', 'alt', 'title', 'placeholder', 'role', 'aria-label'
];

// Pseudo-class selectors
export const PSEUDO_CLASSES = [
  ':hover', ':focus', ':active', ':visited', ':first-child',
  ':last-child', ':nth-child()', ':nth-of-type()', ':not()',
  ':disabled', ':checked', ':empty', ':target'
];

// Pseudo-element selectors  
export const PSEUDO_ELEMENTS = [
  '::before', '::after', '::first-line', '::first-letter',
  '::selection', '::placeholder', '::backdrop'
];

function calculateSpecificity(selector: string): number {
  // CSS specificity calculation: inline=1000, ids=100, classes/attrs/pseudo=10, elements=1
  let specificity = 0;
  
  // Count IDs
  const ids = selector.match(/#[a-zA-Z][\w-]*/g) || [];
  specificity += ids.length * 100;
  
  // Count classes, attributes, and pseudo-classes
  const classes = selector.match(/\.[a-zA-Z][\w-]*/g) || [];
  const attributes = selector.match(/\[[^\]]*\]/g) || [];
  const pseudoClasses = selector.match(/:[a-zA-Z][\w-]*(\([^)]*\))?/g) || [];
  specificity += (classes.length + attributes.length + pseudoClasses.length) * 10;
  
  // Count elements and pseudo-elements
  const elements = selector.match(/^[a-zA-Z][\w-]*|(?:\s|>|\+|~)[a-zA-Z][\w-]*/g) || [];
  const pseudoElements = selector.match(/::[a-zA-Z][\w-]*/g) || [];
  specificity += (elements.length + pseudoElements.length) * 1;
  
  return specificity;
}

function generateElementSelectors(element: string, config: CssSelectorGeneratorConfig): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Basic element selector
  selectors.push({
    selector: element,
    specificity: calculateSpecificity(element),
    description: `Selects all ${element} elements`,
    usage: `Targets every <${element}> tag on the page`
  });
  
  // With common classes (if enabled)
  if (config.preferClasses) {
    const commonClasses = ['container', 'wrapper', 'content', 'item', 'active', 'disabled'];
    commonClasses.forEach(className => {
      const selector = `${element}.${className}`;
      selectors.push({
        selector,
        specificity: calculateSpecificity(selector),
        description: `Selects ${element} elements with class "${className}"`,
        usage: `Targets <${element} class="${className}"> elements`
      });
    });
  }
  
  // With ID (if enabled)
  if (config.preferIds) {
    const selector = `${element}#main`;
    selectors.push({
      selector,
      specificity: calculateSpecificity(selector),
      description: `Selects ${element} element with ID "main"`,
      usage: `Targets <${element} id="main"> element`
    });
  }
  
  // With attributes
  if (element === 'input') {
    const attrSelectors = [
      `${element}[type="text"]`,
      `${element}[type="email"]`,
      `${element}[required]`,
      `${element}[disabled]`
    ];
    attrSelectors.forEach(selector => {
      const attr = selector.match(/\[([^\]]*)\]/)?.[1] || '';
      selectors.push({
        selector,
        specificity: calculateSpecificity(selector),
        description: `Selects ${element} elements with ${attr} attribute`,
        usage: `Targets input fields with specific attributes`
      });
    });
  }
  
  return selectors;
}

function generateClassSelectors(className: string, config: CssSelectorGeneratorConfig): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Basic class selector
  selectors.push({
    selector: `.${className}`,
    specificity: calculateSpecificity(`.${className}`),
    description: `Selects elements with class "${className}"`,
    usage: `Targets any element with class="${className}"`
  });
  
  // With element types
  if (config.includeTagName) {
    ['div', 'span', 'p', 'a', 'button'].forEach(element => {
      const selector = `${element}.${className}`;
      selectors.push({
        selector,
        specificity: calculateSpecificity(selector),
        description: `Selects ${element} elements with class "${className}"`,
        usage: `Targets <${element} class="${className}"> elements`
      });
    });
  }
  
  // Multiple classes
  const combinedSelector = `.${className}.active`;
  selectors.push({
    selector: combinedSelector,
    specificity: calculateSpecificity(combinedSelector),
    description: `Selects elements with both "${className}" and "active" classes`,
    usage: `Targets elements with multiple classes`
  });
  
  // With pseudo-classes
  [':hover', ':focus', ':first-child', ':last-child'].forEach(pseudo => {
    const selector = `.${className}${pseudo}`;
    selectors.push({
      selector,
      specificity: calculateSpecificity(selector),
      description: `Selects ${className} elements in ${pseudo.replace(':', '')} state`,
      usage: `Targets elements during specific interactions or positions`
    });
  });
  
  return selectors;
}

function generateIdSelectors(idName: string): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Basic ID selector
  selectors.push({
    selector: `#${idName}`,
    specificity: calculateSpecificity(`#${idName}`),
    description: `Selects the element with ID "${idName}"`,
    usage: `Targets the unique <element id="${idName}"> element`
  });
  
  // ID with element type
  ['div', 'section', 'header', 'nav'].forEach(element => {
    const selector = `${element}#${idName}`;
    selectors.push({
      selector,
      specificity: calculateSpecificity(selector),
      description: `Selects ${element} element with ID "${idName}"`,
      usage: `More specific targeting of <${element} id="${idName}">`
    });
  });
  
  return selectors;
}

function generateAttributeSelectors(config: CssSelectorGeneratorConfig): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Exact attribute match
  selectors.push({
    selector: '[data-role="button"]',
    specificity: calculateSpecificity('[data-role="button"]'),
    description: 'Selects elements with exact data-role="button" attribute',
    usage: 'Targets custom data attributes with specific values'
  });
  
  // Attribute exists
  selectors.push({
    selector: '[data-toggle]',
    specificity: calculateSpecificity('[data-toggle]'),
    description: 'Selects elements that have a data-toggle attribute',
    usage: 'Targets elements regardless of attribute value'
  });
  
  // Attribute contains
  selectors.push({
    selector: '[class*="btn"]',
    specificity: calculateSpecificity('[class*="btn"]'),
    description: 'Selects elements whose class contains "btn"',
    usage: 'Partial matching for class names or attribute values'
  });
  
  // Attribute starts with
  selectors.push({
    selector: '[href^="https://"]',
    specificity: calculateSpecificity('[href^="https://"]'),
    description: 'Selects links that start with "https://"',
    usage: 'Targets external or secure links'
  });
  
  // Attribute ends with
  selectors.push({
    selector: '[src$=".jpg"]',
    specificity: calculateSpecificity('[src$=".jpg"]'),
    description: 'Selects images with .jpg extension',
    usage: 'Targets specific file types'
  });
  
  return selectors;
}

function generatePseudoSelectors(): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Structural pseudo-classes
  selectors.push({
    selector: 'li:first-child',
    specificity: calculateSpecificity('li:first-child'),
    description: 'Selects the first li element in its parent',
    usage: 'Targets the first item in lists'
  });
  
  selectors.push({
    selector: 'tr:nth-child(even)',
    specificity: calculateSpecificity('tr:nth-child(even)'),
    description: 'Selects every even table row',
    usage: 'Creates zebra striping for tables'
  });
  
  // Interactive pseudo-classes
  selectors.push({
    selector: 'button:hover',
    specificity: calculateSpecificity('button:hover'),
    description: 'Selects buttons when being hovered',
    usage: 'Adds hover effects to interactive elements'
  });
  
  selectors.push({
    selector: 'input:focus',
    specificity: calculateSpecificity('input:focus'),
    description: 'Selects input fields when they have focus',
    usage: 'Highlights active form fields'
  });
  
  // Form state pseudo-classes
  selectors.push({
    selector: 'input:disabled',
    specificity: calculateSpecificity('input:disabled'),
    description: 'Selects disabled input fields',
    usage: 'Styles inactive form elements'
  });
  
  // Pseudo-elements
  selectors.push({
    selector: 'p::first-line',
    specificity: calculateSpecificity('p::first-line'),
    description: 'Selects the first line of paragraph text',
    usage: 'Special styling for opening lines'
  });
  
  selectors.push({
    selector: '.card::before',
    specificity: calculateSpecificity('.card::before'),
    description: 'Creates a pseudo-element before card content',
    usage: 'Adds decorative content without extra HTML'
  });
  
  return selectors;
}

function generateCombinedSelectors(config: CssSelectorGeneratorConfig): SelectorInfo[] {
  const selectors: SelectorInfo[] = [];
  
  // Descendant combinator
  selectors.push({
    selector: '.container p',
    specificity: calculateSpecificity('.container p'),
    description: 'Selects all p elements inside .container elements',
    usage: 'Targets nested elements (any depth)'
  });
  
  // Direct child combinator
  selectors.push({
    selector: '.nav > li',
    specificity: calculateSpecificity('.nav > li'),
    description: 'Selects li elements that are direct children of .nav',
    usage: 'Targets immediate children only'
  });
  
  // Adjacent sibling combinator
  selectors.push({
    selector: 'h2 + p',
    specificity: calculateSpecificity('h2 + p'),
    description: 'Selects p elements immediately following h2',
    usage: 'Targets the next sibling element'
  });
  
  // General sibling combinator
  selectors.push({
    selector: 'h2 ~ p',
    specificity: calculateSpecificity('h2 ~ p'),
    description: 'Selects all p elements following h2 (same parent)',
    usage: 'Targets all subsequent siblings'
  });
  
  // Complex selectors
  if (config.specificity === 'high') {
    selectors.push({
      selector: '.header nav ul li:first-child a:hover',
      specificity: calculateSpecificity('.header nav ul li:first-child a:hover'),
      description: 'Highly specific navigation link selector',
      usage: 'Precise targeting with multiple conditions'
    });
    
    selectors.push({
      selector: 'form input[type="email"]:focus + label',
      specificity: calculateSpecificity('form input[type="email"]:focus + label'),
      description: 'Label following focused email input in forms',
      usage: 'Complex form interaction styling'
    });
  }
  
  return selectors;
}

function formatOutput(selectors: SelectorInfo[], config: CssSelectorGeneratorConfig): string {
  const lines: string[] = [];
  
  if (config.outputFormat === 'css') {
    selectors.forEach(sel => {
      if (config.includeComments) {
        lines.push(`/* ${sel.description} */`);
        lines.push(`/* Specificity: ${sel.specificity} */`);
      }
      
      lines.push(`${sel.selector} {`);
      lines.push('  /* Add your styles here */');
      lines.push('}');
      
      if (!config.minifyOutput) {
        lines.push('');
      }
    });
  } else if (config.outputFormat === 'javascript') {
    lines.push('// CSS Selectors for JavaScript');
    lines.push('const selectors = {');
    
    selectors.forEach((sel, index) => {
      const key = sel.selector.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const comment = config.includeComments ? ` // ${sel.description}` : '';
      const comma = index < selectors.length - 1 ? ',' : '';
      lines.push(`  ${key}: '${sel.selector}'${comma}${comment}`);
    });
    
    lines.push('};');
    lines.push('');
    lines.push('// Usage examples:');
    lines.push('// document.querySelector(selectors.elementname);');
    lines.push('// document.querySelectorAll(selectors.elementname);');
  } else if (config.outputFormat === 'xpath') {
    lines.push('<!-- XPath equivalents for CSS selectors -->');
    selectors.forEach(sel => {
      const xpath = convertCssToXpath(sel.selector);
      if (config.includeComments) {
        lines.push(`<!-- ${sel.description} -->`);
      }
      lines.push(`CSS: ${sel.selector}`);
      lines.push(`XPath: ${xpath}`);
      if (!config.minifyOutput) {
        lines.push('');
      }
    });
  }
  
  return config.minifyOutput ? lines.join('').replace(/\s+/g, ' ') : lines.join('\n');
}

function convertCssToXpath(selector: string): string {
  // Simple CSS to XPath conversion (basic implementation)
  let xpath = selector;
  
  // Convert basic patterns
  xpath = xpath.replace(/^([a-zA-Z]+)/, '//$1');
  xpath = xpath.replace(/\.([a-zA-Z][\w-]*)/g, '[contains(@class, "$1")]');
  xpath = xpath.replace(/#([a-zA-Z][\w-]*)/g, '[@id="$1"]');
  xpath = xpath.replace(/\s+/g, '//');
  xpath = xpath.replace(/>/g, '/');
  
  return xpath.startsWith('//') ? xpath : `//${xpath}`;
}

export function processCssSelectorGenerator(input: string, config: CssSelectorGeneratorConfig): ToolResult {
  try {
    if (!input.trim() && config.targetType !== 'pseudo' && config.targetType !== 'combined') {
      return {
        success: false,
        error: 'Input is required for this selector type'
      };
    }
    
    let selectors: SelectorInfo[] = [];
    
    switch (config.targetType) {
      case 'element':
        if (!HTML_ELEMENTS.includes(input.toLowerCase())) {
          selectors = generateElementSelectors(input.toLowerCase(), config);
        } else {
          selectors = generateElementSelectors(input, config);
        }
        break;
        
      case 'class':
        const className = input.replace(/^\./, '').replace(/\s+/g, '-');
        selectors = generateClassSelectors(className, config);
        break;
        
      case 'id':
        const idName = input.replace(/^#/, '').replace(/\s+/g, '-');
        selectors = generateIdSelectors(idName);
        break;
        
      case 'attribute':
        selectors = generateAttributeSelectors(config);
        break;
        
      case 'pseudo':
        selectors = generatePseudoSelectors();
        break;
        
      case 'combined':
        selectors = generateCombinedSelectors(config);
        break;
    }
    
    // Filter by specificity if needed
    if (config.specificity === 'low') {
      selectors = selectors.filter(s => s.specificity <= 20);
    } else if (config.specificity === 'medium') {
      selectors = selectors.filter(s => s.specificity > 10 && s.specificity <= 50);
    } else if (config.specificity === 'high') {
      selectors = selectors.filter(s => s.specificity > 30);
    }
    
    // Limit results if not generating multiple
    if (!config.generateMultiple) {
      selectors = selectors.slice(0, 3);
    }
    
    const output = formatOutput(selectors, config);
    
    return {
      success: true,
      output,
      selectors
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const CSS_SELECTOR_GENERATOR_TOOL: Tool = {
  id: 'css-selector-generator',
  name: 'CSS Selector Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'css-tools')!,
  slug: 'css-selector-generator',
  icon: '🎯',
  keywords: ['css', 'selector', 'targeting', 'dom', 'element', 'class', 'id', 'pseudo', 'xpath'],
  seoTitle: 'CSS Selector Generator - Create Precise Element Selectors | FreeFormatHub',
  seoDescription: 'Generate CSS selectors for HTML elements. Class, ID, attribute, pseudo-class selectors with specificity control and multiple output formats.',
  description: 'Generate precise CSS selectors for targeting HTML elements. Support for classes, IDs, attributes, pseudo-classes, and complex combinators.',

  examples: [
    {
      title: 'Basic Element Selector',
      input: 'button',
      output: `button {
  /* Add your styles here */
}

button.active {
  /* Add your styles here */
}`,
      description: 'Generate selectors for HTML elements'
    },
    {
      title: 'Class-based Selectors',
      input: 'nav-item',
      output: `.nav-item {
  /* Add your styles here */
}

a.nav-item {
  /* Add your styles here */
}`,
      description: 'Create selectors targeting specific classes'
    },
    {
      title: 'Combined Selectors',
      input: 'Complex targeting',
      output: `.container p {
  /* Selects all p elements inside .container elements */
}

.nav > li {
  /* Selects li elements that are direct children of .nav */
}`,
      description: 'Generate complex combinatorial selectors'
    }
  ],

  useCases: [
    'Creating precise CSS selectors for styling specific elements',
    'Generating selectors for JavaScript DOM manipulation',
    'Building CSS rules with appropriate specificity levels',
    'Converting between CSS selectors and XPath expressions',
    'Learning CSS selector syntax and best practices',
    'Creating selectors for automated testing frameworks',
    'Targeting form elements with specific attributes',
    'Building responsive design selectors with pseudo-classes'
  ],

  faq: [
    {
      question: 'What is CSS selector specificity and why does it matter?',
      answer: 'Specificity determines which CSS rule applies when multiple rules target the same element. Higher specificity (IDs > classes > elements) overrides lower. Use appropriate specificity to avoid conflicts.'
    },
    {
      question: 'When should I use different selector types?',
      answer: 'Use IDs for unique elements, classes for reusable styles, attributes for form elements, and pseudo-classes for interactive states. Combine selectors for precise targeting.'
    },
    {
      question: 'How do CSS combinators work?',
      answer: 'Space (descendant), > (direct child), + (adjacent sibling), and ~ (general sibling) define relationships between elements. Each combinator targets different element relationships.'
    },
    {
      question: 'What\'s the difference between CSS selectors and XPath?',
      answer: 'CSS selectors are designed for styling and are simpler. XPath is more powerful for complex document navigation but primarily used in testing and XML processing.'
    },
    {
      question: 'How can I optimize selector performance?',
      answer: 'Keep selectors short, avoid universal selectors (*), use classes over complex attribute selectors, and prefer specific selectors over descendant selectors when possible.'
    }
  ],

  commonErrors: [
    'Invalid CSS selector syntax or characters',
    'Overly complex selectors causing performance issues',
    'Specificity conflicts preventing styles from applying',
    'Missing or incorrect combinator operators',
    'Malformed pseudo-class or pseudo-element syntax'
  ],

  relatedTools: ['html-validator', 'css-beautifier', 'dom-inspector', 'xpath-generator', 'css-minifier']
};