import type { UserPreferences, ToolHistory, ToolConfig } from '../../types';

const STORAGE_KEYS = {
  PREFERENCES: 'freeformathub:preferences',
  HISTORY: 'freeformathub:history',
  FAVORITES: 'freeformathub:favorites',
} as const;

export class LocalStorageManager {
  private static instance: LocalStorageManager;

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  private isStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getPreferences(): UserPreferences {
    if (!this.isStorageAvailable()) {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
    
    return this.getDefaultPreferences();
  }

  savePreferences(preferences: Partial<UserPreferences>): void {
    if (!this.isStorageAvailable()) return;

    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }

  getSidebarExpandedCategories(): string[] {
    const preferences = this.getPreferences();
    return preferences.sidebarExpandedCategories || [];
  }

  saveSidebarExpandedCategories(categoryIds: string[]): void {
    this.savePreferences({
      sidebarExpandedCategories: Array.from(new Set(categoryIds))
    });
  }

  addToHistory(entry: Omit<ToolHistory, 'id'>): void {
    if (!this.isStorageAvailable()) return;

    try {
      const history = this.getHistory();
      const newEntry: ToolHistory = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      // Keep only last 100 entries
      const updatedHistory = [newEntry, ...(history || []).slice(0, 99)];
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

      // Update recent tools
      this.updateRecentTools(entry.toolId);
    } catch (error) {
      console.warn('Failed to save history to localStorage:', error);
    }
  }

  getHistory(): ToolHistory[] {
    if (!this.isStorageAvailable()) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error);
      return [];
    }
  }

  clearHistory(): void {
    if (!this.isStorageAvailable()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
      console.warn('Failed to clear history from localStorage:', error);
    }
  }

  addToFavorites(toolId: string): void {
    const preferences = this.getPreferences();
    const favoriteTools = preferences.favoriteTools || [];
    if (!favoriteTools.includes(toolId)) {
      const updated = {
        ...preferences,
        favoriteTools: [...favoriteTools, toolId],
      };
      this.savePreferences(updated);
    }
  }

  removeFromFavorites(toolId: string): void {
    const preferences = this.getPreferences();
    const favoriteTools = preferences.favoriteTools || [];
    const updated = {
      ...preferences,
      favoriteTools: favoriteTools.filter(id => id !== toolId),
    };
    this.savePreferences(updated);
  }

  private updateRecentTools(toolId: string): void {
    const preferences = this.getPreferences();
    const recentTools = preferences.recentTools || [];
    const recent = recentTools.filter(id => id !== toolId);
    recent.unshift(toolId);
    
    // Keep only last 20 recent tools
    const updated = {
      ...preferences,
      recentTools: recent.slice(0, 20),
    };
    this.savePreferences(updated);
  }

  markToolAsRecent(toolId: string): void {
    this.updateRecentTools(toolId);
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      defaultConfigs: {},
      favoriteTools: [],
      recentTools: [],
      history: [],
      sidebarExpandedCategories: [],
    };
  }

  saveToolConfig(toolId: string, config: ToolConfig): void {
    const preferences = this.getPreferences();
    const updated = {
      ...preferences,
      defaultConfigs: {
        ...preferences.defaultConfigs,
        [toolId]: config,
      },
    };
    this.savePreferences(updated);
  }

  getToolConfig(toolId: string): ToolConfig | undefined {
    const preferences = this.getPreferences();
    return preferences.defaultConfigs[toolId];
  }
}
