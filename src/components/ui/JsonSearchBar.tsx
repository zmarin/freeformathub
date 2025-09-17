import React, { useState, useCallback, useEffect, useMemo } from 'react';

export interface JsonSearchBarProps {
  data: any;
  onSearch: (searchTerm: string) => void;
  onNavigateToMatch: (matchIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface SearchMatch {
  path: string;
  key: string;
  value: any;
  type: 'key' | 'value';
}

export const JsonSearchBar: React.FC<JsonSearchBarProps> = ({
  data,
  onSearch,
  onNavigateToMatch,
  className = '',
  style
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searchType, setSearchType] = useState<'both' | 'keys' | 'values'>('both');

  // Find all matches in the JSON data
  const matches = useMemo((): SearchMatch[] => {
    if (!searchTerm || !data) return [];

    const results: SearchMatch[] = [];
    const searchLower = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    const searchInData = (obj: any, currentPath: string) => {
      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = Array.isArray(obj) ? `${currentPath}[${key}]` : `${currentPath}.${key}`;

          // Search in keys
          if ((searchType === 'both' || searchType === 'keys')) {
            const keyText = caseSensitive ? key : key.toLowerCase();
            if (keyText.includes(searchLower)) {
              results.push({
                path: newPath,
                key,
                value,
                type: 'key'
              });
            }
          }

          // Search in values
          if ((searchType === 'both' || searchType === 'values')) {
            if (typeof value === 'string') {
              const valueText = caseSensitive ? value : value.toLowerCase();
              if (valueText.includes(searchLower)) {
                results.push({
                  path: newPath,
                  key,
                  value,
                  type: 'value'
                });
              }
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              const valueText = String(value);
              const valueToSearch = caseSensitive ? valueText : valueText.toLowerCase();
              if (valueToSearch.includes(searchLower)) {
                results.push({
                  path: newPath,
                  key,
                  value,
                  type: 'value'
                });
              }
            }
          }

          // Recursively search nested objects/arrays
          searchInData(value, newPath);
        });
      }
    };

    searchInData(data, '$');
    return results;
  }, [data, searchTerm, caseSensitive, searchType]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentMatchIndex(-1);
    onSearch(term);
  }, [onSearch]);

  // Navigate to previous match
  const handlePreviousMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    onNavigateToMatch(newIndex);
  }, [matches.length, currentMatchIndex, onNavigateToMatch]);

  // Navigate to next match
  const handleNextMatch = useCallback(() => {
    if (matches.length === 0) return;

    const newIndex = currentMatchIndex >= matches.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(newIndex);
    onNavigateToMatch(newIndex);
  }, [matches.length, currentMatchIndex, onNavigateToMatch]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentMatchIndex(-1);
    onSearch('');
  }, [onSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'search') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            handlePreviousMatch();
          } else {
            handleNextMatch();
          }
        } else if (e.key === 'Escape') {
          handleClearSearch();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlePreviousMatch, handleNextMatch, handleClearSearch]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-md)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        ...style
      }}
    >
      {/* Search Icon */}
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* Search Input */}
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search keys and values..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-primary)'
        }}
      />

      {/* Search Options */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        {/* Case Sensitive Toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer'
          }}
          title="Case sensitive search"
        >
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            style={{ accentColor: 'var(--color-primary)' }}
          />
          Aa
        </label>

        {/* Search Type Selector */}
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as typeof searchType)}
          style={{
            fontSize: '0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.125rem 0.25rem',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)'
          }}
          title="Search scope"
        >
          <option value="both">Both</option>
          <option value="keys">Keys Only</option>
          <option value="values">Values Only</option>
        </select>
      </div>

      {/* Match Navigation */}
      {searchTerm && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)'
        }}>
          {/* Match Counter */}
          <span style={{ minWidth: '3rem', textAlign: 'center' }}>
            {matches.length > 0
              ? `${currentMatchIndex + 1}/${matches.length}`
              : '0/0'
            }
          </span>

          {/* Navigation Buttons */}
          <button
            onClick={handlePreviousMatch}
            disabled={matches.length === 0}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.125rem 0.25rem',
              cursor: matches.length > 0 ? 'pointer' : 'not-allowed',
              opacity: matches.length > 0 ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)'
            }}
            title="Previous match (Shift+Enter)"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNextMatch}
            disabled={matches.length === 0}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.125rem 0.25rem',
              cursor: matches.length > 0 ? 'pointer' : 'not-allowed',
              opacity: matches.length > 0 ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)'
            }}
            title="Next match (Enter)"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Clear Button */}
      {searchTerm && (
        <button
          onClick={handleClearSearch}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.125rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Clear search (Escape)"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default JsonSearchBar;