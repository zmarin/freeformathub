import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonTreeView } from '../ui/JsonTreeView';
import { JsonSearchBar } from '../ui/JsonSearchBar';

interface JsonTreeViewAppProps {
  container: HTMLElement;
}

const JsonTreeViewAppComponent: React.FC<{ initialData?: any }> = ({ initialData }) => {
  const [jsonData, setJsonData] = useState<any>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchPath, setCurrentMatchPath] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // Try to get JSON data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    const storageKey = urlParams.get('key');

    let data = initialData;

    if (dataParam) {
      try {
        data = JSON.parse(decodeURIComponent(dataParam));
      } catch (err) {
        setError('Invalid JSON data in URL parameter');
        return;
      }
    } else if (storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`json-tree-data-${storageKey}`);
        if (stored) {
          data = JSON.parse(stored);
        }
      } catch (err) {
        setError('Invalid JSON data in localStorage');
        return;
      }
    }

    if (!data) {
      // Show file input for manual JSON upload
      setError('No JSON data provided. Please upload a JSON file or provide data via URL.');
      return;
    }

    setJsonData(data);
  }, [initialData]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentMatchPath(undefined);
  };

  const handleNavigateToMatch = (matchIndex: number) => {
    // This would connect to search results from JsonSearchBar
    // Implementation depends on search result structure
  };

  const handleCopyJson = async () => {
    if (!jsonData) return;

    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      await navigator.clipboard.writeText(jsonString);

      const btn = document.getElementById('copy-btn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const handleDownloadJson = () => {
    if (!jsonData) return;

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Set up event listeners for copy and download buttons
  useEffect(() => {
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    if (copyBtn) copyBtn.addEventListener('click', handleCopyJson);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownloadJson);

    return () => {
      if (copyBtn) copyBtn.removeEventListener('click', handleCopyJson);
      if (downloadBtn) downloadBtn.removeEventListener('click', handleDownloadJson);
    };
  }, [jsonData]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-danger mb-4">⚠️ {error}</div>
        <div className="mb-6">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target?.result as string);
                    setJsonData(data);
                    setError(undefined);
                  } catch (err) {
                    setError('Invalid JSON file');
                  }
                };
                reader.readAsText(file);
              }
            }}
            className="mb-4"
          />
        </div>
        <p className="text-text-secondary text-sm">
          Or provide JSON data via URL parameter: <code>?data=...</code>
        </p>
      </div>
    );
  }

  if (!jsonData) {
    return (
      <div className="text-center py-12">
        <div className="text-text-secondary">Loading JSON data...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '600px' }}>
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <JsonSearchBar
          data={jsonData}
          onSearch={handleSearch}
          onNavigateToMatch={handleNavigateToMatch}
        />
      </div>

      {/* Tree View */}
      <JsonTreeView
        data={jsonData}
        searchTerm={searchTerm}
        currentMatchPath={currentMatchPath}
        defaultExpanded={true}
        initialHeight={500}
        onHeightChange={(height) => {
          // Save height preference
          if (typeof window !== 'undefined') {
            localStorage.setItem('json-tree-viewer-height', height.toString());
          }
        }}
      />
    </div>
  );
};

export class JsonTreeViewApp {
  private container: HTMLElement;
  private root: any;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  initialize(data?: any) {
    this.root = createRoot(this.container);
    this.root.render(<JsonTreeViewAppComponent initialData={data} />);
  }

  updateData(data: any) {
    if (this.root) {
      this.root.render(<JsonTreeViewAppComponent initialData={data} />);
    }
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

export default JsonTreeViewAppComponent;