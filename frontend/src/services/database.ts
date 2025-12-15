/**
 * Database Layer - Local-first storage
 * 
 * Features:
 * - IndexedDB for persistence
 * - Type-safe operations
 * - Constitutional data sovereignty
 * - Full export/import support
 * - No external dependencies
 */

// Database Schema
export interface Reflection {
  id: string;
  content: string;
  encrypted?: boolean; // NEW: indicates if content is encrypted
  createdAt: Date;
  updatedAt: Date;
  layer: 'sovereign' | 'commons' | 'builder';
  modality: 'text' | 'voice' | 'video' | 'document';
  threadId?: string;
  tags?: string[];
  identityAxis?: string;
  worldviews?: string[];
  isPublic: boolean;
  metadata?: Record<string, any>;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  reflectionIds: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface IdentityAxis {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
  preferences: {
    defaultLayer: 'sovereign' | 'commons' | 'builder';
    defaultModality: 'text' | 'voice' | 'video' | 'document';
    particlesEnabled: boolean;
  };
}

export interface ConsentRecord {
  id: string;
  type: 'license' | 'constitution' | 'export' | 'commons';
  accepted: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Database Service
class MirrorDatabase {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'mirror-db';
  private readonly version = 1;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Reflections store
        if (!db.objectStoreNames.contains('reflections')) {
          const reflectionStore = db.createObjectStore('reflections', { keyPath: 'id' });
          reflectionStore.createIndex('createdAt', 'createdAt', { unique: false });
          reflectionStore.createIndex('threadId', 'threadId', { unique: false });
          reflectionStore.createIndex('layer', 'layer', { unique: false });
          reflectionStore.createIndex('isPublic', 'isPublic', { unique: false });
        }

        // Threads store
        if (!db.objectStoreNames.contains('threads')) {
          const threadStore = db.createObjectStore('threads', { keyPath: 'id' });
          threadStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Identity Axes store
        if (!db.objectStoreNames.contains('identityAxes')) {
          db.createObjectStore('identityAxes', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Consent store
        if (!db.objectStoreNames.contains('consent')) {
          const consentStore = db.createObjectStore('consent', { keyPath: 'id' });
          consentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Helper to ensure DB is initialized before operations
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  // Helper to deserialize dates from IndexedDB
  private deserializeDates<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };
    if (result.createdAt && typeof result.createdAt === 'string') {
      result.createdAt = new Date(result.createdAt);
    }
    if (result.updatedAt && typeof result.updatedAt === 'string') {
      result.updatedAt = new Date(result.updatedAt);
    }
    if (result.timestamp && typeof result.timestamp === 'string') {
      result.timestamp = new Date(result.timestamp);
    }
    return result;
  }

  // Helper to validate reflection data
  private validateReflection(reflection: Reflection): void {
    if (!reflection.id) throw new Error('Reflection must have an ID');
    if (!reflection.content) throw new Error('Reflection must have content');
    if (!['sovereign', 'commons', 'builder'].includes(reflection.layer)) {
      throw new Error('Invalid layer');
    }
    if (!['text', 'voice', 'video', 'document'].includes(reflection.modality)) {
      throw new Error('Invalid modality');
    }
  }

  // Reflections
  async addReflection(reflection: Reflection): Promise<void> {
    await this.ensureInitialized();
    this.validateReflection(reflection);
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readwrite');
      const store = tx.objectStore('reflections');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.add(reflection);
    });
  }

  async getReflection(id: string): Promise<Reflection | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readonly');
      const store = tx.objectStore('reflections');
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? this.deserializeDates<Reflection>(result) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllReflections(): Promise<Reflection[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readonly');
      const store = tx.objectStore('reflections');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map(r => this.deserializeDates<Reflection>(r)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getReflectionsByThread(threadId: string): Promise<Reflection[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readonly');
      const store = tx.objectStore('reflections');
      const index = store.index('threadId');
      const request = index.getAll(threadId);
      
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map(r => this.deserializeDates<Reflection>(r)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateReflection(reflection: Reflection): Promise<void> {
    await this.ensureInitialized();
    this.validateReflection(reflection);
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readwrite');
      const store = tx.objectStore('reflections');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.put(reflection);
    });
  }

  async deleteReflection(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('reflections', 'readwrite');
      const store = tx.objectStore('reflections');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.delete(id);
    });
  }

  // Threads
  async addThread(thread: Thread): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('threads', 'readwrite');
      const store = tx.objectStore('threads');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.add(thread);
    });
  }

  async getThread(id: string): Promise<Thread | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('threads', 'readonly');
      const store = tx.objectStore('threads');
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? this.deserializeDates<Thread>(result) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllThreads(): Promise<Thread[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('threads', 'readonly');
      const store = tx.objectStore('threads');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map(t => this.deserializeDates<Thread>(t)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateThread(thread: Thread): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('threads', 'readwrite');
      const store = tx.objectStore('threads');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.put(thread);
    });
  }

  async deleteThread(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('threads', 'readwrite');
      const store = tx.objectStore('threads');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.delete(id);
    });
  }

  // Identity Axes
  async addIdentityAxis(axis: IdentityAxis): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('identityAxes', 'readwrite');
      const store = tx.objectStore('identityAxes');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.add(axis);
    });
  }

  async getAllIdentityAxes(): Promise<IdentityAxis[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('identityAxes', 'readonly');
      const store = tx.objectStore('identityAxes');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map(a => this.deserializeDates<IdentityAxis>(a)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateIdentityAxis(axis: IdentityAxis): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('identityAxes', 'readwrite');
      const store = tx.objectStore('identityAxes');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.put(axis);
    });
  }

  async deleteIdentityAxis(id: string): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('identityAxes', 'readwrite');
      const store = tx.objectStore('identityAxes');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.delete(id);
    });
  }

  // Settings
  async getSettings(): Promise<UserSettings | null> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get('user-settings');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove the 'id' field that we add for storage
          const { id, ...settings } = result;
          resolve(settings as UserSettings);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.put({ id: 'user-settings', ...settings });
    });
  }

  // Consent
  async addConsent(consent: ConsentRecord): Promise<void> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('consent', 'readwrite');
      const store = tx.objectStore('consent');
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
      
      store.add(consent);
    });
  }

  async getAllConsent(): Promise<ConsentRecord[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('consent', 'readonly');
      const store = tx.objectStore('consent');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.map(c => this.deserializeDates<ConsentRecord>(c)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Export all data
  async exportAll(): Promise<{
    reflections: Reflection[];
    threads: Thread[];
    identityAxes: IdentityAxis[];
    settings: UserSettings | null;
    consent: ConsentRecord[];
    exportedAt: Date;
  }> {
    const [reflections, threads, identityAxes, settings, consent] = await Promise.all([
      this.getAllReflections(),
      this.getAllThreads(),
      this.getAllIdentityAxes(),
      this.getSettings(),
      this.getAllConsent(),
    ]);

    return {
      reflections,
      threads,
      identityAxes,
      settings,
      consent,
      exportedAt: new Date(),
    };
  }

  // Import all data
  async importAll(data: {
    reflections?: Reflection[];
    threads?: Thread[];
    identityAxes?: IdentityAxis[];
    settings?: UserSettings;
    consent?: ConsentRecord[];
  }): Promise<void> {
    // Import reflections
    if (data.reflections) {
      for (const reflection of data.reflections) {
        await this.addReflection(reflection);
      }
    }

    // Import threads
    if (data.threads) {
      for (const thread of data.threads) {
        await this.addThread(thread);
      }
    }

    // Import identity axes
    if (data.identityAxes) {
      for (const axis of data.identityAxes) {
        await this.addIdentityAxis(axis);
      }
    }

    // Import settings
    if (data.settings) {
      await this.saveSettings(data.settings);
    }

    // Import consent
    if (data.consent) {
      for (const consent of data.consent) {
        await this.addConsent(consent);
      }
    }
  }

  // Clear all data (dangerous!)
  async clearAll(): Promise<void> {
    const stores = ['reflections', 'threads', 'identityAxes', 'settings', 'consent'];
    for (const storeName of stores) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }
  }
}

// Singleton instance
export const db = new MirrorDatabase();

// Initialize on import
if (typeof window !== 'undefined') {
  db.init().catch(console.error);
}