import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface SplitPanelLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultSplitPosition?: number; // percentage (0-100)
  minPanelWidth?: number; // pixels
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function SplitPanelLayout({
  leftPanel,
  rightPanel,
  defaultSplitPosition = 50,
  minPanelWidth = 300,
  className = '',
  orientation = 'horizontal',
}: SplitPanelLayoutProps) {
  const [splitPosition, setSplitPosition] = useState(defaultSplitPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newPosition: number;
      if (orientation === 'horizontal') {
        const mouseX = e.clientX - rect.left;
        newPosition = (mouseX / rect.width) * 100;
      } else {
        const mouseY = e.clientY - rect.top;
        newPosition = (mouseY / rect.height) * 100;
      }

      // Calculate min/max based on minPanelWidth
      const containerSize = orientation === 'horizontal' ? rect.width : rect.height;
      const minPercent = (minPanelWidth / containerSize) * 100;
      const maxPercent = 100 - minPercent;

      // Clamp position
      newPosition = Math.max(minPercent, Math.min(maxPercent, newPosition));
      setSplitPosition(newPosition);
    },
    [isDragging, orientation, minPanelWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  const containerClass = `split-panel-layout split-panel-layout--${orientation} ${className}`;
  const leftStyle = orientation === 'horizontal'
    ? { width: `${splitPosition}%` }
    : { height: `${splitPosition}%` };
  const rightStyle = orientation === 'horizontal'
    ? { width: `${100 - splitPosition}%` }
    : { height: `${100 - splitPosition}%` };

  return (
    <div ref={containerRef} className={containerClass}>
      <div className="split-panel-layout__panel split-panel-layout__panel--left" style={leftStyle}>
        {leftPanel}
      </div>

      <div
        className={`split-panel-layout__divider${isDragging ? ' split-panel-layout__divider--active' : ''}`}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation={orientation}
        aria-valuenow={splitPosition}
      >
        <div className="split-panel-layout__divider-handle">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="split-panel-layout__divider-icon"
          >
            {orientation === 'horizontal' ? (
              <>
                <circle cx="6" cy="4" r="1" fill="currentColor" />
                <circle cx="10" cy="4" r="1" fill="currentColor" />
                <circle cx="6" cy="8" r="1" fill="currentColor" />
                <circle cx="10" cy="8" r="1" fill="currentColor" />
                <circle cx="6" cy="12" r="1" fill="currentColor" />
                <circle cx="10" cy="12" r="1" fill="currentColor" />
              </>
            ) : (
              <>
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="8" cy="6" r="1" fill="currentColor" />
                <circle cx="12" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="10" r="1" fill="currentColor" />
                <circle cx="8" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="10" r="1" fill="currentColor" />
              </>
            )}
          </svg>
        </div>
      </div>

      <div className="split-panel-layout__panel split-panel-layout__panel--right" style={rightStyle}>
        {rightPanel}
      </div>
    </div>
  );
}
