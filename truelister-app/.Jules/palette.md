## 2026-05-29 - Accessible Marketplace Publishing
**Learning:** In React Native, custom selection grids using `TouchableOpacity` require explicit `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityState={{ selected: boolean }}` to be properly interpreted by screen readers. Adding a visual prefix (e.g., "✓") to the text also helps visual users quickly identify selection state.
**Action:** Always apply these accessibility props to custom multi-select or single-select UI components to ensure they are fully navigable and understandable via assistive technologies.

## 2026-06-02 - Reactive Form Validation & Guidance
**Learning:** In high-speed inventory workflows, disabling primary "Save" actions until mandatory fields (like Title) are met prevents error-driven friction and provides immediate visual confirmation of form readiness. Combining this with `autoFocus` on the first required field significantly reduces the "tap-to-start" overhead for mobile users.
**Action:** Implement conditional disabling/dimming on all submission buttons paired with auto-focus on primary inputs to create a "guided" feel for mandatory data entry.

## 2026-06-05 - Visual Distinction for Status-Based Items
**Learning:** When displaying a catalog where items can have different terminal states (like "Sold"), visually de-emphasizing them (e.g., via 0.8 opacity) while providing explicit badges (overlays or small corner tags) helps users scan for active inventory more efficiently. Adding a "Sold: " prefix to accessibility labels ensures the status is communicated immediately to screen reader users.
**Action:** Use a combination of opacity, badges, and text decoration (strikethrough on price) to create a clear visual hierarchy for item status.
