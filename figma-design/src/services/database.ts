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

  // Reflections
  async addReflection(reflection: Reflection): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readwrite');
    const store = tx.objectStore('reflections');
    await store.add(reflection);
    return tx.complete as unknown as Promise<void>;
  }

  async getReflection(id: string): Promise<Reflection | null> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readonly');
    const store = tx.objectStore('reflections');
    return store.get(id) as unknown as Promise<Reflection | null>;
  }

  async getAllReflections(): Promise<Reflection[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readonly');
    const store = tx.objectStore('reflections');
    return store.getAll() as unknown as Promise<Reflection[]>;
  }

  async getReflectionsByThread(threadId: string): Promise<Reflection[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readonly');
    const store = tx.objectStore('reflections');
    const index = store.index('threadId');
    return index.getAll(threadId) as unknown as Promise<Reflection[]>;
  }

  async updateReflection(reflection: Reflection): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readwrite');
    const store = tx.objectStore('reflections');
    await store.put(reflection);
    return tx.complete as unknown as Promise<void>;
  }

  async deleteReflection(id: string): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('reflections', 'readwrite');
    const store = tx.objectStore('reflections');
    await store.delete(id);
    return tx.complete as unknown as Promise<void>;
  }

  // Threads
  async addThread(thread: Thread): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('threads', 'readwrite');
    const store = tx.objectStore('threads');
    await store.add(thread);
    return tx.complete as unknown as Promise<void>;
  }

  async getThread(id: string): Promise<Thread | null> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('threads', 'readonly');
    const store = tx.objectStore('threads');
    return store.get(id) as unknown as Promise<Thread | null>;
  }

  async getAllThreads(): Promise<Thread[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('threads', 'readonly');
    const store = tx.objectStore('threads');
    return store.getAll() as unknown as Promise<Thread[]>;
  }

  async updateThread(thread: Thread): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('threads', 'readwrite');
    const store = tx.objectStore('threads');
    await store.put(thread);
    return tx.complete as unknown as Promise<void>;
  }

  async deleteThread(id: string): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('threads', 'readwrite');
    const store = tx.objectStore('threads');
    await store.delete(id);
    return tx.complete as unknown as Promise<void>;
  }

  // Identity Axes
  async addIdentityAxis(axis: IdentityAxis): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('identityAxes', 'readwrite');
    const store = tx.objectStore('identityAxes');
    await store.add(axis);
    return tx.complete as unknown as Promise<void>;
  }

  async getAllIdentityAxes(): Promise<IdentityAxis[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('identityAxes', 'readonly');
    const store = tx.objectStore('identityAxes');
    return store.getAll() as unknown as Promise<IdentityAxis[]>;
  }

  async updateIdentityAxis(axis: IdentityAxis): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('identityAxes', 'readwrite');
    const store = tx.objectStore('identityAxes');
    await store.put(axis);
    return tx.complete as unknown as Promise<void>;
  }

  async deleteIdentityAxis(id: string): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('identityAxes', 'readwrite');
    const store = tx.objectStore('identityAxes');
    await store.delete(id);
    return tx.complete as unknown as Promise<void>;
  }

  // Settings
  async getSettings(): Promise<UserSettings | null> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    return store.get('user-settings') as unknown as Promise<UserSettings | null>;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    await store.put({ id: 'user-settings', ...settings });
    return tx.complete as unknown as Promise<void>;
  }

  // Consent
  async addConsent(consent: ConsentRecord): Promise<void> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('consent', 'readwrite');
    const store = tx.objectStore('consent');
    await store.add(consent);
    return tx.complete as unknown as Promise<void>;
  }

  async getAllConsent(): Promise<ConsentRecord[]> {
    await this.ensureInitialized();
    const tx = this.db!.transaction('consent', 'readonly');
    const store = tx.objectStore('consent');
    return store.getAll() as unknown as Promise<ConsentRecord[]>;
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