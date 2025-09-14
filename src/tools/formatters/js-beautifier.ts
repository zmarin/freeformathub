import type { Tool, ToolResult, ToolExample } from '../../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface JsBeautifierConfig {
  mode: 'beautify' | 'minify';
  indentSize: number;
  indentType: 'spaces' | 'tabs';
  maxLineLength: number;
  insertSpaceAfterKeywords: boolean;
  insertSpaceBeforeFunctionParen: boolean;
  insertSpaceAfterFunctionParen: boolean;
  insertSpaceBeforeOpeningBrace: boolean;
  insertNewLineBeforeOpeningBrace: boolean;
  insertNewLineAfterOpeningBrace: boolean;
  insertNewLineBeforeClosingBrace: boolean;
  preserveComments: boolean;
  preserveEmptyLines: boolean;
  addSemicolons: boolean;
  quoteStyle: 'single' | 'double' | 'preserve';
  trailingCommas: boolean;
  validateSyntax: boolean;
}

export interface JsBeautifierResult extends ToolResult {
  stats?: {
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    lineCount: number;
    functionCount: number;
    variableCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
  };
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'error' | 'warning';
  code: string;
}

interface Token {
  type: 'keyword' | 'identifier' | 'literal' | 'operator' | 'punctuation' | 'comment' | 'whitespace' | 'string' | 'number' | 'regex';
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
  'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
  'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
  'null', 'package', 'private', 'protected', 'public', 'return', 'short',
  'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
  'with', 'yield', 'async', 'of'
]);

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '**', '++', '--', '=', '+=', '-=', '*=', '/=',
  '%=', '**=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||',
  '!', '&', '|', '^', '~', '<<', '>>', '>>>', '&=', '|=', '^=', '<<=',
  '>>=', '>>>=', '?', ':', '=>', '?.', '??', '??='
]);

function tokenizeJavaScript(js: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  let line = 1;
  let column = 1;

  while (position < js.length) {
    const char = js[position];
    
    // Skip whitespace but track position
    if (/\s/.test(char)) {
      let whitespaceEnd = position;
      let whitespaceContent = '';
      
      while (whitespaceEnd < js.length && /\s/.test(js[whitespaceEnd])) {
        whitespaceContent += js[whitespaceEnd];
        if (js[whitespaceEnd] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        whitespaceEnd++;
      }
      
      tokens.push({
        type: 'whitespace',
        value: whitespaceContent,
        line,
        column: column - whitespaceContent.length
      });
      
      position = whitespaceEnd;
      continue;
    }
    
    // Comments
    if (char === '/' && position + 1 < js.length) {
      if (js[position + 1] === '/') {
        // Single line comment
        let commentEnd = position + 2;
        while (commentEnd < js.length && js[commentEnd] !== '\n') {
          commentEnd++;
        }
        
        const commentContent = js.slice(position, commentEnd);
        tokens.push({
          type: 'comment',
          value: commentContent,
          line,
          column
        });
        
        column += commentContent.length;
        position = commentEnd;
        continue;
      } else if (js[position + 1] === '*') {
        // Multi-line comment
        let commentEnd = position + 2;
        while (commentEnd < js.length - 1) {
          if (js[commentEnd] === '*' && js[commentEnd + 1] === '/') {
            commentEnd += 2;
            break;
          }
          if (js[commentEnd] === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
          commentEnd++;
        }
        
        const commentContent = js.slice(position, commentEnd);
        tokens.push({
          type: 'comment',
          value: commentContent,
          line,
          column: column - commentContent.length + 1
        });
        
        position = commentEnd;
        continue;
      }
    }
    
    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let stringEnd = position + 1;
      let escaped = false;
      
      while (stringEnd < js.length) {
        const c = js[stringEnd];
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === quote) {
          stringEnd++;
          break;
        } else if (quote === '`' && c === '$' && js[stringEnd + 1] === '{') {
          // Template literal expression - simplified handling
          let braceCount = 1;
          stringEnd += 2;
          while (stringEnd < js.length && braceCount > 0) {
            if (js[stringEnd] === '{') braceCount++;
            else if (js[stringEnd] === '}') braceCount--;
            stringEnd++;
          }
          continue;
        }
        
        if (c === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        stringEnd++;
      }
      
      const stringContent = js.slice(position, stringEnd);
      tokens.push({
        type: 'string',
        value: stringContent,
        line,
        column
      });
      
      position = stringEnd;
      continue;
    }
    
    // Regular expressions (simplified detection)
    if (char === '/' && position > 0) {
      const prevToken = tokens[tokens.length - 1];
      const isRegexContext = !prevToken || 
        prevToken.type === 'punctuation' && ['(', '[', '{', ',', ';', ':', '!', '&', '|', '?', '+', '-', '*', '=', '<', '>'].includes(prevToken.value) ||
        prevToken.type === 'keyword' && ['return', 'case', 'in', 'of', 'delete', 'void', 'typeof', 'new', 'instanceof'].includes(prevToken.value);
        
      if (isRegexContext) {
        let regexEnd = position + 1;
        let escaped = false;
        
        while (regexEnd < js.length) {
          const c = js[regexEnd];
          if (escaped) {
            escaped = false;
          } else if (c === '\\') {
            escaped = true;
          } else if (c === '/') {
            regexEnd++;
            // Check for regex flags
            while (regexEnd < js.length && /[gimuy]/.test(js[regexEnd])) {
              regexEnd++;
            }
            break;
          } else if (c === '\n') {
            break; // Invalid regex
          }
          regexEnd++;
        }
        
        if (regexEnd > position + 1 && js[regexEnd - 1] !== '\n') {
          const regexContent = js.slice(position, regexEnd);
          tokens.push({
            type: 'regex',
            value: regexContent,
            line,
            column
          });
          
          column += regexContent.length;
          position = regexEnd;
          continue;
        }
      }
    }
    
    // Numbers
    if (/\d/.test(char) || (char === '.' && /\d/.test(js[position + 1] || ''))) {
      let numberEnd = position;
      let hasDecimal = char === '.';
      
      while (numberEnd < js.length) {
        const c = js[numberEnd];
        if (/\d/.test(c)) {
          numberEnd++;
        } else if (c === '.' && !hasDecimal) {
          hasDecimal = true;
          numberEnd++;
        } else if ((c === 'e' || c === 'E') && numberEnd > position) {
          numberEnd++;
          if (numberEnd < js.length && (js[numberEnd] === '+' || js[numberEnd] === '-')) {
            numberEnd++;
          }
        } else {
          break;
        }
      }
      
      const numberContent = js.slice(position, numberEnd);
      tokens.push({
        type: 'number',
        value: numberContent,
        line,
        column
      });
      
      column += numberContent.length;
      position = numberEnd;
      continue;
    }
    
    // Multi-character operators
    let operatorFound = false;
    for (let len = 3; len >= 1; len--) {
      const potential = js.slice(position, position + len);
      if (OPERATORS.has(potential)) {
        tokens.push({
          type: 'operator',
          value: potential,
          line,
          column
        });
        
        column += len;
        position += len;
        operatorFound = true;
        break;
      }
    }
    
    if (operatorFound) continue;
    
    // Punctuation
    if ('{}()[];,.'.includes(char)) {
      tokens.push({
        type: 'punctuation',
        value: char,
        line,
        column
      });
      
      column++;
      position++;
      continue;
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let identifierEnd = position;
      while (identifierEnd < js.length && /[a-zA-Z0-9_$]/.test(js[identifierEnd])) {
        identifierEnd++;
      }
      
      const identifier = js.slice(position, identifierEnd);
      const type = KEYWORDS.has(identifier) ? 'keyword' : 'identifier';
      
      tokens.push({
        type,
        value: identifier,
        line,
        column
      });
      
      column += identifier.length;
      position = identifierEnd;
      continue;
    }
    
    // Everything else as punctuation
    tokens.push({
      type: 'punctuation',
      value: char,
      line,
      column
    });
    
    column++;
    position++;
  }
  
  return tokens;
}

function validateJavaScript(tokens: Token[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const brackets = { '(': ')', '[': ']', '{': '}' };
  const stack: Array<{ token: string; line: number; column: number }> = [];
  
  let functionCount = 0;
  let variableCount = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'whitespace') continue;
    
    // Count functions and variables for stats
    if (token.type === 'keyword') {
      if (token.value === 'function') {
        functionCount++;
      } else if (['var', 'let', 'const'].includes(token.value)) {
        variableCount++;
      }
    }
    
    // Check bracket matching
    if (token.type === 'punctuation') {
      if (Object.keys(brackets).includes(token.value)) {
        stack.push({ token: token.value, line: token.line, column: token.column });
      } else if (Object.values(brackets).includes(token.value)) {
        if (stack.length === 0) {
          errors.push({
            line: token.line,
            column: token.column,
            message: `Unexpected closing ${token.value}`,
            type: 'error',
            code: 'unexpected-closing'
          });
        } else {
          const last = stack.pop()!;
          if (brackets[last.token as keyof typeof brackets] !== token.value) {
            errors.push({
              line: token.line,
              column: token.column,
              message: `Mismatched bracket: expected ${brackets[last.token as keyof typeof brackets]} but found ${token.value}`,
              type: 'error',
              code: 'mismatched-bracket'
            });
          }
        }
      }
    }
    
    // Check for incomplete statements
    if (token.type === 'keyword' && ['if', 'while', 'for'].includes(token.value)) {
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'whitespace') j++;
      
      if (j >= tokens.length || tokens[j].value !== '(') {
        errors.push({
          line: token.line,
          column: token.column,
          message: `${token.value} statement missing opening parenthesis`,
          type: 'warning',
          code: 'missing-paren'
        });
      }
    }
  }
  
  // Check for unclosed brackets
  for (const bracket of stack) {
    errors.push({
      line: bracket.line,
      column: bracket.column,
      message: `Unclosed ${bracket.token}`,
      type: 'error',
      code: 'unclosed-bracket'
    });
  }
  
  return errors;
}

function beautifyJavaScript(tokens: Token[], config: JsBeautifierConfig): string {
  const lines: string[] = [];
  let currentIndent = 0;
  let currentLine = '';
  const indent = config.indentType === 'tabs' ? '\t' : ' '.repeat(config.indentSize);
  
  function addLine(content: string = '') {
    lines.push(indent.repeat(currentIndent) + content);
  }
  
  function addToCurrentLine(content: string) {
    currentLine += content;
  }
  
  function finishCurrentLine() {
    if (currentLine.trim()) {
      lines.push(indent.repeat(currentIndent) + currentLine.trim());
      currentLine = '';
    }
  }
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
    
    if (token.type === 'whitespace') {
      // Handle whitespace based on configuration
      if (config.preserveEmptyLines && token.value.includes('\n\n')) {
        finishCurrentLine();
        addLine();
      } else if (token.value.includes('\n')) {
        finishCurrentLine();
      } else {
        // Add single space where appropriate
        if (currentLine && !currentLine.endsWith(' ') && 
            prevToken && nextToken && 
            ['keyword', 'identifier', 'number'].includes(prevToken.type) &&
            ['keyword', 'identifier', 'number'].includes(nextToken.type)) {
          addToCurrentLine(' ');
        }
      }
      continue;
    }
    
    if (token.type === 'comment') {
      if (config.preserveComments) {
        if (token.value.startsWith('//')) {
          finishCurrentLine();
          addLine(token.value);
        } else {
          if (currentLine.trim()) {
            addToCurrentLine(' ');
          }
          addToCurrentLine(token.value);
        }
      }
      continue;
    }
    
    if (token.type === 'string' || token.type === 'regex' || token.type === 'number') {
      let value = token.value;
      
      // Handle quote style for strings
      if (token.type === 'string' && config.quoteStyle !== 'preserve') {
        const content = value.slice(1, -1); // Remove quotes
        const targetQuote = config.quoteStyle === 'single' ? "'" : '"';
        
        if (value[0] !== targetQuote && value[0] !== '`') {
          // Escape target quotes in content and replace
          const escapedContent = content.replace(new RegExp(targetQuote, 'g'), '\\' + targetQuote);
          value = targetQuote + escapedContent + targetQuote;
        }
      }
      
      addToCurrentLine(value);
      continue;
    }
    
    if (token.type === 'keyword') {
      // Add space before keywords if needed
      if (currentLine && !currentLine.endsWith(' ') && config.insertSpaceAfterKeywords) {
        if (['else', 'catch', 'finally'].includes(token.value)) {
          addToCurrentLine(' ');
        }
      }
      
      addToCurrentLine(token.value);
      
      // Add space after certain keywords
      if (config.insertSpaceAfterKeywords && 
          ['if', 'while', 'for', 'switch', 'catch', 'function', 'return', 'throw', 'new', 'typeof', 'delete', 'void'].includes(token.value)) {
        addToCurrentLine(' ');
      }
      
      continue;
    }
    
    if (token.type === 'identifier') {
      addToCurrentLine(token.value);
      continue;
    }
    
    if (token.type === 'operator') {
      // Add spaces around operators
      if (currentLine && !currentLine.endsWith(' ') && 
          !['++', '--', '!'].includes(token.value)) {
        addToCurrentLine(' ');
      }
      
      addToCurrentLine(token.value);
      
      if (!['++', '--'].includes(token.value)) {
        addToCurrentLine(' ');
      }
      
      continue;
    }
    
    if (token.type === 'punctuation') {
      switch (token.value) {
        case '{':
          if (config.insertSpaceBeforeOpeningBrace && currentLine && !currentLine.endsWith(' ')) {
            addToCurrentLine(' ');
          }
          
          if (config.insertNewLineBeforeOpeningBrace) {
            finishCurrentLine();
            addLine('{');
          } else {
            addToCurrentLine('{');
          }
          
          if (config.insertNewLineAfterOpeningBrace) {
            finishCurrentLine();
          }
          
          currentIndent++;
          break;
          
        case '}':
          currentIndent = Math.max(0, currentIndent - 1);
          
          if (config.insertNewLineBeforeClosingBrace) {
            finishCurrentLine();
            addLine('}');
          } else {
            finishCurrentLine();
            addLine('}');
          }
          break;
          
        case '(':
          if (config.insertSpaceBeforeFunctionParen && 
              prevToken && (prevToken.value === 'function' || prevToken.type === 'identifier')) {
            addToCurrentLine(' ');
          }
          addToCurrentLine('(');
          break;
          
        case ')':
          addToCurrentLine(')');
          if (config.insertSpaceAfterFunctionParen) {
            addToCurrentLine(' ');
          }
          break;
          
        case ';':
          addToCurrentLine(';');
          finishCurrentLine();
          break;
          
        case ',':
          addToCurrentLine(',');
          if (config.trailingCommas || (nextToken && nextToken.value !== '}' && nextToken.value !== ']')) {
            addToCurrentLine(' ');
          }
          break;
          
        default:
          addToCurrentLine(token.value);
          break;
      }
    }
  }
  
  finishCurrentLine();
  return lines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

function minifyJavaScript(tokens: Token[], config: JsBeautifierConfig): string {
  let result = '';
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;
    
    if (token.type === 'whitespace') {
      // Only add space where syntactically necessary
      if (prevToken && nextToken &&
          (prevToken.type === 'keyword' || prevToken.type === 'identifier' || prevToken.type === 'number') &&
          (nextToken.type === 'keyword' || nextToken.type === 'identifier' || nextToken.type === 'number')) {
        result += ' ';
      }
      continue;
    }
    
    if (token.type === 'comment') {
      if (config.preserveComments) {
        result += token.value;
      }
      continue;
    }
    
    if (token.type === 'string') {
      let value = token.value;
      
      // Handle quote style
      if (config.quoteStyle !== 'preserve') {
        const content = value.slice(1, -1);
        const targetQuote = config.quoteStyle === 'single' ? "'" : '"';
        
        if (value[0] !== targetQuote && value[0] !== '`') {
          const escapedContent = content.replace(new RegExp(targetQuote, 'g'), '\\' + targetQuote);
          value = targetQuote + escapedContent + targetQuote;
        }
      }
      
      result += value;
      continue;
    }
    
    if (['keyword', 'identifier', 'number', 'regex'].includes(token.type)) {
      result += token.value;
      continue;
    }
    
    if (token.type === 'operator') {
      // Add minimal spacing for operators
      if (['++', '--'].includes(token.value)) {
        result += token.value;
      } else {
        result += token.value;
      }
      continue;
    }
    
    if (token.type === 'punctuation') {
      result += token.value;
      
      // Add semicolons where missing if configured
      if (config.addSemicolons && token.value === '}' && 
          nextToken && nextToken.type !== 'punctuation') {
        result += ';';
      }
    }
  }
  
  return result;
}

export function processJsBeautifier(input: string, config: JsBeautifierConfig): JsBeautifierResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide JavaScript content to process'
      };
    }
    
    const originalSize = input.length;
    const tokens = tokenizeJavaScript(input);
    
    let errors: ValidationError[] = [];
    let warnings: ValidationError[] = [];
    
    if (config.validateSyntax) {
      const validationErrors = validateJavaScript(tokens);
      errors = validationErrors.filter(e => e.type === 'error');
      warnings = validationErrors.filter(e => e.type === 'warning');
    }
    
    let output = '';
    if (config.mode === 'beautify') {
      output = beautifyJavaScript(tokens, config);
    } else {
      output = minifyJavaScript(tokens, config);
    }
    
    const processedSize = output.length;
    const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;
    const lineCount = output.split('\n').length;
    const functionCount = tokens.filter(t => t.value === 'function').length;
    const variableCount = tokens.filter(t => ['var', 'let', 'const'].includes(t.value)).length;
    
    return {
      success: true,
      output,
      stats: {
        originalSize,
        processedSize,
        compressionRatio,
        lineCount,
        functionCount,
        variableCount,
        errors,
        warnings
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process JavaScript'
    };
  }
}

export const JS_BEAUTIFIER_TOOL: Tool = {
  id: 'js-beautifier',
  name: 'JavaScript Beautifier & Minifier',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'formatters')!.subcategories!.find(sub => sub.id === 'code-formatting')!,
  description: 'Format, beautify, and minify JavaScript code with proper indentation, syntax validation, and optimization. Supports ES6+, JSX, and modern JavaScript features with comprehensive formatting options.',
  slug: 'js-beautifier',
  icon: 'code',
  keywords: ['javascript', 'beautifier', 'minifier', 'formatter', 'web', 'code', 'syntax', 'validation'],
  examples: [
    {
      title: 'Beautify Minified JavaScript',
      input: `function calculate(a,b){if(a>b){return a+b;}else{return a-b;}}const users=[{name:"John",age:30},{name:"Jane",age:25}];users.forEach(user=>{console.log(\`\${user.name} is \${user.age} years old\`);});`,
      output: `function calculate(a, b) {
  if (a > b) {
    return a + b;
  } else {
    return a - b;
  }
}

const users = [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 }
];

users.forEach(user => {
  console.log(\`\${user.name} is \${user.age} years old\`);
});`,
      description: 'Format compact JavaScript with proper indentation and spacing'
    },
    {
      title: 'Minify Formatted JavaScript',
      input: `function fetchUserData(userId) {
  return fetch(\`/api/users/\${userId}\`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .catch(error => {
      console.error('Error fetching user data:', error);
      return null;
    });
}

const handleUserClick = async (userId) => {
  const userData = await fetchUserData(userId);
  if (userData) {
    updateUI(userData);
  }
};`,
      output: `function fetchUserData(userId){return fetch(\`/api/users/\${userId}\`).then(response=>{if(!response.ok){throw new Error('Network response was not ok');}return response.json();}).catch(error=>{console.error('Error fetching user data:',error);return null;});}const handleUserClick=async userId=>{const userData=await fetchUserData(userId);if(userData){updateUI(userData);}};`,
      description: 'Compress JavaScript by removing whitespace and formatting'
    },
    {
      title: 'ES6+ Features',
      input: `const { useState, useEffect } = React;const MyComponent = () => {const [data, setData] = useState([]);const [loading, setLoading] = useState(true);useEffect(() => {fetchData().then(result => {setData(result);setLoading(false);});}, []);return loading ? <Spinner /> : <DataList items={data} />;};`,
      output: `const { useState, useEffect } = React;

const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);
  
  return loading ? <Spinner /> : <DataList items={data} />;
};`,
      description: 'Format modern JavaScript with arrow functions, destructuring, and JSX'
    }
  ],
  
  useCases: [
    'Format minified JavaScript files for debugging',
    'Standardize code style across development team',
    'Compress JavaScript for production deployment',
    'Clean up legacy or third-party JavaScript code',
    'Validate JavaScript syntax and find errors'
  ],
  
  commonErrors: [
    'Syntax errors preventing beautification',
    'Unclosed brackets or parentheses',
    'Invalid JavaScript syntax in input',
    'Mixed quote styles causing parsing issues'
  ],
  
  faq: [
    {
      question: 'What JavaScript features are supported?',
      answer: 'The tool supports ES6+ features including arrow functions, template literals, destructuring, async/await, classes, modules, and basic JSX syntax.'
    },
    {
      question: 'Can I customize the formatting style?',
      answer: 'Yes, you can configure indentation, spacing around operators and brackets, quote style (single/double), semicolon insertion, and brace placement.'
    },
    {
      question: 'Does it validate JavaScript syntax?',
      answer: 'The tool performs basic syntax validation including bracket matching, incomplete statements, and structural issues. For comprehensive linting, use dedicated tools like ESLint.'
    },
    {
      question: 'How does minification work?',
      answer: 'Minification removes unnecessary whitespace, comments (optionally), and formatting while preserving code functionality. It doesn\'t perform variable renaming or advanced optimizations.'
    },
    {
      question: 'What about TypeScript support?',
      answer: 'The tool handles basic TypeScript syntax but is primarily designed for JavaScript. For full TypeScript support, use specialized TypeScript formatters.'
    }
  ],
  relatedTools: ['html-beautifier', 'css-beautifier', 'json-formatter', 'xml-formatter', 'code-formatter'],
  seoTitle: 'JavaScript Beautifier & Minifier - Format & Compress JS Code Online',
  seoDescription: 'Free JavaScript beautifier and minifier tool. Format minified JS code with proper indentation or compress formatted JavaScript for production. Supports ES6+, JSX, and modern syntax with validation.'
};