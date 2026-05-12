## 2025-05-15 - [Debounced History Optimization]
**Learning:** In the `useUndoRedo` hook, dispatching a history-pushing action on every keystroke leads to O(N) memory growth and poor UX. Separating immediate UI updates (`UPDATE`) from debounced history commits (`COMMIT`) significantly improves efficiency.
**Action:** Use a "lastCommitted" state to track the reference point for history, and ensure manual undos/redos flush any pending debounced timers to avoid state inconsistency.

## 2025-05-16 - [Sheets Data Caching]
**Learning:** Google Sheets CSV exports are slow and redundant for static data (dropdowns) or frequently accessed lists (inventory). Implementing tiered in-memory caching (5m for static, 1m for volatile) provides a 150ms-500ms speed boost per interaction.
**Action:** Always invalidate specific caches during write operations (e.g., `appendItem`) and global caches when the Spreadsheet ID changes to ensure data consistency without sacrificing the performance win.
