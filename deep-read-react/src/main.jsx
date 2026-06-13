import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

// No StrictMode: it double-invokes effects in dev, which would spin up two
// Lenis instances and duplicate ScrollTriggers. Production is unaffected either way.
createRoot(document.getElementById('root')).render(<App />);
