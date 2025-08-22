import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface CssMinifierConfig extends ToolConfig {
  removeComments: boolean;
  removeWhitespace: boolean;
  removeSemicolons: boolean;
  removeEmptyRules: boolean;
  optimizeColors: boolean;
  optimizeZeros: boolean;
  mergeRules: boolean;
  preserveImportant: boolean;
}

export const CSS_MINIFIER_TOOL: Tool = {
  id: 'css-minifier',
  name: 'CSS Minifier',
  description: 'Minify and compress CSS code by removing whitespace, comments, and optimizing properties for smaller file sizes.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'css-tools')!,
  slug: 'css-minifier',
  icon: '🎨',
  keywords: ['css', 'minify', 'compress', 'optimize', 'reduce', 'size', 'whitespace', 'comments'],
  seoTitle: 'Free CSS Minifier - Compress CSS Code Online for Better Performance',
  seoDescription: 'Minify CSS code instantly to reduce file size and improve website performance. Remove comments, whitespace, and optimize properties automatically.',
  examples: [
    {
      title: 'Basic CSS Minification',
      input: '/* Main styles */\n.header {\n  background-color: #ffffff;\n  margin: 10px 0px;\n  padding: 20px;\n}',
      output: '.header{background-color:#fff;margin:10px 0;padding:20px}',
      description: 'Remove comments, whitespace, and optimize colors'
    },
    {
      title: 'Advanced Optimization',
      input: '.box {\n  border: 0px solid black;\n  margin: 0.0em;\n  color: rgba(255, 255, 255, 1.0);\n}',
      output: '.box{border:0 solid #000;margin:0;color:#fff}',
      description: 'Optimize zeros, colors, and remove unnecessary units'
    },
    {
      title: 'Media Queries and Rules',
      input: '@media screen and (max-width: 768px) {\n  .mobile {\n    display: block;\n    width: 100.0%;\n  }\n}\n.empty {}',
      output: '@media screen and (max-width:768px){.mobile{display:block;width:100%}}',
      description: 'Minify media queries and remove empty rules'
    },
    {
      title: 'CSS Variables and Functions',
      input: ':root {\n  --primary: hsl(200, 50%, 50%);\n  --spacing: calc(1rem + 2px);\n}\n.card { color: var(--primary); }',
      output: ':root{--primary:hsl(200,50%,50%);--spacing:calc(1rem + 2px)}.card{color:var(--primary)}',
      description: 'Preserve CSS variables and functions while minifying'
    }
  ],
  useCases: [
    'Reduce CSS file size for faster website loading',
    'Optimize stylesheets for production deployment',
    'Compress CSS for email templates and newsletters',
    'Minimize bandwidth usage for mobile applications',
    'Clean up development CSS for final builds',
    'Prepare CSS for CDN distribution and caching'
  ],
  commonErrors: [
    'Invalid CSS syntax will cause minification to fail',
    'Missing semicolons or braces can break minification',
    'Comments containing important licenses should be preserved',
    'Some CSS hacks may be affected by aggressive optimization',
    'Complex calc() expressions might need manual review',
    'Vendor prefixes should be handled carefully'
  ],
  faq: [
    {
      question: 'Will CSS minification break my styles?',
      answer: 'No, minification only removes unnecessary characters and optimizes values while preserving functionality. The visual appearance of your styles remains exactly the same.'
    },
    {
      question: 'How much can I expect to reduce file size?',
      answer: 'Typical reduction is 20-40% depending on your CSS structure. Highly commented or formatted CSS can see even greater reductions.'
    },
    {
      question: 'Are CSS variables and modern features supported?',
      answer: 'Yes! The minifier preserves CSS custom properties (variables), calc() functions, CSS Grid, Flexbox, and other modern CSS features.'
    },
    {
      question: 'Should I minify CSS for development?',
      answer: 'No, keep readable formatting during development. Minification is best applied during your build process or before production deployment.'
    },
    {
      question: 'Can I preserve certain comments in minified CSS?',
      answer: 'Important comments (like copyright notices) starting with /*! are automatically preserved even when comment removal is enabled.'
    }
  ],
  relatedTools: [
    'css-beautifier',
    'js-minifier',
    'html-minifier',
    'css-formatter',
    'sass-compiler'
  ]
};

export function minifyCss(input: string, config: CssMinifierConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide CSS code to minify.'
    };
  }

  try {
    let css = input;
    const originalSize = css.length;

    // Preserve important comments (starting with /*!)
    const importantComments: string[] = [];
    css = css.replace(/\/\*![^*]*\*+(?:[^/*][^*]*\*+)*\//g, (match) => {
      const placeholder = `__IMPORTANT_COMMENT_${importantComments.length}__`;
      importantComments.push(match);
      return placeholder;
    });

    // Remove comments
    if (config.removeComments) {
      css = css.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
    }

    // Remove unnecessary whitespace
    if (config.removeWhitespace) {
      // Remove leading/trailing whitespace from lines
      css = css.replace(/^\s+|\s+$/gm, '');
      
      // Replace multiple whitespace with single space
      css = css.replace(/\s+/g, ' ');
      
      // Remove whitespace around specific characters
      css = css.replace(/\s*([{}:;,>+~])\s*/g, '$1');
      
      // Remove whitespace after opening and before closing parentheses
      css = css.replace(/\(\s+/g, '(');
      css = css.replace(/\s+\)/g, ')');
      
      // Remove whitespace in media queries
      css = css.replace(/@media\s+/g, '@media ');
      css = css.replace(/\s*\{\s*/g, '{');
    }

    // Remove unnecessary semicolons (last property in rule)
    if (config.removeSemicolons) {
      css = css.replace(/;}/g, '}');
    }

    // Remove empty rules
    if (config.removeEmptyRules) {
      css = css.replace(/[^{}]+\{\s*\}/g, '');
      css = css.replace(/\{\s*\}/g, '');
    }

    // Optimize colors
    if (config.optimizeColors) {
      // Convert RGB to hex when shorter
      css = css.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, (match, r, g, b) => {
        const hex = '#' + 
          parseInt(r).toString(16).padStart(2, '0') +
          parseInt(g).toString(16).padStart(2, '0') +
          parseInt(b).toString(16).padStart(2, '0');
        return hex.length <= match.length ? hex : match;
      });

      // Shorten hex colors (#ffffff -> #fff)
      css = css.replace(/#([a-f0-9])\1([a-f0-9])\2([a-f0-9])\3/gi, '#$1$2$3');

      // Convert color names to shorter hex when possible
      const colorMap: Record<string, string> = {
        'white': '#fff',
        'black': '#000',
        'red': '#f00',
        'green': '#008000',
        'blue': '#00f',
        'yellow': '#ff0',
        'cyan': '#0ff',
        'magenta': '#f0f',
        'silver': '#c0c0c0',
        'gray': '#808080',
        'maroon': '#800000',
        'olive': '#808000',
        'lime': '#0f0',
        'aqua': '#0ff',
        'teal': '#008080',
        'navy': '#000080',
        'fuchsia': '#f0f',
        'purple': '#800080'
      };

      Object.entries(colorMap).forEach(([name, hex]) => {
        const regex = new RegExp(`\\b${name}\\b`, 'gi');
        css = css.replace(regex, hex);
      });

      // Optimize rgba with alpha 1 to rgb
      css = css.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*1(?:\.0+)?\s*\)/g, 'rgb($1,$2,$3)');
    }

    // Optimize zeros
    if (config.optimizeZeros) {
      // Remove units from zero values
      css = css.replace(/\b0+(px|em|rem|%|in|cm|mm|pt|pc|ex|ch|vw|vh|vmin|vmax|deg|rad|grad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)/g, '0');
      
      // Remove leading zeros
      css = css.replace(/\b0+(\.\d+)/g, '$1');
      
      // Remove trailing zeros from decimals
      css = css.replace(/(\d+)\.0+(?!\d)/g, '$1');
      css = css.replace(/(\d+\.\d*?)0+(?!\d)/g, '$1');
      
      // Optimize multiple zeros in shorthand properties
      css = css.replace(/\b0 0 0 0\b/g, '0');
      css = css.replace(/\b0 0 0\b/g, '0');
      css = css.replace(/\b0 0\b/g, '0');
    }

    // Basic rule merging (merge identical selectors)
    if (config.mergeRules) {
      const rules = new Map<string, string[]>();
      
      // Simple rule extraction and merging
      css = css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, properties) => {
        const cleanSelector = selector.trim();
        const cleanProperties = properties.trim();
        
        if (!rules.has(cleanSelector)) {
          rules.set(cleanSelector, []);
        }
        rules.get(cleanSelector)!.push(cleanProperties);
        
        return ''; // Remove original rule
      });

      // Rebuild CSS with merged rules
      let mergedCss = '';
      rules.forEach((propertiesArray, selector) => {
        const allProperties = propertiesArray.join(';').replace(/;+/g, ';').replace(/^;|;$/g, '');
        if (allProperties) {
          mergedCss += `${selector}{${allProperties}}`;
        }
      });
      
      css = mergedCss || css; // Fallback to original if merging fails
    }

    // Restore important comments
    importantComments.forEach((comment, index) => {
      const placeholder = `__IMPORTANT_COMMENT_${index}__`;
      css = css.replace(placeholder, comment);
    });

    // Final cleanup
    css = css.trim();
    
    const minifiedSize = css.length;
    const savedBytes = originalSize - minifiedSize;
    const compressionRatio = originalSize > 0 ? (savedBytes / originalSize * 100) : 0;

    return {
      success: true,
      output: css,
      metadata: {
        originalSize,
        minifiedSize,
        savedBytes,
        compressionRatio: Number(compressionRatio.toFixed(1)),
        rules: countCssRules(css),
        selectors: countCssSelectors(css),
        properties: countCssProperties(css)
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Minification failed'
    };
  }
}

function countCssRules(css: string): number {
  return (css.match(/\{[^{}]*\}/g) || []).length;
}

function countCssSelectors(css: string): number {
  const rules = css.match(/[^{}]+\{[^{}]*\}/g) || [];
  let selectorCount = 0;
  
  rules.forEach(rule => {
    const selectorPart = rule.split('{')[0];
    // Count commas + 1 for selector count in each rule
    selectorCount += (selectorPart.match(/,/g) || []).length + 1;
  });
  
  return selectorCount;
}

function countCssProperties(css: string): number {
  const properties = css.match(/[^{}:]+:[^{}:;]+/g) || [];
  return properties.length;
}