import * as sass from 'sass';
import * as Babel from '@babel/standalone';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

export interface CompilationResult {
  code: string;
  sourceMap?: string;
  warnings: string[];
  errors: string[];
  processingTime: number;
}

export interface CompilationOptions {
  sourceMap?: boolean;
  minify?: boolean;
  target?: 'es5' | 'es2015' | 'es2017' | 'es2018' | 'es2020';
  jsxPragma?: string;
  includePolyfills?: boolean;
}

// SCSS/Sass Compiler
export class SassCompiler {
  static async compile(
    source: string,
    options: CompilationOptions = {}
  ): Promise<CompilationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const result = sass.compileString(source, {
        style: options.minify ? 'compressed' : 'expanded',
        sourceMap: options.sourceMap,
        alertColor: true,
        quietDeps: true,
        logger: {
          warn: (message) => warnings.push(message),
          debug: () => {} // Suppress debug messages
        }
      });

      // Add autoprefixer
      let processedCss = result.css;
      if (typeof window !== 'undefined') {
        try {
          const processor = postcss([
            autoprefixer({
              overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead']
            })
          ]);
          const autoprefixedResult = await processor.process(processedCss, {
            from: undefined
          });
          processedCss = autoprefixedResult.css;
        } catch (autoprefixerError) {
          warnings.push(`Autoprefixer warning: ${autoprefixerError}`);
        }
      }

      return {
        code: processedCss,
        sourceMap: result.sourceMap ? JSON.stringify(result.sourceMap) : undefined,
        warnings,
        errors,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        code: source, // Return original on error
        warnings,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: performance.now() - startTime
      };
    }
  }

  static validateSass(source: string): { isValid: boolean; errors: string[] } {
    try {
      sass.compileString(source, { style: 'compressed' });
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

// TypeScript/JavaScript Compiler
export class JavaScriptCompiler {
  static async compile(
    source: string,
    options: CompilationOptions = {}
  ): Promise<CompilationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Configure Babel presets and plugins
      const presets = [];
      const plugins = [];

      // TypeScript support
      if (this.isTypeScript(source)) {
        presets.push(['@babel/preset-typescript', {
          allowDeclareFields: true,
          onlyRemoveTypeImports: true
        }]);
      }

      // JSX support
      if (this.isJSX(source)) {
        presets.push(['@babel/preset-react', {
          pragma: options.jsxPragma || 'React.createElement',
          pragmaFrag: 'React.Fragment',
          development: !options.minify
        }]);
      }

      // ES target
      const targetMap = {
        es5: 'es5',
        es2015: 'es2015',
        es2017: 'es2017',
        es2018: 'es2018',
        es2020: 'es2020'
      };

      presets.push(['@babel/preset-env', {
        targets: targetMap[options.target || 'es2020'],
        useBuiltIns: options.includePolyfills ? 'entry' : false,
        corejs: options.includePolyfills ? 3 : undefined
      }]);

      // Additional plugins
      plugins.push(
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import'
      );

      if (options.minify) {
        plugins.push(['babel-plugin-minify-mangle-names', {
          keepFnName: true
        }]);
      }

      const result = Babel.transform(source, {
        presets,
        plugins,
        sourceMap: options.sourceMap,
        compact: options.minify,
        comments: !options.minify,
        filename: this.isTypeScript(source) ? 'input.ts' : 'input.js'
      });

      if (!result.code) {
        throw new Error('Compilation failed: No output generated');
      }

      return {
        code: result.code,
        sourceMap: result.map ? JSON.stringify(result.map) : undefined,
        warnings,
        errors,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        code: source, // Return original on error
        warnings,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: performance.now() - startTime
      };
    }
  }

  static isTypeScript(source: string): boolean {
    // Simple heuristics to detect TypeScript
    return /\b(interface|type|enum|namespace|declare|abstract|implements|private|protected|public|readonly)\b/.test(source) ||
           /:\s*\w+(\[\]|<[^>]+>)?\s*[=;,)\]]/.test(source) ||
           /\bas\s+\w+/.test(source);
  }

  static isJSX(source: string): boolean {
    // Simple heuristics to detect JSX
    return /<[A-Z][\w.]*\s*[^>]*\/?>/.test(source) ||
           /<[a-z]+\s+[^>]*\/?>/.test(source) ||
           /React\.createElement/.test(source) ||
           /jsx/.test(source);
  }

  static validateJavaScript(source: string): { isValid: boolean; errors: string[] } {
    try {
      // Try to parse with Babel
      Babel.transform(source, {
        presets: ['@babel/preset-env'],
        filename: 'input.js'
      });
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

// CSS Processor (for PostCSS features)
export class CSSProcessor {
  static async process(
    source: string,
    options: CompilationOptions = {}
  ): Promise<CompilationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      if (typeof window === 'undefined') {
        // Server-side fallback
        return {
          code: source,
          warnings,
          errors,
          processingTime: performance.now() - startTime
        };
      }

      const plugins = [
        autoprefixer({
          overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead']
        })
      ];

      const processor = postcss(plugins);
      const result = await processor.process(source, {
        from: undefined,
        map: options.sourceMap ? { inline: false } : false
      });

      result.warnings().forEach(warning => {
        warnings.push(warning.toString());
      });

      return {
        code: result.css,
        sourceMap: result.map ? result.map.toString() : undefined,
        warnings,
        errors,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        code: source,
        warnings,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: performance.now() - startTime
      };
    }
  }

  static validateCSS(source: string): { isValid: boolean; errors: string[] } {
    try {
      // Basic CSS validation using PostCSS parser
      postcss.parse(source);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

// HTML Processor (for HTML validation and processing)
export class HTMLProcessor {
  static async process(
    source: string,
    options: CompilationOptions = {}
  ): Promise<CompilationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      let processedHtml = source;

      // Basic HTML validation and improvements
      const validationResult = this.validateHTML(source);
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
      }
      warnings.push(...validationResult.warnings);

      // Auto-format HTML (basic)
      if (!options.minify) {
        processedHtml = this.formatHTML(processedHtml);
      } else {
        processedHtml = this.minifyHTML(processedHtml);
      }

      return {
        code: processedHtml,
        warnings,
        errors,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        code: source,
        warnings,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: performance.now() - startTime
      };
    }
  }

  static validateHTML(source: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for basic HTML structure
    if (!source.includes('<!DOCTYPE')) {
      warnings.push('Missing DOCTYPE declaration');
    }

    if (!source.includes('<html')) {
      warnings.push('Missing <html> tag');
    }

    if (!source.includes('<head')) {
      warnings.push('Missing <head> section');
    }

    if (!source.includes('<body')) {
      warnings.push('Missing <body> section');
    }

    // Check for unclosed tags (basic)
    const openTags = source.match(/<(\w+)(?:\s[^>]*)?>/g) || [];
    const closeTags = source.match(/<\/(\w+)>/g) || [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

    openTags.forEach(tag => {
      const tagName = tag.match(/<(\w+)/)?.[1];
      if (tagName && !selfClosingTags.includes(tagName.toLowerCase())) {
        const closeTag = `</${tagName}>`;
        if (!source.includes(closeTag)) {
          warnings.push(`Unclosed tag: ${tagName}`);
        }
      }
    });

    // Check for common mistakes
    if (source.includes('<script') && !source.includes('</script>')) {
      errors.push('Script tag must be closed');
    }

    if (source.includes('<style') && !source.includes('</style>')) {
      errors.push('Style tag must be closed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static formatHTML(html: string): string {
    // Basic HTML formatting
    return html
      .replace(/>\s*</g, '>\n<')
      .replace(/^\s+|\s+$/gm, '')
      .split('\n')
      .map((line, index, lines) => {
        if (index === 0) return line;
        const prevLine = lines[index - 1];
        const isClosingTag = line.trim().startsWith('</');
        const prevIsOpeningTag = prevLine.trim().match(/<\w+[^>]*>$/);

        if (isClosingTag && prevIsOpeningTag) {
          return '  ' + line.trim();
        }
        return line.trim();
      })
      .join('\n');
  }

  private static minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }
}

// Export unified compiler interface
export class CodeCompiler {
  static async compile(
    source: string,
    language: 'html' | 'css' | 'scss' | 'javascript' | 'typescript' | 'jsx',
    options: CompilationOptions = {}
  ): Promise<CompilationResult> {
    switch (language) {
      case 'scss':
        return SassCompiler.compile(source, options);

      case 'css':
        return CSSProcessor.process(source, options);

      case 'javascript':
      case 'typescript':
      case 'jsx':
        return JavaScriptCompiler.compile(source, options);

      case 'html':
        return HTMLProcessor.process(source, options);

      default:
        return {
          code: source,
          warnings: [],
          errors: [`Unsupported language: ${language}`],
          processingTime: 0
        };
    }
  }

  static validate(
    source: string,
    language: 'html' | 'css' | 'scss' | 'javascript' | 'typescript' | 'jsx'
  ): { isValid: boolean; errors: string[]; warnings?: string[] } {
    switch (language) {
      case 'scss':
        return SassCompiler.validateSass(source);

      case 'css':
        return CSSProcessor.validateCSS(source);

      case 'javascript':
      case 'typescript':
      case 'jsx':
        return JavaScriptCompiler.validateJavaScript(source);

      case 'html':
        const result = HTMLProcessor.validateHTML(source);
        return {
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings
        };

      default:
        return {
          isValid: false,
          errors: [`Unsupported language: ${language}`]
        };
    }
  }

  static detectLanguage(source: string): 'html' | 'css' | 'scss' | 'javascript' | 'typescript' | 'jsx' {
    // SCSS detection
    if (/\$\w+|@mixin|@include|@extend|@if|@for|@while|@each/.test(source)) {
      return 'scss';
    }

    // TypeScript detection
    if (JavaScriptCompiler.isTypeScript(source)) {
      return 'typescript';
    }

    // JSX detection
    if (JavaScriptCompiler.isJSX(source)) {
      return 'jsx';
    }

    // HTML detection
    if (/<\/?[a-z][\s\S]*>/i.test(source)) {
      return 'html';
    }

    // CSS detection
    if (/[.#]?\w+\s*\{[\s\S]*\}/.test(source)) {
      return 'css';
    }

    // Default to JavaScript
    return 'javascript';
  }
}

export default CodeCompiler;