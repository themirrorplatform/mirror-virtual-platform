import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Analytics tracking utilities
export const analytics = {
  /**
   * Track a page view
   * Call this on every page load/navigation
   */
  async trackPageView(
    pagePath: string,
    pageTitle: string,
    sessionId: string,
    metadata?: {
      referrer?: string;
      deviceType?: string;
      browser?: string;
      os?: string;
    }
  ) {
    try {
      const { error } = await supabase.from('page_views').insert({
        page_path: pagePath,
        page_title: pageTitle,
        session_id: sessionId,
        referrer: metadata?.referrer || document.referrer,
        device_type: metadata?.deviceType || getDeviceType(),
        browser: metadata?.browser || getBrowser(),
        os: metadata?.os || getOS(),
        viewed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to track page view:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  /**
   * Track a custom event
   * Use for button clicks, form submissions, etc.
   */
  async trackEvent(
    eventName: string,
    sessionId: string,
    metadata?: {
      category?: string;
      label?: string;
      value?: number;
      pagePath?: string;
      properties?: Record<string, any>;
    }
  ) {
    try {
      const { error } = await supabase.from('events').insert({
        event_name: eventName,
        event_category: metadata?.category || 'engagement',
        event_label: metadata?.label,
        event_value: metadata?.value,
        page_path: metadata?.pagePath || window.location.pathname,
        session_id: sessionId,
        properties: metadata?.properties || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to track event:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  /**
   * Track gallery image view
   */
  async trackImageView(imageId: string, sessionId: string) {
    try {
      const { error } = await supabase.from('gallery_image_views').insert({
        image_id: imageId,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        viewed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to track image view:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  /**
   * Initialize or retrieve session
   * Call this once on app load
   */
  initSession(): string {
    const SESSION_KEY = 'mirror_session_id';
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, sessionId);

      // Create session record
      supabase.from('user_sessions').insert({
        session_id: sessionId,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        landing_page: window.location.pathname,
        started_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to create session:', error);
        }
      });
    }

    return sessionId;
  },

  /**
   * Update session on page unload
   */
  async endSession(sessionId: string, pageCount: number, totalDuration: number) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          exit_page: window.location.pathname,
          page_count: pageCount,
          total_duration_seconds: totalDuration,
          ended_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to end session:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },
};

// Helper functions
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

export default analytics;
