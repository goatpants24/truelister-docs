## 2025-03-24 - [Title Character Counter]
**Learning:** Real-time character counters are essential for marketplace apps to prevent users from exceeding field limits (e.g., eBay's 80-char limit) and provide immediate visual feedback via color thresholds.
**Action:** Always include character counters for fields with strict character limits, and use visual indicators (Amber/Red) to signal approaching and exceeding the limit.

## 2025-03-24 - [Home Screen Interactivity and Accessibility]
**Learning:** Pull-to-refresh is a critical micro-UX pattern for data-driven apps, providing a familiar and intuitive way to update content. Combined with ARIA roles and accessibility states (selected), it ensures the interface is both delightful and usable for all users.
**Action:** Implement pull-to-refresh for primary lists and ensure all mode/selection toggles include `accessibilityRole="button"` and `accessibilityState={{ selected: boolean }}`.

## 2025-03-25 - [Empty State Call-to-Action]
**Learning:** Empty states without a clear next step are dead ends for users. Adding a prominent "Create New Item" CTA in the Drafts screen empty state transforms a passive message into an active guidance, improving app flow and user engagement.
**Action:** Always provide a primary CTA button in empty states to guide users toward the core functional path.
