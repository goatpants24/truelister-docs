## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-22 - [In-memory Dropdown Caching]
**Learning:** The `fetchDropdowns` function is called frequently (e.g., on every item form mount). Since this data is relatively static, implementing an in-memory cache with a 5-minute TTL significantly improves form loading snappiness (~150ms saving).
**Action:** Always invalidate this cache when the data source (e.g., Spreadsheet ID) changes to prevent stale data across user sessions.
