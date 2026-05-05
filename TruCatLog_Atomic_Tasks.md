# TruCatLog: Atomic Agent Tasks

Each task is designed to be completed by a small, specialized agent with a "sole purpose."

## Domain 1: Discovery (Scout Agent)
- [TASK-1.1]: List all files in `src/screens/` and summarize differences between numbered variants (1, 2, 3).
- [TASK-1.2]: Identify all `import` statements referencing deleted variants and flag for removal.

## Domain 2: Brand (Metadata Agent)
- [TASK-2.1]: Update `name` and `slug` in `app.json` to "TruCatLog".
- [TASK-2.2]: Synchronize `package.json` name with `app.json`.
- [TASK-2.3]: Rewrite README.md to reflect new branding and features.

## Domain 3: Frontend (UI Agent)
- [TASK-3.1]: Refactor `HomeScreen.tsx` to support Grid, List, and Table view modes.
- [TASK-3.2]: Implement a chip-based selector for multiple marketplaces.
- [TASK-3.3]: Create the `OnboardingScreen.tsx` layout with step-based navigation.

## Domain 4: Core Logic (Logic Agent)
- [TASK-4.1]: Implement `handleMarketResearch` to generate eBay/Google deep links from item state.
- [TASK-4.2]: Add "Mark Sold" logic that triggers a `Cross-Listing Reminder` alert.
- [TASK-4.3]: Integrate `useUndoRedo` hook into the main item form.

## Domain 5: Backend (Connectivity Agent)
- [TASK-5.1]: Update `sheets.ts` to support dynamic Spreadsheet IDs from `AsyncStorage`.
- [TASK-5.2]: Build a regex helper to extract Google Sheet IDs from full URLs.
- [TASK-5.3]: Implement a `ping` action in the Apps Script and a corresponding test in-app.

## Domain 6: QA (Hardening Agent)
- [TASK-6.1]: Fix `expo-file-system` imports to use the `/legacy` path.
- [TASK-6.2]: Ensure `photoUrl` is synchronized with `photoUrlCard` on save for Home Screen thumbnails.
- [TASK-6.3]: Run `npx tsc --noEmit` and resolve all remaining type errors.
