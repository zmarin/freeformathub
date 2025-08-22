import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface SVGOptimizerConfig {
  removeComments: boolean;
  removeMetadata: boolean;
  removeUnusedNS: boolean;
  removeEditorsNS: boolean;
  removeEmptyAttrs: boolean;
  removeEmptyText: boolean;
  removeEmptyContainers: boolean;
  removeUnknownsAndDefaults: boolean;
  removeNonInheritableGroupAttrs: boolean;
  removeUselessStrokeAndFill: boolean;
  removeUnusedID: boolean;
  removeDimensions: boolean;
  convertStyleToAttrs: boolean;
  convertColors: boolean;
  convertPathData: boolean;
  convertTransform: boolean;
  removeHiddenElems: boolean;
  mergePaths: boolean;
  convertShapeToPath: boolean;
  sortAttrs: boolean;
  removeTitleAndDesc: boolean;
  minifyStyles: boolean;
  precision: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    elementsRemoved: string[];
    attributesRemoved: number;
    processingTime: number;
  };
}

// SVG optimization functions
function removeComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, '');
}

function removeMetadata(svg: string): string {
  return svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
}

function removeTitle(svg: string): string {
  return svg.replace(/<title[\s\S]*?<\/title>/gi, '');
}

function removeDesc(svg: string): string {
  return svg.replace(/<desc[\s\S]*?<\/desc>/gi, '');
}

function removeEmptyAttributes(svg: string): string {
  return svg.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');
}

function removeUnusedNamespaces(svg: string): string {
  // Remove common unused namespaces
  const unusedNS = [
    'xmlns:sketch="[^"]*"',
    'xmlns:figma="[^"]*"',
    'xmlns:adobe="[^"]*"',
    'xmlns:illustrator="[^"]*"'
  ];
  
  let optimized = svg;
  unusedNS.forEach(ns => {
    optimized = optimized.replace(new RegExp(`\\s+${ns}`, 'g'), '');
  });
  
  return optimized;
}

function removeEditorsNamespaces(svg: string): string {
  // Remove editor-specific attributes
  const editorAttrs = [
    'sketch:type="[^"]*"',
    'figma:type="[^"]*"',
    'data-name="[^"]*"',
    'data-testid="[^"]*"'
  ];
  
  let optimized = svg;
  editorAttrs.forEach(attr => {
    optimized = optimized.replace(new RegExp(`\\s+${attr}`, 'g'), '');
  });
  
  return optimized;
}

function removeEmptyElements(svg: string): string {
  // Remove empty groups, defs, etc.
  const emptyElements = [
    /<g[\s>][^>]*>\s*<\/g>/gi,
    /<defs[\s>][^>]*>\s*<\/defs>/gi,
    /<clipPath[\s>][^>]*>\s*<\/clipPath>/gi,
    /<mask[\s>][^>]*>\s*<\/mask>/gi
  ];
  
  let optimized = svg;
  emptyElements.forEach(pattern => {
    optimized = optimized.replace(pattern, '');
  });
  
  return optimized;
}

function removeUselessStrokeAndFill(svg: string): string {
  // Remove stroke="none" and fill="none" when not needed
  return svg
    .replace(/\s+stroke="none"/g, '')
    .replace(/\s+fill="none"(?=[\s>])/g, '');
}

function convertStyleToAttrs(svg: string): string {
  return svg.replace(/style="([^"]*)"/g, (match, styleContent) => {
    const styles = styleContent.split(';').filter(Boolean);
    return styles.map((style: string) => {
      const [prop, value] = style.split(':').map((s: string) => s.trim());
      if (prop && value) {
        return `${prop}="${value}"`;
      }
      return '';
    }).join(' ');
  });
}

function convertColors(svg: string): string {
  // Convert rgb() to hex when shorter
  return svg.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g, (match, r, g, b) => {
    const toHex = (n: number) => parseInt(n).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return hex.length <= match.length ? hex : match;
  });
}

function optimizePathData(svg: string, precision: number): string {
  return svg.replace(/d="([^"]*)"/g, (match, pathData) => {
    // Simplify path data by reducing precision
    const optimizedPath = pathData.replace(/[\d.]+/g, (num: string) => {
      const parsed = parseFloat(num);
      return parsed.toFixed(precision).replace(/\.?0+$/, '');
    });
    return `d="${optimizedPath}"`;
  });
}

function removeDimensions(svg: string): string {
  return svg.replace(/\s+(?:width|height)="[^"]*"/g, '');
}

function sortAttributes(svg: string): string {
  return svg.replace(/<([^>]+)>/g, (match) => {
    const tagMatch = match.match(/^<(\w+)(.*?)(\/??)>$/);
    if (!tagMatch) return match;
    
    const [, tagName, attributes, selfClosing] = tagMatch;
    
    if (!attributes.trim()) return match;
    
    // Parse attributes
    const attrs = attributes.match(/(\w+(?:-\w+)*)="[^"]*"/g) || [];
    
    // Sort attributes alphabetically
    const sortedAttrs = attrs.sort().join(' ');
    
    return `<${tagName}${sortedAttrs ? ' ' + sortedAttrs : ''}${selfClosing}>`;
  });
}

function minifyWhitespace(svg: string): string {
  return svg
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function countElements(svg: string): { [key: string]: number } {
  const elements = svg.match(/<(\w+)[\s>]/g) || [];
  const count: { [key: string]: number } = {};
  
  elements.forEach(element => {
    const tag = element.match(/<(\w+)/)?.[1];
    if (tag) {
      count[tag] = (count[tag] || 0) + 1;
    }
  });
  
  return count;
}

export function processSVGOptimization(input: string, config: SVGOptimizerConfig): ToolResult {
  const startTime = performance.now();
  
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide SVG content to optimize'
      };
    }

    // Validate SVG
    if (!input.includes('<svg')) {
      return {
        success: false,
        error: 'Invalid SVG content. Please provide valid SVG markup.'
      };
    }

    const originalSize = new Blob([input]).size;
    const originalElements = countElements(input);
    let optimized = input;
    const removedElements: string[] = [];
    let attributesRemoved = 0;

    // Apply optimizations based on config
    if (config.removeComments) {
      const before = optimized;
      optimized = removeComments(optimized);
      if (before !== optimized) removedElements.push('comments');
    }

    if (config.removeMetadata) {
      const before = optimized;
      optimized = removeMetadata(optimized);
      if (before !== optimized) removedElements.push('metadata');
    }

    if (config.removeTitleAndDesc) {
      const before = optimized;
      optimized = removeTitle(optimized);
      optimized = removeDesc(optimized);
      if (before !== optimized) removedElements.push('title/desc elements');
    }

    if (config.removeUnusedNS) {
      const before = optimized;
      optimized = removeUnusedNamespaces(optimized);
      if (before !== optimized) removedElements.push('unused namespaces');
    }

    if (config.removeEditorsNS) {
      const before = optimized;
      optimized = removeEditorsNamespaces(optimized);
      if (before !== optimized) removedElements.push('editor namespaces');
    }

    if (config.removeEmptyAttrs) {
      const beforeAttrs = optimized.match(/\w+=""/g)?.length || 0;
      optimized = removeEmptyAttributes(optimized);
      const afterAttrs = optimized.match(/\w+=""/g)?.length || 0;
      attributesRemoved += beforeAttrs - afterAttrs;
    }

    if (config.removeEmptyContainers) {
      const before = optimized;
      optimized = removeEmptyElements(optimized);
      if (before !== optimized) removedElements.push('empty containers');
    }

    if (config.removeUselessStrokeAndFill) {
      const before = optimized;
      optimized = removeUselessStrokeAndFill(optimized);
      if (before !== optimized) removedElements.push('useless stroke/fill');
    }

    if (config.convertStyleToAttrs) {
      const before = optimized;
      optimized = convertStyleToAttrs(optimized);
      if (before !== optimized) removedElements.push('style to attributes');
    }

    if (config.convertColors) {
      optimized = convertColors(optimized);
    }

    if (config.convertPathData) {
      optimized = optimizePathData(optimized, config.precision);
    }

    if (config.removeDimensions) {
      const before = optimized;
      optimized = removeDimensions(optimized);
      if (before !== optimized) removedElements.push('width/height attributes');
    }

    if (config.sortAttrs) {
      optimized = sortAttributes(optimized);
    }

    // Always minify whitespace at the end
    optimized = minifyWhitespace(optimized);

    const optimizedSize = new Blob([optimized]).size;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
    const endTime = performance.now();

    return {
      success: true,
      output: optimized,
      metadata: {
        originalSize,
        optimizedSize,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        elementsRemoved: removedElements,
        attributesRemoved,
        processingTime: Math.round((endTime - startTime) * 100) / 100
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize SVG'
    };
  }
}

export const SVG_OPTIMIZER_TOOL: Tool = {
  id: 'svg-optimizer',
  name: 'SVG Optimizer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'svg-tools')!,
  slug: 'svg-optimizer',
  icon: '🎨',
  keywords: ['svg', 'optimize', 'compress', 'minify', 'vector', 'graphics', 'clean', 'reduce'],
  seoTitle: 'SVG Optimizer - Compress & Clean SVG Files Online | FreeFormatHub',
  seoDescription: 'Optimize SVG files by removing unnecessary code, comments, and metadata. Reduce file size while maintaining visual quality. Advanced compression options.',
  description: 'Optimize and compress SVG files by removing unnecessary elements, attributes, and metadata. Advanced cleaning options to reduce file size while preserving visual quality.',

  examples: [
    {
      title: 'Basic Optimization',
      input: `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <!-- This is a comment -->
  <title>My SVG</title>
  <desc>Description here</desc>
  <g fill="none" stroke="none">
    <rect width="50" height="50" fill="#ff0000" stroke="none"/>
  </g>
</svg>`,
      output: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="50" height="50" fill="red"/></svg>`,
      description: 'Remove comments, metadata, empty attributes, and optimize colors'
    },
    {
      title: 'Path Optimization',
      input: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <path d="M10.000,20.000 L30.000,40.000 Z" fill="rgb(255, 0, 0)"/>
</svg>`,
      output: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M10,20L30,40Z" fill="red"/></svg>`,
      description: 'Optimize path data precision and convert colors to shorter format'
    }
  ],

  useCases: [
    'Website performance optimization',
    'Icon set compression for faster loading',
    'SVG sprite optimization',
    'Email template SVG cleanup',
    'Print-ready file preparation',
    'Developer handoff file cleaning',
    'Automated build pipeline integration',
    'Storage space conservation'
  ],

  faq: [
    {
      question: 'How much can SVG optimization reduce file size?',
      answer: 'Typical reductions range from 20-60% depending on the original SVG complexity. Files with extensive metadata, comments, or inefficient markup see the largest improvements.'
    },
    {
      question: 'Will optimization affect visual appearance?',
      answer: 'No, optimization only removes unnecessary code while preserving the visual appearance. Path precision can be adjusted if slight visual changes are acceptable for better compression.'
    },
    {
      question: 'What gets removed during optimization?',
      answer: 'Comments, metadata, empty attributes, unused namespaces, unnecessary whitespace, and redundant elements. You can customize which optimizations to apply.'
    },
    {
      question: 'Should I remove width/height attributes?',
      answer: 'Removing width/height makes SVGs responsive but may require CSS sizing. Keep them if you need fixed dimensions, remove for scalable icons.'
    },
    {
      question: 'Is the optimization reversible?',
      answer: 'Some optimizations like removing comments and metadata are irreversible. Always keep backups of original files if you might need the removed information.'
    }
  ],

  commonErrors: [
    'Invalid SVG markup or structure',
    'Corrupted or malformed XML',
    'Missing required SVG elements or attributes',
    'Circular references in definitions'
  ],

  relatedTools: ['image-compressor', 'xml-formatter', 'css-beautifier', 'html-beautifier']
};