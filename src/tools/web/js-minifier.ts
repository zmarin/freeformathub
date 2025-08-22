import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsMinifierConfig extends ToolConfig {
  removeComments: boolean;
  removeWhitespace: boolean;
  preserveNewlines: boolean;
  mangleNames: boolean;
  removeDebugger: boolean;
  removeConsole: boolean;
  preserveImportant: boolean;
  safeModeOnly: boolean;
}

export const JS_MINIFIER_TOOL: Tool = {
  id: 'js-minifier',
  name: 'JavaScript Minifier',
  description: 'Minify and compress JavaScript code by removing comments, whitespace, and optimizing syntax for production use.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'web')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'web')!.subcategories!.find(sub => sub.id === 'javascript-tools')!,
  slug: 'js-minifier',
  icon: '⚡',
  keywords: ['javascript', 'js', 'minify', 'compress', 'optimize', 'reduce', 'size', 'uglify'],
  seoTitle: 'Free JavaScript Minifier - Compress JS Code Online for Production',
  seoDescription: 'Minify JavaScript code instantly to reduce file size and improve website performance. Remove comments, whitespace, and optimize code structure.',
  examples: [
    {
      title: 'Basic JavaScript Minification',
      input: '// Main function\nfunction calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}',
      output: 'function calculateTotal(items){let total=0;for(let i=0;i<items.length;i++){total+=items[i].price;}return total;}',
      description: 'Remove comments and unnecessary whitespace'
    },
    {
      title: 'Object and Array Minification',
      input: 'const config = {\n  api: {\n    baseUrl: "https://api.example.com",\n    timeout: 5000\n  },\n  features: ["auth", "logging", "cache"]\n};',
      output: 'const config={api:{baseUrl:"https://api.example.com",timeout:5000},features:["auth","logging","cache"]};',
      description: 'Optimize object and array formatting'
    },
    {
      title: 'Arrow Functions and ES6',
      input: 'const users = data.map((user) => ({\n  id: user.id,\n  name: user.firstName + " " + user.lastName,\n  active: user.status === "active"\n}));',
      output: 'const users=data.map((user)=>({id:user.id,name:user.firstName+" "+user.lastName,active:user.status==="active"}));',
      description: 'Minify modern JavaScript syntax'
    },
    {
      title: 'Class Definition Minification',
      input: 'class UserManager {\n  constructor(apiUrl) {\n    this.apiUrl = apiUrl;\n    this.cache = new Map();\n  }\n\n  async fetchUser(id) {\n    if (this.cache.has(id)) {\n      return this.cache.get(id);\n    }\n    const response = await fetch(`${this.apiUrl}/users/${id}`);\n    const user = await response.json();\n    this.cache.set(id, user);\n    return user;\n  }\n}',
      output: 'class UserManager{constructor(apiUrl){this.apiUrl=apiUrl;this.cache=new Map();}async fetchUser(id){if(this.cache.has(id)){return this.cache.get(id);}const response=await fetch(`${this.apiUrl}/users/${id}`);const user=await response.json();this.cache.set(id,user);return user;}}',
      description: 'Minify ES6 class definitions and async/await'
    }
  ],
  useCases: [
    'Reduce JavaScript bundle size for faster loading',
    'Optimize scripts for production deployment',
    'Compress libraries and vendor code',
    'Minimize bandwidth usage for mobile apps',
    'Prepare code for CDN distribution',
    'Clean up development code for release builds'
  ],
  commonErrors: [
    'Syntax errors will cause minification to fail',
    'Missing semicolons may break after minification',
    'Global variable conflicts in minified scope',
    'Template literals need careful handling',
    'Regex patterns may be affected by minification',
    'Dynamic imports and eval() require special attention'
  ],
  faq: [
    {
      question: 'Will JavaScript minification break my code?',
      answer: 'Basic minification (removing whitespace and comments) is very safe. Advanced features like name mangling require more careful testing but can provide significant size reduction.'
    },
    {
      question: 'How much can I reduce JavaScript file size?',
      answer: 'Typical reduction is 30-60% depending on code structure and comments. Well-commented and formatted code can see even greater reductions.'
    },
    {
      question: 'Are modern JavaScript features supported?',
      answer: 'Yes! The minifier handles ES6+, async/await, arrow functions, destructuring, template literals, and other modern JavaScript features.'
    },
    {
      question: 'Should I minify JavaScript during development?',
      answer: 'No, keep readable formatting during development. Minification should be part of your build process or deployment pipeline.'
    },
    {
      question: 'Can I preserve specific comments?',
      answer: 'Yes, important comments starting with /*! or /** are preserved even when comment removal is enabled.'
    }
  ],
  relatedTools: [
    'js-beautifier',
    'css-minifier',
    'html-minifier',
    'json-formatter',
    'typescript-compiler'
  ]
};

export function minifyJs(input: string, config: JsMinifierConfig): ToolResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Input is empty. Please provide JavaScript code to minify.'
    };
  }

  try {
    let js = input;
    const originalSize = js.length;

    // Preserve important comments (/*! or /**)
    const importantComments: string[] = [];
    js = js.replace(/\/\*[!*][^*]*\*+(?:[^/*][^*]*\*+)*\//g, (match) => {
      const placeholder = `__IMPORTANT_COMMENT_${importantComments.length}__`;
      importantComments.push(match);
      return placeholder;
    });

    // Remove comments
    if (config.removeComments) {
      // Remove single-line comments (but preserve URLs and regex)
      js = js.replace(/\/\/.*$/gm, (match, offset) => {
        // Check if it's inside a string
        const beforeMatch = js.substring(0, offset);
        const singleQuotes = (beforeMatch.match(/'/g) || []).length;
        const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
        const backticks = (beforeMatch.match(/`/g) || []).length;
        
        // If odd number of quotes, we're inside a string
        if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1) {
          return match;
        }
        return '';
      });
      
      // Remove multi-line comments
      js = js.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
    }

    // Remove debugger statements
    if (config.removeDebugger) {
      js = js.replace(/\bdebugger\s*;?\s*/g, '');
    }

    // Remove console statements
    if (config.removeConsole) {
      js = js.replace(/console\.[a-zA-Z]+\s*\([^)]*\)\s*;?\s*/g, '');
    }

    // Remove unnecessary whitespace
    if (config.removeWhitespace) {
      // Handle strings and regex patterns carefully
      let inString = false;
      let stringChar = '';
      let inRegex = false;
      let result = '';
      let lastChar = '';
      
      for (let i = 0; i < js.length; i++) {
        const char = js[i];
        const nextChar = js[i + 1] || '';
        
        // Handle string literals
        if ((char === '"' || char === "'" || char === '`') && lastChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
          result += char;
          lastChar = char;
          continue;
        }

        // Handle regex literals
        if (char === '/' && !inString && lastChar !== '\\') {
          if (!inRegex && /[=,(+\-*%&|^!<>?:;{}[\]]/.test(lastChar.trim() || ' ')) {
            inRegex = true;
          } else if (inRegex) {
            inRegex = false;
          }
          result += char;
          lastChar = char;
          continue;
        }

        // If inside string or regex, preserve everything
        if (inString || inRegex) {
          result += char;
          lastChar = char;
          continue;
        }

        // Remove unnecessary whitespace
        if (/\s/.test(char)) {
          // Preserve newlines if requested
          if (config.preserveNewlines && char === '\n') {
            result += '\n';
            lastChar = '\n';
            continue;
          }
          
          // Only add space if needed for syntax
          if (/[a-zA-Z0-9_$]/.test(lastChar) && /[a-zA-Z0-9_$]/.test(nextChar)) {
            if (result && result[result.length - 1] !== ' ') {
              result += ' ';
              lastChar = ' ';
            }
          }
          continue;
        }

        // Remove space before and after operators
        if (/[+\-*/%=<>!&|^?:;,{}()[\]]/.test(char)) {
          // Remove trailing space
          if (result && result[result.length - 1] === ' ') {
            result = result.slice(0, -1);
          }
          result += char;
          lastChar = char;
          continue;
        }

        result += char;
        lastChar = char;
      }
      
      js = result;
    }

    // Basic safe name mangling (only if safe mode is disabled)
    if (config.mangleNames && !config.safeModeOnly) {
      // This is a very basic implementation - real minifiers use AST
      // Only mangle obvious local variables in function scopes
      js = js.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{([^}]*)\}/g, (match, funcName, params, body) => {
        let mangledBody = body;
        
        // Simple variable name shortening (very basic)
        const varMap = new Map();
        let counter = 0;
        
        // Find local variable declarations
        const varMatches = body.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        if (varMatches) {
          varMatches.forEach(varMatch => {
            const varName = varMatch.split(/\s+/)[1];
            if (varName.length > 3 && !varMap.has(varName)) {
              const shortName = generateShortName(counter++);
              varMap.set(varName, shortName);
            }
          });
        }
        
        // Replace variable names
        varMap.forEach((shortName, originalName) => {
          const regex = new RegExp(`\\b${originalName}\\b`, 'g');
          mangledBody = mangledBody.replace(regex, shortName);
        });
        
        return `function ${funcName}(${params}){${mangledBody}}`;
      });
    }

    // Restore important comments
    importantComments.forEach((comment, index) => {
      const placeholder = `__IMPORTANT_COMMENT_${index}__`;
      js = js.replace(placeholder, comment);
    });

    // Final cleanup
    js = js.trim();
    
    const minifiedSize = js.length;
    const savedBytes = originalSize - minifiedSize;
    const compressionRatio = originalSize > 0 ? (savedBytes / originalSize * 100) : 0;

    return {
      success: true,
      output: js,
      metadata: {
        originalSize,
        minifiedSize,
        savedBytes,
        compressionRatio: Number(compressionRatio.toFixed(1)),
        functions: countJsFunctions(js),
        variables: countJsVariables(js),
        lines: js.split('\n').length
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Minification failed'
    };
  }
}

function generateShortName(index: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let name = '';
  let num = index;
  
  do {
    name = chars[num % chars.length] + name;
    num = Math.floor(num / chars.length);
  } while (num > 0);
  
  return name;
}

function countJsFunctions(js: string): number {
  const functionRegex = /function\s+\w+\s*\(|function\s*\(|\w+\s*=\s*function|\w+\s*:\s*function|=>\s*\{?/g;
  return (js.match(functionRegex) || []).length;
}

function countJsVariables(js: string): number {
  const varRegex = /(?:var|let|const)\s+\w+/g;
  return (js.match(varRegex) || []).length;
}