# Audit: Hivemind State Separation (.squidrun/)

**Goal:** Decouple the Hivemind Orchestrator from the target project by separating application-level state from project-level state.

---

## 1. Inventory and Classification

The following files and directories were identified within `.squidrun/`. They are classified as either **Orchestrator** (global app state) or **Project** (target-specific state).

| Path | Classification | Purpose | Responsible Module(s) |
| :--- | :--- | :--- | :--- |
| `app-status.json` | **Orchestrator** | Runtime state of the Hivemind app (session #, mode, version). | `settings-manager.js`, `renderer.js` |
| `usage-stats.json` | **Orchestrator** | Cumulative usage metrics across all sessions and projects. | `usage-manager.js` |
| `message-state.json` | **Orchestrator** | Sequencing and deduplication tracking for agent messaging. | `sequencing.js` |
| `schedules.json` | **Orchestrator** | Background task schedules managed by the app. | `scheduler.js` |
| `triggers/` | **Orchestrator** | Named pipes (files) for inter-agent communication. | `triggers.js`, `hm-send.js`, `daemon` |
| `build/status.md` | **Project** | High-level progress tracking for the current task. | `terminal-daemon.js`, `mcp-server.js` |
| `build/blockers.md` | **Project** | Active blockers specific to the project's current state. | `context-compressor.js`, `daemon` |
| `build/errors.md` | **Project** | Active system/agent errors detected in the current project. | `context-compressor.js`, `daemon` |
| `intent/` | **Project** | JSON files storing the current goal state for each pane. | `terminal.js`, `intent-handlers.js` |
| `review.json` | **Project** | Code review results for the current project change. | `shared-state.js`, `pre-commit.sh` |
| `coordination-philosophy.md` | **Orchestrator** | Foundational rules for how Hivemind operates. | Human Reference / Context |

---

## 2. Current Code Path Tracing

Currently, all modules resolve these paths using `resolveCoordPath()` in `ui/config.js`, which defaults to `PROJECT_ROOT/.squidrun/`. This results in **Orchestrator state** being scattered across every project Hivemind touches, rather than being aggregated globally.

### Key Observation:
The `triggers/` directory is essentially a transport layer. While it acts like orchestrator state, it relies on being in a location accessible to all agents. If agents are spawned in the project root, keeping triggers in the project root is the most reliable fallback.

---

## 3. Proposed Separation Architecture

To achieve clean decoupling, state should be bifurcated based on its classification.

### 3.1 Global App State (Orchestrator)
**Proposed Location:** `%APPDATA%/hivemind/` (Windows) or `~/.config/hivemind/` (Unix).

This ensures that `usage-stats.json` and `app-status.json` are consistent regardless of which project is open.

- **Files to Move:**
  - `app-status.json`
  - `usage-stats.json`
  - `schedules.json`
  - `message-state.json`
  - `firmware/` (The newly created firmware templates)

### 3.2 Project-Specific State (Project)
**Proposed Location:** `.squidrun/` within the **Target Project Root**.

This keeps the metadata (status, blockers, intents) with the code it describes. This allows different projects to have different "memory" and progress states.

- **Files to Keep:**
  - `build/` (status.md, blockers.md, errors.md)
  - `intent/`
  - `review.json`
  - `context-snapshots/` (Evidence Ledger artifacts)

---

## 4. Migration Strategy (Investigation Only)

1.  **Config Update:** Update `ui/config.js` to define `GLOBAL_STATE_ROOT` (user config dir) vs `PROJECT_COORD_ROOT` (target project `.squidrun`).
2.  **Module Redirection:**
    - Update `UsageManager` and `SettingsManager` to use `GLOBAL_STATE_ROOT`.
    - Update `ContextCompressor` and `TerminalDaemon` to continue using `PROJECT_COORD_ROOT`.
3.  **Trigger Handling:** Triggers should likely remain in `PROJECT_COORD_ROOT` to ensure agents running in that project's context can always find them without needing global path knowledge.
