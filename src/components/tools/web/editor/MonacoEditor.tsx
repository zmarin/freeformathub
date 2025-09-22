import React, { useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'scss' | 'jsx';
  theme?: 'vs-dark' | 'light' | 'vs' | 'hc-black';
  height?: string | number;
  options?: editor.IStandaloneEditorConstructionOptions;
  className?: string;
  placeholder?: string;
  onValidationChange?: (markers: editor.IMarkerData[]) => void;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  autoFormat?: boolean;
}

// Common libraries for IntelliSense
const CDN_LIBRARIES = [
  { name: 'jQuery', url: 'https://code.jquery.com/jquery-3.7.1.min.js', types: '@types/jquery' },
  { name: 'React', url: 'https://unpkg.com/react@18/umd/react.development.js', types: '@types/react' },
  { name: 'Vue', url: 'https://unpkg.com/vue@3/dist/vue.global.js', types: 'vue' },
  { name: 'Bootstrap', url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js', types: '@types/bootstrap' },
  { name: 'Lodash', url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', types: '@types/lodash' },
  { name: 'D3', url: 'https://d3js.org/d3.v7.min.js', types: '@types/d3' },
  { name: 'Three.js', url: 'https://threejs.org/build/three.min.js', types: '@types/three' },
  { name: 'Chart.js', url: 'https://cdn.jsdelivr.net/npm/chart.js', types: 'chart.js' },
  { name: 'Moment.js', url: 'https://momentjs.com/downloads/moment.min.js', types: '@types/moment' },
  { name: 'GSAP', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', types: 'gsap' }
];

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  height = '100%',
  options = {},
  className = '',
  placeholder,
  onValidationChange,
  minimap = true,
  lineNumbers = true,
  wordWrap = true,
  autoFormat = true
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: minimap },
    lineNumbers: lineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
    fontLigatures: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    selectOnLineNumbers: true,
    roundedSelection: true,
    readOnly: false,
    cursorStyle: 'line',
    renderWhitespace: 'boundary',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showProperties: true,
      showValues: true,
      showMethods: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true,
      showIssues: true,
      showUsers: true,
      showWords: true
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    parameterHints: { enabled: true },
    hover: { enabled: true },
    contextmenu: true,
    ...options
  };

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure language features
    setupLanguageFeatures(monaco, language);

    // Add custom snippets
    addCustomSnippets(monaco, language);

    // Setup validation
    if (onValidationChange) {
      const model = editor.getModel();
      if (model) {
        const updateMarkers = () => {
          const markers = monaco.editor.getModelMarkers({ resource: model.uri });
          onValidationChange(markers);
        };

        // Initial validation
        updateMarkers();

        // Listen for marker changes
        const disposable = monaco.editor.onDidChangeMarkers(updateMarkers);

        return () => disposable.dispose();
      }
    }

    // Auto-format on paste and save
    if (autoFormat) {
      editor.onDidPaste(() => {
        setTimeout(() => {
          editor.getAction('editor.action.formatDocument')?.run();
        }, 100);
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        editor.getAction('editor.action.formatDocument')?.run();
      });
    }

    // Add placeholder text
    if (placeholder && !value) {
      const model = editor.getModel();
      if (model) {
        model.setValue(`<!-- ${placeholder} -->`);
        editor.setSelection(new monaco.Selection(1, 5, 1, placeholder.length + 4));
      }
    }

    // Focus editor
    editor.focus();
  }, [language, onValidationChange, autoFormat, placeholder, value]);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  }, [onChange]);

  const setupLanguageFeatures = (monaco: Monaco, lang: string) => {
    // HTML enhancements
    if (lang === 'html') {
      monaco.languages.html.htmlDefaults.setOptions({
        format: {
          tabSize: 2,
          insertSpaces: true,
          wrapLineLength: 120,
          unformatted: 'default',
          contentUnformatted: 'pre,code,textarea',
          indentInnerHtml: false,
          preserveNewLines: true,
          maxPreserveNewLines: 2,
          indentHandlebars: false,
          endWithNewline: false,
          extraLiners: 'head, body, /html',
          wrapAttributes: 'auto'
        },
        suggest: { html5: true, angular1: true, ionic: true }
      });
    }

    // CSS/SCSS enhancements
    if (lang === 'css' || lang === 'scss') {
      monaco.languages.css.cssDefaults.setOptions({
        validate: true,
        lint: {
          compatibleVendorPrefixes: 'warning',
          vendorPrefix: 'warning',
          duplicateProperties: 'warning',
          emptyRules: 'warning',
          importStatement: 'ignore',
          boxModel: 'ignore',
          universalSelector: 'ignore',
          zeroUnits: 'ignore',
          fontFaceProperties: 'warning',
          hexColorLength: 'error',
          argumentsInColorFunction: 'error',
          unknownProperties: 'warning',
          validProperties: []
        }
      });
    }

    // JavaScript/TypeScript enhancements
    if (lang === 'javascript' || lang === 'typescript' || lang === 'jsx') {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: lang === 'jsx' ? monaco.languages.typescript.JsxEmit.React : undefined,
        allowJs: true,
        typeRoots: ['node_modules/@types']
      });

      // Add common libraries for auto-completion
      addLibraryDefinitions(monaco);
    }
  };

  const addLibraryDefinitions = (monaco: Monaco) => {
    // Add common DOM types
    const domLib = `
      declare const document: Document;
      declare const window: Window;
      declare const console: Console;
      declare function setTimeout(callback: Function, ms?: number): number;
      declare function setInterval(callback: Function, ms?: number): number;
      declare function clearTimeout(id: number): void;
      declare function clearInterval(id: number): void;
      declare function fetch(url: string, options?: any): Promise<Response>;
    `;

    // Add jQuery if detected
    const jqueryLib = `
      declare const $: JQueryStatic;
      declare const jQuery: JQueryStatic;
      interface JQueryStatic {
        (selector: string): JQuery;
        (element: Element): JQuery;
        ajax(settings: any): any;
        get(url: string): any;
        post(url: string, data?: any): any;
      }
      interface JQuery {
        hide(): JQuery;
        show(): JQuery;
        addClass(className: string): JQuery;
        removeClass(className: string): JQuery;
        css(property: string, value?: string): JQuery;
        on(event: string, handler: Function): JQuery;
        off(event?: string, handler?: Function): JQuery;
        click(handler?: Function): JQuery;
        val(value?: string): JQuery | string;
        text(text?: string): JQuery | string;
        html(html?: string): JQuery | string;
        attr(name: string, value?: string): JQuery | string;
        find(selector: string): JQuery;
        parent(): JQuery;
        children(): JQuery;
        append(content: string | JQuery): JQuery;
        prepend(content: string | JQuery): JQuery;
        remove(): JQuery;
        each(callback: (index: number, element: Element) => void): JQuery;
      }
    `;

    // Add React types if JSX
    const reactLib = `
      declare namespace React {
        interface Component<P = {}, S = {}> {}
        interface FunctionComponent<P = {}> {
          (props: P): JSX.Element | null;
        }
        const useState: <T>(initial: T) => [T, (value: T) => void];
        const useEffect: (effect: () => void | (() => void), deps?: any[]) => void;
        const useCallback: <T extends Function>(callback: T, deps: any[]) => T;
        const useMemo: <T>(factory: () => T, deps: any[]) => T;
      }
      declare namespace JSX {
        interface Element {}
        interface IntrinsicElements {
          div: any;
          span: any;
          button: any;
          input: any;
          form: any;
          img: any;
          a: any;
          p: any;
          h1: any;
          h2: any;
          h3: any;
          h4: any;
          h5: any;
          h6: any;
          ul: any;
          ol: any;
          li: any;
          nav: any;
          header: any;
          footer: any;
          main: any;
          section: any;
          article: any;
          aside: any;
        }
      }
    `;

    try {
      monaco.languages.typescript.javascriptDefaults.addExtraLib(domLib, 'dom.d.ts');
      monaco.languages.typescript.javascriptDefaults.addExtraLib(jqueryLib, 'jquery.d.ts');
      monaco.languages.typescript.javascriptDefaults.addExtraLib(reactLib, 'react.d.ts');
    } catch (error) {
      console.warn('Failed to add type definitions:', error);
    }
  };

  const addCustomSnippets = (monaco: Monaco, lang: string) => {
    // HTML snippets
    if (lang === 'html') {
      monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'html5',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'HTML5 boilerplate',
              insertText: [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '<head>',
                '    <meta charset="UTF-8">',
                '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '    <title>${1:Document}</title>',
                '</head>',
                '<body>',
                '    ${2}',
                '</body>',
                '</html>'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'flexbox',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Flexbox container',
              insertText: '<div style="display: flex; justify-content: ${1:center}; align-items: ${2:center};">\n    ${3}\n</div>',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'grid',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'CSS Grid container',
              insertText: '<div style="display: grid; grid-template-columns: ${1:repeat(3, 1fr)}; gap: ${2:1rem};">\n    ${3}\n</div>',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            }
          ]
        })
      });
    }

    // CSS snippets
    if (lang === 'css' || lang === 'scss') {
      monaco.languages.registerCompletionItemProvider('css', {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'flexcenter',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Flex center alignment',
              insertText: [
                'display: flex;',
                'justify-content: center;',
                'align-items: center;'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'transition',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Smooth transition',
              insertText: 'transition: ${1:all} ${2:0.3s} ${3:ease};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'gradient',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Linear gradient',
              insertText: 'background: linear-gradient(${1:45deg}, ${2:#ff6b6b}, ${3:#4ecdc4});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            }
          ]
        })
      });
    }

    // JavaScript snippets
    if (lang === 'javascript' || lang === 'typescript') {
      monaco.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'addEventListener',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Add event listener',
              insertText: "document.getElementById('${1:elementId}').addEventListener('${2:click}', function(${3:event}) {\n    ${4}\n});",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'fetch',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Fetch API request',
              insertText: [
                'fetch(\'${1:url}\')',
                '    .then(response => response.json())',
                '    .then(data => {',
                '        ${2}',
                '    })',
                '    .catch(error => {',
                '        console.error(\'Error:\', error);',
                '    });'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            },
            {
              label: 'debounce',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Debounce function',
              insertText: [
                'function debounce(func, wait) {',
                '    let timeout;',
                '    return function executedFunction(...args) {',
                '        const later = () => {',
                '            clearTimeout(timeout);',
                '            func(...args);',
                '        };',
                '        clearTimeout(timeout);',
                '        timeout = setTimeout(later, wait);',
                '    };',
                '}'
              ].join('\n'),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            }
          ]
        })
      });
    }
  };

  return (
    <div className={`monaco-editor-container ${className}`}>
      <Editor
        height={height}
        language={language}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={defaultOptions}
        loading={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-text-secondary)'
          }}>
            <div className="loading-spinner" style={{ marginRight: '0.5rem' }} />
            Loading editor...
          </div>
        }
      />
    </div>
  );
};

// Export utility functions
export const formatCode = async (code: string, language: string): Promise<string> => {
  if (typeof window !== 'undefined' && monacoRef.current && editorRef.current) {
    try {
      const formatted = await monacoRef.current.editor.getModel(editorRef.current.getModel()?.uri!)?.getValue();
      return formatted || code;
    } catch (error) {
      console.warn('Code formatting failed:', error);
      return code;
    }
  }
  return code;
};

export const getCDNLibraries = () => CDN_LIBRARIES;

export default MonacoEditor;