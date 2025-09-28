import React, { useState, useCallback } from 'react';
import { copyToClipboard } from '../../lib/utils';

interface CopyButtonProps {
  value: any;
  path?: string;
  type?: 'value' | 'path';
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onCopy?: (value: any, path?: string) => void;
  label?: string;
}

// Professional SVG Icons
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

const PathIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export function CopyButton({
  value,
  path,
  type = 'value',
  variant = 'accent',
  size = 'md',
  className = '',
  onCopy,
  label
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAnimating) return;

    try {
      const textToCopy = type === 'path' ? (path || '') :
                        typeof value === 'string' ? value :
                        JSON.stringify(value, null, 2);

      await copyToClipboard(textToCopy);

      setIsAnimating(true);
      setCopied(true);
      onCopy?.(value, path);

      // Reset states after animation
      setTimeout(() => {
        setCopied(false);
        setIsAnimating(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
      setIsAnimating(false);
    }
  }, [value, path, type, onCopy, isAnimating]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy(e as any);
    }
  }, [handleCopy]);

  const sizeMap = {
    sm: { button: 20, icon: 12, padding: 4 },
    md: { button: 24, icon: 14, padding: 5 },
    lg: { button: 28, icon: 16, padding: 6 }
  };

  const variantMap = {
    primary: {
      base: 'rgba(91, 124, 153, 0.1)', // --color-primary with alpha
      hover: 'rgba(91, 124, 153, 0.2)',
      color: '#5b7c99',
      success: '#5cb85c'
    },
    secondary: {
      base: 'rgba(92, 184, 92, 0.1)', // --color-secondary with alpha
      hover: 'rgba(92, 184, 92, 0.2)',
      color: '#5cb85c',
      success: '#4ba94b'
    },
    accent: {
      base: 'rgba(139, 92, 246, 0.1)', // --color-accent with alpha
      hover: 'rgba(139, 92, 246, 0.2)',
      color: '#8b5cf6',
      success: '#5cb85c'
    }
  };

  const currentSize = sizeMap[size];
  const currentVariant = variantMap[variant];
  const iconSize = currentSize.icon;

  return (
    <button
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      className={`copy-button copy-button--${variant} copy-button--${size} ${copied ? 'copy-button--copied' : ''} ${className}`}
      style={{
        position: 'relative',
        width: currentSize.button,
        height: currentSize.button,
        padding: currentSize.padding,
        border: 'none',
        borderRadius: '6px',
        cursor: copied ? 'default' : 'pointer',
        background: copied ? 'rgba(92, 184, 92, 0.15)' : currentVariant.base,
        color: copied ? currentVariant.success : currentVariant.color,
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isAnimating ? 'scale(0.9)' : 'scale(1)',
        outline: 'none',
        ...(copied && {
          animation: 'copySuccess 0.4s ease'
        })
      }}
      title={copied ? 'Copied!' : (label || (type === 'path' ? 'Copy JSON path' : 'Copy value'))}
      aria-label={copied ? 'Copied to clipboard' : (label || (type === 'path' ? 'Copy JSON path' : 'Copy value'))}
      tabIndex={0}
      onMouseEnter={(e) => {
        if (!copied) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'scale(1.15)';
          (e.target as HTMLElement).style.background = currentVariant.hover;
          (e.target as HTMLElement).style.boxShadow = `0 2px 8px ${currentVariant.color}33`;
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          (e.target as HTMLElement).style.opacity = '0.7';
          (e.target as HTMLElement).style.transform = 'scale(1)';
          (e.target as HTMLElement).style.background = currentVariant.base;
          (e.target as HTMLElement).style.boxShadow = 'none';
        }
      }}
      onFocus={(e) => {
        (e.target as HTMLElement).style.outline = `2px solid ${currentVariant.color}`;
        (e.target as HTMLElement).style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        (e.target as HTMLElement).style.outline = 'none';
      }}
    >
      {copied ? (
        <CheckIcon size={iconSize} />
      ) : type === 'path' ? (
        <PathIcon size={iconSize} />
      ) : (
        <CopyIcon size={iconSize} />
      )}
    </button>
  );
}

// Compact version for inline use
export function InlineCopyButton({
  value,
  path,
  type = 'value',
  className = '',
  onCopy
}: Pick<CopyButtonProps, 'value' | 'path' | 'type' | 'className' | 'onCopy'>) {
  return (
    <CopyButton
      value={value}
      path={path}
      type={type}
      variant="accent"
      size="sm"
      className={`inline-copy ${className}`}
      onCopy={onCopy}
    />
  );
}