import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play,
  Save,
  Download,
  Share2,
  Settings,
  Code2,
  Eye,
  AlertTriangle,
  Info,
  Gauge,
  Package,
  Folder,
  Terminal,
  Maximize2,
  RotateCcw
} from 'lucide-react';

// Import all the enhanced components
import { MonacoEditor } from './editor/MonacoEditor';
import { LayoutManager, type LayoutConfig } from './panels/LayoutManager';
import { DeviceFrame, type DeviceType, type DeviceOrientation } from './preview/DeviceFrame';
import { ProjectManager, type Project, type ProjectFile } from './project/ProjectManager';
import { CDNPackageSearch } from './cdn/CDNPackageSearch';
import { PerformanceMonitor, PerformanceAnalyzer, type PerformanceMetrics } from '../../../lib/performance/metrics';
import { CodeCompiler, type CompilationResult } from '../../../lib/compiler/preprocessors';
import { ProjectExporter, type ExportOptions } from '../../../lib/sharing/exportUtils';

// Enhanced tool definition
import {
  processHtmlVisualizer,
  HTML_TEMPLATES,
  type HtmlVisualizerOptions,
  type HtmlVisualizerResult
} from '../../../tools/web/html-visualizer';

interface HtmlVisualizerEnhancedProps {
  className?: string;
}

interface EnhancedVisualizerState {
  project: Project;
  selectedFile: ProjectFile | null;
  layoutConfig: LayoutConfig;
  isProcessing: boolean;
  result: HtmlVisualizerResult | null;
  performanceMetrics: PerformanceMetrics[];
  compilationResults: Map<string, CompilationResult>;
  showCDNSearch: boolean;
  showPerformancePanel: boolean;
  showExportDialog: boolean;
}

const defaultProject: Project = {
  id: 'default-enhanced',
  name: 'Enhanced Web Project',
  description: 'A powerful web development playground',
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: 'file',
      extension: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced HTML Visualizer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Welcome to Enhanced HTML Visualizer</h1>
            <p>The most powerful online code playground</p>
        </header>

        <main>
            <section class="features">
                <div class="feature">
                    <h3>🎨 Advanced Editor</h3>
                    <p>Monaco Editor with IntelliSense, syntax highlighting, and code completion</p>
                </div>
                <div class="feature">
                    <h3>📱 Device Preview</h3>
                    <p>Test your code on desktop, tablet, and mobile devices</p>
                </div>
                <div class="feature">
                    <h3>⚡ Live Performance</h3>
                    <p>Real-time performance monitoring and optimization suggestions</p>
                </div>
            </section>

            <section class="demo">
                <button id="demo-btn" class="btn">Try Interactive Demo</button>
                <div id="result" class="result"></div>
            </section>
        </main>
    </div>

    <script src="script.js"></script>
</body>
</html>`,
      lastModified: Date.now(),
      size: 1200
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: 'file',
      extension: 'css',
      content: `/* Enhanced HTML Visualizer Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

header {
    text-align: center;
    color: white;
    margin-bottom: 3rem;
}

header h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.feature {
    background: rgba(255, 255, 255, 0.95);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.feature h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.demo {
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
}

.btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.result {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    min-height: 100px;
    border: 2px dashed #dee2e6;
    transition: all 0.3s ease;
}

.result.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }

    header h1 {
        font-size: 2rem;
    }

    .features {
        grid-template-columns: 1fr;
    }
}`,
      lastModified: Date.now(),
      size: 2500
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: 'file',
      extension: 'js',
      content: `// Enhanced HTML Visualizer JavaScript
console.log('🚀 Enhanced HTML Visualizer loaded!');

// Demo functionality
document.addEventListener('DOMContentLoaded', function() {
    const demoBtn = document.getElementById('demo-btn');
    const result = document.getElementById('result');

    if (demoBtn && result) {
        demoBtn.addEventListener('click', function() {
            result.classList.add('active');

            // Simulate interactive demo
            result.innerHTML = \`
                <h4>🎉 Interactive Demo Active!</h4>
                <p>This demonstrates the enhanced capabilities:</p>
                <ul style="text-align: left; max-width: 500px; margin: 1rem auto;">
                    <li>✅ Monaco Editor with IntelliSense</li>
                    <li>✅ Real-time device preview</li>
                    <li>✅ Performance monitoring</li>
                    <li>✅ CDN package management</li>
                    <li>✅ Export to CodePen, JSFiddle, and more</li>
                    <li>✅ Project management with file system</li>
                </ul>
                <div style="margin-top: 1rem;">
                    <span style="color: #059669; font-weight: 600;">
                        Performance Score: 95/100 ⚡
                    </span>
                </div>
            \`;

            // Add some animation
            setTimeout(() => {
                result.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    result.style.transform = 'scale(1)';
                }, 200);
            }, 100);
        });
    }

    // Add some interactive effects
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        feature.style.animationDelay = \`\${index * 0.1}s\`;
        feature.style.animation = 'fadeInUp 0.6s ease forwards';
    });
});

// CSS animation keyframes (added via JavaScript)
const style = document.createElement('style');
style.textContent = \`
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
\`;
document.head.appendChild(style);

// Performance monitoring demo
let performanceData = {
    fps: 60,
    memory: 0,
    renderTime: 0
};

function updatePerformanceDemo() {
    performanceData.fps = 58 + Math.random() * 4; // 58-62 fps
    performanceData.memory = 45 + Math.random() * 10; // 45-55 MB
    performanceData.renderTime = 12 + Math.random() * 6; // 12-18 ms

    console.log('Performance:', performanceData);
}

// Update performance data every 5 seconds
setInterval(updatePerformanceDemo, 5000);

// Web API demonstrations
if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker supported');
}

if ('WebAssembly' in window) {
    console.log('✅ WebAssembly supported');
}

// Modern JavaScript features demo
const modernFeatures = {
    async: true,
    await: true,
    destructuring: true,
    templateLiterals: true,
    arrowFunctions: true,
    classes: true,
    modules: true
};

console.log('🔥 Modern JS features:', modernFeatures);`,
      lastModified: Date.now(),
      size: 3000
    }
  ],
  settings: {
    preprocessors: {
      html: false,
      css: true,
      scss: true,
      typescript: true,
      jsx: true
    },
    autoSave: true,
    autoFormat: true,
    liveReload: true
  },
  metadata: {
    created: Date.now(),
    lastModified: Date.now(),
    version: '2.0.0',
    tags: ['enhanced', 'playground', 'demo']
  }
};

const defaultLayoutConfig: LayoutConfig = {
  mode: 'horizontal',
  panels: {
    html: { visible: true, size: 33, order: 0, minimized: false },
    css: { visible: true, size: 33, order: 1, minimized: false },
    javascript: { visible: true, size: 34, order: 2, minimized: false },
    preview: { visible: true, size: 50, order: 3, minimized: false },
    console: { visible: false, size: 20, order: 4, minimized: false },
    files: { visible: true, size: 20, order: 5, minimized: false }
  },
  previewMode: 'desktop',
  theme: 'vs-dark'
};

export const HtmlVisualizerEnhanced: React.FC<HtmlVisualizerEnhancedProps> = ({
  className = ''
}) => {
  const [state, setState] = useState<EnhancedVisualizerState>({
    project: defaultProject,
    selectedFile: defaultProject.files[0],
    layoutConfig: defaultLayoutConfig,
    isProcessing: false,
    result: null,
    performanceMetrics: [],
    compilationResults: new Map(),
    showCDNSearch: false,
    showPerformancePanel: false,
    showExportDialog: false
  });

  const performanceMonitor = useRef(new PerformanceMonitor());
  const previewRef = useRef<HTMLIFrameElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize performance monitoring
  useEffect(() => {
    const monitor = performanceMonitor.current;

    const unsubscribe = monitor.onMetrics((metrics) => {
      setState(prev => ({
        ...prev,
        performanceMetrics: [...prev.performanceMetrics.slice(-19), metrics]
      }));
    });

    monitor.start();

    return () => {
      unsubscribe();
      monitor.dispose();
    };
  }, []);

  // Auto-compile and preview
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      handleCompileAndPreview();
    }, 500);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [state.project, state.selectedFile]);

  const handleCompileAndPreview = useCallback(async () => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Compile files based on preprocessor settings
      const compilationResults = new Map<string, CompilationResult>();

      for (const file of state.project.files) {
        if (file.type === 'file' && file.content) {
          const language = file.extension as any;

          if (['html', 'css', 'scss', 'javascript', 'typescript', 'jsx'].includes(language)) {
            const result = await CodeCompiler.compile(file.content, language, {
              sourceMap: false,
              minify: false
            });
            compilationResults.set(file.id, result);
          }
        }
      }

      // Get compiled content
      const htmlFile = state.project.files.find(f => f.extension === 'html');
      const cssFiles = state.project.files.filter(f => ['css', 'scss'].includes(f.extension || ''));
      const jsFiles = state.project.files.filter(f => ['js', 'jsx', 'ts', 'tsx'].includes(f.extension || ''));

      if (!htmlFile) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          result: {
            success: false,
            error: 'No HTML file found in project'
          }
        }));
        return;
      }

      // Combine CSS
      let combinedCSS = '';
      cssFiles.forEach(file => {
        const compiled = compilationResults.get(file.id);
        combinedCSS += compiled?.code || file.content || '';
        combinedCSS += '\n\n';
      });

      // Combine JavaScript
      let combinedJS = '';
      jsFiles.forEach(file => {
        const compiled = compilationResults.get(file.id);
        combinedJS += compiled?.code || file.content || '';
        combinedJS += '\n\n';
      });

      // Process with original visualizer
      const result = processHtmlVisualizer({
        html: htmlFile.content || '',
        css: combinedCSS,
        javascript: combinedJS,
        options: {
          autoRun: true,
          theme: state.layoutConfig.theme,
          layout: state.layoutConfig.mode,
          showLineNumbers: true,
          wrapLines: true
        }
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        result,
        compilationResults
      }));

      // Update performance monitor iframe reference
      if (previewRef.current && result.success) {
        performanceMonitor.current.setIframe(previewRef.current);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Compilation failed'
        }
      }));
    }
  }, [state.project, state.layoutConfig]);

  const handleProjectChange = useCallback((project: Project) => {
    setState(prev => ({ ...prev, project }));
  }, []);

  const handleFileSelect = useCallback((file: ProjectFile | null) => {
    setState(prev => ({ ...prev, selectedFile: file }));
  }, []);

  const handleFileContentChange = useCallback((content: string) => {
    if (!state.selectedFile) return;

    const updatedFiles = state.project.files.map(file =>
      file.id === state.selectedFile.id
        ? { ...file, content, lastModified: Date.now() }
        : file
    );

    setState(prev => ({
      ...prev,
      project: { ...prev.project, files: updatedFiles }
    }));
  }, [state.selectedFile, state.project.files]);

  const handleLayoutConfigChange = useCallback((config: LayoutConfig) => {
    setState(prev => ({ ...prev, layoutConfig: config }));
  }, []);

  const handleExport = useCallback(async (format: ExportOptions['format']) => {
    try {
      const result = await ProjectExporter.exportProject(state.project, {
        format,
        includeMetadata: true,
        addComments: true,
        generateManifest: format === 'zip'
      });

      if (result.success) {
        console.log('Export successful:', result);
        // Handle download or redirect based on format
        if (result.data instanceof Blob) {
          const url = URL.createObjectURL(result.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${state.project.name.replace(/\s+/g, '-').toLowerCase()}.${format === 'zip' ? 'zip' : 'html'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [state.project]);

  const renderToolbar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: 'var(--color-surface-secondary)',
      borderBottom: '1px solid var(--color-border)',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          Enhanced HTML Visualizer
        </h2>
        <span style={{
          padding: '0.125rem 0.5rem',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          v2.0
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => handleCompileAndPreview()}
          disabled={state.isProcessing}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Play size={14} />
          {state.isProcessing ? 'Processing...' : 'Run'}
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, showCDNSearch: !prev.showCDNSearch }))}
          className={`btn ${state.showCDNSearch ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Package size={14} />
          CDN
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, showPerformancePanel: !prev.showPerformancePanel }))}
          className={`btn ${state.showPerformancePanel ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Gauge size={14} />
          Performance
        </button>

        <button
          onClick={() => setState(prev => ({ ...prev, showExportDialog: !prev.showExportDialog }))}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Share2 size={14} />
          Export
        </button>

        {state.performanceMetrics.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            padding: '0.5rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)'
          }}>
            <span>FPS: {Math.round(state.performanceMetrics[state.performanceMetrics.length - 1]?.fps || 0)}</span>
            <span>Memory: {((state.performanceMetrics[state.performanceMetrics.length - 1]?.memory.used || 0) / 1024 / 1024).toFixed(1)}MB</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderEditor = (language: 'html' | 'css' | 'javascript') => {
    const file = state.project.files.find(f => f.extension === language);
    if (!file) return <div>No {language.toUpperCase()} file</div>;

    return (
      <MonacoEditor
        value={file.content || ''}
        onChange={language === state.selectedFile?.extension ? handleFileContentChange : () => {}}
        language={language}
        theme={state.layoutConfig.theme}
        height="100%"
        options={{
          minimap: { enabled: true },
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true
        }}
        autoFormat={state.project.settings.autoFormat}
      />
    );
  };

  const renderPreview = () => (
    <DeviceFrame
      deviceType={state.layoutConfig.previewMode as DeviceType}
      orientation="portrait"
      onDeviceChange={(deviceType) =>
        handleLayoutConfigChange({
          ...state.layoutConfig,
          previewMode: deviceType as any
        })
      }
      zoom={1}
      showFrame={true}
      showStatusBar={true}
    >
      {state.result?.previewHtml ? (
        <iframe
          ref={previewRef}
          srcDoc={state.result.previewHtml}
          title="Preview"
          sandbox="allow-scripts allow-forms allow-modals"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: 'white'
          }}
        />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-secondary)'
        }}>
          {state.isProcessing ? 'Processing...' : 'No preview available'}
        </div>
      )}
    </DeviceFrame>
  );

  return (
    <div className={`html-visualizer-enhanced ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--color-surface)'
    }}>
      {renderToolbar()}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar panels */}
        {(state.showCDNSearch || state.showPerformancePanel || state.layoutConfig.panels.files?.visible) && (
          <div style={{
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-secondary)'
          }}>
            {state.layoutConfig.panels.files?.visible && (
              <div style={{ flex: 1, minHeight: 0 }}>
                <ProjectManager
                  project={state.project}
                  onProjectChange={handleProjectChange}
                  onFileSelect={handleFileSelect}
                  selectedFile={state.selectedFile}
                />
              </div>
            )}

            {state.showCDNSearch && (
              <div style={{ flex: 1, minHeight: 0, borderTop: '1px solid var(--color-border)' }}>
                <CDNPackageSearch
                  onPackageSelect={(pkg, importCode) => {
                    // Add package import to HTML file
                    const htmlFile = state.project.files.find(f => f.extension === 'html');
                    if (htmlFile) {
                      let content = htmlFile.content || '';
                      if (importCode.includes('<script')) {
                        content = content.replace('</head>', `  ${importCode}\n</head>`);
                      } else if (importCode.includes('<link')) {
                        content = content.replace('</head>', `  ${importCode}\n</head>`);
                      }

                      const updatedFiles = state.project.files.map(file =>
                        file.id === htmlFile.id ? { ...file, content } : file
                      );

                      setState(prev => ({
                        ...prev,
                        project: { ...prev.project, files: updatedFiles }
                      }));
                    }
                  }}
                />
              </div>
            )}

            {state.showPerformancePanel && state.performanceMetrics.length > 0 && (
              <div style={{
                padding: '1rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Performance Monitor</h4>
                {(() => {
                  const analysis = PerformanceAnalyzer.analyzeMetrics(state.performanceMetrics);
                  return (
                    <div>
                      <div style={{ marginBottom: '1rem' }}>
                        <div>Avg FPS: {analysis.summary.avgFPS.toFixed(1)}</div>
                        <div>Peak Memory: {(analysis.summary.peakMemory / 1024 / 1024).toFixed(1)}MB</div>
                        <div>Avg Render: {analysis.summary.avgRenderTime.toFixed(2)}ms</div>
                      </div>

                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h5>Recommendations:</h5>
                          <ul style={{ fontSize: '0.75rem', paddingLeft: '1rem' }}>
                            {analysis.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Main content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <LayoutManager
            config={state.layoutConfig}
            onConfigChange={handleLayoutConfigChange}
          >
            {{
              htmlEditor: renderEditor('html'),
              cssEditor: renderEditor('css'),
              javascriptEditor: renderEditor('javascript'),
              preview: renderPreview()
            }}
          </LayoutManager>
        </div>
      </div>

      {/* Export Dialog */}
      {state.showExportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Export Project</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <button
                onClick={() => handleExport('html')}
                className="btn btn-outline"
              >
                <Download size={14} />
                HTML File
              </button>
              <button
                onClick={() => handleExport('zip')}
                className="btn btn-outline"
              >
                <Package size={14} />
                ZIP Archive
              </button>
              <button
                onClick={() => handleExport('codepen')}
                className="btn btn-outline"
              >
                <Code2 size={14} />
                CodePen
              </button>
              <button
                onClick={() => handleExport('jsfiddle')}
                className="btn btn-outline"
              >
                <Code2 size={14} />
                JSFiddle
              </button>
              <button
                onClick={() => handleExport('stackblitz')}
                className="btn btn-outline"
              >
                <Code2 size={14} />
                StackBlitz
              </button>
              <button
                onClick={() => handleExport('codesandbox')}
                className="btn btn-outline"
              >
                <Code2 size={14} />
                CodeSandbox
              </button>
            </div>
            <button
              onClick={() => setState(prev => ({ ...prev, showExportDialog: false }))}
              className="btn btn-ghost"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error/Warning Display */}
      {state.result && !state.result.success && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          backgroundColor: 'var(--color-danger)',
          color: 'white',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          maxWidth: '400px',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <strong>Error</strong>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            {state.result.error}
          </p>
        </div>
      )}
    </div>
  );
};

export default HtmlVisualizerEnhanced;