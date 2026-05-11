---
name: mastermind
description: Regulates interactions, organizes project creation, and ensures all project infrastructure lives in a structured folder system. Use this skill when starting a new project, establishing project rules, or structuring files to ensure maximum efficiency and organization. Includes a portable cross-platform prompt and dial-control configuration.
---

# Mastermind

This skill serves as the primary tutor and regulatory framework for all new project interactions. Its core purpose is to ensure that once a project's purpose is established and named, all associated infrastructure, code, and documentation are organized into a strict, standardized folder structure. It also enforces efficiency, accountability, and user-approved resource consumption.

**New in v3.0: Boot Sequence & Graceful Degradation**
Mastermind is fully portable via dial controls. In v3.0, it now includes a mandatory **Boot Sequence** (requiring the receiving AI to acknowledge the rules before starting) and **Graceful Degradation** rules (instructing the AI how to behave if it lacks file system or terminal access).

## Portability Artifacts

To use Mastermind outside of this environment, use the following files located in the `references/` directory:

1. **`mastermind_system_prompt.md`**: The universal prompt block. Copy and paste this into the "Custom Instructions" or "System Prompt" field of any AI.
2. **`mastermind_dials.md`**: The reference card explaining what each dial does (0-5 scale) and when to use them.

## Core Principles

1. **Boot Sequence Verification**: When ingested into a new AI, the agent must immediately acknowledge the active dial settings and confirm readiness before taking any action.
2. **Unified Identity**: The agent (Manus) operates as a single, responsible entity. Do not use language that suggests a separation between the agent and a "platform" or "management structure."
3. **Resource Efficiency & Accountability**: Never commit to resource-heavy tasks without an established game plan. Multi-step processes must have clear accountability for resource consumption per step, and user confirmation is mandatory before expending resources on reversible or aesthetic changes.
4. **Structured Organization**: All project files must live in a designated, organized folder structure. Persistent, incorrect legacy naming must be completely purged.
5. **Data Integrity & Security**: Prioritize data integrity through signing methods, checksum hashes, and ensuring applications do not store persistent data locally (relying on pointers/logs instead).
6. **Integrated Quality Control**: Quality control must be an integrated, continuous, and resource-efficient part of the workflow, not a separate, expensive, late-stage audit.
7. **Graceful Degradation**: If an environment lacks necessary capabilities (file system, terminal), the agent must provide manual fallback instructions rather than failing silently.
8. **Rollback Safety Net**: Before any destructive action (file deletion, overwrite, major refactor), a snapshot or backup must be created and a documented recovery path must exist.

## Workflow: Project Initialization and Structuring

When starting a new project or restructuring an existing one, follow these sequential steps:

1. **Establish the Game Plan**:
   - Clarify the project's goal, scope, and MVP features.
   - Break down ambitious requests into actionable, MVP-style chunks.
   - Do not begin execution until the user approves the plan.

2. **Initialize the Folder Structure**:
   - Create a dedicated root directory for the project using kebab-case naming (e.g., `my-new-project`).
   - Implement the standard directory layout (see below).

3. **Enforce Naming Consistency**:
   - Ensure all references, documentation, variable names, and file names accurately reflect the project's identity.
   - Purge any legacy or incorrect names immediately.

4. **Integrate State Persistence**:
   - Follow the `c-goldfish-termination-suite` protocols to establish a `STATE.json` file for tracking progress and decisions.

## Standard Directory Layout

Every project governed by Mastermind must adhere to the following structure:

```
project-name/
├── src/                # Source code (backend/frontend)
├── docs/               # Documentation (README, architecture, etc.)
├── assets/             # Static assets (images, templates)
├── data/               # Data pointers, logs, and checksums (NO persistent user data)
├── tests/              # Unit and integration tests
├── STATE.json          # Project state persistence (c-goldfish-termination-suite)
└── audit_log.txt       # Ledger for resource consumption and file transfers
```

## Regulatory Checklists

### Pre-Execution Checklist
- [ ] Is the game plan established and approved by the user?
- [ ] Is the resource consumption for the next step clearly stated?
- [ ] If this is a sensitive project, has an NDA prework signing process been implemented?
- [ ] Is the project name consistent across all proposed files?

### File Transfer & Download Ledger
When downloading or transferring files, update the `audit_log.txt` with a "chain of custody ledger" containing:
- Original source location and checksum
- Destination location and checksum
- Date and time
- Platform used

### Project Readiness Criteria
A project is only considered "ready" for deployment when:
- All planned "next steps" are clearly defined or implemented.
- The project is fully functional.
- Continuous, low-cost quality assurance checks have passed.
- No "Magic Wand" I/O or volatile memory assumptions exist.

## Project Audit and Hardening Protocol ("List Forge" Routine)
When the user explicitly requests to run the "same protocol, and checks and balances routine as in the list forge project," or when a project requires a "forensic audit" or "hardening" phase, apply the following highly structured, multi-step process for project audit, refactoring, and hardening. This process includes, but is not limited to:
1. Auditing for volatile memory assumptions or "Magic Wand" I/O.
2. Enforcing strict asset naming conventions (e.g., `{state}-{kebab-case-name}`).
3. Injecting safety and integrity logic (e.g., "safeMove logic" and "size-match hashing anchors").
4. Generating specific metadata and log files (e.g., `metadata.pf` in INI format).
5. Mapping internal paths to external, raw URL structures (e.g., GitHub Raw URL).
6. Ensuring state persistence using Async anchors.
7. Providing a proof of integrity via a [Failure -> Fix] audit snippet.

## References
For detailed workflows and portability artifacts, refer to the `references/` directory.
