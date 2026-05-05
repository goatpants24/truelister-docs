# Mastermind — Dial Control Reference Card

This document describes every configurable dial in the Mastermind CONFIG BLOCK, what each level does, and when to use it. Adjust the numbers in the CONFIG BLOCK of the system prompt to tune behavior.

---

## RESOURCE_GATE
**Controls how aggressively the agent gates resource-consuming actions.**

| Level | Behavior |
|-------|----------|
| 0 | Off. Agent acts freely without resource checks. |
| 1 | Warn only. Agent notes when a step is resource-heavy but proceeds. |
| 2 | Soft gate. Agent pauses before large multi-step tasks and summarizes scope. |
| 3 | Confirm per step. Agent asks for approval before each step that consumes resources. *(Default)* |
| 4 | Confirm + itemize cost. Agent lists estimated cost of every step before beginning. |
| 5 | Full lockdown. No action taken without explicit per-step user approval. |

**Recommended:** 3 for standard work. 5 when debugging or after a resource dispute.

---

## QC_INTENSITY
**Controls the depth and frequency of quality control checks.**

| Level | Behavior |
|-------|----------|
| 0 | No QC. Agent produces output without review. |
| 1 | Light review. Agent does a quick self-check before delivering. |
| 2 | Standard checks. Agent validates logic, naming, and structure at delivery. |
| 3 | Integrated continuous QC. Agent runs checks at every phase transition. *(Default)* |
| 4 | Hardening pass. Applies safeMove logic, checksum anchors, and asset naming enforcement. |
| 5 | Full List Forge forensic audit. Complete protocol: volatile memory audit, `{state}-{kebab-case-name}` enforcement, `metadata.pf` generation, GitHub Raw URL mapping, Async state anchors, [Failure → Fix] snippet. |

**Recommended:** 3 for active development. 5 before any production deployment.

---

## CONFIRMATION_MODE
**Controls how often the agent pauses to confirm with the user.**

| Level | Behavior |
|-------|----------|
| 0 | Silent auto. Agent proceeds without interruption. |
| 1 | Notify milestones only. Agent announces phase completions but does not pause. |
| 2 | Confirm before irreversible actions. Agent pauses only before destructive or permanent changes. *(Default)* |
| 3 | Confirm before every action. Agent asks before each discrete step. |
| 4 | Step-by-step with cost. Agent confirms each step and states its resource cost. |
| 5 | Full lockstep. Agent does nothing without explicit instruction for each micro-action. |

**Recommended:** 2 for normal flow. 4 when the user wants full visibility.

---

## FOLDER_ENFORCEMENT
**Controls how strictly the standard directory layout is enforced.**

| Level | Behavior |
|-------|----------|
| 0 | Off. No folder structure guidance. |
| 1 | Suggest structure. Agent recommends the standard layout but does not enforce it. |
| 2 | Warn on deviation. Agent flags when files are placed outside the standard layout. |
| 3 | Enforce standard layout. Agent creates and maintains the standard structure. *(Default)* |
| 4 | Enforce + rename legacy. Agent corrects legacy folder names automatically. |
| 5 | Enforce + purge + audit trail. Agent removes non-compliant structures and logs all changes. |

**Recommended:** 3 for new projects. 4 when refactoring an existing messy project.

---

## NAMING_STRICTNESS
**Controls enforcement of kebab-case naming and legacy name purging.**

| Level | Behavior |
|-------|----------|
| 0 | Off. No naming guidance. |
| 1 | Suggest kebab-case. Agent recommends but does not enforce. |
| 2 | Warn on legacy names. Agent flags incorrect names but proceeds. |
| 3 | Enforce kebab-case. Agent uses correct names and corrects deviations. *(Default)* |
| 4 | Enforce + flag all inconsistencies. Agent produces a full inconsistency report. |
| 5 | Enforce + block until corrected. Agent refuses to proceed until all names are corrected. |

**Recommended:** 3 for standard work. 5 after a project rename or major refactor.

---

## STATE_SYNC
**Controls how frequently the STATE.json file is updated.**

| Level | Behavior |
|-------|----------|
| 0 | Off. No state file maintained. |
| 1 | On request only. Agent syncs STATE.json only when explicitly asked. |
| 2 | At milestones. Agent syncs at natural phase transitions. *(Default)* |
| 3 | Every 10 messages. Agent syncs on a message-count interval. |
| 4 | Every 5 messages. More frequent sync for fast-moving sessions. |
| 5 | Every message. Maximum persistence. Use for critical or long-running projects. |

**Recommended:** 2 for most projects. 3–4 for complex, multi-day projects.

---

## VERBOSITY
**Controls how much the agent explains its actions.**

| Level | Behavior |
|-------|----------|
| 0 | Silent. Agent outputs results only, no commentary. |
| 1 | Minimal. Agent acknowledges actions with one-liners. |
| 2 | Standard. Agent provides clear, concise explanations. *(Default)* |
| 3 | Detailed. Agent explains reasoning at each step. |
| 4 | Verbose. Agent provides full rationale, alternatives considered, and decisions made. |
| 5 | Full trace. Agent narrates every micro-decision. Use for debugging or onboarding. |

**Recommended:** 2 for experienced users. 3–4 when learning a new workflow.

---

## NDA_GATE
**Controls the NDA prework requirement for sensitive projects.**

| Level | Behavior |
|-------|----------|
| 0 | Off. No NDA process. *(Default)* |
| 1 | Remind on sensitive projects. Agent flags when IP or confidential data is involved. |
| 2 | Require acknowledgment. Agent requires explicit user acknowledgment before proceeding. |
| 3 | Require signed NDA artifact. Agent produces and stores an NDA document in `docs/` before any work begins. |

**Recommended:** 0 for personal projects. 2–3 for client work or sensitive IP.

---

## Inline Override Syntax

Override any dial mid-conversation without editing the system prompt:

```
[MASTERMIND: DIAL_NAME=VALUE]
```

**Examples:**
```
[MASTERMIND: RESOURCE_GATE=5]
[MASTERMIND: VERBOSITY=0]
[MASTERMIND: QC_INTENSITY=4]
[MASTERMIND: CONFIRMATION_MODE=3, FOLDER_ENFORCEMENT=4]
```

Overrides take effect immediately and persist for the remainder of the session.

---

## Preset Profiles

For convenience, the following preset combinations are recommended:

| Profile | Settings | Use Case |
|---------|----------|----------|
| **Autopilot** | RESOURCE_GATE=1, CONFIRMATION_MODE=0, VERBOSITY=1, QC_INTENSITY=2 | Trusted, fast iteration on low-stakes tasks |
| **Standard** | All dials at 3 (default) | Normal project work |
| **Watchdog** | RESOURCE_GATE=4, CONFIRMATION_MODE=4, QC_INTENSITY=3, VERBOSITY=3 | After a resource dispute or quality issue |
| **Lockdown** | RESOURCE_GATE=5, CONFIRMATION_MODE=5, QC_INTENSITY=5, NAMING_STRICTNESS=5 | Pre-production hardening or forensic audit |
| **Stealth** | VERBOSITY=0, CONFIRMATION_MODE=0, STATE_SYNC=5 | Silent background execution with full state tracking |
