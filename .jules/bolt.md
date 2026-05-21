## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Regex vs String Manipulation for ID Generation]
**Learning:** Using `String.prototype.match` with a regex inside a `reduce` loop for thousands of items is significantly slower than using `startsWith` and `substring`. Profiling showed a ~6x performance improvement (from ~2.7ms to ~0.44ms for 5000 items) by switching to a simple `for` loop and string manipulation.
**Action:** Favor simple string methods (`startsWith`, `substring`, `includes`) over regex for large-scale iterative tasks when the pattern is fixed.
