import "@testing-library/jest-dom/vitest";
import fakeIndexedDB from "fake-indexeddb";
// @ts-expect-error - subpath types not resolvable through package exports
import FDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";

// Provide a fake IndexedDB for Dexie in tests
(globalThis as any).indexedDB = fakeIndexedDB;
(globalThis as any).IDBKeyRange = FDBKeyRange;
