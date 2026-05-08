
## 2025-05-14 - [Undo/Redo History Bloat]
**Learning:** In React Native forms with large state objects, an un-debounced undo/redo history can lead to massive memory consumption ((N^2)$ on string length $) and sluggish state updates during rapid typing as the entire state is cloned into an array on every keystroke.
**Action:** Implement a debounced commit strategy in the state hook. Update the UI state immediately with an `UPDATE` action, but only push to the history stack with a `COMMIT` action at the start of a sequence and after a debounce timeout.
