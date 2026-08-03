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

## 2026-07-10 - Item Form Micro-UX and Focus Flow
**Learning:** Sequential data entry in complex forms (Title -> Brand -> Size -> Price) is significantly improved by implementing keyboard focus navigation. Combined with expanded touch targets (hitSlop) for header actions and dynamic accessibility labels for async states (Saving...), the interface feels more responsive and professional.
**Action:** Use `useRef` and `onSubmitEditing` to chain `TextInput` focus. Always add `hitSlop` to small header buttons and ensure accessibility labels update to reflect current component state.

## 2026-07-15 - Standardizing External Links Accessibility Hint
**Learning:** External research links and redirection targets can cause disorientation for screen reader users if they open outside the app without warning. Providing an explicit `accessibilityHint="Opens in your browser"` on all elements invoking external links ensures a highly accessible and predictable browsing experience.
**Action:** Always accompany `Linking.openURL` buttons or link items with an explicit `accessibilityHint="Opens in your browser"` attribute.

## 2026-08-03 - Native Keyboard Flows and Form Submission
**Learning:** Multistep forms and connectivity settings in mobile interfaces are significantly more fluid and accessible when native soft keyboard actions (Next and Done) are used to handle field focusing and automatic saving. This prevents cognitive friction and unnecessary touch target searching.
**Action:** Always map step-appropriate returnKeyType ('next' and 'done') to onSubmitEditing to advance form focus sequentially or automatically submit data.
