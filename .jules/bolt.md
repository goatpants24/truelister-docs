## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [HomeScreen Stale-While-Revalidate Optimization]
**Learning:** Using `useFocusEffect` to refresh inventory on every screen focus causes a jarring full-screen loading flicker if `setLoading(true)` is called unconditionally. Implementing a `hasLoadedOnce` ref allows for background refreshes that improve perceived performance.
**Action:** Guard `setLoading(true)` with a `!hasLoadedOnce.current` check to ensure the spinner only appears on the very first mount, while subsequent focus events refresh the list seamlessly.
