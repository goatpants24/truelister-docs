## 2025-05-15 - Optimizing Inventory Data Flow
**Learning:** Updating local service caches directly after write operations eliminates the need for full network re-fetches (saving ~2s of latency). Furthermore, using `useRef` for referential stability checks in `useFocusEffect` hooks prevents redundant $O(N)$ merge logic and React state updates when no data has changed.
**Action:** Always favor direct cache updates over invalidation for "instant" UI transitions, and implement referential caching for expensive data-merging operations in high-frequency hooks.

## 2026-06-21 - Resolving Massive Code Duplication and Rendering Inefficiency
**Learning:** Codebase-wide duplications (triplicate component/logic blocks) not only bloat bundle size but also cause subtle logic bugs and break React memoization by creating multiple unstable component identities. Consolidating these into single memoized definitions is a prerequisite for predictable rendering performance.
**Action:** Always verify project-wide type safety with `tsc` to catch accidental duplications or missing dependencies after major refactors, and prioritize surgical consolidation of hot-path components (like list items) to ensure memoization effectiveness.
