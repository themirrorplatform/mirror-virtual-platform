/**
 * RealmRouter - Constitutional navigation between realms
 * Manages transitions between Mirror/Threads/World/Archive/Self
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type Realm = 'mirror' | 'threads' | 'world' | 'archive' | 'self';

interface RealmRouterProps {
  currentRealm: Realm;
  children: ReactNode;
}

export function RealmRouter({ currentRealm, children }: RealmRouterProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentRealm}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.4,
          ease: [0.23, 1, 0.32, 1], // Constitutional easing
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook for realm navigation
 */
export function useRealmNavigation(
  currentRealm: Realm,
  setRealm: (realm: Realm) => void,
  commonsEnabled: boolean
) {
  const navigateToRealm = (realm: Realm) => {
    // Constitutional check: World requires Commons
    if (realm === 'world' && !commonsEnabled) {
      console.warn('World realm requires Commons to be enabled');
      return false;
    }

    setRealm(realm);
    return true;
  };

  return {
    currentRealm,
    navigateToRealm,
    canAccessWorld: commonsEnabled,
  };
}
