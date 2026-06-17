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

## 2025-05-24 - [Visual Feedback for Selection Chips]
**Learning:** Adding a visual prefix like a checkmark (✓) to selected chips in a multi-select list provides an additional layer of confirmation beyond just background color changes, which significantly improves usability for all users and ensures consistency with other parts of the application (like the Publish screen).
**Action:** When implementing chip-based selection, always include a visual confirmation character (like ✓) for the selected state to provide unambiguous feedback.

## 2025-05-24 - [Onboarding Flow Accessibility]
**Learning:** The onboarding flow is the most critical path for new users. Adding explicit accessibility labels to URL inputs and button roles to skip/next actions ensures that users relying on screen readers can successfully set up the application without frustration.
**Action:** Always audit the onboarding flow for missing accessibility attributes to ensure a positive first-time experience for all users.
