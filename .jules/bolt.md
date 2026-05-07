## 2026-05-07 - [Optimized state management and undo/redo efficiency]
**Learning:** React Native form performance can be significantly degraded by unnecessary re-renders when using complex state hooks (like undo/redo) that aren't optimized for rapid input.
**Action:** Always separate immediate UI state updates from heavy operations (like history stack manipulation) using a debounced commit strategy. Use functional updates in state setters to maintain stable callbacks and prevent component-wide re-renders during user input.
