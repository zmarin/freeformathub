import React, { useRef, useEffect, useState, useCallback } from 'react';

interface JsonError {
  line: number;
  column: number;
  message: string;
  start?: number;
  end?: number;
}

interface ErrorHighlightTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export function ErrorHighlightTextarea({
  value,
  onChange,
  placeholder,
  error,
  className = '',
  style = {},
  ...props
}: ErrorHighlightTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [parsedError, setParsedError] = useState<JsonError | null>(null);

  // Parse JSON error message to extract line/column info
  const parseJsonError = useCallback((errorMessage: string): JsonError | null => {
    if (!errorMessage) return null;

    // Common JSON error patterns
    const patterns = [
      /line (\d+) column (\d+)/i,
      /position (\d+)/i,
      /at line (\d+), column (\d+)/i,
      /Unexpected token.*at position (\d+)/i
    ];

    for (const pattern of patterns) {
      const match = errorMessage.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          // Line and column format
          return {
            line: parseInt(match[1]) - 1, // Convert to 0-based
            column: parseInt(match[2]) - 1,
            message: errorMessage
          };
        } else if (match[1]) {
          // Position format - convert to line/column
          const position = parseInt(match[1]);
          const lines = value.slice(0, position).split('\n');
          return {
            line: lines.length - 1,
            column: lines[lines.length - 1].length,
            message: errorMessage,
            start: position,
            end: position + 1
          };
        }
      }
    }

    return {
      line: 0,
      column: 0,
      message: errorMessage
    };
  }, [value]);

  // Update parsed error when error message changes
  useEffect(() => {
    if (error) {
      setParsedError(parseJsonError(error));
    } else {
      setParsedError(null);
    }
  }, [error, parseJsonError]);

  // Create overlay with syntax highlighting and error indicators
  const createOverlayContent = useCallback(() => {
    if (!value) return '';

    const lines = value.split('\n');
    let highlightedLines = lines.map((line, lineIndex) => {
      let highlightedLine = line;

      // Add error highlighting if this line has an error
      if (parsedError && lineIndex === parsedError.line) {
        const errorStart = parsedError.column;
        const errorEnd = parsedError.end ?
          parsedError.end - parsedError.start! + errorStart :
          errorStart + 1;

        if (errorStart >= 0 && errorStart < line.length) {
          const before = line.slice(0, errorStart);
          const errorText = line.slice(errorStart, Math.min(errorEnd, line.length));
          const after = line.slice(Math.min(errorEnd, line.length));

          highlightedLine = before +
            `<span class="error-highlight" style="background-color: var(--color-danger-light, #fee2e2); color: var(--color-danger, #dc6868); border-bottom: 2px solid var(--color-danger, #dc6868);">${errorText || ' '}</span>` +
            after;
        }
      }

      return highlightedLine;
    });

    return highlightedLines.join('\n');
  }, [value, parsedError]);

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle textarea changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style
      }}
      className={className}
    >
      {/* Error overlay */}
      {parsedError && (
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: 'var(--space-lg)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflow: 'auto',
            zIndex: 1,
            color: 'transparent',
            backgroundColor: 'transparent'
          }}
          dangerouslySetInnerHTML={{ __html: createOverlayContent() }}
        />
      )}

      {/* Main textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 0,
          fontFamily: 'var(--font-family-mono)',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'none',
          padding: 'var(--space-lg)',
          backgroundColor: parsedError ? 'var(--color-danger-light, #fee2e2)' : 'transparent',
          zIndex: 2
        }}
        spellCheck={false}
        {...props}
      />

      {/* Error gutter indicators */}
      {parsedError && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: 'var(--color-danger, #dc6868)',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Error tooltip */}
      {parsedError && (
        <div
          style={{
            position: 'absolute',
            top: `${(parsedError.line + 1) * 1.5 * 14 + 16}px`, // Approximate line height calculation
            left: 'var(--space-lg)',
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-text-inverse)',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            maxWidth: '300px',
            zIndex: 4,
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-md)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={parsedError.message}
        >
          Line {parsedError.line + 1}: {parsedError.message}
        </div>
      )}
    </div>
  );
}