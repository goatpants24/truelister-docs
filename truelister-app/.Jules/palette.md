## 2026-05-29 - Accessible Marketplace Publishing
**Learning:** In React Native, custom selection grids using `TouchableOpacity` require explicit `accessibilityRole="button"`, `accessibilityLabel`, and `accessibilityState={{ selected: boolean }}` to be properly interpreted by screen readers. Adding a visual prefix (e.g., "✓") to the text also helps visual users quickly identify selection state.
**Action:** Always apply these accessibility props to custom multi-select or single-select UI components to ensure they are fully navigable and understandable via assistive technologies.
