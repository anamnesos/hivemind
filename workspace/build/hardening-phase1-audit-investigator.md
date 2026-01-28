# Hardening Phase 1 Audit — ipc-handlers.js + index.html

Date: 2026-01-28
Owner: Investigator
Scope: `ui/modules/ipc-handlers.js`, `ui/index.html`
Goal: Split plan only (no code changes) + logging/comment counts baseline

---

## 1) File Size / Structure Snapshot

- `ui/modules/ipc-handlers.js`: **3805 lines**
- `ui/index.html`: **4164 lines**

### ipc-handlers.js — Section Map (from in-file headers)
Each section already has a label; this plan proposes to split along these boundaries.

**Sections + IPC channel counts:**
- PTY IPC HANDLERS (via Daemon) — 10
- SHARED CONTEXT HANDLERS — 3
- CONFLICT DETECTION HANDLERS — 2
- STATE HANDLERS — 5
- SETTINGS HANDLERS — 3
- PROJECT/FOLDER PICKER — 2
- FRICTION PANEL — 4
- SCREENSHOTS — 4
- BACKGROUND PROCESSES — 4
- USAGE STATS — 2
- H2: SESSION HISTORY (Sprint 3.2) — 1
- J2: RECENT PROJECTS (Sprint 3.2) — 5
- V4: AUTO-NUDGE (AR2) — 2
- V4: COMPLETION DETECTION (AT1) — 2
- V4 CB2: AGENT CLAIMS — 4
- V4 CP1: SESSION SUMMARY PERSISTENCE — 4
- V5 MP1: PER-PANE PROJECT ASSIGNMENT — 4
- V5 PT1: PERFORMANCE TRACKING — 5
- V5 TM1: TEMPLATE SAVE/LOAD — 5
- V6 SR2: SMART ROUTING IPC HANDLERS — 3
- V6 AH1: AUTO-HANDOFF IPC HANDLERS — 2
- V6 CR1: CONFLICT QUEUE IPC HANDLERS — 4
- V6 LM1: LEARNING DATA PERSISTENCE — 5
- V7 QV1: OUTPUT VALIDATION HOOKS — 4
- V7 RB1: CHECKPOINT ROLLBACK SUPPORT — 5
- V7 OB1: ACTIVITY LOG IPC HANDLERS — 4
- V7 QV2: COMPLETION QUALITY CHECKS — 4
- V8 TE2: TEST EXECUTION DAEMON — 4
- V8 CI1: PRE-COMMIT VALIDATION HOOKS — 5
- V8 TR2: TEST FAILURE NOTIFICATIONS — 4
- V10 MQ4: MESSAGE QUEUE IPC HANDLERS — 10
- V11 MC4-MC6: MCP BRIDGE IPC HANDLERS — 8
- MC8: MCP AUTO-CONFIGURATION — 3
- V9 DC3: API DOCUMENTATION GENERATOR — 5
- V9 PL3: PERFORMANCE AUDIT — 8
- V9 PL1: ERROR MESSAGE IMPROVEMENTS — 5
- SDK IPC HANDLERS (Task #3: Multi-Agent Coordination) — 5
- SDK V2 IPC HANDLERS (4 Independent Sessions) — 8

---

## 2) Split Plan — ipc-handlers.js

### Guiding Principle
Split by feature domain. Keep a **thin registry** in `ipc-handlers.js` and move each section into its own module that exports a `registerIpcHandlers(ctx, deps)` function. Reduce cross-file coupling by passing a shared `ctx` object (mainWindow, daemonClient, currentSettings, watcher, triggers, usageStats, sessionStartTimes, backgroundProcesses, etc.) instead of module-level globals.

### Proposed File Map (no code changes yet)

**`ui/modules/ipc/index.js`** (new)
- Exports `init`, `setDaemonClient`, `setupIPCHandlers`
- Creates a `ctx` object once and passes to submodules
- Calls `register*Handlers(ctx, deps)` for each feature module

**Core / system**
- `ui/modules/ipc/pty-handlers.js`
  - pty-create, pty-write, codex-exec, send-trusted-enter, clipboard-paste-text, pty-resize, pty-kill, spawn-claude, get-claude-state, get-daemon-terminals
- `ui/modules/ipc/state-handlers.js`
  - get-state, set-state, trigger-sync, broadcast-message, start-planning
- `ui/modules/ipc/settings-handlers.js`
  - get-settings, set-setting, get-all-settings

**Workspace / files**
- `ui/modules/ipc/shared-context-handlers.js`
  - read-shared-context, write-shared-context, get-shared-context-path
- `ui/modules/ipc/project-handlers.js`
  - select-project, get-project
  - recent projects: get-recent-projects, add-recent-project, remove-recent-project, clear-recent-projects, switch-project
  - per-pane project assignment: set-pane-project, get-pane-project, get-all-pane-projects, clear-pane-projects
- `ui/modules/ipc/friction-handlers.js`
  - list-friction, read-friction, delete-friction, clear-friction
- `ui/modules/ipc/screenshot-handlers.js`
  - save-screenshot, list-screenshots, delete-screenshot, get-screenshot-path

**Operations / background**
- `ui/modules/ipc/process-handlers.js`
  - spawn-process, list-processes, kill-process, get-process-output
  - helpers at bottom of current file: broadcastProcessList, getBackgroundProcesses, cleanupProcesses
- `ui/modules/ipc/usage-stats-handlers.js`
  - get-usage-stats, reset-usage-stats
- `ui/modules/ipc/session-history-handlers.js`
  - get-session-history

**Automation / workflow**
- `ui/modules/ipc/auto-nudge-handlers.js`
  - nudge-agent, nudge-all-stuck
- `ui/modules/ipc/completion-detection-handlers.js`
  - check-completion, get-completion-patterns
- `ui/modules/ipc/agent-claims-handlers.js`
  - claim-agent, release-agent, get-claims, clear-claims
- `ui/modules/ipc/session-summary-handlers.js`
  - save-session-summary, get-session-summaries, get-latest-summary, clear-session-summaries
- `ui/modules/ipc/performance-tracking-handlers.js`
  - record-completion, record-error, record-response-time, get-performance, reset-performance
- `ui/modules/ipc/template-handlers.js`
  - save-template, load-template, list-templates, get-template, delete-template

**Routing / coordination**
- `ui/modules/ipc/smart-routing-handlers.js`
  - route-task, get-best-agent, get-agent-roles
- `ui/modules/ipc/auto-handoff-handlers.js`
  - trigger-handoff, get-handoff-chain
- `ui/modules/ipc/conflict-queue-handlers.js`
  - request-file-access, release-file-access, get-conflict-queue-status, clear-all-locks
- `ui/modules/ipc/learning-data-handlers.js`
  - record-task-outcome, get-learning-data, get-best-agent-for-task, reset-learning, get-routing-weights

**Quality / validation**
- `ui/modules/ipc/output-validation-handlers.js`
  - validate-output, validate-file, get-validation-patterns
- `ui/modules/ipc/completion-quality-handlers.js`
  - check-completion-quality, validate-state-transition, get-quality-rules
- `ui/modules/ipc/checkpoint-handlers.js`
  - create-checkpoint, list-checkpoints, get-checkpoint-diff, rollback-checkpoint, delete-checkpoint
- `ui/modules/ipc/activity-log-handlers.js`
  - get-activity-log, clear-activity-log, save-activity-log, log-activity

**Testing / CI**
- `ui/modules/ipc/test-execution-handlers.js`
  - detect-test-framework, run-tests, get-test-results, get-test-status
- `ui/modules/ipc/precommit-handlers.js`
  - run-pre-commit-checks, run-tests, get-ci-status, set-ci-enabled, should-block-commit
- `ui/modules/ipc/test-notification-handlers.js`
  - notify-test-failure, get-test-notification-settings, set-test-notification-settings, should-block-on-test-failure

**Messaging / MCP**
- `ui/modules/ipc/message-queue-handlers.js`
  - init-message-queue, send-message, send-broadcast-message, send-group-message, get-messages, get-all-messages, mark-message-delivered, clear-messages, get-message-queue-status, start-message-watcher
- `ui/modules/ipc/mcp-handlers.js`
  - mcp-register-agent, mcp-unregister-agent, mcp-get-connected-agents, mcp-tool-call, mcp-get-tool-definitions, mcp-validate-session, get-mcp-health, get-mcp-status
- `ui/modules/ipc/mcp-autoconfig-handlers.js`
  - mcp-configure-agent, mcp-reconnect-agent, mcp-remove-agent-config

**Docs / perf / error UX**
- `ui/modules/ipc/api-docs-handlers.js`
  - generate-api-docs, get-api-docs, get-handler-doc, list-api-handlers, search-api-docs
- `ui/modules/ipc/perf-audit-handlers.js`
  - get-perf-profile, set-perf-enabled, set-slow-threshold, reset-perf-profile, save-perf-profile, get-slow-handlers, get-handler-perf, benchmark-handler
- `ui/modules/ipc/error-handlers.js`
  - get-error-message, show-error-toast, list-error-codes, handle-error, full-restart

**SDK**
- `ui/modules/ipc/sdk-handlers.js`
  - sdk-start, sdk-stop, sdk-write, sdk-status, sdk-broadcast
- `ui/modules/ipc/sdk-v2-handlers.js`
  - sdk-send-message, sdk-subscribe, sdk-unsubscribe, sdk-get-session-ids, sdk-start-sessions, sdk-stop-sessions, sdk-pane-status, sdk-interrupt

### Notes / Risks
- Many handlers rely on shared module state (`mainWindow`, `daemonClient`, `currentSettings`, etc.). Splitting will be safest if handled via a `ctx` object passed to each module.
- Several handler names are duplicated in different sections (`validate-output`, `check-completion-quality`, `run-tests`). Splitting exposes these collisions; should clarify which is authoritative or rename.

---

## 3) Split Plan — index.html

### Guiding Principle
Separate **CSS** into logical files and **HTML** into partials/templates. This reduces the 4,164-line monolith and makes UI changes more localized. Since there is no build pipeline, a Phase 1 plan can still outline the *target* split, with implementation options later (posthtml include, simple build script, or runtime template injection).

### CSS Split Proposal
Target folder: `ui/styles/`

1) `base.css`
- `:root` variables, typography, base layout, body/background

2) `layout.css`
- header, main-content grid, pane grid layout, right-panel layout, status bar

3) `buttons.css`
- `.btn`, size/variants, toggles, badges

4) `panes.css`
- pane headers, terminal containers, badges, timers, CLI badges, project indicators

5) `state-bar.css`
- state display, progress bar, active agent badges, heartbeat

6) `settings-panel.css`
- settings panel, toggles, permissions warnings, cost alert controls

7) `friction-panel.css`
- friction list + actions

8) `right-panel.css`
- tab shell + tab buttons

9) `tabs/`
- `tabs/screenshots.css`
- `tabs/tests.css`
- `tabs/activity.css`
- `tabs/history.css`
- `tabs/projects.css`
- `tabs/performance.css`
- `tabs/templates.css`
- `tabs/progress.css`
- `tabs/processes.css`
- `tabs/messages.css`

10) `sdk-messages.css`
- all `.sdk-*` message UI, message states, delivery states, typewriter

11) `animations.css`
- honeycomb thinking animation, pulses, keyframes, reduced-motion overrides

12) `utilities.css`
- helpers like `.hidden`, `.active`, common spacing utilities

### HTML Split Proposal
Target folder: `ui/partials/`

- `header.html`
  - Hivemind title, dry-run/CI/MCP indicators, header buttons
- `settings-panel.html`
- `friction-panel.html`
- `state-bar.html`
- `pane-grid.html`
  - 6 panes + broadcast bar
  - Optional: replace repeated panes with `<template id="pane-template">` later
- `right-panel.html`
  - panel tabs + container
- `tabs/*.html`
  - `tabs/screenshots.html`, `tabs/tests.html`, `tabs/activity.html`, `tabs/history.html`, `tabs/projects.html`, `tabs/performance.html`, `tabs/templates.html`, `tabs/progress.html`, `tabs/processes.html`, `tabs/messages.html`
- `status-bar.html`

**Implementation options (later, not part of Phase 1):**
- `posthtml-include` build step to assemble `index.html`
- Runtime fetch + injection in `renderer.js` (needs DOMContentLoaded ordering)
- Node build script that concatenates partials on `npm start`

---

## 4) Logging & Version-Fix Comment Counts (Baseline)

### Console logging (ui/**)
Total matches: **376**
- `console.log`: 272
- `console.error`: 91
- `console.warn`: 16
- `console.info/debug`: 0

Top files by count:
- `ui/modules/ipc-handlers.js`: 63
- `ui/modules/triggers.js`: 48
- `ui/modules/terminal.js`: 41
- `ui/modules/watcher.js`: 34
- `ui/main.js`: 31
- `ui/renderer.js`: 31
- `ui/modules/daemon-handlers.js`: 27
- `ui/modules/sdk-bridge.js`: 26
- `ui/modules/tabs.js`: 24
- `ui/daemon-client.js`: 16

### Version/fix comment markers
Method: comment lines matching `// V<digit>` or `/* V<digit>` or `<!-- V<digit>`.
- Total in `ui/**`: **172**
- Top contributors:
  - `ui/terminal-daemon.js`: 41
  - `ui/modules/ipc-handlers.js`: 34
  - `ui/main.js`: 21
  - `ui/modules/terminal.js`: 21
  - `ui/modules/triggers.js`: 14
  - `ui/modules/watcher.js`: 13
  - `ui/modules/sdk-bridge.js`: 8
  - `ui/modules/daemon-handlers.js`: 6
  - `ui/renderer.js`: 5
  - `ui/daemon-client.js`: 5
  - `ui/index.html`: 1

Related fix/bug markers (comment lines matching `FIX|BUG`): **72** across `ui/**`.

**Note:** prior “83 version-fix comments” appears to be a narrower count than this scan; if a specific definition is desired (e.g., only `// V` in `ui/modules/`), we can re-count to match that definition.

---

## 5) Suggested Next Steps (No code changes yet)

1) Confirm desired split granularity (few big modules vs. many feature modules).
2) Decide how HTML partials will be assembled (build step vs runtime injection).
3) Align on logging strategy (replace console.* with logger, or allow in dev only).
4) Define a precise pattern for “version-fix comments” to track deletions in the hardening sprint.

---

(End)
