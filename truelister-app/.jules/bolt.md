## 2025-05-15 - Optimizing Inventory Data Flow
**Learning:** Updating local service caches directly after write operations eliminates the need for full network re-fetches (saving ~2s of latency). Furthermore, using `useRef` for referential stability checks in `useFocusEffect` hooks prevents redundant $O(N)$ merge logic and React state updates when no data has changed.
**Action:** Always favor direct cache updates over invalidation for "instant" UI transitions, and implement referential caching for expensive data-merging operations in high-frequency hooks.
