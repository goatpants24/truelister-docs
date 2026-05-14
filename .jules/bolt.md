## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2026-05-10 - [In-memory Dropdown Caching]
**Learning:** The `ItemFormScreen` calls `fetchDropdowns` on every mount. Since these options (categories, conditions) change very rarely, redundant network calls to Google Sheets add ~150ms of unnecessary latency and waste bandwidth.
**Action:** Implement a 5-minute (300,000ms) TTL in-memory cache in `src/services/sheets.ts`. Ensure the cache is cleared when spreadsheet settings change to maintain data consistency.
