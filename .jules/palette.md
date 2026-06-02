## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2025-03-24 - [Marketplace Selection Visual Feedback]
**Learning:** For multi-select chips, combining a visual checkmark (✓) prefix with the `accessibilityState={{ selected: boolean }}` prop provides a clear and consistent UX across different screens (e.g., ItemForm vs. Publish). Re-stating "Selected" in the `accessibilityLabel` is redundant as the state attribute already handles this for assistive technologies.
**Action:** Use a '✓ ' prefix for selected states in multi-select chips and rely on semantic accessibility props for state announcement.
