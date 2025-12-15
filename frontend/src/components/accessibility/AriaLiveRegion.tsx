/**
 * ARIA Live Region - Screen reader announcements
 * Provides invisible region for dynamic content announcements
 */

export function AriaLiveRegion() {
  return (
    <>
      {/* Polite announcements (non-urgent) */}
      <div
        id="aria-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Assertive announcements (urgent) */}
      <div
        id="aria-live-region-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
