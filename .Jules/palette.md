## 2025-03-20 - [Title Character Counter & Accessibility]
**Learning:** Real-time feedback for field constraints (like title length) is a critical micro-UX that prevents user frustration during marketplace export. Accessibility labels for icon-only buttons are essential for screen readers to provide context for actions like "AI Suggest" or "Research".
**Action:** Always include character counters for fields with strict downstream limits (eBay/Mercari titles) and ensure all `TouchableOpacity` elements with icons have `accessibilityLabel` and `accessibilityRole="button"`.
