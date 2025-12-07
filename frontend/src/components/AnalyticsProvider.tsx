import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { analytics } from '../lib/analytics';

/**
 * AnalyticsProvider Component
 * Wraps the app to automatically track page views and sessions
 * Add to _app.tsx to enable analytics tracking
 */
export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [sessionId, setSessionId] = React.useState<string>('');
  const [pageCount, setPageCount] = React.useState<number>(0);
  const [sessionStart, setSessionStart] = React.useState<number>(Date.now());

  useEffect(() => {
    // Initialize session on mount
    const id = analytics.initSession();
    setSessionId(id);
    setSessionStart(Date.now());

    // Track initial page view
    if (id) {
      analytics.trackPageView(
        window.location.pathname,
        document.title,
        id
      );
      setPageCount(1);
    }

    // Cleanup on unmount
    return () => {
      if (id) {
        const duration = Math.floor((Date.now() - sessionStart) / 1000);
        analytics.endSession(id, pageCount, duration);
      }
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (sessionId) {
        analytics.trackPageView(
          url,
          document.title,
          sessionId
        );
        setPageCount(prev => prev + 1);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, sessionId]);

  return <>{children}</>;
};

export default AnalyticsProvider;
