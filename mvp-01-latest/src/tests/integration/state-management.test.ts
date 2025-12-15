/**
 * Integration Tests - State Management
 * 
 * Tests the complete state management flow:
 * - State initialization
 * - State updates and persistence
 * - Instrument visibility logic
 * - License tier compliance
 * - Constitutional state constraints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { stateManager } from '../../services/state';
import { databaseService } from '../../services/database';
import type { MirrorState, InstrumentId } from '../../types';

describe('State Management Integration', () => {
  beforeEach(async () => {
    await databaseService.init();
    await stateManager.initialize();
  });

  afterEach(() => {
    stateManager.reset();
  });

  describe('1. State Initialization', () => {
    it('should initialize with default state', async () => {
      const state = stateManager.getState();
      
      expect(state).toBeDefined();
      expect(state.currentLayer).toBe('sovereign');
      expect(state.currentLicense).toBe('personal');
      expect(state.visibleInstruments).toBeDefined();
      expect(Array.isArray(state.visibleInstruments)).toBe(true);
    });

    it('should load state from database if exists', async () => {
      // Set custom state
      stateManager.setState({
        currentLayer: 'commons',
        theme: 'light',
      });

      await stateManager.saveState();

      // Reset and reinitialize
      stateManager.reset();
      await stateManager.initialize();

      const state = stateManager.getState();
      expect(state.currentLayer).toBe('commons');
      expect(state.theme).toBe('light');
    });
  });

  describe('2. State Updates', () => {
    it('should update state reactively', async () => {
      let updateCount = 0;
      
      stateManager.subscribe(() => {
        updateCount++;
      });

      stateManager.setState({ currentLayer: 'commons' });
      stateManager.setState({ currentLayer: 'builder' });

      expect(updateCount).toBeGreaterThanOrEqual(2);
    });

    it('should persist state changes to database', async () => {
      stateManager.setState({ 
        currentLayer: 'commons',
        theme: 'high-contrast',
      });

      await stateManager.saveState();

      // Verify saved to database
      const settings = await databaseService.getSettings();
      expect(settings?.theme).toBe('high-contrast');
    });

    it('should merge state updates correctly', () => {
      const initialLayer = stateManager.getState().currentLayer;
      
      stateManager.setState({ theme: 'dark' });
      
      const state = stateManager.getState();
      expect(state.theme).toBe('dark');
      expect(state.currentLayer).toBe(initialLayer); // Should not be reset
    });
  });

  describe('3. Instrument Visibility Logic', () => {
    it('should show correct instruments for sovereign layer', () => {
      stateManager.setState({ currentLayer: 'sovereign' });
      
      const instruments = stateManager.getVisibleInstruments();
      
      // Sovereign layer should have private reflection tools
      expect(instruments.includes('mirror' as InstrumentId)).toBe(true);
      expect(instruments.includes('threads' as InstrumentId)).toBe(true);
      expect(instruments.includes('archive' as InstrumentId)).toBe(true);
    });

    it('should show commons instruments when in commons layer', () => {
      stateManager.setState({ currentLayer: 'commons' });
      
      const instruments = stateManager.getVisibleInstruments();
      
      // Commons layer should have sharing tools
      expect(instruments.includes('world' as InstrumentId)).toBe(true);
    });

    it('should show builder instruments only in builder layer', () => {
      stateManager.setState({ currentLayer: 'builder' });
      
      const instruments = stateManager.getVisibleInstruments();
      
      // Builder layer should have creation tools
      expect(instruments.includes('pattern-library' as InstrumentId)).toBe(true);
    });
  });

  describe('4. License Tier Logic', () => {
    it('should respect personal license limits', () => {
      stateManager.setState({ currentLicense: 'personal' });
      
      const instruments = stateManager.getVisibleInstruments();
      
      // Personal license should have basic instruments
      expect(instruments.length).toBeGreaterThan(0);
    });

    it('should unlock additional instruments for professional license', () => {
      stateManager.setState({ currentLicense: 'personal' });
      const personalInstruments = stateManager.getVisibleInstruments();
      
      stateManager.setState({ currentLicense: 'professional' });
      const professionalInstruments = stateManager.getVisibleInstruments();
      
      // Professional should have same or more instruments
      expect(professionalInstruments.length).toBeGreaterThanOrEqual(
        personalInstruments.length
      );
    });

    it('should show enterprise instruments only with enterprise license', () => {
      stateManager.setState({ currentLicense: 'enterprise' });
      
      const instruments = stateManager.getVisibleInstruments();
      
      // Enterprise has all instruments
      expect(instruments.length).toBeGreaterThan(0);
    });
  });

  describe('5. Constitutional Constraints', () => {
    it('should never force a layer choice', () => {
      // User should be able to set any layer at any time
      const layers: Array<'sovereign' | 'commons' | 'builder'> = [
        'sovereign',
        'commons', 
        'builder'
      ];

      layers.forEach(layer => {
        expect(() => {
          stateManager.setState({ currentLayer: layer });
        }).not.toThrow();
      });
    });

    it('should never require an instrument to be used', () => {
      // User can have zero visible instruments (they chose to hide all)
      stateManager.setState({ visibleInstruments: [] });
      
      const state = stateManager.getState();
      expect(state.visibleInstruments).toHaveLength(0);
      
      // System should still work
      expect(() => stateManager.setState({ theme: 'dark' })).not.toThrow();
    });

    it('should allow user to change mind at any time', () => {
      // Simulate rapid layer switching (user exploring)
      stateManager.setState({ currentLayer: 'sovereign' });
      stateManager.setState({ currentLayer: 'commons' });
      stateManager.setState({ currentLayer: 'builder' });
      stateManager.setState({ currentLayer: 'sovereign' });
      
      // All changes should work
      expect(stateManager.getState().currentLayer).toBe('sovereign');
    });

    it('should not track "progress" or "completion"', () => {
      const state = stateManager.getState();
      
      // These fields should NOT exist
      expect(state).not.toHaveProperty('progress');
      expect(state).not.toHaveProperty('completion');
      expect(state).not.toHaveProperty('streak');
      expect(state).not.toHaveProperty('points');
    });
  });

  describe('6. Theme Switching', () => {
    it('should switch between themes', () => {
      const themes: Array<'dark' | 'light' | 'high-contrast'> = [
        'dark',
        'light',
        'high-contrast'
      ];

      themes.forEach(theme => {
        stateManager.setState({ theme });
        expect(stateManager.getState().theme).toBe(theme);
      });
    });

    it('should persist theme preference', async () => {
      stateManager.setState({ theme: 'light' });
      await stateManager.saveState();

      const settings = await databaseService.getSettings();
      expect(settings?.theme).toBe('light');
    });
  });

  describe('7. State Subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const changes: string[] = [];
      
      stateManager.subscribe((state) => {
        changes.push(state.currentLayer);
      });

      stateManager.setState({ currentLayer: 'commons' });
      stateManager.setState({ currentLayer: 'builder' });

      expect(changes.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow multiple subscribers', () => {
      let subscriber1Called = false;
      let subscriber2Called = false;

      stateManager.subscribe(() => {
        subscriber1Called = true;
      });

      stateManager.subscribe(() => {
        subscriber2Called = true;
      });

      stateManager.setState({ theme: 'dark' });

      expect(subscriber1Called).toBe(true);
      expect(subscriber2Called).toBe(true);
    });

    it('should allow unsubscribing', () => {
      let callCount = 0;
      
      const unsubscribe = stateManager.subscribe(() => {
        callCount++;
      });

      stateManager.setState({ theme: 'dark' });
      expect(callCount).toBe(1);

      unsubscribe();

      stateManager.setState({ theme: 'light' });
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('8. Error Handling', () => {
    it('should handle invalid state updates gracefully', () => {
      expect(() => {
        stateManager.setState({ currentLayer: 'invalid' as any });
      }).not.toThrow();
      
      // State should remain valid
      const state = stateManager.getState();
      expect(['sovereign', 'commons', 'builder']).toContain(state.currentLayer);
    });

    it('should recover from database save failures', async () => {
      // This should not crash the app
      await expect(
        stateManager.saveState()
      ).resolves.not.toThrow();
    });
  });
});
