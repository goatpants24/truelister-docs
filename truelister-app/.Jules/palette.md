## 2026-05-29 - Accessible Marketplace Publishing
**Learning:** In React Native, custom selection grids using `TouchableOpacity` require explicit `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityState={{ selected: boolean }}` to be properly interpreted by screen readers. Adding a visual prefix (e.g., "✓") to the text also helps visual users quickly identify selection state.
**Action:** Always apply these accessibility props to custom multi-select or single-select UI components to ensure they are fully navigable and understandable via assistive technologies.

## 2026-06-02 - Reactive Form Validation & Guidance
**Learning:** In high-speed inventory workflows, disabling primary "Save" actions until mandatory fields (like Title) are met prevents error-driven friction and provides immediate visual confirmation of form readiness. Combining this with `autoFocus` on the first required field significantly reduces the "tap-to-start" overhead for mobile users.
**Action:** Implement conditional disabling/dimming on all submission buttons paired with auto-focus on primary inputs to create a "guided" feel for mandatory data entry.

## 2026-07-05 - Searchable Inventory & Empty States
**Learning:** For catalogs exceeding a single screen, a real-time search filter is a critical micro-UX win. Implementing this requires a "No Matches" empty state to prevent user confusion when a query yields zero results. In React Native, ensure  is applied to the list container (not the input) to provide a smooth transition between searching and browsing.
**Action:** Always pair search inputs with a memoized filter logic and a dedicated "No Results" view that includes a clear "Clear Search" action.
