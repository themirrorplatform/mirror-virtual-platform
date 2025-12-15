/**
 * Reflection Linking Service
 * 
 * Constitutional Principles:
 * - Non-linear connections (beyond threads)
 * - User-created links only
 * - Emergent structure, not imposed
 * - Graph view available but optional
 */

export interface ReflectionLink {
  id: string;
  fromReflectionId: string;
  toReflectionId: string;
  type: 'connects_to' | 'contradicts' | 'builds_on' | 'questions' | 'custom';
  customLabel?: string;
  note?: string;
  createdAt: Date;
}

export interface ReflectionGraph {
  nodes: Array<{
    id: string;
    label: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    type: ReflectionLink['type'];
    label?: string;
  }>;
}

class ReflectionLinksService {
  private readonly STORAGE_KEY = 'mirror_reflection_links';
  private links: ReflectionLink[] = [];

  constructor() {
    this.loadLinks();
  }

  /**
   * Load links from localStorage
   */
  private loadLinks(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.links = parsed.map((link: any) => ({
          ...link,
          createdAt: new Date(link.createdAt),
        }));
      } catch {
        this.links = [];
      }
    }
  }

  /**
   * Save links to localStorage
   */
  private saveLinks(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.links));
  }

  /**
   * Create a link between reflections
   */
  createLink(
    fromReflectionId: string,
    toReflectionId: string,
    type: ReflectionLink['type'],
    options?: {
      customLabel?: string;
      note?: string;
    }
  ): ReflectionLink {
    const link: ReflectionLink = {
      id: crypto.randomUUID(),
      fromReflectionId,
      toReflectionId,
      type,
      customLabel: options?.customLabel,
      note: options?.note,
      createdAt: new Date(),
    };

    this.links.push(link);
    this.saveLinks();

    return link;
  }

  /**
   * Delete a link
   */
  deleteLink(linkId: string): void {
    this.links = this.links.filter(l => l.id !== linkId);
    this.saveLinks();
  }

  /**
   * Get all links for a reflection
   */
  getLinksForReflection(reflectionId: string): {
    outgoing: ReflectionLink[];
    incoming: ReflectionLink[];
  } {
    return {
      outgoing: this.links.filter(l => l.fromReflectionId === reflectionId),
      incoming: this.links.filter(l => l.toReflectionId === reflectionId),
    };
  }

  /**
   * Get connected reflections (direct connections only)
   */
  getConnectedReflections(reflectionId: string): string[] {
    const { outgoing, incoming } = this.getLinksForReflection(reflectionId);
    
    const connected = new Set<string>();
    outgoing.forEach(l => connected.add(l.toReflectionId));
    incoming.forEach(l => connected.add(l.fromReflectionId));
    
    return Array.from(connected);
  }

  /**
   * Build graph for visualization
   */
  buildGraph(reflectionIds: string[]): ReflectionGraph {
    const idSet = new Set(reflectionIds);
    
    // Filter links to only include those between provided reflections
    const relevantLinks = this.links.filter(
      l => idSet.has(l.fromReflectionId) && idSet.has(l.toReflectionId)
    );

    // Create nodes
    const nodes = reflectionIds.map(id => ({
      id,
      label: id.substring(0, 8), // Short label
    }));

    // Create edges
    const edges = relevantLinks.map(link => ({
      id: link.id,
      from: link.fromReflectionId,
      to: link.toReflectionId,
      type: link.type,
      label: link.customLabel || this.getTypeLabeltext(link.type),
    }));

    return { nodes, edges };
  }

  /**
   * Find path between two reflections
   */
  findPath(
    fromId: string,
    toId: string,
    maxDepth: number = 5
  ): string[] | null {
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [
      { id: fromId, path: [fromId] }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.path.length > maxDepth) continue;
      if (visited.has(current.id)) continue;
      
      visited.add(current.id);

      if (current.id === toId) {
        return current.path;
      }

      const connected = this.getConnectedReflections(current.id);
      for (const nextId of connected) {
        if (!visited.has(nextId)) {
          queue.push({
            id: nextId,
            path: [...current.path, nextId],
          });
        }
      }
    }

    return null;
  }

  /**
   * Get all links
   */
  getAllLinks(): ReflectionLink[] {
    return [...this.links];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalLinks: number;
    linksByType: Record<ReflectionLink['type'], number>;
    mostConnectedReflection: { id: string; connectionCount: number } | null;
  } {
    const linksByType: Record<ReflectionLink['type'], number> = {
      connects_to: 0,
      contradicts: 0,
      builds_on: 0,
      questions: 0,
      custom: 0,
    };

    for (const link of this.links) {
      linksByType[link.type]++;
    }

    // Find most connected reflection
    const connectionCounts = new Map<string, number>();
    for (const link of this.links) {
      connectionCounts.set(
        link.fromReflectionId,
        (connectionCounts.get(link.fromReflectionId) || 0) + 1
      );
      connectionCounts.set(
        link.toReflectionId,
        (connectionCounts.get(link.toReflectionId) || 0) + 1
      );
    }

    let mostConnected: { id: string; connectionCount: number } | null = null;
    for (const [id, count] of connectionCounts.entries()) {
      if (!mostConnected || count > mostConnected.connectionCount) {
        mostConnected = { id, connectionCount: count };
      }
    }

    return {
      totalLinks: this.links.length,
      linksByType,
      mostConnectedReflection: mostConnected,
    };
  }

  /**
   * Get human-readable label for link type
   */
  private getTypeLabeltext(type: ReflectionLink['type']): string {
    switch (type) {
      case 'connects_to': return 'connects to';
      case 'contradicts': return 'contradicts';
      case 'builds_on': return 'builds on';
      case 'questions': return 'questions';
      case 'custom': return '';
    }
  }

  /**
   * Export links
   */
  exportLinks(): string {
    return JSON.stringify(this.links, null, 2);
  }

  /**
   * Import links
   */
  importLinks(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.links = parsed.map((link: any) => ({
        ...link,
        createdAt: new Date(link.createdAt),
      }));
      this.saveLinks();
    } catch (error) {
      throw new Error('Invalid links data');
    }
  }
}

// Singleton instance
export const reflectionLinks = new ReflectionLinksService();
