## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2026-05-16 - [Empty State CTA and Accessibility]
**Learning:** Empty states without a clear call-to-action (CTA) can be a dead-end for users. Providing a primary button to start the main user flow (e.g., "Create New Item") significantly improves the user journey. Additionally, descriptive accessibility labels for list items and their actions (like "Delete") ensure a more inclusive experience for screen reader users.
**Action:** Always provide a primary CTA in empty states and ensure all interactive list elements have clear, context-aware accessibility labels.
