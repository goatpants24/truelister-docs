## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2025-05-24 - [Publish Screen Accessibility & Visual Feedback]
**Learning:** For multi-selection grids (like marketplaces), providing both semantic accessibility state (`accessibilityState={{ selected: isSelected }}`) and clear visual indicators (like a checkmark prefix) ensures the interface is accessible to both screen readers and sighted users. Dynamic accessibility labels on action buttons that reflect internal state (e.g., "Publishing...") are crucial for non-visual feedback during async operations.
**Action:** Always pair `accessibilityState` with visual indicators in selection UI, and use dynamic `accessibilityLabel` for async action buttons.
