## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-20 - [Service Caching Optimization]
**Learning:** Frequent `AsyncStorage` reads for static or slow-changing config (like spreadsheet ID) and redundant network requests for dropdown options add noticeable latency to screen transitions and form initialization.
**Action:** Implement in-memory caching for storage-backed helpers and add a TTL-based cache for slow-changing API results (like dropdown lists) to improve UI responsiveness.
