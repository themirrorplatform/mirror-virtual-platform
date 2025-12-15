/**
 * Integration Tests - Core Reflection Flow
 * 
 * Tests the complete user journey:
 * 1. Open app → Initialize database
 * 2. Create reflection → Save to database
 * 3. Generate mirrorback → AI integration
 * 4. Archive reflection → Retrieve from database
 * 5. Export data → Sovereignty verification
 * 
 * Constitutional verification: No engagement traps, user maintains sovereignty
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { databaseService } from '../../services/database';
import { stateManager } from '../../services/state';
import { autoRecoveryService } from '../../services/autoRecovery';
import { exportService } from '../../services/export';
import type { Reflection, Thread } from '../../types';

describe('Core Reflection Flow', () => {
  beforeEach(async () => {
    // Initialize database before each test
    await databaseService.init();
    await stateManager.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    autoRecoveryService.clearAll();
    // Note: IndexedDB cleanup happens automatically in test environment
  });

  describe('1. Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const isReady = databaseService.isInitialized();
      expect(isReady).toBe(true);
    });

    it('should create all required object stores', async () => {
      // Verify database structure
      const reflections = await databaseService.getAllReflections();
      const threads = await databaseService.getAllThreads();
      const axes = await databaseService.getAllIdentityAxes();
      
      expect(Array.isArray(reflections)).toBe(true);
      expect(Array.isArray(threads)).toBe(true);
      expect(Array.isArray(axes)).toBe(true);
    });
  });

  describe('2. Create & Save Reflection', () => {
    it('should save a reflection to database', async () => {
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'This is a test reflection about identity and change.',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);
      
      const retrieved = await databaseService.getReflection(reflection.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.content).toBe(reflection.content);
      expect(retrieved?.layer).toBe('sovereign');
    });

    it('should handle date serialization correctly', async () => {
      const now = new Date();
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'Date test',
        createdAt: now,
        updatedAt: now,
        layer: 'commons',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);
      const retrieved = await databaseService.getReflection(reflection.id);
      
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
      expect(retrieved?.createdAt.getTime()).toBe(now.getTime());
    });

    it('should validate reflection data before saving', async () => {
      const invalidReflection = {
        id: crypto.randomUUID(),
        content: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'invalid-layer', // Invalid layer
        modality: 'text',
        metadata: {},
      } as any;

      await expect(
        databaseService.addReflection(invalidReflection)
      ).rejects.toThrow();
    });

    it('should reject empty content', async () => {
      const emptyReflection: Reflection = {
        id: crypto.randomUUID(),
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await expect(
        databaseService.addReflection(emptyReflection)
      ).rejects.toThrow('Content cannot be empty');
    });
  });

  describe('3. Thread Management', () => {
    it('should create and retrieve threads', async () => {
      const thread: Thread = {
        id: crypto.randomUUID(),
        name: 'Identity Evolution',
        createdAt: new Date(),
        updatedAt: new Date(),
        reflectionIds: [],
      };

      await databaseService.addThread(thread);
      
      const retrieved = await databaseService.getThread(thread.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved?.name).toBe('Identity Evolution');
    });

    it('should associate reflections with threads', async () => {
      const thread: Thread = {
        id: crypto.randomUUID(),
        name: 'Test Thread',
        createdAt: new Date(),
        updatedAt: new Date(),
        reflectionIds: [],
      };

      await databaseService.addThread(thread);

      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'Thread-linked reflection',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        threadId: thread.id,
        metadata: {},
      };

      await databaseService.addReflection(reflection);

      const threadReflections = await databaseService.getReflectionsByThread(thread.id);
      expect(threadReflections).toHaveLength(1);
      expect(threadReflections[0].content).toBe('Thread-linked reflection');
    });
  });

  describe('4. Auto-Recovery', () => {
    it('should save recovery snapshots', async () => {
      const content = 'This is important content that should not be lost';
      
      autoRecoveryService.saveSnapshot(content, {
        threadId: 'test-thread',
        modality: 'text',
      });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      const hasRecovery = autoRecoveryService.hasRecovery();
      expect(hasRecovery).toBe(true);
    });

    it('should retrieve recovery snapshots', async () => {
      const content = 'Recovery test content';
      
      autoRecoveryService.saveSnapshot(content);
      await new Promise(resolve => setTimeout(resolve, 150));

      const snapshot = await autoRecoveryService.getSnapshot();
      expect(snapshot).toBeTruthy();
      expect(snapshot?.content).toBe(content);
    });

    it('should clear snapshots after successful save', async () => {
      autoRecoveryService.saveSnapshot('Test content');
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(autoRecoveryService.hasRecovery()).toBe(true);

      autoRecoveryService.clearSnapshot();
      
      expect(autoRecoveryService.hasRecovery()).toBe(false);
    });
  });

  describe('5. Data Export (Sovereignty)', () => {
    it('should export all user data', async () => {
      // Create test data
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'Export test reflection',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);

      // Export data
      const exported = await exportService.exportAllData();
      
      expect(exported.reflections).toBeDefined();
      expect(exported.reflections.length).toBeGreaterThan(0);
      expect(exported.metadata).toBeDefined();
      expect(exported.metadata.exportedAt).toBeDefined();
    });

    it('should export in JSON format', async () => {
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'JSON export test',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'commons',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);

      const jsonString = await exportService.exportAsJSON();
      
      expect(() => JSON.parse(jsonString)).not.toThrow();
      
      const parsed = JSON.parse(jsonString);
      expect(parsed.reflections).toBeDefined();
    });
  });

  describe('6. Update & Delete Operations', () => {
    it('should update existing reflections', async () => {
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'Original content',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);

      // Update content
      reflection.content = 'Updated content';
      reflection.updatedAt = new Date();
      
      await databaseService.updateReflection(reflection);

      const retrieved = await databaseService.getReflection(reflection.id);
      expect(retrieved?.content).toBe('Updated content');
    });

    it('should delete reflections', async () => {
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'To be deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);
      
      let retrieved = await databaseService.getReflection(reflection.id);
      expect(retrieved).toBeTruthy();

      await databaseService.deleteReflection(reflection.id);

      retrieved = await databaseService.getReflection(reflection.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('7. Constitutional Compliance', () => {
    it('should not require any specific order of operations', async () => {
      // User should be able to create reflection before thread
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'No order required',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        threadId: 'non-existent-thread', // Thread doesn't exist yet
        metadata: {},
      };

      // This should work (no FK constraints)
      await expect(
        databaseService.addReflection(reflection)
      ).resolves.not.toThrow();
    });

    it('should allow reflection without thread', async () => {
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content: 'Standalone reflection',
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        // No threadId - perfectly valid
        metadata: {},
      };

      await expect(
        databaseService.addReflection(reflection)
      ).resolves.not.toThrow();
    });

    it('should preserve user content exactly as entered', async () => {
      const content = 'Content with\n\nline breaks\tand\ttabs and   spaces';
      
      const reflection: Reflection = {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        layer: 'sovereign',
        modality: 'text',
        metadata: {},
      };

      await databaseService.addReflection(reflection);
      const retrieved = await databaseService.getReflection(reflection.id);
      
      // Content must be byte-for-byte identical
      expect(retrieved?.content).toBe(content);
    });
  });
});
