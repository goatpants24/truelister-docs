## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-15 - [Navigation Payload & List Memoization]
**Learning:** Passing large data arrays (O(N)) in navigation parameters causes bridge congestion and frame drops. Combined with unstable FlatList render callbacks (due to dependencies on the full list), it creates a major performance bottleneck as the catalog grows.
**Action:** Omit large data from navigation params when redundant (e.g., edits) and ensure FlatList renderers have stable identities by excluding the list itself from their dependency arrays.
