## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Sheets Service Caching]
**Learning:** Implementing in-memory caching for Google Sheets CSV data significantly reduces network overhead. A 1-minute TTL for inventory and a 5-minute TTL for dropdowns balances data freshness with performance. Invalidation must be handled explicitly during `appendItem` and settings changes.
**Action:** Use `Date.now()` to track `lastFetched` timestamps in a service-level singleton object, and ensure all mutation methods (or configuration changes) reset these timestamps.
