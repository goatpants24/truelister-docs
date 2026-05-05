# MCP Architecture: TruCatLog Multi-Agent Workflow

This blueprint defines how a collection of small, purpose-built agents (MCP) can recreate or evolve the TruCatLog project under a Supervisor Agent.

## Specialized Agent Roles

### 1. The Scout (Search & Discovery)
- **Role**: Explores the codebase, maps dependencies, and identifies variants.
- **MCP Toolset**: `list_files`, `grep`, `read_file`.
- **Purpose**: Provide the Supervisor with a "Map of the World."

### 2. The Weaver (UI & UX)
- **Role**: Implements screens, components, and transitions.
- **MCP Toolset**: `write_file`, `replace_with_git_merge_diff`.
- **Purpose**: Materialize the visual interface requested by the user.

### 3. The Mechanic (Logic & State)
- **Role**: Handles business logic, data parsing, and state history.
- **MCP Toolset**: `write_file`, `npx tsc`.
- **Purpose**: Ensure the app "works" correctly under the hood.

### 4. The Bridge (Connectivity & Backend)
- **Role**: Manages external API links (Google Sheets, Drive) and local persistence.
- **MCP Toolset**: `curl`, `view_text_website`, `AsyncStorage` mocks.
- **Purpose**: Maintain data flow between the app and the user's accounts.

### 5. The Sentinel (QA & Hardening)
- **Role**: Fixes build errors, runs type checks, and verifies features.
- **MCP Toolset**: `run_in_bash_session`, `frontend_verification_instructions`.
- **Purpose**: Prevent regressions and ensure cross-platform stability.

---

## Supervisor Execution Logic (The "MCP Orchestrator")

The Supervisor (Jules) does not write every line of code. Instead, it manages the "Stack" of Agent Tasks:

1. **Step 1: Contextualize**: Supervisor analyzes user request and triggers the **Scout** to map the current project state.
2. **Step 2: Task Generation**: Supervisor breaks the requirement into **Atomic Tasks** (referencing the `TruCatLog_Atomic_Tasks.md` pattern).
3. **Step 3: Dispatch & Lock**: Supervisor assigns tasks to specialized agents.
4. **Step 4: Integration Review**: Supervisor reviews the code produced by Weaver and Mechanic to ensure they work together.
5. **Step 5: Sentinel Deployment**: Supervisor triggers the **Sentinel** to run `tsc` and verify the UI.
6. **Step 6: Completion**: Supervisor compiles the agent reports into a single, cohesive update for the user.
