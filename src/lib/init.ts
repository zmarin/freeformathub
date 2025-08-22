import { IndexedDBManager } from './storage';

export async function initializeApp() {
  // Initialize IndexedDB for large result caching
  try {
    const db = IndexedDBManager.getInstance();
    await db.initialize();
  } catch (error) {
    console.warn('Failed to initialize IndexedDB:', error);
  }
}

// Auto-initialize when in browser
if (typeof window !== 'undefined') {
  initializeApp();
}