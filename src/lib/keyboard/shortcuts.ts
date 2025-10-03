import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

interface KeyboardShortcutOptions {
  enabled?: boolean;
  scope?: string;
}

/**
 * Hook to register keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut configurations
 * @param options Options for shortcut handling
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutOptions = {}
) {
  const { enabled = true, scope = 'global' } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields (unless explicitly allowed)
      const target = event.target as HTMLElement;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (isInputField && !target.dataset.allowShortcuts) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl;
        const shiftMatches = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
        const altMatches = shortcut.alt === undefined || event.altKey === shortcut.alt;
        const metaMatches = shortcut.meta === undefined || event.metaKey === shortcut.meta;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Format a shortcut key combination for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('⌘');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Get platform-specific modifier key
 */
export function getPlatformModifier(): 'Ctrl' | '⌘' {
  return typeof window !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

/**
 * Create a shortcut configuration with platform-aware modifiers
 */
export function createShortcut(
  key: string,
  action: () => void,
  options: {
    description: string;
    shift?: boolean;
    alt?: boolean;
    useMeta?: boolean; // Use Cmd on Mac, Ctrl on Windows/Linux
  }
): KeyboardShortcut {
  const isMac = typeof window !== 'undefined' && /Mac/.test(navigator.platform);

  return {
    key,
    ctrl: options.useMeta ? !isMac : undefined,
    meta: options.useMeta ? isMac : undefined,
    shift: options.shift,
    alt: options.alt,
    description: options.description,
    action,
    preventDefault: true,
  };
}

/**
 * Common shortcut presets
 */
export const CommonShortcuts = {
  copy: (action: () => void) => createShortcut('c', action, {
    description: 'Copy',
    useMeta: true,
  }),

  paste: (action: () => void) => createShortcut('v', action, {
    description: 'Paste',
    useMeta: true,
  }),

  save: (action: () => void) => createShortcut('s', action, {
    description: 'Save',
    useMeta: true,
  }),

  undo: (action: () => void) => createShortcut('z', action, {
    description: 'Undo',
    useMeta: true,
  }),

  redo: (action: () => void) => createShortcut('y', action, {
    description: 'Redo',
    useMeta: true,
  }),

  find: (action: () => void) => createShortcut('f', action, {
    description: 'Find',
    useMeta: true,
  }),

  escape: (action: () => void) => ({
    key: 'Escape',
    description: 'Close/Cancel',
    action,
    preventDefault: true,
  }),
};
