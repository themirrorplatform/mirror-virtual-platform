import { useCallback, useEffect, useState } from 'react';

// Advanced micro-interaction utilities
// Provides haptic feedback, sound, and visual confirmation for interactions

interface MicroInteractionOptions {
  haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  sound?: 'click' | 'success' | 'error' | 'summon' | 'dismiss';
  visual?: 'ripple' | 'pulse' | 'flash' | 'shake';
  delay?: number;
}

// Haptic feedback (for supported devices)
function triggerHaptic(type: MicroInteractionOptions['haptic']) {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [20],
      success: [10, 50, 10],
      warning: [15, 100, 15],
      error: [20, 100, 20, 100, 20],
    };
    
    if (type && patterns[type]) {
      navigator.vibrate(patterns[type]);
    }
  }
}

// Sound effects (subtle, constitutional)
function triggerSound(type: MicroInteractionOptions['sound'], volume: number = 0.3) {
  // Only if user hasn't disabled sounds (check localStorage)
  const soundsEnabled = localStorage.getItem('mirror_sounds_enabled') !== 'false';
  if (!soundsEnabled) return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Different frequencies for different actions
  const frequencies = {
    click: [440, 0.05],
    success: [523.25, 0.1], // C5
    error: [220, 0.15], // A3
    summon: [659.25, 0.08], // E5
    dismiss: [392, 0.08], // G4
  };

  if (type && frequencies[type]) {
    const [freq, duration] = frequencies[type];
    oscillator.frequency.value = freq as number;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (duration as number));
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (duration as number));
  }
}

export function useMicroInteractions() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const trigger = useCallback((options: MicroInteractionOptions = {}) => {
    const { haptic, sound, visual, delay = 0 } = options;

    setTimeout(() => {
      // Haptic feedback (mobile devices)
      if (haptic) {
        triggerHaptic(haptic);
      }

      // Sound feedback (subtle)
      if (sound) {
        triggerSound(sound);
      }

      // Visual feedback handled by component
      // This hook just coordinates timing
    }, delay);
  }, []);

  // Specific interaction helpers
  const onClick = useCallback(() => {
    trigger({ haptic: 'light', sound: 'click' });
  }, [trigger]);

  const onSuccess = useCallback(() => {
    trigger({ haptic: 'success', sound: 'success' });
  }, [trigger]);

  const onError = useCallback(() => {
    trigger({ haptic: 'error', sound: 'error' });
  }, [trigger]);

  const onSummon = useCallback(() => {
    trigger({ haptic: 'medium', sound: 'summon' });
  }, [trigger]);

  const onDismiss = useCallback(() => {
    trigger({ haptic: 'light', sound: 'dismiss' });
  }, [trigger]);

  return {
    trigger,
    onClick,
    onSuccess,
    onError,
    onSummon,
    onDismiss,
    isReducedMotion,
  };
}

// Ripple effect component (constitutional styling)
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}

// Long press detection (constitutional alternative to right-click)
export function useLongPress(
  callback: () => void,
  duration: number = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      callback();
      setIsPressed(false);
    }, duration);
  }, [callback, duration]);

  const cancel = useCallback(() => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: cancel,
    }
  };
}

// Hover delay (prevent accidental tooltips)
export function useDelayedHover(delay: number = 500) {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, delay);
  }, [delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(false);
  }, []);

  return {
    isHovered,
    handlers: {
      onMouseEnter,
      onMouseLeave,
    }
  };
}

// Focus visible (only show focus ring on keyboard navigation)
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const onFocus = useCallback(() => {
    // Only show focus ring if user is navigating with keyboard
    setIsFocusVisible(true);
  }, []);

  const onBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  const onMouseDown = useCallback(() => {
    // Hide focus ring on mouse click
    setIsFocusVisible(false);
  }, []);

  return {
    isFocusVisible,
    handlers: {
      onFocus,
      onBlur,
      onMouseDown,
    }
  };
}

// Add React import at the top
import React from 'react';
