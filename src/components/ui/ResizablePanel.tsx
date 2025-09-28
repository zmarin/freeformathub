import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  initialWidth?: string | number;
  minWidth?: number;
  maxWidth?: number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  onResize?: (size: number) => void;
  resizable?: boolean;
}

export function ResizablePanel({
  children,
  initialWidth = '50%',
  minWidth = 200,
  maxWidth = Infinity,
  direction = 'horizontal',
  className = '',
  onResize,
  resizable = true
}: ResizablePanelProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable) return;

    e.preventDefault();
    setIsResizing(true);

    if (direction === 'horizontal') {
      startPos.current = e.clientX;
    } else {
      startPos.current = e.clientY;
    }

    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      startSize.current = direction === 'horizontal' ? rect.width : rect.height;
    }
  }, [resizable, direction]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos.current;
    const newSize = Math.max(minWidth, Math.min(maxWidth, startSize.current + delta));

    setWidth(`${newSize}px`);
    onResize?.(newSize);
  }, [isResizing, direction, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, direction]);

  return (
    <div className="resizable-panel-container" style={{ position: 'relative', display: 'flex' }}>
      <div
        ref={panelRef}
        className={`resizable-panel ${className}`}
        style={{
          width: direction === 'horizontal' ? width : '100%',
          height: direction === 'vertical' ? width : '100%',
          position: 'relative'
        }}
      >
        {children}
      </div>
      {resizable && (
        <div
          className="resize-handle"
          style={{
            position: 'absolute',
            [direction === 'horizontal' ? 'right' : 'bottom']: -2,
            [direction === 'horizontal' ? 'top' : 'left']: 0,
            [direction === 'horizontal' ? 'width' : 'height']: 4,
            [direction === 'horizontal' ? 'height' : 'width']: '100%',
            cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
            backgroundColor: 'transparent',
            zIndex: 10,
            transition: 'background-color 0.2s'
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => {
            if (!isResizing) {
              (e.target as HTMLElement).style.backgroundColor = 'var(--color-primary, #3b82f6)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        />
      )}
    </div>
  );
}

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function ResizablePanelGroup({
  children,
  direction = 'horizontal',
  className = ''
}: ResizablePanelGroupProps) {
  return (
    <div
      className={`resizable-panel-group ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        width: '100%',
        height: '100%',
        gap: 4
      }}
    >
      {children}
    </div>
  );
}