## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2025-03-24 - [Non-Color Selection Indicators]
**Learning:** Relying on color alone to indicate selection (e.g., a blue border) is insufficient for accessibility. Adding a visual glyph like a checkmark (✓) ensures the state is clear to all users, including those with color vision deficiencies.
**Action:** Always add a visual glyph or secondary indicator when showing selection states, especially in grids or lists where multiple items can be selected.
