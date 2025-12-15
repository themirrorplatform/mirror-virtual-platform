/**
 * Migration Service - Schema Evolution
 * 
 * Constitutional Principles:
 * - Never lose user data during upgrades
 * - Always backward compatible
 * - User can export before migration
 * - Transparent about what changes
 */

import { db } from './database';

export interface Migration {
  version: number;
  name: string;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

class MigrationService {
  private readonly CURRENT_VERSION = 1;
  private readonly VERSION_KEY = 'mirror_schema_version';

  /**
   * Get current schema version
   */
  getCurrentVersion(): number {
    const stored = localStorage.getItem(this.VERSION_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Set schema version
   */
  private setVersion(version: number): void {
    localStorage.setItem(this.VERSION_KEY, version.toString());
  }

  /**
   * All migrations in order
   */
  private migrations: Migration[] = [
    {
      version: 1,
      name: 'Initial Schema',
      description: 'Create base tables for reflections, threads, and identity axes',
      up: async () => {
        // Already created in database.ts
        // This is a no-op for existing users
      },
    },
    // Future migrations will go here
  ];

  /**
   * Check if migration is needed
   */
  needsMigration(): boolean {
    return this.getCurrentVersion() < this.CURRENT_VERSION;
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    const currentVersion = this.getCurrentVersion();
    return this.migrations.filter(m => m.version > currentVersion);
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<{
    success: boolean;
    migrationsRun: number;
    errors: string[];
  }> {
    const pending = this.getPendingMigrations();
    const errors: string[] = [];
    let migrationsRun = 0;

    for (const migration of pending) {
      try {
        console.log(`Running migration: ${migration.name} (v${migration.version})`);
        await migration.up();
        this.setVersion(migration.version);
        migrationsRun++;
      } catch (error) {
        const errorMsg = `Migration ${migration.name} failed: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // Stop on first error (don't partially migrate)
        break;
      }
    }

    return {
      success: errors.length === 0,
      migrationsRun,
      errors,
    };
  }

  /**
   * Rollback to specific version
   * (Constitutional: user should be able to undo)
   */
  async rollback(targetVersion: number): Promise<void> {
    const currentVersion = this.getCurrentVersion();
    
    if (targetVersion >= currentVersion) {
      throw new Error('Target version must be lower than current version');
    }

    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();

    for (const migration of migrationsToRollback) {
      if (migration.down) {
        console.log(`Rolling back: ${migration.name} (v${migration.version})`);
        await migration.down();
      }
    }

    this.setVersion(targetVersion);
  }

  /**
   * Get migration history
   */
  getHistory(): {
    currentVersion: number;
    latestVersion: number;
    migrations: Array<{
      version: number;
      name: string;
      description: string;
      applied: boolean;
    }>;
  } {
    const currentVersion = this.getCurrentVersion();

    return {
      currentVersion,
      latestVersion: this.CURRENT_VERSION,
      migrations: this.migrations.map(m => ({
        version: m.version,
        name: m.name,
        description: m.description,
        applied: m.version <= currentVersion,
      })),
    };
  }
}

// Singleton instance
export const migrationService = new MigrationService();
