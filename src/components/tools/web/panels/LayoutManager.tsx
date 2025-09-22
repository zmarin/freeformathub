import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle
} from 'react-resizable-panels';
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCcw,
  Layout,
  Columns,
  Rows,
  Grid3X3,
  Eye,
  EyeOff,
  Settings,
  Layers
} from 'lucide-react';

export type LayoutMode = 'horizontal' | 'vertical' | 'stacked' | 'grid' | 'focus';
export type PanelType = 'html' | 'css' | 'javascript' | 'preview' | 'console' | 'files';

export interface LayoutConfig {
  mode: LayoutMode;
  panels: {
    [key in PanelType]?: {
      visible: boolean;
      size: number;
      order: number;
      minimized: boolean;
    };
  };
  previewMode: 'desktop' | 'tablet' | 'mobile';
  theme: 'vs-dark' | 'light' | 'vs' | 'hc-black';
}

export interface LayoutManagerProps {
  children: {
    htmlEditor?: React.ReactNode;
    cssEditor?: React.ReactNode;
    javascriptEditor?: React.ReactNode;
    preview?: React.ReactNode;
    console?: React.ReactNode;
    files?: React.ReactNode;
  };
  config: LayoutConfig;
  onConfigChange: (config: LayoutConfig) => void;
  className?: string;
}

const defaultConfig: LayoutConfig = {
  mode: 'horizontal',
  panels: {
    html: { visible: true, size: 33, order: 0, minimized: false },
    css: { visible: true, size: 33, order: 1, minimized: false },
    javascript: { visible: true, size: 34, order: 2, minimized: false },
    preview: { visible: true, size: 50, order: 3, minimized: false },
    console: { visible: false, size: 20, order: 4, minimized: false },
    files: { visible: false, size: 20, order: 5, minimized: false }
  },
  previewMode: 'desktop',
  theme: 'vs-dark'
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  children,
  config,
  onConfigChange,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<PanelType | null>(null);
  const [showLayoutOptions, setShowLayoutOptions] = useState(false);

  const panelRefs = useRef<{ [key in PanelType]?: ImperativePanelHandle }>({});

  const updateConfig = useCallback((updates: Partial<LayoutConfig>) => {
    onConfigChange({ ...config, ...updates });
  }, [config, onConfigChange]);

  const togglePanel = useCallback((panelType: PanelType) => {
    const currentPanel = config.panels[panelType];
    if (!currentPanel) return;

    updateConfig({
      panels: {
        ...config.panels,
        [panelType]: {
          ...currentPanel,
          visible: !currentPanel.visible
        }
      }
    });
  }, [config.panels, updateConfig]);

  const minimizePanel = useCallback((panelType: PanelType) => {
    const currentPanel = config.panels[panelType];
    if (!currentPanel) return;

    updateConfig({
      panels: {
        ...config.panels,
        [panelType]: {
          ...currentPanel,
          minimized: !currentPanel.minimized
        }
      }
    });
  }, [config.panels, updateConfig]);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    let newPanels = { ...config.panels };

    // Adjust panel visibility and sizes based on layout mode
    switch (mode) {
      case 'focus':
        // Hide all editor panels except the focused one
        Object.keys(newPanels).forEach(key => {
          const panelType = key as PanelType;
          if (panelType !== 'preview' && panelType !== focusedPanel) {
            newPanels[panelType] = { ...newPanels[panelType]!, visible: false };
          }
        });
        break;
      case 'stacked':
        // All editor panels stacked vertically
        newPanels = {
          ...newPanels,
          html: { ...newPanels.html!, visible: true, size: 25 },
          css: { ...newPanels.css!, visible: true, size: 25 },
          javascript: { ...newPanels.javascript!, visible: true, size: 25 },
          preview: { ...newPanels.preview!, visible: true, size: 25 }
        };
        break;
      case 'grid':
        // 2x2 grid layout
        newPanels = {
          ...newPanels,
          html: { ...newPanels.html!, visible: true, size: 50 },
          css: { ...newPanels.css!, visible: true, size: 50 },
          javascript: { ...newPanels.javascript!, visible: true, size: 50 },
          preview: { ...newPanels.preview!, visible: true, size: 50 }
        };
        break;
      default:
        // Reset to default sizes
        newPanels = {
          ...newPanels,
          html: { ...newPanels.html!, visible: true, size: 33 },
          css: { ...newPanels.css!, visible: true, size: 33 },
          javascript: { ...newPanels.javascript!, visible: true, size: 34 },
          preview: { ...newPanels.preview!, visible: true, size: 50 }
        };
    }

    updateConfig({ mode, panels: newPanels });
  }, [config.panels, focusedPanel, updateConfig]);

  const resetLayout = useCallback(() => {
    onConfigChange(defaultConfig);
  }, [onConfigChange]);

  const enterFullscreen = useCallback((panelType: PanelType) => {
    if (panelType === focusedPanel && isFullscreen) {
      // Exit fullscreen
      setIsFullscreen(false);
      setFocusedPanel(null);
      setLayoutMode(config.mode);
    } else {
      // Enter fullscreen
      setIsFullscreen(true);
      setFocusedPanel(panelType);
      setLayoutMode('focus');
    }
  }, [focusedPanel, isFullscreen, config.mode, setLayoutMode]);

  const getVisiblePanels = useCallback(() => {
    return Object.entries(config.panels)
      .filter(([_, panel]) => panel.visible && !panel.minimized)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([type, _]) => type as PanelType);
  }, [config.panels]);

  const renderPanelContent = useCallback((panelType: PanelType) => {
    const panelConfig = config.panels[panelType];
    if (!panelConfig?.visible) return null;

    const isMinimized = panelConfig.minimized;
    const isFocused = focusedPanel === panelType;

    return (
      <Panel
        ref={(ref) => {
          if (ref) panelRefs.current[panelType] = ref;
        }}
        key={panelType}
        defaultSize={panelConfig.size}
        minSize={isMinimized ? 5 : 15}
        className={`panel-${panelType} ${isFocused ? 'panel-focused' : ''}`}
      >
        <div className="panel-container">
          {/* Panel Header */}
          <div className="panel-header" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-surface-secondary)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {panelType === 'html' && <span style={{ color: '#e34c26' }}>HTML</span>}
              {panelType === 'css' && <span style={{ color: '#1572b6' }}>CSS</span>}
              {panelType === 'javascript' && <span style={{ color: '#f7df1e' }}>JavaScript</span>}
              {panelType === 'preview' && (
                <>
                  <Eye size={14} />
                  <span>Preview</span>
                </>
              )}
              {panelType === 'console' && (
                <>
                  <Monitor size={14} />
                  <span>Console</span>
                </>
              )}
              {panelType === 'files' && (
                <>
                  <Layers size={14} />
                  <span>Files</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => minimizePanel(panelType)}
                className="btn btn-ghost"
                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                title={isMinimized ? 'Restore' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
              <button
                onClick={() => enterFullscreen(panelType)}
                className="btn btn-ghost"
                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                title={isFocused ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <Maximize2 size={12} />
              </button>
              <button
                onClick={() => togglePanel(panelType)}
                className="btn btn-ghost"
                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                title="Close"
              >
                <EyeOff size={12} />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          {!isMinimized && (
            <div className="panel-content" style={{ height: 'calc(100% - 3rem)', overflow: 'hidden' }}>
              {panelType === 'html' && children.htmlEditor}
              {panelType === 'css' && children.cssEditor}
              {panelType === 'javascript' && children.javascriptEditor}
              {panelType === 'preview' && children.preview}
              {panelType === 'console' && children.console}
              {panelType === 'files' && children.files}
            </div>
          )}
        </div>
      </Panel>
    );
  }, [config.panels, focusedPanel, children, minimizePanel, enterFullscreen, togglePanel]);

  const renderLayoutControls = () => (
    <div className="layout-controls" style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '0.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <button
        onClick={() => setShowLayoutOptions(!showLayoutOptions)}
        className="btn btn-outline"
        style={{ padding: '0.5rem', fontSize: '0.75rem' }}
        title="Layout Options"
      >
        <Layout size={14} />
      </button>

      {showLayoutOptions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem',
          minWidth: '200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Layout Mode</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <button
                onClick={() => setLayoutMode('horizontal')}
                className={`btn ${config.mode === 'horizontal' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
              >
                <Columns size={12} />
                Horizontal
              </button>
              <button
                onClick={() => setLayoutMode('vertical')}
                className={`btn ${config.mode === 'vertical' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
              >
                <Rows size={12} />
                Vertical
              </button>
              <button
                onClick={() => setLayoutMode('stacked')}
                className={`btn ${config.mode === 'stacked' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
              >
                <Layers size={12} />
                Stacked
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`btn ${config.mode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
              >
                <Grid3X3 size={12} />
                Grid
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Panels</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {Object.entries(config.panels).map(([type, panel]) => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={panel.visible}
                    onChange={() => togglePanel(type as PanelType)}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={resetLayout}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.75rem' }}
          >
            <RotateCcw size={12} />
            Reset Layout
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={() => updateConfig({ previewMode: 'desktop' })}
          className={`btn ${config.previewMode === 'desktop' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem', fontSize: '0.75rem' }}
          title="Desktop Preview"
        >
          <Monitor size={12} />
        </button>
        <button
          onClick={() => updateConfig({ previewMode: 'tablet' })}
          className={`btn ${config.previewMode === 'tablet' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem', fontSize: '0.75rem' }}
          title="Tablet Preview"
        >
          <Tablet size={12} />
        </button>
        <button
          onClick={() => updateConfig({ previewMode: 'mobile' })}
          className={`btn ${config.previewMode === 'mobile' ? 'btn-primary' : 'btn-outline'}`}
          style={{ padding: '0.5rem', fontSize: '0.75rem' }}
          title="Mobile Preview"
        >
          <Smartphone size={12} />
        </button>
      </div>
    </div>
  );

  const visiblePanels = getVisiblePanels();
  const editorPanels = visiblePanels.filter(p => ['html', 'css', 'javascript', 'console', 'files'].includes(p));
  const previewPanels = visiblePanels.filter(p => p === 'preview');

  return (
    <div className={`layout-manager ${className}`} style={{ position: 'relative', height: '100%' }}>
      {renderLayoutControls()}

      {config.mode === 'grid' ? (
        // Grid layout: 2x2
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: '100%',
          gap: '1px',
          backgroundColor: 'var(--color-border)'
        }}>
          {visiblePanels.slice(0, 4).map(panelType => (
            <div key={panelType} style={{ backgroundColor: 'var(--color-surface)' }}>
              {renderPanelContent(panelType)}
            </div>
          ))}
        </div>
      ) : config.mode === 'stacked' ? (
        // Stacked layout: all panels vertically
        <PanelGroup direction="vertical">
          {visiblePanels.map((panelType, index) => (
            <React.Fragment key={panelType}>
              {renderPanelContent(panelType)}
              {index < visiblePanels.length - 1 && (
                <PanelResizeHandle style={{
                  height: '1px',
                  backgroundColor: 'var(--color-border)',
                  cursor: 'row-resize'
                }} />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      ) : (
        // Horizontal/Vertical layout
        <PanelGroup direction={config.mode === 'horizontal' ? 'horizontal' : 'vertical'}>
          {/* Editor panels */}
          {editorPanels.length > 0 && (
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction={config.mode === 'horizontal' ? 'vertical' : 'horizontal'}>
                {editorPanels.map((panelType, index) => (
                  <React.Fragment key={panelType}>
                    {renderPanelContent(panelType)}
                    {index < editorPanels.length - 1 && (
                      <PanelResizeHandle style={{
                        width: config.mode === 'horizontal' ? '100%' : '1px',
                        height: config.mode === 'horizontal' ? '1px' : '100%',
                        backgroundColor: 'var(--color-border)',
                        cursor: config.mode === 'horizontal' ? 'row-resize' : 'col-resize'
                      }} />
                    )}
                  </React.Fragment>
                ))}
              </PanelGroup>
            </Panel>
          )}

          {/* Preview panels */}
          {editorPanels.length > 0 && previewPanels.length > 0 && (
            <PanelResizeHandle style={{
              width: config.mode === 'horizontal' ? '1px' : '100%',
              height: config.mode === 'horizontal' ? '100%' : '1px',
              backgroundColor: 'var(--color-border)',
              cursor: config.mode === 'horizontal' ? 'col-resize' : 'row-resize'
            }} />
          )}

          {previewPanels.length > 0 && (
            <Panel defaultSize={50} minSize={20}>
              {previewPanels.map(panelType => renderPanelContent(panelType))}
            </Panel>
          )}
        </PanelGroup>
      )}

      {/* Click outside to close layout options */}
      {showLayoutOptions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10
          }}
          onClick={() => setShowLayoutOptions(false)}
        />
      )}
    </div>
  );
};

export default LayoutManager;