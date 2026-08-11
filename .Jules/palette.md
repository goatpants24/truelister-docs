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

## 2026-07-20 - Setup and Settings Soft Keyboard Flow
**Learning:** Completing configuration and connectivity screens can feel tedious if the user has to manually dismiss the soft keyboard and tap buttons. Wiring inputs with step-appropriate `returnKeyType` ('next' or 'done') and `onSubmitEditing` callbacks allows a continuous and natural typing flow that automatically advances steps or saves settings.
**Action:** Map `returnKeyType` to transition focus or submit the form, and use `useRef` to target the next input without losing focus.

## 2026-07-22 - Conveying Button States to Screen Readers
**Learning:** In React Native/Expo, simply disabling a button using the `disabled` prop does not automatically inform screen readers (VoiceOver or TalkBack) that the button is interactive/inactive. Providing an explicit `accessibilityState={{ disabled: isBtnDisabled }}` ensures that assistive technologies correctly announce the button's current state to users.
**Action:** Always accompany `disabled` props on touchable elements with matching `accessibilityState={{ disabled }}` attributes to maintain high accessibility.
