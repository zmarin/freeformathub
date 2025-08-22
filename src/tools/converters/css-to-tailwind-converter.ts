import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface CssToTailwindConfig {
  preserveComments: boolean;
  useShorthandClasses: boolean;
  generateUtilityClasses: boolean;
  includeResponsiveVariants: boolean;
  includeHoverStates: boolean;
  includeFocusStates: boolean;
  includeActiveStates: boolean;
  useArbitraryValues: boolean;
  convertFlexbox: boolean;
  convertGrid: boolean;
  convertPositioning: boolean;
  convertSpacing: boolean;
  convertColors: boolean;
  convertTypography: boolean;
  convertBorders: boolean;
  convertBackgrounds: boolean;
  convertShadows: boolean;
  convertTransitions: boolean;
  generateComponentClasses: boolean;
  outputFormat: 'classes' | 'html' | 'react' | 'vue';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  conversion?: ConversionResult;
  warnings?: string[];
}

interface ConversionResult {
  originalCss: string;
  tailwindClasses: string[];
  htmlOutput?: string;
  componentOutput?: string;
  utilityClasses: string[];
  responsiveVariants: string[];
  interactiveStates: string[];
  arbitraryValues: string[];
  unconvertedRules: string[];
  conversionStats: ConversionStats;
}

interface ConversionStats {
  totalRules: number;
  convertedRules: number;
  unconvertedRules: number;
  generatedClasses: number;
  responsiveVariants: number;
  interactiveStates: number;
  conversionRate: number;
}

// CSS property to Tailwind class mappings
const CSS_TO_TAILWIND_MAP: Record<string, (value: string) => string[]> = {
  // Display
  'display': (value: string) => {
    const displayMap: Record<string, string> = {
      'block': 'block',
      'inline-block': 'inline-block',
      'inline': 'inline',
      'flex': 'flex',
      'inline-flex': 'inline-flex',
      'grid': 'grid',
      'inline-grid': 'inline-grid',
      'table': 'table',
      'table-caption': 'table-caption',
      'table-cell': 'table-cell',
      'table-column': 'table-column',
      'table-column-group': 'table-column-group',
      'table-footer-group': 'table-footer-group',
      'table-header-group': 'table-header-group',
      'table-row': 'table-row',
      'table-row-group': 'table-row-group',
      'flow-root': 'flow-root',
      'contents': 'contents',
      'hidden': 'hidden',
      'none': 'hidden',
    };
    return displayMap[value] ? [displayMap[value]] : [];
  },

  // Position
  'position': (value: string) => {
    const positionMap: Record<string, string> = {
      'static': 'static',
      'fixed': 'fixed',
      'absolute': 'absolute',
      'relative': 'relative',
      'sticky': 'sticky',
    };
    return positionMap[value] ? [positionMap[value]] : [];
  },

  // Top, Right, Bottom, Left
  'top': (value: string) => convertSpacing(value, 'top'),
  'right': (value: string) => convertSpacing(value, 'right'),
  'bottom': (value: string) => convertSpacing(value, 'bottom'),
  'left': (value: string) => convertSpacing(value, 'left'),

  // Width and Height
  'width': (value: string) => convertSize(value, 'w'),
  'height': (value: string) => convertSize(value, 'h'),
  'min-width': (value: string) => convertSize(value, 'min-w'),
  'min-height': (value: string) => convertSize(value, 'min-h'),
  'max-width': (value: string) => convertSize(value, 'max-w'),
  'max-height': (value: string) => convertSize(value, 'max-h'),

  // Margin and Padding
  'margin': (value: string) => convertSpacingShorthand(value, 'm'),
  'margin-top': (value: string) => convertSpacing(value, 'mt'),
  'margin-right': (value: string) => convertSpacing(value, 'mr'),
  'margin-bottom': (value: string) => convertSpacing(value, 'mb'),
  'margin-left': (value: string) => convertSpacing(value, 'ml'),
  'padding': (value: string) => convertSpacingShorthand(value, 'p'),
  'padding-top': (value: string) => convertSpacing(value, 'pt'),
  'padding-right': (value: string) => convertSpacing(value, 'pr'),
  'padding-bottom': (value: string) => convertSpacing(value, 'pb'),
  'padding-left': (value: string) => convertSpacing(value, 'pl'),

  // Flexbox
  'flex-direction': (value: string) => {
    const flexDirectionMap: Record<string, string> = {
      'row': 'flex-row',
      'row-reverse': 'flex-row-reverse',
      'column': 'flex-col',
      'column-reverse': 'flex-col-reverse',
    };
    return flexDirectionMap[value] ? [flexDirectionMap[value]] : [];
  },
  'flex-wrap': (value: string) => {
    const flexWrapMap: Record<string, string> = {
      'nowrap': 'flex-nowrap',
      'wrap': 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    };
    return flexWrapMap[value] ? [flexWrapMap[value]] : [];
  },
  'justify-content': (value: string) => {
    const justifyMap: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return justifyMap[value] ? [justifyMap[value]] : [];
  },
  'align-items': (value: string) => {
    const alignMap: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'baseline': 'items-baseline',
      'stretch': 'items-stretch',
    };
    return alignMap[value] ? [alignMap[value]] : [];
  },

  // Typography
  'font-size': (value: string) => convertFontSize(value),
  'font-weight': (value: string) => convertFontWeight(value),
  'font-family': (value: string) => convertFontFamily(value),
  'line-height': (value: string) => convertLineHeight(value),
  'text-align': (value: string) => {
    const textAlignMap: Record<string, string> = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right',
      'justify': 'text-justify',
    };
    return textAlignMap[value] ? [textAlignMap[value]] : [];
  },
  'text-decoration': (value: string) => {
    const textDecorationMap: Record<string, string> = {
      'underline': 'underline',
      'line-through': 'line-through',
      'none': 'no-underline',
    };
    return textDecorationMap[value] ? [textDecorationMap[value]] : [];
  },
  'text-transform': (value: string) => {
    const textTransformMap: Record<string, string> = {
      'uppercase': 'uppercase',
      'lowercase': 'lowercase',
      'capitalize': 'capitalize',
      'none': 'normal-case',
    };
    return textTransformMap[value] ? [textTransformMap[value]] : [];
  },

  // Colors
  'color': (value: string) => convertColor(value, 'text'),
  'background-color': (value: string) => convertColor(value, 'bg'),
  'border-color': (value: string) => convertColor(value, 'border'),

  // Borders
  'border': (value: string) => convertBorder(value),
  'border-width': (value: string) => convertBorderWidth(value),
  'border-style': (value: string) => {
    const borderStyleMap: Record<string, string> = {
      'solid': 'border-solid',
      'dashed': 'border-dashed',
      'dotted': 'border-dotted',
      'double': 'border-double',
      'none': 'border-none',
    };
    return borderStyleMap[value] ? [borderStyleMap[value]] : [];
  },
  'border-radius': (value: string) => convertBorderRadius(value),

  // Box Shadow
  'box-shadow': (value: string) => convertBoxShadow(value),

  // Opacity
  'opacity': (value: string) => {
    const opacity = parseFloat(value);
    if (opacity === 0) return ['opacity-0'];
    if (opacity === 0.05) return ['opacity-5'];
    if (opacity === 0.1) return ['opacity-10'];
    if (opacity === 0.2) return ['opacity-20'];
    if (opacity === 0.25) return ['opacity-25'];
    if (opacity === 0.3) return ['opacity-30'];
    if (opacity === 0.4) return ['opacity-40'];
    if (opacity === 0.5) return ['opacity-50'];
    if (opacity === 0.6) return ['opacity-60'];
    if (opacity === 0.7) return ['opacity-70'];
    if (opacity === 0.75) return ['opacity-75'];
    if (opacity === 0.8) return ['opacity-80'];
    if (opacity === 0.9) return ['opacity-90'];
    if (opacity === 0.95) return ['opacity-95'];
    if (opacity === 1) return ['opacity-100'];
    return [`opacity-[${Math.round(opacity * 100)}%]`];
  },

  // Overflow
  'overflow': (value: string) => {
    const overflowMap: Record<string, string> = {
      'visible': 'overflow-visible',
      'hidden': 'overflow-hidden',
      'scroll': 'overflow-scroll',
      'auto': 'overflow-auto',
    };
    return overflowMap[value] ? [overflowMap[value]] : [];
  },
  'overflow-x': (value: string) => {
    const overflowMap: Record<string, string> = {
      'visible': 'overflow-x-visible',
      'hidden': 'overflow-x-hidden',
      'scroll': 'overflow-x-scroll',
      'auto': 'overflow-x-auto',
    };
    return overflowMap[value] ? [overflowMap[value]] : [];
  },
  'overflow-y': (value: string) => {
    const overflowMap: Record<string, string> = {
      'visible': 'overflow-y-visible',
      'hidden': 'overflow-y-hidden',
      'scroll': 'overflow-y-scroll',
      'auto': 'overflow-y-auto',
    };
    return overflowMap[value] ? [overflowMap[value]] : [];
  },

  // Z-Index
  'z-index': (value: string) => {
    const zIndex = parseInt(value);
    const zIndexMap: Record<number, string> = {
      0: 'z-0',
      10: 'z-10',
      20: 'z-20',
      30: 'z-30',
      40: 'z-40',
      50: 'z-50',
      9999: 'z-50',
    };
    return zIndexMap[zIndex] ? [zIndexMap[zIndex]] : [`z-[${value}]`];
  },
};

// Helper functions for conversion
function convertSpacing(value: string, prefix: string): string[] {
  const spacingMap: Record<string, string> = {
    '0': '0',
    '1px': 'px',
    '2px': '0.5',
    '4px': '1',
    '6px': '1.5',
    '8px': '2',
    '10px': '2.5',
    '12px': '3',
    '14px': '3.5',
    '16px': '4',
    '20px': '5',
    '24px': '6',
    '28px': '7',
    '32px': '8',
    '36px': '9',
    '40px': '10',
    '44px': '11',
    '48px': '12',
    '56px': '14',
    '64px': '16',
    '80px': '20',
    '96px': '24',
    '112px': '28',
    '128px': '32',
    '144px': '36',
    '160px': '40',
    '176px': '44',
    '192px': '48',
    '208px': '52',
    '224px': '56',
    '240px': '60',
    '256px': '64',
    '288px': '72',
    '320px': '80',
    '384px': '96',
  };

  if (value === 'auto') return [`${prefix}-auto`];
  if (spacingMap[value]) return [`${prefix}-${spacingMap[value]}`];
  
  // Handle rem values
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) {
    const rem = parseFloat(remMatch[1]);
    const spacing = rem * 4; // Tailwind's base spacing is 0.25rem = 1 unit
    return [`${prefix}-${spacing}`];
  }

  // Handle percentage values
  if (value.endsWith('%')) {
    const percentage = value.slice(0, -1);
    const percentageMap: Record<string, string> = {
      '25': '1/4',
      '33.333333': '1/3',
      '50': '1/2',
      '66.666667': '2/3',
      '75': '3/4',
      '100': 'full',
    };
    if (percentageMap[percentage]) {
      return [`${prefix}-${percentageMap[percentage]}`];
    }
    return [`${prefix}-[${value}]`];
  }

  return [`${prefix}-[${value}]`];
}

function convertSpacingShorthand(value: string, prefix: string): string[] {
  const values = value.trim().split(/\s+/);
  const classes: string[] = [];

  if (values.length === 1) {
    // All sides
    classes.push(...convertSpacing(values[0], prefix));
  } else if (values.length === 2) {
    // Vertical | Horizontal
    classes.push(...convertSpacing(values[0], `${prefix}y`));
    classes.push(...convertSpacing(values[1], `${prefix}x`));
  } else if (values.length === 4) {
    // Top | Right | Bottom | Left
    classes.push(...convertSpacing(values[0], `${prefix}t`));
    classes.push(...convertSpacing(values[1], `${prefix}r`));
    classes.push(...convertSpacing(values[2], `${prefix}b`));
    classes.push(...convertSpacing(values[3], `${prefix}l`));
  }

  return classes;
}

function convertSize(value: string, prefix: string): string[] {
  const sizeMap: Record<string, string> = {
    'auto': 'auto',
    'max-content': 'max',
    'min-content': 'min',
    'fit-content': 'fit',
    '100%': 'full',
    '100vw': 'screen',
    '100vh': 'screen',
  };

  if (sizeMap[value]) return [`${prefix}-${sizeMap[value]}`];
  
  // Handle fractional values
  if (value.endsWith('%')) {
    const percentage = value.slice(0, -1);
    const fractionMap: Record<string, string> = {
      '8.333333': '1/12',
      '16.666667': '1/6',
      '20': '1/5',
      '25': '1/4',
      '33.333333': '1/3',
      '41.666667': '5/12',
      '50': '1/2',
      '58.333333': '7/12',
      '66.666667': '2/3',
      '75': '3/4',
      '83.333333': '5/6',
      '91.666667': '11/12',
      '100': 'full',
    };
    if (fractionMap[percentage]) {
      return [`${prefix}-${fractionMap[percentage]}`];
    }
  }

  // Check spacing map for pixel values
  return convertSpacing(value, prefix);
}

function convertFontSize(value: string): string[] {
  const fontSizeMap: Record<string, string> = {
    '12px': 'text-xs',
    '14px': 'text-sm',
    '16px': 'text-base',
    '18px': 'text-lg',
    '20px': 'text-xl',
    '24px': 'text-2xl',
    '30px': 'text-3xl',
    '36px': 'text-4xl',
    '48px': 'text-5xl',
    '60px': 'text-6xl',
    '72px': 'text-7xl',
    '96px': 'text-8xl',
    '128px': 'text-9xl',
  };

  return fontSizeMap[value] ? [fontSizeMap[value]] : [`text-[${value}]`];
}

function convertFontWeight(value: string): string[] {
  const fontWeightMap: Record<string, string> = {
    '100': 'font-thin',
    '200': 'font-extralight',
    '300': 'font-light',
    '400': 'font-normal',
    '500': 'font-medium',
    '600': 'font-semibold',
    '700': 'font-bold',
    '800': 'font-extrabold',
    '900': 'font-black',
    'thin': 'font-thin',
    'extralight': 'font-extralight',
    'light': 'font-light',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
    'extrabold': 'font-extrabold',
    'black': 'font-black',
  };

  return fontWeightMap[value] ? [fontWeightMap[value]] : [`font-[${value}]`];
}

function convertFontFamily(value: string): string[] {
  // Normalize font family value
  const normalized = value.toLowerCase().replace(/['"]/g, '');
  
  if (normalized.includes('sans-serif') || 
      normalized.includes('arial') || 
      normalized.includes('helvetica')) {
    return ['font-sans'];
  }
  if (normalized.includes('serif') || 
      normalized.includes('times') || 
      normalized.includes('georgia')) {
    return ['font-serif'];
  }
  if (normalized.includes('monospace') || 
      normalized.includes('courier') || 
      normalized.includes('monaco') || 
      normalized.includes('consolas')) {
    return ['font-mono'];
  }

  return [`font-[${value}]`];
}

function convertLineHeight(value: string): string[] {
  const lineHeightMap: Record<string, string> = {
    '1': 'leading-none',
    '1.25': 'leading-tight',
    '1.375': 'leading-snug',
    '1.5': 'leading-normal',
    '1.625': 'leading-relaxed',
    '2': 'leading-loose',
    'normal': 'leading-normal',
    'none': 'leading-none',
  };

  return lineHeightMap[value] ? [lineHeightMap[value]] : [`leading-[${value}]`];
}

function convertColor(value: string, prefix: string): string[] {
  // Handle named colors
  const namedColors: Record<string, string> = {
    'transparent': 'transparent',
    'black': 'black',
    'white': 'white',
    'red': 'red-500',
    'green': 'green-500',
    'blue': 'blue-500',
    'yellow': 'yellow-500',
    'orange': 'orange-500',
    'purple': 'purple-500',
    'pink': 'pink-500',
    'gray': 'gray-500',
    'grey': 'gray-500',
  };

  if (namedColors[value]) {
    return [`${prefix}-${namedColors[value]}`];
  }

  // Handle hex colors
  if (value.startsWith('#')) {
    // Try to match common Tailwind colors
    const commonHexColors: Record<string, string> = {
      '#000000': 'black',
      '#ffffff': 'white',
      '#f3f4f6': 'gray-100',
      '#e5e7eb': 'gray-200',
      '#d1d5db': 'gray-300',
      '#9ca3af': 'gray-400',
      '#6b7280': 'gray-500',
      '#374151': 'gray-700',
      '#1f2937': 'gray-800',
      '#111827': 'gray-900',
    };

    if (commonHexColors[value.toLowerCase()]) {
      return [`${prefix}-${commonHexColors[value.toLowerCase()]}`];
    }
  }

  // Handle rgb/rgba values
  if (value.startsWith('rgb')) {
    return [`${prefix}-[${value}]`];
  }

  return [`${prefix}-[${value}]`];
}

function convertBorder(value: string): string[] {
  const parts = value.trim().split(/\s+/);
  const classes: string[] = [];

  // Handle shorthand border: width style color
  if (parts.length >= 1) {
    const width = parts[0];
    if (width !== '0' && width !== 'none') {
      classes.push(...convertBorderWidth(width));
    }
  }

  if (parts.length >= 2) {
    const style = parts[1];
    classes.push(...CSS_TO_TAILWIND_MAP['border-style'](style));
  }

  if (parts.length >= 3) {
    const color = parts.slice(2).join(' ');
    classes.push(...convertColor(color, 'border'));
  }

  return classes.length > 0 ? classes : ['border'];
}

function convertBorderWidth(value: string): string[] {
  const borderWidthMap: Record<string, string> = {
    '0': 'border-0',
    '1px': 'border',
    '2px': 'border-2',
    '4px': 'border-4',
    '8px': 'border-8',
    'thin': 'border',
    'medium': 'border-2',
    'thick': 'border-4',
  };

  return borderWidthMap[value] ? [borderWidthMap[value]] : [`border-[${value}]`];
}

function convertBorderRadius(value: string): string[] {
  const borderRadiusMap: Record<string, string> = {
    '0': 'rounded-none',
    '2px': 'rounded-sm',
    '4px': 'rounded',
    '6px': 'rounded-md',
    '8px': 'rounded-lg',
    '12px': 'rounded-xl',
    '16px': 'rounded-2xl',
    '24px': 'rounded-3xl',
    '50%': 'rounded-full',
    '9999px': 'rounded-full',
  };

  return borderRadiusMap[value] ? [borderRadiusMap[value]] : [`rounded-[${value}]`];
}

function convertBoxShadow(value: string): string[] {
  const shadowMap: Record<string, string> = {
    'none': 'shadow-none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)': 'shadow-sm',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)': 'shadow',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)': 'shadow-md',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)': 'shadow-lg',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)': 'shadow-xl',
    '0 35px 60px -12px rgba(0, 0, 0, 0.3)': 'shadow-2xl',
    'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)': 'shadow-inner',
  };

  return shadowMap[value] ? [shadowMap[value]] : [`shadow-[${value}]`];
}

function parseCssRule(rule: string): { selector: string; declarations: Array<{ property: string; value: string }> } | null {
  const match = rule.match(/([^{]+)\s*\{\s*([^}]*)\s*\}/);
  if (!match) return null;

  const selector = match[1].trim();
  const declarationsText = match[2].trim();

  const declarations = declarationsText
    .split(';')
    .map(decl => decl.trim())
    .filter(decl => decl)
    .map(decl => {
      const colonIndex = decl.indexOf(':');
      if (colonIndex === -1) return null;
      
      const property = decl.substring(0, colonIndex).trim();
      const value = decl.substring(colonIndex + 1).trim();
      return { property, value };
    })
    .filter(Boolean) as Array<{ property: string; value: string }>;

  return { selector, declarations };
}

function convertCssRuleToTailwind(rule: { selector: string; declarations: Array<{ property: string; value: string }> }, config: CssToTailwindConfig): string[] {
  const classes: string[] = [];

  for (const { property, value } of rule.declarations) {
    if (CSS_TO_TAILWIND_MAP[property]) {
      const convertedClasses = CSS_TO_TAILWIND_MAP[property](value);
      classes.push(...convertedClasses);
    }
  }

  return classes;
}

function generateResponsiveVariants(classes: string[], config: CssToTailwindConfig): string[] {
  if (!config.includeResponsiveVariants) return [];

  const responsiveClasses: string[] = [];
  const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];

  breakpoints.forEach(breakpoint => {
    classes.forEach(cls => {
      if (!cls.startsWith(breakpoint)) {
        responsiveClasses.push(`${breakpoint}${cls}`);
      }
    });
  });

  return responsiveClasses;
}

function generateInteractiveStates(classes: string[], config: CssToTailwindConfig): string[] {
  const interactiveClasses: string[] = [];

  if (config.includeHoverStates) {
    classes.forEach(cls => {
      interactiveClasses.push(`hover:${cls}`);
    });
  }

  if (config.includeFocusStates) {
    classes.forEach(cls => {
      interactiveClasses.push(`focus:${cls}`);
    });
  }

  if (config.includeActiveStates) {
    classes.forEach(cls => {
      interactiveClasses.push(`active:${cls}`);
    });
  }

  return interactiveClasses;
}

function generateOutputFormat(classes: string[], config: CssToTailwindConfig, originalSelector?: string): string {
  const classString = classes.join(' ');

  switch (config.outputFormat) {
    case 'html':
      return `<div class="${classString}">Content</div>`;
    
    case 'react':
      return `<div className="${classString}">Content</div>`;
    
    case 'vue':
      return `<div class="${classString}">Content</div>`;
    
    case 'classes':
    default:
      return classString;
  }
}

export function processCssToTailwindConverter(input: string, config: CssToTailwindConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'CSS input is required'
      };
    }

    const warnings: string[] = [];
    const originalCss = input.trim();
    
    // Remove comments if not preserving them
    let processedCss = originalCss;
    if (!config.preserveComments) {
      processedCss = processedCss.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Parse CSS rules
    const rules = processedCss.match(/[^{}]+\{[^{}]*\}/g) || [];
    const parsedRules = rules.map(rule => parseCssRule(rule)).filter(Boolean);

    const allTailwindClasses: string[] = [];
    const unconvertedRules: string[] = [];
    const utilityClasses: string[] = [];
    let convertedRulesCount = 0;

    // Convert each CSS rule
    for (const rule of parsedRules) {
      if (!rule) continue;

      const convertedClasses = convertCssRuleToTailwind(rule, config);
      
      if (convertedClasses.length > 0) {
        allTailwindClasses.push(...convertedClasses);
        utilityClasses.push(...convertedClasses);
        convertedRulesCount++;
      } else {
        unconvertedRules.push(`${rule.selector} { ${rule.declarations.map(d => `${d.property}: ${d.value}`).join('; ')} }`);
      }
    }

    // Remove duplicates
    const uniqueClasses = Array.from(new Set(allTailwindClasses));

    // Generate responsive variants
    const responsiveVariants = config.includeResponsiveVariants 
      ? generateResponsiveVariants(uniqueClasses, config) 
      : [];

    // Generate interactive states
    const interactiveStates = [
      ...(config.includeHoverStates ? generateInteractiveStates(uniqueClasses, config).filter(c => c.startsWith('hover:')) : []),
      ...(config.includeFocusStates ? generateInteractiveStates(uniqueClasses, config).filter(c => c.startsWith('focus:')) : []),
      ...(config.includeActiveStates ? generateInteractiveStates(uniqueClasses, config).filter(c => c.startsWith('active:')) : []),
    ];

    // Find arbitrary values
    const arbitraryValues = uniqueClasses.filter(cls => cls.includes('[') && cls.includes(']'));

    // Generate output based on format
    const htmlOutput = config.outputFormat !== 'classes' 
      ? generateOutputFormat(uniqueClasses, config) 
      : undefined;

    // Create conversion result
    const conversion: ConversionResult = {
      originalCss,
      tailwindClasses: uniqueClasses,
      htmlOutput,
      componentOutput: htmlOutput,
      utilityClasses,
      responsiveVariants,
      interactiveStates,
      arbitraryValues,
      unconvertedRules,
      conversionStats: {
        totalRules: parsedRules.length,
        convertedRules: convertedRulesCount,
        unconvertedRules: unconvertedRules.length,
        generatedClasses: uniqueClasses.length,
        responsiveVariants: responsiveVariants.length,
        interactiveStates: interactiveStates.length,
        conversionRate: parsedRules.length > 0 ? Math.round((convertedRulesCount / parsedRules.length) * 100) : 0,
      }
    };

    // Generate output
    let output = `CSS to Tailwind Conversion Result\n`;
    output += `${'='.repeat(40)}\n\n`;
    
    output += `Conversion Statistics:\n`;
    output += `• Total CSS Rules: ${conversion.conversionStats.totalRules}\n`;
    output += `• Converted Rules: ${conversion.conversionStats.convertedRules}\n`;
    output += `• Conversion Rate: ${conversion.conversionStats.conversionRate}%\n`;
    output += `• Generated Classes: ${conversion.conversionStats.generatedClasses}\n\n`;

    if (uniqueClasses.length > 0) {
      output += `Tailwind Classes:\n`;
      output += `${uniqueClasses.join(' ')}\n\n`;

      if (config.outputFormat !== 'classes' && htmlOutput) {
        output += `${config.outputFormat.toUpperCase()} Output:\n`;
        output += `${htmlOutput}\n\n`;
      }
    }

    if (responsiveVariants.length > 0) {
      output += `Responsive Variants (Examples):\n`;
      output += `${responsiveVariants.slice(0, 10).join(' ')}\n`;
      if (responsiveVariants.length > 10) {
        output += `... and ${responsiveVariants.length - 10} more\n`;
      }
      output += `\n`;
    }

    if (interactiveStates.length > 0) {
      output += `Interactive States (Examples):\n`;
      output += `${interactiveStates.slice(0, 10).join(' ')}\n`;
      if (interactiveStates.length > 10) {
        output += `... and ${interactiveStates.length - 10} more\n`;
      }
      output += `\n`;
    }

    if (arbitraryValues.length > 0) {
      output += `Arbitrary Values:\n`;
      arbitraryValues.forEach(cls => {
        output += `• ${cls}\n`;
      });
      output += `\n`;
    }

    if (unconvertedRules.length > 0) {
      output += `Unconverted CSS Rules:\n`;
      unconvertedRules.forEach(rule => {
        output += `• ${rule}\n`;
      });
      warnings.push(`${unconvertedRules.length} CSS rules could not be converted`);
    }

    // Add warnings
    if (conversion.conversionStats.conversionRate < 100) {
      warnings.push(`${100 - conversion.conversionStats.conversionRate}% of CSS rules were not converted`);
    }

    if (arbitraryValues.length > 0) {
      warnings.push('Some values use arbitrary syntax - consider adding them to your Tailwind config');
    }

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

export const CSS_TO_TAILWIND_CONVERTER_TOOL: Tool = {
  id: 'css-to-tailwind-converter',
  name: 'CSS to Tailwind Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'code-development')!,
  slug: 'css-to-tailwind-converter',
  icon: '🎨',
  keywords: ['css', 'tailwind', 'convert', 'utility', 'classes', 'styling', 'framework', 'transform'],
  seoTitle: 'CSS to Tailwind Converter - Transform CSS to Utility Classes | FreeFormatHub',
  seoDescription: 'Convert CSS styles to Tailwind CSS utility classes with responsive variants, interactive states, and component generation.',
  description: 'Convert traditional CSS styles to Tailwind CSS utility classes with support for responsive variants, interactive states, and multiple output formats.',

  examples: [
    {
      title: 'Basic CSS Properties',
      input: `.card {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}`,
      output: `Tailwind Classes:
bg-white p-4 rounded-lg shadow

React Output:
<div className="bg-white p-4 rounded-lg shadow">Content</div>`,
      description: 'Convert basic CSS properties to Tailwind classes'
    },
    {
      title: 'Flexbox Layout',
      input: `.flex-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
}`,
      output: `Tailwind Classes:
flex justify-center items-center flex-col gap-4`,
      description: 'Convert flexbox layout properties'
    },
    {
      title: 'Responsive Design',
      input: `.responsive-text {
  font-size: 16px;
  color: #374151;
  text-align: center;
}`,
      output: `Tailwind Classes:
text-base text-gray-700 text-center

Responsive Variants:
sm:text-base md:text-base lg:text-base`,
      description: 'Generate responsive variants for converted classes'
    }
  ],

  useCases: [
    'Converting existing CSS stylesheets to Tailwind CSS',
    'Migrating from traditional CSS to utility-first approach',
    'Learning Tailwind CSS equivalents for CSS properties',
    'Generating utility classes for design systems',
    'Creating component libraries with Tailwind classes',
    'Optimizing CSS bundle size with utility classes',
    'Rapid prototyping with utility-first CSS',
    'Educational purposes for CSS-to-utility transformation'
  ],

  faq: [
    {
      question: 'How accurate is the CSS to Tailwind conversion?',
      answer: 'The converter handles most common CSS properties and provides high accuracy for standard styling. Complex CSS features may require manual adjustment or use arbitrary values.'
    },
    {
      question: 'Can it handle responsive CSS and media queries?',
      answer: 'The tool can generate responsive variants for converted classes, but complex media query logic may need manual conversion to Tailwind\'s responsive prefixes.'
    },
    {
      question: 'What happens to CSS properties that don\'t have Tailwind equivalents?',
      answer: 'Unsupported properties are listed as unconverted rules and can be implemented using Tailwind\'s arbitrary value syntax or custom CSS.'
    },
    {
      question: 'Does it support CSS custom properties and variables?',
      answer: 'CSS custom properties are converted using arbitrary values. Consider adding frequently used values to your Tailwind configuration for better optimization.'
    },
    {
      question: 'Can I customize the output format?',
      answer: 'Yes, you can choose between plain classes, HTML, React (className), or Vue template formats to match your development workflow.'
    }
  ],

  commonErrors: [
    'Complex CSS selectors that don\'t map to utility classes',
    'CSS features not supported by Tailwind CSS',
    'Vendor-specific properties and experimental CSS',
    'Complex animations and keyframes',
    'CSS-in-JS syntax mixed with regular CSS'
  ],

  relatedTools: ['css-minifier', 'css-beautifier', 'css-validator', 'scss-to-css', 'css-analyzer']
};