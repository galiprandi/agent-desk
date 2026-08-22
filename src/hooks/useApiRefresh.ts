import { useSyncExternalStore } from "react";

// Simple pub/sub so React components re-render after sync API writes.
const listeners = new Set<() => void>();
let version = 0;

export function notifyApiChange() {
  version++;
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return version;
}

export function useApiRefresh(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
