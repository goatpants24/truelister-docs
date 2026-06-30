# 🎨 Palette Journal: UX & Accessibility

## 2025-05-15 - Title Character Counter
**Learning:** Marketplace item titles should adhere to an 80-character limit, with visual character counters providing thresholds: amber at 70 characters and red at 80+ to guide users toward optimal title lengths.
**Action:** Use a `fieldFooter` container to align error messages and character counters for a consistent look.

## 2025-05-15 - Chip Accessibility
**Learning:** Interactive chips used for multi-selection must include `accessibilityRole="button"` and `accessibilityState={{ selected: isSelected }}` to ensure screen readers correctly convey their purpose and state.
**Action:** Always include accessibility props when using `TouchableOpacity` for selection elements.

## 2026-06-25 - Header Save Feedback and Touch Targets
**Learning:** Secondary actions in the header (like 'Save' or 'Cancel') benefit significantly from explicit touch target expansion (hitSlop) and real-time state feedback (ActivityIndicator) to ensure they feel as reliable and responsive as primary bottom-of-screen buttons.
**Action:** Always add hitSlop and dynamic accessibility labels to header actions to maintain mobile usability and assistive technology clarity.

## 2026-06-30 - Sold Status Visual & A11y
**Learning:** In marketplace apps, "Sold" items should be visually distinguished from active inventory using multiple cues (strikethrough, opacity, and badges) to reduce cognitive load. Crucially, these visual states must be reflected in accessibility labels (e.g., prefixing with "Sold: ") so screen reader users get the same context as sighted users.
**Action:** When implementing status-based UI changes, always pair visual indicators with corresponding updates to `accessibilityLabel` or `accessibilityState`.
