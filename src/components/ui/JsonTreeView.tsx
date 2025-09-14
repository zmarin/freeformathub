import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { copyToClipboard } from '../../lib/utils';

export interface JsonTreeViewProps {
  data: any;
  searchTerm?: string;
  onPathClick?: (path: string) => void;
  onValueCopy?: (value: any, path: string) => void;
  maxDepth?: number;
  className?: string;
}

interface TreeNodeProps {
  data: any;
  path: string;
  depth: number;
  isLast: boolean;
  searchTerm?: string;
  onPathClick?: (path: string) => void;
  onValueCopy?: (value: any, path: string) => void;
  maxDepth?: number;
  expandedNodes: Set<string>;
  onToggleExpanded: (path: string) => void;
}

const getDataType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const formatValue = (value: any): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const getValueColor = (type: string): string => {
  switch (type) {
    case 'string': return 'var(--color-secondary)';
    case 'number': return 'var(--color-accent)';
    case 'boolean': return 'var(--color-warning)';
    case 'null': return 'var(--color-text-muted)';
    default: return 'var(--color-text-primary)';
  }
};

const highlightSearch = (text: string, searchTerm?: string): React.ReactNode => {
  if (!searchTerm || !text.toLowerCase().includes(searchTerm.toLowerCase())) {
    return text;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark
            key={index}
            style={{
              backgroundColor: 'var(--color-warning-light)',
              color: 'var(--color-warning)',
              padding: '1px 2px',
              borderRadius: '2px'
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const TreeNode: React.FC<TreeNodeProps> = ({
  data,
  path,
  depth,
  isLast,
  searchTerm,
  onPathClick,
  onValueCopy,
  maxDepth = 10,
  expandedNodes,
  onToggleExpanded
}) => {
  const dataType = getDataType(data);
  const isExpandable = dataType === 'object' || dataType === 'array';
  const isExpanded = expandedNodes.has(path);
  const shouldAutoCollapse = maxDepth > 0 && depth >= maxDepth;

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = useCallback(async (value: any, copyPath: string, type: 'value' | 'path') => {
    try {
      const textToCopy = type === 'path' ? copyPath :
                        typeof value === 'string' ? value :
                        JSON.stringify(value, null, 2);

      await copyToClipboard(textToCopy);
      setCopied(type);
      onValueCopy?.(value, copyPath);
      setTimeout(() => setCopied(null), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [onValueCopy]);

  const renderValue = () => {
    if (isExpandable) {
      const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
      const preview = Array.isArray(data) ? `[${itemCount} items]` : `{${itemCount} properties}`;

      return (
        <span style={{
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
          fontSize: '0.85em'
        }}>
          {preview}
        </span>
      );
    }

    return (
      <span style={{ color: getValueColor(dataType) }}>
        {formatValue(data)}
      </span>
    );
  };

  const renderChildren = () => {
    if (!isExpandable || (!isExpanded && shouldAutoCollapse)) return null;

    const entries = Array.isArray(data)
      ? data.map((item, index) => [index, item])
      : Object.entries(data);

    return (
      <div style={{ marginLeft: '1rem' }}>
        {entries.map(([key, value], index) => {
          const childPath = Array.isArray(data) ? `${path}[${key}]` : `${path}.${key}`;
          const isLastChild = index === entries.length - 1;

          return (
            <TreeNode
              key={childPath}
              data={value}
              path={childPath}
              depth={depth + 1}
              isLast={isLastChild}
              searchTerm={searchTerm}
              onPathClick={onPathClick}
              onValueCopy={onValueCopy}
              maxDepth={maxDepth}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.125rem 0',
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.875rem',
          lineHeight: '1.4'
        }}
      >
        {/* Expand/Collapse Button */}
        {isExpandable && (
          <button
            onClick={() => onToggleExpanded(path)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem'
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        {/* Indentation placeholder */}
        {!isExpandable && (
          <span style={{ width: '1rem', display: 'inline-block' }} />
        )}

        {/* Key/Index */}
        <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
          {highlightSearch(path.split('.').pop()?.replace(/[\[\]]/g, '') || 'root', searchTerm)}:
        </span>

        {/* Value */}
        <span>{renderValue()}</span>

        {/* Action Buttons */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '0.25rem',
          opacity: 0,
          transition: 'opacity 0.2s'
        }}
        className="tree-node-actions"
        >
          {/* Copy Path */}
          <button
            onClick={() => handleCopy(data, path, 'path')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem 0.25rem',
              borderRadius: '3px',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem'
            }}
            title="Copy path"
          >
            {copied === 'path' ? '✓' : '📋'}
          </button>

          {/* Copy Value */}
          <button
            onClick={() => handleCopy(data, path, 'value')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem 0.25rem',
              borderRadius: '3px',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem'
            }}
            title="Copy value"
          >
            {copied === 'value' ? '✓' : '📄'}
          </button>

          {/* Navigate to Path */}
          {onPathClick && (
            <button
              onClick={() => onPathClick(path)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.125rem 0.25rem',
                borderRadius: '3px',
                color: 'var(--color-text-secondary)',
                fontSize: '0.75rem'
              }}
              title="Navigate to path"
            >
              →
            </button>
          )}
        </div>
      </div>

      {renderChildren()}
    </div>
  );
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({
  data,
  searchTerm,
  onPathClick,
  onValueCopy,
  maxDepth = 10,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['$']));
  const [allExpanded, setAllExpanded] = useState(false);

  // Auto-expand nodes that contain search matches
  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      const expandSearchMatches = (obj: any, currentPath: string, expanded: Set<string>) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            const newPath = Array.isArray(obj) ? `${currentPath}[${key}]` : `${currentPath}.${key}`;

            if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
              // Expand parent path
              expanded.add(currentPath);
            }

            if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
              expanded.add(currentPath);
            }

            expandSearchMatches(value, newPath, expanded);
          });
        }
      };

      const newExpanded = new Set(expandedNodes);
      expandSearchMatches(data, '$', newExpanded);
      setExpandedNodes(newExpanded);
    }
  }, [searchTerm, data]);

  const handleToggleExpanded = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const getAllPaths = (obj: any, currentPath: string, paths: Set<string>) => {
      if (typeof obj === 'object' && obj !== null) {
        paths.add(currentPath);
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = Array.isArray(obj) ? `${currentPath}[${key}]` : `${currentPath}.${key}`;
          getAllPaths(value, newPath, paths);
        });
      }
    };

    const allPaths = new Set<string>();
    getAllPaths(data, '$', allPaths);
    setExpandedNodes(allPaths);
    setAllExpanded(true);
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set(['$']));
    setAllExpanded(false);
  }, []);

  const stats = useMemo(() => {
    const calculateStats = (obj: any): { objects: number; arrays: number; primitives: number; maxDepth: number } => {
      let objects = 0;
      let arrays = 0;
      let primitives = 0;
      let maxDepth = 0;

      const traverse = (value: any, depth: number) => {
        maxDepth = Math.max(maxDepth, depth);

        if (Array.isArray(value)) {
          arrays++;
          value.forEach(item => traverse(item, depth + 1));
        } else if (typeof value === 'object' && value !== null) {
          objects++;
          Object.values(value).forEach(val => traverse(val, depth + 1));
        } else {
          primitives++;
        }
      };

      traverse(obj, 0);
      return { objects, arrays, primitives, maxDepth };
    };

    return calculateStats(data);
  }, [data]);

  if (!data) {
    return (
      <div className={className} style={{
        padding: 'var(--space-xl)',
        textAlign: 'center',
        color: 'var(--color-text-secondary)'
      }}>
        No data to display
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Tree Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-secondary)',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          <span>Objects: <strong>{stats.objects}</strong></span>
          <span>Arrays: <strong>{stats.arrays}</strong></span>
          <span>Primitives: <strong>{stats.primitives}</strong></span>
          <span>Max Depth: <strong>{stats.maxDepth}</strong></span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={handleExpandAll}
            className="btn btn-outline"
            style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="btn btn-outline"
            style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div style={{
        padding: 'var(--space-lg)',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        <style>
          {`
            .tree-node-actions {
              opacity: 0 !important;
            }
            div:hover > div > .tree-node-actions {
              opacity: 1 !important;
            }
          `}
        </style>

        <TreeNode
          data={data}
          path="$"
          depth={0}
          isLast={true}
          searchTerm={searchTerm}
          onPathClick={onPathClick}
          onValueCopy={onValueCopy}
          maxDepth={maxDepth}
          expandedNodes={expandedNodes}
          onToggleExpanded={handleToggleExpanded}
        />
      </div>
    </div>
  );
};

export default JsonTreeView;