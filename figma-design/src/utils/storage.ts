/**
 * StorageManager - Constitutional data persistence layer
 * Handles local-first storage with sovereignty guarantees
 */

export interface Reflection {
  id: string;
  text: string;
  timestamp: string;
  layer: 'sovereign' | 'commons' | 'builder';
  threadId?: string;
  worldviews: string[];
  mirrorback?: {
    text: string;
    timestamp: string;
  };
  metadata: {
    wordCount: number;
    hasVoice: boolean;
    hasVideo: boolean;
    isShared: boolean;
  };
}

export interface Thread {
  id: string;
  name: string;
  createdAt: string;
  lastUpdated: string;
  reflectionIds: string[];
  tensions: Tension[];
  contradictions: Contradiction[];
}

export interface Tension {
  id: string;
  label: string;
  reflectionIds: string[];
  intensity: 'low' | 'medium' | 'high';
  description: string;
  firstDetected: string;
}

export interface Contradiction {
  id: string;
  reflectionIdA: string;
  reflectionIdB: string;
  description: string;
  detectedAt: string;
}

export interface IdentityNode {
  id: string;
  label: string;
  strength: number;
  learningEnabled: boolean;
  relatedReflectionIds: string[];
  connections: Array<{
    nodeId: string;
    strength: number;
  }>;
  createdAt: string;
  lastUpdated: string;
}

export interface WorldPost {
  id: string;
  reflectionId: string;
  content: string;
  isAnonymous: boolean;
  publishedAt: string;
  witnessedBy: string[];
  responses: WorldResponse[];
}

export interface WorldResponse {
  id: string;
  postId: string;
  content: string;
  quotedText?: string;
  isAnonymous: boolean;
  respondedAt: string;
}

export interface ConstitutionalState {
  activeConstitution: string;
  amendments: Amendment[];
  speechDomains: SpeechDomain[];
  worldviews: Worldview[];
}

export interface Amendment {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'proposed' | 'active' | 'rejected';
  proposedAt: string;
  activatedAt?: string;
}

export interface SpeechDomain {
  id: string;
  name: string;
  allowed: boolean;
  customized: boolean;
}

export interface Worldview {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isPaused: boolean;
  activatedAt: string;
}

export interface UserSettings {
  crisisMode: boolean;
  commonsEnabled: boolean;
  defaultAnonymous: boolean;
  autoArchive: boolean;
  identityLearningEnabled: boolean;
}

class StorageManager {
  private static instance: StorageManager;
  private storageAvailable: boolean;

  private constructor() {
    this.storageAvailable = this.checkStorageAvailable();
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private checkStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('LocalStorage not available, using in-memory storage');
      return false;
    }
  }

  // Generic storage operations
  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.storageAvailable) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.storageAvailable) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e instanceof DOMException && e.code === 22) {
        console.error('Storage quota exceeded');
        // TODO: Trigger cleanup or export prompt
      }
      console.error(`Error writing ${key}:`, e);
    }
  }

  // Reflections
  getReflections(): Reflection[] {
    return this.getItem<Reflection[]>('mirror_reflections', []);
  }

  saveReflection(reflection: Reflection): void {
    const reflections = this.getReflections();
    const existingIndex = reflections.findIndex(r => r.id === reflection.id);
    
    if (existingIndex >= 0) {
      reflections[existingIndex] = reflection;
    } else {
      reflections.push(reflection);
    }
    
    this.setItem('mirror_reflections', reflections);
  }

  deleteReflection(id: string): void {
    const reflections = this.getReflections().filter(r => r.id !== id);
    this.setItem('mirror_reflections', reflections);
  }

  getReflectionsByThread(threadId: string): Reflection[] {
    return this.getReflections().filter(r => r.threadId === threadId);
  }

  // Threads
  getThreads(): Thread[] {
    return this.getItem<Thread[]>('mirror_threads', []);
  }

  saveThread(thread: Thread): void {
    const threads = this.getThreads();
    const existingIndex = threads.findIndex(t => t.id === thread.id);
    
    if (existingIndex >= 0) {
      threads[existingIndex] = thread;
    } else {
      threads.push(thread);
    }
    
    this.setItem('mirror_threads', threads);
  }

  deleteThread(id: string): void {
    const threads = this.getThreads().filter(t => t.id !== id);
    this.setItem('mirror_threads', threads);
  }

  linkReflectionToThread(reflectionId: string, threadId: string): void {
    // Update reflection
    const reflections = this.getReflections();
    const reflection = reflections.find(r => r.id === reflectionId);
    if (reflection) {
      reflection.threadId = threadId;
      this.setItem('mirror_reflections', reflections);
    }

    // Update thread
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread && !thread.reflectionIds.includes(reflectionId)) {
      thread.reflectionIds.push(reflectionId);
      thread.lastUpdated = new Date().toISOString();
      this.setItem('mirror_threads', threads);
    }
  }

  // Identity Graph
  getIdentityNodes(): IdentityNode[] {
    return this.getItem<IdentityNode[]>('mirror_identity_nodes', []);
  }

  saveIdentityNode(node: IdentityNode): void {
    const nodes = this.getIdentityNodes();
    const existingIndex = nodes.findIndex(n => n.id === node.id);
    
    if (existingIndex >= 0) {
      nodes[existingIndex] = node;
    } else {
      nodes.push(node);
    }
    
    this.setItem('mirror_identity_nodes', nodes);
  }

  deleteIdentityNode(id: string): void {
    const nodes = this.getIdentityNodes().filter(n => n.id !== id);
    this.setItem('mirror_identity_nodes', nodes);
  }

  // World/Commons
  getWorldPosts(): WorldPost[] {
    return this.getItem<WorldPost[]>('mirror_world_posts', []);
  }

  saveWorldPost(post: WorldPost): void {
    const posts = this.getWorldPosts();
    posts.unshift(post); // Add to beginning (newest first)
    this.setItem('mirror_world_posts', posts);
  }

  witnessPost(postId: string, userId: string = 'local_user'): void {
    const posts = this.getWorldPosts();
    const post = posts.find(p => p.id === postId);
    if (post && !post.witnessedBy.includes(userId)) {
      post.witnessedBy.push(userId);
      this.setItem('mirror_world_posts', posts);
    }
  }

  addResponse(response: WorldResponse): void {
    const posts = this.getWorldPosts();
    const post = posts.find(p => p.id === response.postId);
    if (post) {
      post.responses.push(response);
      this.setItem('mirror_world_posts', posts);
    }
  }

  // Constitutional State
  getConstitutionalState(): ConstitutionalState {
    return this.getItem<ConstitutionalState>('mirror_constitution', {
      activeConstitution: 'Core Constitution v1.0',
      amendments: [],
      speechDomains: [],
      worldviews: [],
    });
  }

  saveConstitutionalState(state: ConstitutionalState): void {
    this.setItem('mirror_constitution', state);
  }

  // Settings
  getSettings(): UserSettings {
    return this.getItem<UserSettings>('mirror_settings', {
      crisisMode: false,
      commonsEnabled: false,
      defaultAnonymous: false,
      autoArchive: false,
      identityLearningEnabled: true,
    });
  }

  saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    const settings = this.getSettings();
    settings[key] = value;
    this.setItem('mirror_settings', settings);
  }

  // Export all data
  exportAllData(): {
    reflections: Reflection[];
    threads: Thread[];
    identityNodes: IdentityNode[];
    worldPosts: WorldPost[];
    constitutionalState: ConstitutionalState;
    settings: UserSettings;
    exportedAt: string;
  } {
    return {
      reflections: this.getReflections(),
      threads: this.getThreads(),
      identityNodes: this.getIdentityNodes(),
      worldPosts: this.getWorldPosts(),
      constitutionalState: this.getConstitutionalState(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Import data (merge strategy)
  importData(data: ReturnType<typeof this.exportAllData>): void {
    if (data.reflections) {
      const existing = this.getReflections();
      const merged = [...existing];
      
      data.reflections.forEach(imported => {
        if (!merged.find(r => r.id === imported.id)) {
          merged.push(imported);
        }
      });
      
      this.setItem('mirror_reflections', merged);
    }

    if (data.threads) {
      const existing = this.getThreads();
      const merged = [...existing];
      
      data.threads.forEach(imported => {
        if (!merged.find(t => t.id === imported.id)) {
          merged.push(imported);
        }
      });
      
      this.setItem('mirror_threads', merged);
    }

    // Similar merging for other data types...
    if (data.identityNodes) {
      this.setItem('mirror_identity_nodes', data.identityNodes);
    }
    if (data.worldPosts) {
      this.setItem('mirror_world_posts', data.worldPosts);
    }
    if (data.constitutionalState) {
      this.setItem('mirror_constitution', data.constitutionalState);
    }
    if (data.settings) {
      this.setItem('mirror_settings', data.settings);
    }
  }

  // Clear all data (sovereignty requirement)
  clearAllData(): void {
    if (!this.storageAvailable) return;
    
    const keys = [
      'mirror_reflections',
      'mirror_threads',
      'mirror_identity_nodes',
      'mirror_world_posts',
      'mirror_constitution',
      'mirror_settings',
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
  }

  // Get storage usage estimate
  getStorageInfo(): { used: number; available: boolean } {
    if (!this.storageAvailable) {
      return { used: 0, available: false };
    }

    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('mirror_')) {
        total += localStorage[key].length + key.length;
      }
    }

    return {
      used: total,
      available: true,
    };
  }
}

export const storage = StorageManager.getInstance();
