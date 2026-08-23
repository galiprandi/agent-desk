/**
 * Analytics module — GA4 event tracking.
 *
 * Page views are sent manually (send_page_view: false in index.html)
 * because the app uses a hash router and GA4's automatic page view
 * detection doesn't work with hash-based navigation.
 */

const GA_MEASUREMENT_ID = "G-WP3N21Q376";

type GtagCommand = "event" | "config" | "set" | "js";
type GtagArgs = unknown[];

interface GtagFunction {
  (...args: GtagArgs): void;
}

interface WindowWithGtag extends Window {
  gtag?: GtagFunction;
  dataLayer: unknown[];
}

function getWindow(): WindowWithGtag | null {
  return typeof window !== "undefined" ? (window as unknown as WindowWithGtag) : null;
}

function getGtag(): GtagFunction | null {
  const w = getWindow();
  if (!w) return null;
  if (typeof w.gtag === "function") return w.gtag;
  // gtag may not be loaded yet (script is async). Push to dataLayer directly.
  return (...args: GtagArgs) => {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(args);
  };
}

/** Send a page view event. Call on every hash route change. */
export function trackPageView(path: string): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: document.title,
  });
}

/** Send a custom event. */
export function trackEvent(
  action: string,
  params?: Record<string, unknown>,
): void {
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", action, params);
}

// ----- Domain-specific event helpers -----

export const analytics = {
  // Task events
  taskCreated: (tags: string[] = []) =>
    trackEvent("task_create", { tag_count: tags.length }),

  taskUpdated: (fields: string[] = []) =>
    trackEvent("task_update", { fields }),

  taskDeleted: () => trackEvent("task_delete"),

  taskStatusChanged: (from: string, to: string) =>
    trackEvent("task_status_change", { from, to }),

  // Event events
  eventCreated: () => trackEvent("event_create"),

  eventUpdated: () => trackEvent("event_update"),

  eventDeleted: () => trackEvent("event_delete"),

  // Session events
  sessionStarted: () => trackEvent("session_start"),

  sessionEnded: (durationMs?: number) =>
    trackEvent("session_end", { duration_ms: durationMs }),

  // Link events
  linkCreated: (type: string) => trackEvent("link_create", { type }),

  linkDeleted: () => trackEvent("link_delete"),

  // Search
  searchPerformed: (resultCount: number) =>
    trackEvent("search", { result_count: resultCount }),

  // Export
  exportDownloaded: () => trackEvent("export_download"),

  exportImported: (counts: Record<string, number>) =>
    trackEvent("export_import", counts),
};
