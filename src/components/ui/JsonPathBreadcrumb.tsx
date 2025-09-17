import React, { useState, useCallback } from 'react';
import { copyToClipboard } from '../../lib/utils';

export interface JsonPathBreadcrumbProps {
  path: string;
  onPathClick?: (path: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const JsonPathBreadcrumb: React.FC<JsonPathBreadcrumbProps> = ({
  path,
  onPathClick,
  className = '',
  style
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = useCallback(async () => {
    try {
      await copyToClipboard(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  }, [path]);

  // Parse the path into segments
  const parsePathSegments = useCallback((jsonPath: string): Array<{ name: string; fullPath: string }> => {
    if (!jsonPath || jsonPath === '$') {
      return [{ name: 'root', fullPath: '$' }];
    }

    const segments: Array<{ name: string; fullPath: string }> = [
      { name: 'root', fullPath: '$' }
    ];

    // Remove the leading $ and split by . while preserving array indices
    let remaining = jsonPath.slice(1);
    let currentPath = '$';

    // Handle array indices and object properties
    const pathParts = remaining.split(/\.(?![^\[]*\])/); // Split on dots not inside brackets

    pathParts.forEach((part, index) => {
      if (part) {
        // Handle array indices like [0], [1], etc.
        const arrayMatches = part.match(/^(.+?)(\[\d+\])$/);
        if (arrayMatches) {
          const [, objectPart, arrayPart] = arrayMatches;
          if (objectPart) {
            currentPath += `.${objectPart}`;
            segments.push({ name: objectPart, fullPath: currentPath });
          }
          currentPath += arrayPart;
          segments.push({ name: arrayPart, fullPath: currentPath });
        } else {
          currentPath += `.${part}`;
          segments.push({ name: part, fullPath: currentPath });
        }
      }
    });

    return segments;
  }, []);

  const segments = parsePathSegments(path);

  const handleSegmentClick = useCallback((segmentPath: string) => {
    onPathClick?.(segmentPath);
  }, [onPathClick]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: 'var(--space-md)',
        backgroundColor: 'var(--color-surface-secondary)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '0.875rem',
        border: '1px solid var(--color-border)',
        ...style
      }}
    >
      {/* Path Label */}
      <span style={{
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Path:
      </span>

      {/* Breadcrumb Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        flex: 1
      }}>
        {segments.map((segment, index) => (
          <React.Fragment key={segment.fullPath}>
            {/* Separator */}
            {index > 0 && (
              <span style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem'
              }}>
                /
              </span>
            )}

            {/* Segment Button */}
            <button
              onClick={() => handleSegmentClick(segment.fullPath)}
              style={{
                background: 'none',
                border: 'none',
                cursor: onPathClick ? 'pointer' : 'default',
                padding: '0.125rem 0.25rem',
                borderRadius: 'var(--radius-sm)',
                color: index === segments.length - 1
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
                fontWeight: index === segments.length - 1 ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'background-color 0.2s',
                fontFamily: 'var(--font-family-mono)',
                textDecoration: onPathClick ? 'underline' : 'none',
                textDecorationStyle: 'dotted'
              }}
              title={`Navigate to ${segment.fullPath}`}
              disabled={!onPathClick}
            >
              {segment.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopyPath}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          color: copied ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          transition: 'all 0.2s'
        }}
        title="Copy full path"
      >
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={copied
              ? "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            }
          />
        </svg>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

export default JsonPathBreadcrumb;