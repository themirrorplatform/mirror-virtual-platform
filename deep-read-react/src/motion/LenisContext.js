import { createContext, useContext } from 'react';

/** Holds the active Lenis instance (or null under reduced-motion / before init). */
export const LenisContext = createContext(null);
export const useLenis = () => useContext(LenisContext);
