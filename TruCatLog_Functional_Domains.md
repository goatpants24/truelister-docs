# TruCatLog Functional Domains

To enable a multi-agent (MCP) workflow, the project work is categorized into these logical domains:

### 1. Discovery & Consolidation (The "Scout" Domain)
- Identifying redundant code.
- Selecting primary feature sets from variants.
- Merging disparate logic into a "source of truth".

### 2. Identity & Metadata (The "Brand" Domain)
- Application naming and rebranding.
- Configuration file updates (`app.json`, `package.json`).
- Documentation alignment (`README.md`).

### 3. UI/UX Evolution (The "Frontend" Domain)
- Screen layout migration.
- New component implementation (Chips, Modals, Onboarding).
- Navigation flow logic (`RootNavigator`).

### 4. Logic & Features (The "Core" Domain)
- Pro features (Market Research, WB Locking).
- Business logic (Sold signaling, item numbering).
- State management (Undo/Redo integration).

### 5. Infrastructure & Connectivity (The "Backend" Domain)
- Google Sheets API integration (Read/Write).
- Apps Script deployment logic.
- Diagnostic tools and health checks.

### 6. Hardening & Quality (The "QA" Domain)
- TypeScript verification.
- Cross-platform build fixes (FileSystem, etc.).
- Functional regression testing (Thumbnails, local drafts).
