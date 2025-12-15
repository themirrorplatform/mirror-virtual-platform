/**
 * Reflection Versioning Service
 * 
 * Constitutional Principles:
 * - Optional version history
 * - User controls versioning
 * - See evolution of thought
 * - Diff view available
 * - Never automatic versioning (user-initiated saves only)
 */

export interface ReflectionVersion {
  id: string;
  reflectionId: string;
  content: string;
  versionNumber: number;
  createdAt: Date;
  note?: string;
  changedBy?: 'user' | 'merge' | 'restore';
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

class ReflectionVersioningService {
  private readonly STORAGE_KEY = 'mirror_reflection_versions';
  private readonly ENABLED_KEY = 'mirror_versioning_enabled';
  private versions: ReflectionVersion[] = [];

  constructor() {
    this.loadVersions();
  }

  /**
   * Load versions from localStorage
   */
  private loadVersions(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.versions = parsed.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt),
        }));
      } catch {
        this.versions = [];
      }
    }
  }

  /**
   * Save versions to localStorage
   */
  private saveVersions(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.versions));
  }

  /**
   * Check if versioning is enabled
   */
  isEnabled(): boolean {
    return localStorage.getItem(this.ENABLED_KEY) === 'true';
  }

  /**
   * Enable versioning
   */
  enable(): void {
    localStorage.setItem(this.ENABLED_KEY, 'true');
  }

  /**
   * Disable versioning
   */
  disable(): void {
    localStorage.removeItem(this.ENABLED_KEY);
  }

  /**
   * Create a version snapshot
   * Constitutional: Only when user explicitly saves
   */
  createVersion(
    reflectionId: string,
    content: string,
    options?: {
      note?: string;
      changedBy?: ReflectionVersion['changedBy'];
    }
  ): ReflectionVersion {
    if (!this.isEnabled()) {
      throw new Error('Versioning not enabled');
    }

    const existingVersions = this.getVersions(reflectionId);
    const versionNumber = existingVersions.length + 1;

    const version: ReflectionVersion = {
      id: crypto.randomUUID(),
      reflectionId,
      content,
      versionNumber,
      createdAt: new Date(),
      note: options?.note,
      changedBy: options?.changedBy || 'user',
    };

    this.versions.push(version);
    this.saveVersions();

    return version;
  }

  /**
   * Get all versions for a reflection
   */
  getVersions(reflectionId: string): ReflectionVersion[] {
    return this.versions
      .filter(v => v.reflectionId === reflectionId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  /**
   * Get specific version
   */
  getVersion(versionId: string): ReflectionVersion | null {
    return this.versions.find(v => v.id === versionId) || null;
  }

  /**
   * Delete version
   */
  deleteVersion(versionId: string): void {
    this.versions = this.versions.filter(v => v.id !== versionId);
    this.saveVersions();
  }

  /**
   * Delete all versions for a reflection
   */
  deleteAllVersions(reflectionId: string): void {
    this.versions = this.versions.filter(v => v.reflectionId !== reflectionId);
    this.saveVersions();
  }

  /**
   * Compare two versions (simple diff)
   */
  diff(version1: string, version2: string): DiffSegment[] {
    const segments: DiffSegment[] = [];
    
    // Simple word-level diff
    const words1 = version1.split(/\s+/);
    const words2 = version2.split(/\s+/);

    // Very basic diff algorithm (could be improved with Myers diff)
    let i1 = 0;
    let i2 = 0;

    while (i1 < words1.length || i2 < words2.length) {
      if (i1 >= words1.length) {
        // Remaining words in version2 are additions
        segments.push({
          type: 'added',
          text: words2.slice(i2).join(' '),
        });
        break;
      }

      if (i2 >= words2.length) {
        // Remaining words in version1 are removals
        segments.push({
          type: 'removed',
          text: words1.slice(i1).join(' '),
        });
        break;
      }

      if (words1[i1] === words2[i2]) {
        // Words match
        segments.push({
          type: 'unchanged',
          text: words1[i1],
        });
        i1++;
        i2++;
      } else {
        // Words differ - check if word exists later
        const foundIn2 = words2.indexOf(words1[i1], i2);
        const foundIn1 = words1.indexOf(words2[i2], i1);

        if (foundIn2 !== -1 && (foundIn1 === -1 || foundIn2 < foundIn1)) {
          // Word from v1 found later in v2 - words in between are additions
          segments.push({
            type: 'added',
            text: words2.slice(i2, foundIn2).join(' '),
          });
          i2 = foundIn2;
        } else if (foundIn1 !== -1) {
          // Word from v2 found later in v1 - words in between are removals
          segments.push({
            type: 'removed',
            text: words1.slice(i1, foundIn1).join(' '),
          });
          i1 = foundIn1;
        } else {
          // No match - treat as replacement
          segments.push({
            type: 'removed',
            text: words1[i1],
          });
          segments.push({
            type: 'added',
            text: words2[i2],
          });
          i1++;
          i2++;
        }
      }
    }

    // Merge consecutive segments of same type
    return this.mergeSegments(segments);
  }

  /**
   * Merge consecutive diff segments of same type
   */
  private mergeSegments(segments: DiffSegment[]): DiffSegment[] {
    const merged: DiffSegment[] = [];
    let current: DiffSegment | null = null;

    for (const segment of segments) {
      if (!current) {
        current = segment;
      } else if (current.type === segment.type) {
        current.text += ' ' + segment.text;
      } else {
        merged.push(current);
        current = segment;
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  }

  /**
   * Get version statistics
   */
  getStats(reflectionId: string): {
    totalVersions: number;
    firstVersion: Date | null;
    lastVersion: Date | null;
    totalChanges: number;
  } {
    const versions = this.getVersions(reflectionId);

    if (versions.length === 0) {
      return {
        totalVersions: 0,
        firstVersion: null,
        lastVersion: null,
        totalChanges: 0,
      };
    }

    return {
      totalVersions: versions.length,
      firstVersion: versions[0].createdAt,
      lastVersion: versions[versions.length - 1].createdAt,
      totalChanges: versions.length - 1,
    };
  }

  /**
   * Get all versions across all reflections
   */
  getAllVersions(): ReflectionVersion[] {
    return [...this.versions];
  }

  /**
   * Clear all versions
   */
  clearAll(): void {
    this.versions = [];
    this.saveVersions();
  }
}

// Singleton instance
export const reflectionVersioning = new ReflectionVersioningService();
