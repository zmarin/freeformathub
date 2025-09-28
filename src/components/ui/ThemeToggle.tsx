import React, { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', size = 'md', showLabel = true }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    setTheme(savedTheme);
    updateResolvedTheme(savedTheme);
  }, []);

  // Apply theme to document
  const updateResolvedTheme = useCallback((newTheme: Theme) => {
    let resolved: 'light' | 'dark';

    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }

    setResolvedTheme(resolved);

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;

    // Update CSS custom properties for dark mode
    if (resolved === 'dark') {
      document.documentElement.style.setProperty('--color-background', '#0f172a');
      document.documentElement.style.setProperty('--color-surface', '#1e293b');
      document.documentElement.style.setProperty('--color-surface-secondary', '#334155');
      document.documentElement.style.setProperty('--color-border', '#475569');
      document.documentElement.style.setProperty('--color-border-light', '#64748b');
      document.documentElement.style.setProperty('--color-text-primary', '#f8fafc');
      document.documentElement.style.setProperty('--color-text-secondary', '#cbd5e1');
      document.documentElement.style.setProperty('--color-text-muted', '#94a3b8');
      document.documentElement.style.setProperty('--color-tree-hover', '#334155');
    } else {
      // Reset to light mode (defined in CSS)
      document.documentElement.style.setProperty('--color-background', '#f5f6f7');
      document.documentElement.style.setProperty('--color-surface', '#ffffff');
      document.documentElement.style.setProperty('--color-surface-secondary', '#fafbfc');
      document.documentElement.style.setProperty('--color-border', '#dde1e6');
      document.documentElement.style.setProperty('--color-border-light', '#f1f5f9');
      document.documentElement.style.setProperty('--color-text-primary', '#2c3e50');
      document.documentElement.style.setProperty('--color-text-secondary', '#64748b');
      document.documentElement.style.setProperty('--color-text-muted', '#94a3b8');
      document.documentElement.style.setProperty('--color-tree-hover', '#f9fafb');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateResolvedTheme('system');

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, updateResolvedTheme]);

  const cycleTheme = useCallback(() => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    updateResolvedTheme(nextTheme);
  }, [theme, updateResolvedTheme]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        );
      case 'dark':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        );
      case 'system':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'Auto';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <button
      onClick={cycleTheme}
      className={`theme-toggle btn btn-outline ${sizeClasses[size]} ${className}`}
      title={`Current theme: ${getThemeLabel()}. Click to cycle themes.`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        transition: 'all 0.2s ease',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)'
      }}
    >
      {getThemeIcon()}
      {showLabel && <span>{getThemeLabel()}</span>}
    </button>
  );
}