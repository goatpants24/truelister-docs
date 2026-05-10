## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Dropdown Metadata Caching]
**Learning:** Network requests for semi-static metadata (like category/condition dropdowns) in an `ItemForm` can cause noticeable UI lag if fetched on every mount. Caching these with a reasonable TTL (5 mins) and ensuring cache invalidation on configuration changes (like switching spreadsheet IDs) provides a significant performance boost without sacrificing data accuracy.
**Action:** Implement TTL-based in-memory caching for metadata services that are frequently called but infrequently changed, and explicitly hook them into existing configuration reset paths.
