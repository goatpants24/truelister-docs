## 2026-05-29 - Accessible Marketplace Publishing
**Learning:** In React Native, custom selection grids using `TouchableOpacity` require explicit `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityState={{ selected: boolean }}` to be properly interpreted by screen readers. Adding a visual prefix (e.g., "✓") to the text also helps visual users quickly identify selection state.
**Action:** Always apply these accessibility props to custom multi-select or single-select UI components to ensure they are fully navigable and understandable via assistive technologies.

## 2026-06-02 - Reactive Form Validation & Guidance
**Learning:** In high-speed inventory workflows, disabling primary "Save" actions until mandatory fields (like Title) are met prevents error-driven friction and provides immediate visual confirmation of form readiness. Combining this with `autoFocus` on the first required field significantly reduces the "tap-to-start" overhead for mobile users.
**Action:** Implement conditional disabling/dimming on all submission buttons paired with auto-focus on primary inputs to create a "guided" feel for mandatory data entry.

## 2026-07-01 - Visual and Accessible 'Sold' Signaling
**Learning:** For inventory apps, items that are no longer available (Sold) should be visually de-emphasized (reduced opacity) but clearly marked with a high-contrast 'stamp' or 'badge' to prevent user confusion. Accessibility is critical here: prefixing the `accessibilityLabel` with "Sold: " ensures screen reader users don't have to navigate deep into the item details to discover its status.
**Action:** Apply a consistent 'Sold' style (e.g., #f87171 color, price strikethrough, and stamp overlay) and ensure accessibility labels reflect the state immediately.
