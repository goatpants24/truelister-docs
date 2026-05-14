## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2026-05-12 - [In-memory Dropdown Cache]
**Learning:** Fetching static dropdown data (categories, conditions, etc.) on every mount of the ItemFormScreen creates unnecessary network overhead. An in-memory cache with a 5-minute TTL significantly improves form load performance (~150ms gain).
**Action:** Always implement time-based caching for static reference data and ensure cache invalidation is hooked into configuration changes in Settings and Onboarding.
