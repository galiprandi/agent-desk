import { useEffect, useRef } from "react";
import { agentAPI } from "@/api/agentAPI";
import { snapshotToJSON, buildSnapshot } from "@/lib/export";
import { useApiRefresh } from "./useApiRefresh";

/**
 * localStorage key for the silent periodic backup. Capped at ~4MB by the
 * browser; on quota errors we drop the oldest snapshot silently.
 */
export const AUTOSAVE_KEY = "agent-desk-autosave";
export const AUTOSAVE_AT_KEY = "agent-desk-autosave-at";

/** Default interval: 60 seconds. 0 disables auto-export. */
export const DEFAULT_AUTO_EXPORT_INTERVAL_MS = 60_000;

function readInterval(): number {
  const raw = agentAPI.config.get("autoExportIntervalMs");
  if (typeof raw === "number" && raw >= 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return DEFAULT_AUTO_EXPORT_INTERVAL_MS;
}

function writeAutosave(): void {
  if (typeof window === "undefined") return;
  try {
    const snapshot = buildSnapshot();
    window.localStorage.setItem(AUTOSAVE_KEY, snapshotToJSON(snapshot));
    window.localStorage.setItem(AUTOSAVE_AT_KEY, snapshot.exportedAt);
  } catch {
    // Quota exceeded or storage unavailable — drop silently. The user can
    // still trigger a manual download via the header button.
  }
}

/** Write a snapshot to localStorage now. Used by beforeunload. */
export function flushAutosave(): void {
  writeAutosave();
}

/**
 * Periodically writes a JSON snapshot of all data to localStorage as a
 * silent backup. Interval is configurable via
 * `agentAPI.config.set("autoExportIntervalMs", ms)`; 0 disables.
 *
 * Re-runs the timer whenever the API changes (so a burst of writes doesn't
 * wait a full interval) and when the interval config changes.
 */
export function useAutoExport(): void {
  const version = useApiRefresh();
  const intervalRef = readInterval();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef <= 0) return;
    // Write once on enable, then on the interval.
    writeAutosave();
    timerRef.current = window.setInterval(writeAutosave, intervalRef);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [intervalRef, version]);
}
