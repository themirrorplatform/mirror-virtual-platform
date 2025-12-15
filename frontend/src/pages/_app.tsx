import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { UIModeProvider, useUIMode } from '../contexts/UIModeContext';
import { MirrorStateProvider, useMirrorStateContext } from '../contexts/MirrorStateContext';
import { TraditionalLayout } from '../layouts/TraditionalLayout';
import { InstrumentOSLayout } from '../layouts/InstrumentOSLayout';
import { CommandPalette } from '../components/CommandPalette';
import { LayerIndicator } from '../components/LayerIndicator';
import { ReceiptSystem } from '../components/ReceiptSystem';

function AppContent({ Component, pageProps }: AppProps) {
  const { isPowerMode } = useUIMode();
  const { state, dismissReceipt } = useMirrorStateContext();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const Layout = isPowerMode ? InstrumentOSLayout : TraditionalLayout;

  return (
    <>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <LayerIndicator />
      <ReceiptSystem receipts={state.receipts} onDismiss={dismissReceipt} />
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <UIModeProvider defaultMode="simple">
      <MirrorStateProvider>
        <AppContent {...props} />
      </MirrorStateProvider>
    </UIModeProvider>
  );
}
