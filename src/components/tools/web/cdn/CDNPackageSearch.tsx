import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Download,
  ExternalLink,
  Star,
  Clock,
  Tag,
  Copy,
  Check,
  Code,
  FileText,
  Link,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { CDNPackageManager, type CDNPackage, type PackageSearchResult } from '../../../../lib/cdn/packageManager';

export interface CDNPackageSearchProps {
  onPackageSelect?: (pkg: CDNPackage, importCode: string) => void;
  onPackageAdd?: (pkg: CDNPackage) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const CDNPackageSearch: React.FC<CDNPackageSearchProps> = ({
  onPackageSelect,
  onPackageAdd,
  className = '',
  placeholder = 'Search CDN packages...',
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PackageSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CDNPackage | null>(null);
  const [importType, setImportType] = useState<'script' | 'link' | 'import'>('script');
  const [copiedPackage, setCopiedPackage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [popularOnly, setPopularOnly] = useState(true);

  const packageManager = useRef(new CDNPackageManager());
  const searchTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Load popular packages on mount
    handleSearch('');
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults = await packageManager.current.searchPackages(searchQuery, {
        limit: 20,
        tags: selectedTags,
        includeUnpopular: !popularOnly
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTags, popularOnly]);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
  }, [handleSearch]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handlePackageClick = useCallback((pkg: CDNPackage) => {
    setSelectedPackage(pkg);
  }, []);

  const handleAddPackage = useCallback((pkg: CDNPackage) => {
    const importCode = packageManager.current.generateImportCode(pkg, importType);
    onPackageSelect?.(pkg, importCode);
    onPackageAdd?.(pkg);
  }, [importType, onPackageSelect, onPackageAdd]);

  const handleCopyImport = useCallback(async (pkg: CDNPackage) => {
    const importCode = packageManager.current.generateImportCode(pkg, importType);
    try {
      await navigator.clipboard.writeText(importCode);
      setCopiedPackage(pkg.name);
      setTimeout(() => setCopiedPackage(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [importType]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedTags([]);
    setPopularOnly(true);
    setQuery('');
    handleSearch('');
  }, [handleSearch]);

  const getPackageIcon = (pkg: CDNPackage) => {
    if (pkg.tags.includes('framework')) return <Zap size={16} style={{ color: '#f39c12' }} />;
    if (pkg.tags.includes('css')) return <FileText size={16} style={{ color: '#3498db' }} />;
    if (pkg.tags.includes('icons')) return <Star size={16} style={{ color: '#e74c3c' }} />;
    if (pkg.tags.includes('animation')) return <Clock size={16} style={{ color: '#9b59b6' }} />;
    if (pkg.tags.includes('utility')) return <Package size={16} style={{ color: '#2ecc71' }} />;
    return <Code size={16} style={{ color: '#95a5a6' }} />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const availableTags = packageManager.current.getAvailableTags();

  return (
    <div className={`cdn-package-search ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }}>
      {/* Search Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)'
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)'
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem' }}
            title="Filters"
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Import Type Selector */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: showFilters ? '0.75rem' : '0'
        }}>
          <button
            onClick={() => setImportType('script')}
            className={`btn ${importType === 'script' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Code size={12} />
            Script
          </button>
          <button
            onClick={() => setImportType('link')}
            className={`btn ${importType === 'link' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Link size={12} />
            CSS
          </button>
          <button
            onClick={() => setImportType('import')}
            className={`btn ${importType === 'import' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Package size={12} />
            ESM
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 600 }}>Filters</span>
              <button
                onClick={clearFilters}
                className="btn btn-ghost"
                style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem' }}
              >
                <X size={12} />
                Clear
              </button>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={popularOnly}
                onChange={(e) => setPopularOnly(e.target.checked)}
              />
              Popular packages only
            </label>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Tags:
              </span>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                marginTop: '0.25rem'
              }}>
                {availableTags.slice(0, 12).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`btn ${selectedTags.includes(tag) ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '0.125rem 0.375rem',
                      fontSize: '0.6875rem',
                      textTransform: 'capitalize'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Stats */}
        {results && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span>
              {results.totalCount} packages found in {results.searchTime.toFixed(0)}ms
            </span>
            {loading && <span>Searching...</span>}
          </div>
        )}
      </div>

      {/* Results */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0.5rem'
      }}>
        {loading && results === null ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--color-text-secondary)'
          }}>
            <div className="loading-spinner" style={{ marginRight: '0.5rem' }} />
            Searching packages...
          </div>
        ) : results?.packages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center'
          }}>
            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No packages found</p>
            <p style={{ fontSize: '0.875rem' }}>
              Try adjusting your search query or filters
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results?.packages.map(pkg => (
              <div
                key={pkg.name}
                className={`package-item ${selectedPackage?.name === pkg.name ? 'selected' : ''}`}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedPackage?.name === pkg.name
                    ? 'var(--color-primary-light)'
                    : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => handlePackageClick(pkg)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    {getPackageIcon(pkg)}
                    <div>
                      <h4 style={{
                        margin: '0 0 0.125rem 0',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)'
                      }}>
                        {pkg.name}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: '1.4'
                      }}>
                        {pkg.description}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <Star size={12} />
                    {pkg.popularity}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      v{pkg.version}
                    </span>
                    {pkg.size && (
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {formatSize(pkg.size.gzipped || 0)}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {pkg.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.125rem 0.25rem',
                            backgroundColor: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.625rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {pkg.documentation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(pkg.documentation, '_blank');
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem' }}
                        title="Documentation"
                      >
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyImport(pkg);
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '0.25rem' }}
                      title="Copy import code"
                    >
                      {copiedPackage === pkg.name ? (
                        <Check size={12} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPackage(pkg);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <Download size={12} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package Details */}
      {selectedPackage && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-secondary)',
          fontSize: '0.875rem'
        }}>
          <h4 style={{
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {getPackageIcon(selectedPackage)}
            {selectedPackage.name}
          </h4>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {packageManager.current.generateImportCode(selectedPackage, importType)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDNPackageSearch;