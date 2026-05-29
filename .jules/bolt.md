## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Google Sheets Data Processing Optimization]
**Learning:** Chaining array methods like `slice()`, `map()`, and `filter()` on large datasets creates multiple intermediate arrays, increasing memory pressure and processing time. Consolidating these into single-pass `for` loops significantly improves performance.
**Action:** Use single-pass loops for data transformation and pre-compile regular expressions outside of loops to minimize overhead in hot paths like `generateItemNumber`.

## 2026-05-22 - [Single-pass CSV Parsing]
**Learning:** Standard CSV parsing using `split('\n')` followed by `map()` and `filter()` creates multiple large intermediate arrays, doubling or tripling peak memory usage for large catalogs. A manual single-pass character iterator reduces memory pressure and CPU cycles.
**Action:** Always prefer single-pass iteration for large text/data processing tasks.

## 2026-05-22 - [Empty-State Merge Guard]
**Learning:** Performing $O(N)$ merge operations (Set creation, filtering) on every screen focus is wasteful when the common state is "no drafts." Guarding these operations with a simple `length > 0` check provides instant UI responsiveness for the majority of user sessions.
**Action:** Add early-exit guards for expensive data processing logic that depends on optional/local state.

## 2026-05-23 - [OCR Regex & Lookup Optimization]
**Learning:** Repetitive string transformations (split/map/join) and regex recompilation inside a high-frequency parsing function like `parseTagText` create significant CPU overhead. Hoisting these to module-level constants and using a pre-calculated map reduces execution time by ~38%.
**Action:** Always hoist regex patterns and static lookup maps outside of performance-critical functions to avoid redundant work.

## 2025-05-24 - [Parallel Marketplace Publishing]
**Learning:** Sequential execution of independent marketplace API calls leads to additive latency (O(sum of latencies)), resulting in a poor user experience when listing to multiple platforms. Refactoring to parallel execution using `Promise.all` reduces total wait time to the slowest single request (O(max latency)).
**Action:** Use `Promise.all` to parallelize independent network requests or I/O-bound tasks that do not have data dependencies on each other.
