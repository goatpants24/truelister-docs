## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2026-05-14 - [Sheets Data Caching]
**Learning:** Google Sheets CSV fetch operations are the primary I/O bottleneck. Implementing in-memory caching with TTLs (1m for inventory, 5m for dropdowns) significantly reduces UI latency during frequent navigation between Home and Item Form screens.
**Action:** Always implement tiered TTL caching for remote static/semi-static data sources to minimize main-thread blocking during screen transitions.
