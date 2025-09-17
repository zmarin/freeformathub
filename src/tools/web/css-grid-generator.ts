import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface CSSGridGeneratorConfig {
  columns: number;
  rows: number;
  columnGap: number;
  rowGap: number;
  columnSizes: ('auto' | 'fr' | 'minmax' | 'fit-content' | 'custom')[];
  rowSizes: ('auto' | 'fr' | 'minmax' | 'fit-content' | 'custom')[];
  customColumnValues: string[];
  customRowValues: string[];
  gridTemplateAreas: string[][];
  useGridAreas: boolean;
  containerWidth: string;
  containerHeight: string;
  padding: number;
  justifyItems: 'start' | 'end' | 'center' | 'stretch';
  alignItems: 'start' | 'end' | 'center' | 'stretch';
  justifyContent: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  alignContent: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
  generateResponsive: boolean;
  breakpoints: {
    mobile: { columns: number; rows: number };
    tablet: { columns: number; rows: number };
    desktop: { columns: number; rows: number };
  };
  includeComments: boolean;
  outputFormat: 'css' | 'scss' | 'tailwind';
  useCSSSuffixes: boolean;
  gridItemPlacements: Array<{
    name: string;
    gridColumn: string;
    gridRow: string;
    justifySelf?: string;
    alignSelf?: string;
  }>;
}

interface CSSGridResult {
  css: string;
  html: string;
  gridVisualization: {
    columns: Array<{ size: string; track: number }>;
    rows: Array<{ size: string; track: number }>;
    areas: string[][];
    totalColumns: number;
    totalRows: number;
  };
  responsiveCSS?: string;
  tailwindClasses?: string[];
  gridStats: {
    totalCells: number;
    namedAreas: number;
    customItems: number;
    hasGaps: boolean;
    hasResponsive: boolean;
  };
}

function generateGridTrackSizes(
  sizes: ('auto' | 'fr' | 'minmax' | 'fit-content' | 'custom')[],
  customValues: string[]
): string {
  return sizes.map((size, index) => {
    switch (size) {
      case 'auto':
        return 'auto';
      case 'fr':
        return '1fr';
      case 'minmax':
        return 'minmax(min-content, 1fr)';
      case 'fit-content':
        return 'fit-content(200px)';
      case 'custom':
        return customValues[index] || '1fr';
      default:
        return '1fr';
    }
  }).join(' ');
}

function generateGridAreas(areas: string[][]): string {
  if (!areas.length) return '';
  
  return areas.map(row => 
    `"${row.join(' ')}"`
  ).join('\n    ');
}

function generateResponsiveCSS(
  config: CSSGridGeneratorConfig,
  baseCSS: string
): string {
  if (!config.generateResponsive) return '';
  
  const { mobile, tablet, desktop } = config.breakpoints;
  
  return `
/* Mobile First (up to 768px) */
@media (max-width: 767px) {
  .grid-container {
    grid-template-columns: ${generateGridTrackSizes(
      Array(mobile.columns).fill('fr'),
      config.customColumnValues
    )};
    grid-template-rows: ${generateGridTrackSizes(
      Array(mobile.rows).fill('auto'),
      config.customRowValues
    )};
  }
}

/* Tablet (768px to 1024px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid-container {
    grid-template-columns: ${generateGridTrackSizes(
      Array(tablet.columns).fill('fr'),
      config.customColumnValues
    )};
    grid-template-rows: ${generateGridTrackSizes(
      Array(tablet.rows).fill('auto'),
      config.customRowValues
    )};
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: ${generateGridTrackSizes(
      Array(desktop.columns).fill('fr'),
      config.customColumnValues
    )};
    grid-template-rows: ${generateGridTrackSizes(
      Array(desktop.rows).fill('auto'),
      config.customRowValues
    )};
  }
}`;
}

function generateTailwindClasses(config: CSSGridGeneratorConfig): string[] {
  const classes: string[] = [];
  
  // Grid display
  classes.push('grid');
  
  // Columns
  if (config.columns <= 12) {
    classes.push(`grid-cols-${config.columns}`);
  } else {
    classes.push(`grid-cols-[repeat(${config.columns},1fr)]`);
  }
  
  // Rows
  if (config.rows <= 6) {
    classes.push(`grid-rows-${config.rows}`);
  } else {
    classes.push(`grid-rows-[repeat(${config.rows},auto)]`);
  }
  
  // Gaps
  if (config.columnGap > 0 || config.rowGap > 0) {
    if (config.columnGap === config.rowGap) {
      classes.push(`gap-${config.columnGap}`);
    } else {
      classes.push(`gap-x-${config.columnGap}`, `gap-y-${config.rowGap}`);
    }
  }
  
  // Alignment
  if (config.justifyItems !== 'stretch') {
    classes.push(`justify-items-${config.justifyItems}`);
  }
  
  if (config.alignItems !== 'stretch') {
    classes.push(`items-${config.alignItems}`);
  }
  
  if (config.justifyContent !== 'start') {
    classes.push(`justify-${config.justifyContent}`);
  }
  
  if (config.alignContent !== 'start') {
    classes.push(`content-${config.alignContent}`);
  }
  
  return classes;
}

function generateSampleHTML(config: CSSGridGeneratorConfig): string {
  const totalItems = config.columns * config.rows;
  let html = '<div class="grid-container">\n';
  
  if (config.useGridAreas && config.gridTemplateAreas.length > 0) {
    // Generate items based on grid areas
    const uniqueAreas = new Set<string>();
    config.gridTemplateAreas.flat().forEach(area => {
      if (area !== '.' && !uniqueAreas.has(area)) {
        uniqueAreas.add(area);
      }
    });
    
    Array.from(uniqueAreas).forEach(area => {
      html += `  <div class="grid-item grid-${area}">\n    ${area}\n  </div>\n`;
    });
  } else if (config.gridItemPlacements.length > 0) {
    // Generate custom positioned items
    config.gridItemPlacements.forEach((item, index) => {
      html += `  <div class="grid-item ${item.name}">\n    ${item.name}\n  </div>\n`;
    });
  } else {
    // Generate default items
    for (let i = 1; i <= Math.min(totalItems, 12); i++) {
      html += `  <div class="grid-item item-${i}">\n    Item ${i}\n  </div>\n`;
    }
  }
  
  html += '</div>';
  return html;
}

export function processCSSGridGenerator(config: CSSGridGeneratorConfig): Promise<ToolResult<CSSGridResult | null>> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      if (config.columns < 1 || config.rows < 1) {
        resolve({
          data: null,
          error: 'Grid must have at least 1 column and 1 row',
          processing_time: 0
        });
        return;
      }
      
      if (config.columns > 20 || config.rows > 20) {
        resolve({
          data: null,
          error: 'Maximum 20 columns and 20 rows supported',
          processing_time: Date.now() - startTime
        });
        return;
      }
      
      // Generate column and row sizes
      const columnSizes = generateGridTrackSizes(config.columnSizes, config.customColumnValues);
      const rowSizes = generateGridTrackSizes(config.rowSizes, config.customRowValues);
      
      // Build the base CSS
      let css = config.includeComments ? '/* CSS Grid Container */\n' : '';
      
      css += '.grid-container {\n';
      css += '  display: grid;\n';
      css += `  grid-template-columns: ${columnSizes};\n`;
      css += `  grid-template-rows: ${rowSizes};\n`;
      
      if (config.columnGap > 0 || config.rowGap > 0) {
        if (config.columnGap === config.rowGap) {
          css += `  gap: ${config.columnGap}px;\n`;
        } else {
          css += `  column-gap: ${config.columnGap}px;\n`;
          css += `  row-gap: ${config.rowGap}px;\n`;
        }
      }
      
      if (config.useGridAreas && config.gridTemplateAreas.length > 0) {
        const areas = generateGridAreas(config.gridTemplateAreas);
        if (areas) {
          css += `  grid-template-areas:\n    ${areas};\n`;
        }
      }
      
      if (config.containerWidth !== 'auto') {
        css += `  width: ${config.containerWidth};\n`;
      }
      
      if (config.containerHeight !== 'auto') {
        css += `  height: ${config.containerHeight};\n`;
      }
      
      if (config.padding > 0) {
        css += `  padding: ${config.padding}px;\n`;
      }
      
      if (config.justifyItems !== 'stretch') {
        css += `  justify-items: ${config.justifyItems};\n`;
      }
      
      if (config.alignItems !== 'stretch') {
        css += `  align-items: ${config.alignItems};\n`;
      }
      
      if (config.justifyContent !== 'start') {
        css += `  justify-content: ${config.justifyContent};\n`;
      }
      
      if (config.alignContent !== 'start') {
        css += `  align-content: ${config.alignContent};\n`;
      }
      
      css += '}\n\n';
      
      // Add grid item styles
      if (config.includeComments) {
        css += '/* Grid Items */\n';
      }
      
      css += '.grid-item {\n';
      css += '  padding: 10px;\n';
      css += '  border: 1px solid #ddd;\n';
      css += '  background: #f9f9f9;\n';
      css += '  display: flex;\n';
      css += '  align-items: center;\n';
      css += '  justify-content: center;\n';
      css += '}\n\n';
      
      // Add grid area specific styles
      if (config.useGridAreas && config.gridTemplateAreas.length > 0) {
        const uniqueAreas = new Set<string>();
        config.gridTemplateAreas.flat().forEach(area => {
          if (area !== '.' && !uniqueAreas.has(area)) {
            uniqueAreas.add(area);
          }
        });
        
        Array.from(uniqueAreas).forEach(area => {
          css += `.grid-${area} {\n`;
          css += `  grid-area: ${area};\n`;
          css += '}\n\n';
        });
      }
      
      // Add custom item placements
      if (config.gridItemPlacements.length > 0) {
        config.gridItemPlacements.forEach(item => {
          css += `.${item.name} {\n`;
          css += `  grid-column: ${item.gridColumn};\n`;
          css += `  grid-row: ${item.gridRow};\n`;
          
          if (item.justifySelf) {
            css += `  justify-self: ${item.justifySelf};\n`;
          }
          
          if (item.alignSelf) {
            css += `  align-self: ${item.alignSelf};\n`;
          }
          
          css += '}\n\n';
        });
      }
      
      // Generate responsive CSS if enabled
      const responsiveCSS = generateResponsiveCSS(config, css);
      if (responsiveCSS) {
        css += responsiveCSS;
      }
      
      // Generate HTML
      const html = generateSampleHTML(config);
      
      // Generate Tailwind classes if needed
      const tailwindClasses = config.outputFormat === 'tailwind' 
        ? generateTailwindClasses(config) 
        : undefined;
      
      // Create grid visualization data
      const gridVisualization = {
        columns: config.columnSizes.map((size, index) => ({
          size: size === 'custom' ? config.customColumnValues[index] || '1fr' : size,
          track: index + 1
        })),
        rows: config.rowSizes.map((size, index) => ({
          size: size === 'custom' ? config.customRowValues[index] || 'auto' : size,
          track: index + 1
        })),
        areas: config.useGridAreas ? config.gridTemplateAreas : [],
        totalColumns: config.columns,
        totalRows: config.rows
      };
      
      // Calculate statistics
      const gridStats = {
        totalCells: config.columns * config.rows,
        namedAreas: config.useGridAreas ? 
          new Set(config.gridTemplateAreas.flat().filter(area => area !== '.')).size : 0,
        customItems: config.gridItemPlacements.length,
        hasGaps: config.columnGap > 0 || config.rowGap > 0,
        hasResponsive: config.generateResponsive
      };
      
      const result: CSSGridResult = {
        css,
        html,
        gridVisualization,
        responsiveCSS: responsiveCSS || undefined,
        tailwindClasses,
        gridStats
      };
      
      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          columns: config.columns,
          rows: config.rows,
          totalCells: gridStats.totalCells,
          outputFormat: config.outputFormat,
          hasAreas: config.useGridAreas,
          hasResponsive: config.generateResponsive,
          cssLength: css.length,
          htmlLength: html.length
        }
      });
      
    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate CSS Grid',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: '3x3 Basic Grid',
    description: 'Create a simple 3-column, 3-row grid layout with gaps',
    input: '3 columns × 3 rows, 20px gap',
    output: `.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 20px;
}

.grid-item {
  padding: 10px;
  border: 1px solid #ddd;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
}`
  },
  {
    title: 'Holy Grail Layout with Areas',
    description: 'Classic web layout using named grid areas',
    input: 'Header, sidebar, main, footer layout',
    output: `.grid-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100vh;
}

.grid-header { grid-area: header; }
.grid-sidebar { grid-area: sidebar; }
.grid-main { grid-area: main; }
.grid-footer { grid-area: footer; }`
  },
  {
    title: 'Responsive Product Grid',
    description: 'Responsive grid that adapts to screen sizes',
    input: 'Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols',
    output: `/* Mobile First */
@media (max-width: 767px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}`
  }
];

export const CSS_GRID_GENERATOR_TOOL: Tool = {
  id: 'css-grid-generator',
  name: 'CSS Grid Generator',
  description: 'Generate CSS Grid layouts with visual editor, responsive breakpoints, named areas, and custom positioning. Create complex grid systems with HTML and CSS code generation.',
  icon: '⚏',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'css-tools')!,
  tags: ['css', 'grid', 'layout', 'generator', 'responsive', 'web', 'design', 'frontend'],
  complexity: 'intermediate',
  examples,
  faqs: [
    {
      question: 'What\'s the difference between CSS Grid and Flexbox?',
      answer: 'CSS Grid is designed for two-dimensional layouts (rows and columns), while Flexbox is for one-dimensional layouts. Grid is perfect for complex page layouts, while Flexbox excels at component-level alignment and distribution.'
    },
    {
      question: 'How do I create responsive grid layouts?',
      answer: 'Enable responsive generation to automatically create media queries for mobile, tablet, and desktop. You can also use CSS functions like minmax(), auto-fit, and auto-fill for intrinsically responsive grids.'
    },
    {
      question: 'What are grid areas and when should I use them?',
      answer: 'Grid areas let you name sections of your grid layout (like "header", "sidebar", "main"). This makes your CSS more semantic and easier to modify. They\'re perfect for classic web layouts and dashboard designs.'
    },
    {
      question: 'How do fr units work in CSS Grid?',
      answer: 'The "fr" unit represents a fraction of available space. "1fr 2fr 1fr" creates three columns where the middle column takes twice as much space as the side columns. It\'s flexible and responsive by nature.'
    },
    {
      question: 'Can I mix different unit types in grid tracks?',
      answer: 'Yes! You can combine px, %, em, fr, auto, minmax(), and other units. For example: "200px 1fr auto" creates a fixed sidebar, flexible main area, and content-sized third column.'
    }
  ],
  relatedTools: ['css-flexbox-generator', 'responsive-design-tester', 'css-beautifier', 'layout-generator', 'css-grid-inspector']
};