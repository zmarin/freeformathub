import { create } from 'zustand';
import type { ToolConfig, ToolHistory, UserPreferences } from '../../types';
import { LocalStorageManager } from '../storage';

interface ToolStore {
  // State
  preferences: UserPreferences;
  currentTool: string | null;
  toolConfigs: Record<string, ToolConfig>;
  isLoading: boolean;
  
  // Actions
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setCurrentTool: (toolId: string | null) => void;
  setToolConfig: (toolId: string, config: ToolConfig) => void;
  getConfig: (toolId: string) => ToolConfig;
  updateConfig: (toolId: string, config: Partial<ToolConfig>) => void;
  addToHistory: (entry: Omit<ToolHistory, 'id'>) => void;
  addToFavorites: (toolId: string) => void;
  removeFromFavorites: (toolId: string) => void;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
}

const storage = LocalStorageManager.getInstance();

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  defaultConfigs: {},
  favoriteTools: [],
  recentTools: [],
  history: [],
};

export const useToolStore = create<ToolStore>((set, get) => ({
  // Initial state
  preferences: typeof window !== 'undefined' ? storage.getPreferences() : defaultPreferences,
  currentTool: null,
  toolConfigs: {},
  isLoading: false,

  // Actions
  setPreferences: (newPreferences) => {
    const updated = { ...get().preferences, ...newPreferences };
    storage.savePreferences(updated);
    set({ preferences: updated });
  },

  setCurrentTool: (toolId) => {
    set({ currentTool: toolId });
  },

  setToolConfig: (toolId, config) => {
    const configs = { ...get().toolConfigs, [toolId]: config };
    storage.saveToolConfig(toolId, config);
    set({ toolConfigs: configs });
  },

  getConfig: (toolId) => {
    const { toolConfigs, preferences } = get();
    return toolConfigs[toolId] || preferences.defaultConfigs[toolId] || {};
  },

  updateConfig: (toolId, configUpdate) => {
    const { toolConfigs } = get();
    const currentConfig = toolConfigs[toolId] || {};
    const newConfig = { ...currentConfig, ...configUpdate };
    const configs = { ...toolConfigs, [toolId]: newConfig };
    storage.saveToolConfig(toolId, newConfig);
    set({ toolConfigs: configs });
  },

  addToHistory: (entry) => {
    storage.addToHistory(entry);
    const preferences = storage.getPreferences();
    set({ preferences });
  },

  addToFavorites: (toolId) => {
    storage.addToFavorites(toolId);
    const preferences = storage.getPreferences();
    set({ preferences });
  },

  removeFromFavorites: (toolId) => {
    storage.removeFromFavorites(toolId);
    const preferences = storage.getPreferences();
    set({ preferences });
  },

  clearHistory: () => {
    storage.clearHistory();
    const preferences = storage.getPreferences();
    set({ preferences });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));