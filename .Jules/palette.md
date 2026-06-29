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

## 2026-06-26 - Sold Status Visibility
**Learning:** In inventory apps, sold items must be visually distinct but still legible. Dimming opacity to 0.8 and adding a high-contrast "SOLD" badge (red #f87171) provides immediate feedback. Accessibility is ensured by prefixing the `accessibilityLabel` with "Sold: ".
**Action:** Use `flex: 1` on title containers when pairing with badges to prevent layout overflow on long text.
