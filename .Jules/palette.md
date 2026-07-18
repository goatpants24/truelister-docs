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

## 2026-07-04 - Sold Status Visual Indicators
**Learning:** In marketplace catalogs, "Sold" items should be clearly distinguished from available inventory using multiple cues: reduced opacity (e.g., 0.8), a bold visual overlay or badge (e.g., a 'SOLD' stamp), and price strikethroughs. This helps users quickly scan their inventory.
**Action:** Apply a consistent "Sold" style across all view modes (grid and list) and prefix `accessibilityLabel` with 'Sold: ' to provide immediate context for screen readers.

## 2026-07-10 - Keyboard Navigation and Focus Management
**Learning:** Sequential keyboard navigation across forms significantly improves data-entry speed on React Native Web and mobile apps. To prevent the soft keyboard from dismissing during input transitions, intermediate text fields must set `blurOnSubmit={false}` and `returnKeyType="next"`.
**Action:** Implement `useRef` hooks and utilize `onSubmitEditing={() => nextInputRef.current?.focus()}` to orchestrate clean focus flows.
