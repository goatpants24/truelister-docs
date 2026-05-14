## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-20 - [Sheets Data Caching]
**Learning:** Fetching and parsing CSV data from Google Sheets on every screen focus or form mount introduces significant latency (~500ms+). Implementing an in-memory cache with a 1-5 minute TTL provides near-instant UI response for repeated visits.
**Action:** Always invalidate data caches when the underlying configuration (Spreadsheet ID, API URL) changes or when a mutation (append/update) occurs.
