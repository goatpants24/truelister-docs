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

## 2026-05-24 - [Parallel Marketplace Publishing]
**Learning:** Sequential `await` in a `for...of` loop for independent network requests (like publishing to multiple marketplaces) creates a performance bottleneck where the total latency is the sum of all requests. Refactoring to `Promise.all` with `map` parallelizes these requests, reducing latency to that of the single slowest request.
**Action:** Always identify independent asynchronous operations and parallelize them using `Promise.all` or `Promise.allSettled` to improve UI responsiveness and reduce user wait time.

## 2026-05-25 - [Single-pass Regex Brand Detection]
**Learning:** Iterative substring searches (`includes`) over a large list of keywords is $O(N \times M)$ and performs poorly when no match is found, as it must scan the entire input for every keyword. A single-pass `RegExp` with word boundaries (`\b`) reduces complexity to roughly $O(M)$ and prevents false positives on partial word matches (e.g., "nike" in "uniken").
**Action:** Use single-pass regex alternations for multi-keyword detection in large text blocks. Sort keywords by length descending to ensure longest-match precedence.

## 2026-05-26 - [Nullish Coalescing Hydration]
**Learning:** Replacing logical OR (`||`) with nullish coalescing (`??`) for default values in object hydration functions (like `rowToItem`) provides a significant performance boost (~58% faster) by avoiding redundant boolean coercion in hot paths.
**Action:** Use `??` instead of `||` for property defaults when the data source is stable and only null/undefined need fallback.

## 2026-05-26 - [Allocation Guard in Data Loops]
**Learning:** Hydrating every row of a spreadsheet into a full TypeScript object (e.g., `CatalogItem`) before checking if the row contains meaningful data is wasteful, especially for spreadsheets with thousands of trailing empty rows. Moving the truthiness check *before* the hydration call prevents unnecessary object allocations and reduces GC pressure.
**Action:** Always guard object creation in high-volume data loops with early-exit checks on raw row data.

## 2026-05-27 - [FlatList getItemLayout Optimization]
**Learning:** Implementing `getItemLayout` for `FlatList` significantly improves scroll performance for large catalogs by eliminating dynamic measurements. However, it requires strictly enforced fixed heights on item components and `overflow: 'hidden'` to prevent content-driven expansion from invalidating the pre-calculated offsets.
**Action:** When using `getItemLayout`, always verify that item styles (including margins and padding) perfectly match the mathematical formula used for offset calculation.

## 2026-05-27 - [Item Number Generation Optimization]
**Learning:** Using `RegExp.match()` inside a loop to parse patterned identifiers (e.g., "TL-001") is significantly slower than direct string slicing and character-based prefix checks. Benchmarks showed that `s.slice(3)` and index-based checks are ~45% faster than regex in this specific use case.
**Action:** Prefer direct string manipulation over Regular Expressions for simple, fixed-prefix pattern parsing in hot paths or large data loops.

## 2025-05-28 - [Memoized QuickActionsBar]
**Learning:** In a large form component like , updating any single field (e.g., Title) triggers a full re-render of all child elements, including the complex action button grid. This causes measurable frame-rate drops during rapid typing.
**Action:** Extract and memoize static or semi-static UI blocks (like action bars) and stabilize their callbacks via `useCallback` to prevent unnecessary re-renders.

## 2025-05-28 - [Memoized QuickActionsBar]
**Learning:** In a large form component like `ItemFormScreen.tsx`, updating any single field (e.g., Title) triggers a full re-render of all child elements, including the complex action button grid. This causes measurable frame-rate drops during rapid typing.
**Action:** Extract and memoize static or semi-static UI blocks (like action bars) and stabilize their callbacks via `useCallback` to prevent unnecessary re-renders.

## 2026-06-11 - [Hoisted Configuration & Data-Driven Rendering]
**Learning:** Hardcoding complex UI structures like button grids within a component lead to redundant object/array allocations on every render and make maintenance difficult. Hoisting the configuration to module level and using `.map()` ensures referential stability for static data.
**Action:** Hoist static configuration arrays outside of components and use data-driven rendering to keep components slim and efficient.

## 2026-06-10 - [Streaming CSV Parser]
**Learning:** Standard CSV parsing that returns a full `string[][]` structure creates a massive $O(N)$ memory bottleneck for large catalogs, doubling or tripling peak heap usage before any object hydration begins. Refactoring the parser to use an `onRow` callback allows for immediate hydration and data processing, effectively eliminating the intermediate collection overhead.
**Action:** Always prefer callback-based "streaming" patterns for large data parsing tasks (CSV, JSON, etc.) to minimize peak memory pressure in resource-constrained environments like mobile.

## 2025-05-29 - [Hoisted Configuration Allocation Guard]
**Learning:** Initializing large configuration objects or arrays inside a React component's render body causes redundant allocations on every render cycle. For complex forms where typing triggers high-frequency re-renders, this can lead to memory pressure and UI stuttering.
**Action:** Always hoist static configuration arrays and objects outside of the component definition or memoize them to ensure referential stability and zero-allocation renders.

## 2025-06-15 - [Referential Stability for Data Services]
**Learning:** Even if individual items are cached, returning a new array reference from a fetch service (e.g., `fetchInventory`) triggers a full reconciliation of list components (like `FlatList`). Returning the *exact same* array/object reference when content is identical allows React to bail out of rendering entirely.
**Action:** Implement content-equality checks in data services to maintain referential stability for collection-level returns.

## 2025-06-15 - [Optimized Iterative Image Compression]
**Learning:** Iteratively re-compressing a JPEG from the previous iteration's result leads to "generation loss" (compounded artifacts) and poorer quality-to-size ratios. Resizing once at high quality (1.0) and using that as the source for all subsequent quality passes preserves image integrity and is CPU-efficient.
**Action:** Always use a stable, high-quality intermediate source for iterative lossy compression loops.

## 2025-06-12 - [Surgical Edit Precision & Hoisting]
**Learning:** Using `replace_with_git_merge_diff` on files with internal code duplication (like `HomeScreen.tsx`) requires extreme hunk range precision to avoid leaving partial syntax or accidentally deleting functional logic. Hoisting static configuration arrays (VIEW_MODES, PHOTO_ACTIONS) provides a "double win": it improves performance via referential stability and prevents runtime ReferenceErrors by centralizing metadata.
**Action:** Always verify the resulting file structure with `read_file` after complex multi-hunk replacements to ensure component boundaries and exports remain intact.

## 2025-06-15 - [Referential Equality & Image Generation Loss]
**Learning:** Using `JSON.stringify` for deep equality checks in a data-parsing loop (O(N)) is a performance anti-pattern due to massive string allocation overhead. Additionally, re-compressing already compressed JPEGs (generation loss) degrades quality, so iterative compression should always stem from the original source URI.
**Action:** Prefer field-by-field equality helpers over `JSON.stringify` for referential caching. Always use the original source URI for lossy format manipulations to preserve output quality.

## 2025-06-20 - [Memoized Form Callbacks & Robust Caching]
**Learning:** Passing inline arrow functions to memoized child components (like QuickActionsBar) in a high-frequency re-render environment (like a form) completely negates the benefits of React.memo. Additionally, a referential cache that ignores secondary fields (like photo URLs) leads to stale UI state when those fields are updated.
**Action:** Always wrap handlers passed to memoized children in useCallback. Ensure referential equality helpers (isItemEqual) cover all potentially mutable fields to maintain cache integrity.
