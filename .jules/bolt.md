## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Google Sheets Data Processing Optimization]
**Learning:** Chaining array methods like `slice()`, `map()`, and `filter()` on large datasets creates multiple intermediate arrays, increasing memory pressure and processing time. Consolidating these into single-pass `for` loops significantly improves performance.
**Action:** Use single-pass loops for data transformation and pre-compile regular expressions outside of loops to minimize overhead in hot paths like `generateItemNumber`.
