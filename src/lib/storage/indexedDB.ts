interface CacheEntry {
  id: string;
  toolId: string;
  input: string;
  output: string;
  timestamp: number;
  size: number;
}

export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private dbName = 'FreeFormatHubCache';
  private version = 1;

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  async initialize(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.warn('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create cache store for large results
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
          cacheStore.createIndex('toolId', 'toolId');
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async cacheResult(toolId: string, input: string, output: string): Promise<void> {
    if (!this.db || output.length < 10000) {
      // Only cache large results (>10KB)
      return;
    }

    try {
      const entry: CacheEntry = {
        id: `${toolId}-${this.hashString(input)}`,
        toolId,
        input,
        output,
        timestamp: Date.now(),
        size: output.length,
      };

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put(entry);

      // Clean old entries to keep cache under 50MB
      await this.cleanCache();
    } catch (error) {
      console.warn('Failed to cache result:', error);
    }
  }

  async getCachedResult(toolId: string, input: string): Promise<string | null> {
    if (!this.db) return null;

    try {
      const id = `${toolId}-${this.hashString(input)}`;
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const result = await store.get(id);

      if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
        // Cache valid for 24 hours
        return result.output;
      }
    } catch (error) {
      console.warn('Failed to get cached result:', error);
    }

    return null;
  }

  private async cleanCache(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      
      // Get all entries sorted by timestamp
      const entries: CacheEntry[] = [];
      const cursor = await index.openCursor();
      
      if (cursor) {
        do {
          entries.push(cursor.value);
        } while (cursor.continue());
      }

      // Calculate total size
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      const maxSize = 50 * 1024 * 1024; // 50MB

      if (totalSize > maxSize) {
        // Remove oldest entries
        entries.sort((a, b) => a.timestamp - b.timestamp);
        let currentSize = totalSize;
        
        for (const entry of entries) {
          if (currentSize <= maxSize * 0.8) break; // Keep under 80% of max
          
          await store.delete(entry.id);
          currentSize -= entry.size;
        }
      }
    } catch (error) {
      console.warn('Failed to clean cache:', error);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  async clearCache(): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}