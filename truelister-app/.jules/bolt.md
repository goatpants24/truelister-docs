## 2025-05-15 - Optimizing Inventory Data Flow
**Learning:** Updating local service caches directly after write operations eliminates the need for full network re-fetches (saving ~2s of latency). Furthermore, using `useRef` for referential stability checks in `useFocusEffect` hooks prevents redundant $O(N)$ merge logic and React state updates when no data has changed.
**Action:** Always favor direct cache updates over invalidation for "instant" UI transitions, and implement referential caching for expensive data-merging operations in high-frequency hooks.

## 2025-05-22 - Correcting File Metadata Retrieval in Expo
**Learning:** Relying on non-existent web-like classes like `File` for local URI metadata in Expo leads to broken iterative loops (like image compression) that fail silently. `FileSystem.getInfoAsync` is the mandatory API for retrieving file size and existence metadata without loading the entire binary into memory.
**Action:** Always verify that file system operations use `expo-file-system` APIs rather than assuming web standard availability, especially when implementing resource-intensive loops.
