## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2025-03-24 - [Emoji Button Accessibility]
**Learning:** Icon-only buttons using emojis (e.g., 🖼, 🏷) require explicit `accessibilityLabel` props. Screen readers often fail to provide meaningful context for emojis, and `accessibilityRole="button"` is essential for non-button elements (like `TouchableOpacity`) to be correctly identified by assistive technologies.
**Action:** Always provide descriptive `accessibilityLabel` and `accessibilityRole="button"` for interactive elements that use icons or emojis instead of text.

## 2025-03-24 - [Maintaining Component Memoization in Forms]
**Learning:** In high-frequency render paths like complex forms, breaking `React.memo` by passing new object literals as props (e.g., `prop={{...}}`) can cause significant performance degradation (jank) during typing.
**Action:** When passing multiple state-derived values to memoized sub-components, pass them as individual primitive props or ensure the object itself is memoized via `useMemo` in the parent.

## 2025-05-15 - [Consistent Feedback for Batch Actions]
**Learning:** Using a data-driven approach (mapping over an array of actions) for a group of similar interactive elements ensures that visual feedback (like checkmarks) and accessibility states (like 'Captured') stay synchronized across all elements, preventing bugs where one action provides better feedback than others.
**Action:** When creating groups of similar action buttons (e.g., photo capture fields), prefer mapping over a configuration array to guarantee consistent UX and accessibility across the entire set.

## 2026-06-17 - [Marketplace Accessibility]
**Learning:** Marketplace credential screens often contain complex statuses and external links that need explicit accessibility roles and labels to be navigable by screen reader users. Dynamic labels for "Save" buttons that reflect the current "Saved" state provide immediate confirmation.
**Action:** Always provide `accessibilityRole="link"` for external documentation links and use dynamic `accessibilityLabel` for action buttons that have success/saved states.

## 2026-06-18 - [Visual Confirmation for Multi-Select Chips]
**Learning:** In mobile interfaces using chip-based multi-selection, providing a visual indicator like a checkmark (✓) inside the selected chip significantly improves clarity, especially when the selection state is only indicated by subtle background color changes.
**Action:** Always include a visual prefix (like ✓) for selected states in multi-select chip components to provide immediate, unambiguous feedback.

## 2026-06-19 - [Touch Target Optimization for Inline Research Links]
**Learning:** Small text-based research links (e.g., "🔍 Label Research") in mobile forms often have insufficient touch targets, leading to user frustration. Combining `accessibilityRole="button"` with a generous `hitSlop` ensures these secondary actions are both discoverable by screen readers and easy to tap.
**Action:** When using text links as buttons in mobile UIs, always apply `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to expand the interactive area without affecting the layout.
