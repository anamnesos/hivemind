# IPC Split Final Gate Review

**Reviewer:** Reviewer (Session 16, post-compaction)
**Date:** 2026-01-28
**Scope:** Final modules + full registry verification

## Verdict: APPROVED WITH 2 BUGS

### New Modules Reviewed (8)

#### pty-handlers.js (10 handlers) — APPROVED
- Channels: `pty-create`, `pty-write`, `codex-exec`, `send-trusted-enter`, `clipboard-paste-text`, `pty-resize`, `pty-kill`, `spawn-claude`, `get-claude-state`, `get-daemon-terminals`
- Uses `ctx.daemonClient`, `ctx.currentSettings`, `ctx.claudeRunning`, `ctx.mainWindow`, `INSTANCE_DIRS`
- Uses `deps.broadcastClaudeState`, `deps.recordSessionStart`
- `spawn-claude` correctly gates SDK mode and dry-run mode
- `clipboard-paste-text` saves/restores clipboard with 200ms timeout — acceptable
- No bugs found

#### state-handlers.js (5 handlers) — APPROVED
- Channels: `get-state`, `set-state`, `trigger-sync`, `broadcast-message`, `start-planning`
- Clean delegation to `ctx.watcher` and `ctx.triggers`
- No bugs

#### settings-handlers.js (3 handlers) — APPROVED
- Channels: `get-settings`, `set-setting`, `get-all-settings`
- `set-setting` correctly handles `watcherEnabled` toggle
- Uses `deps.loadSettings`/`deps.saveSettings`
- Note: `get-settings` and `get-all-settings` are identical — minor redundancy, not a bug

#### conflict-detection-handlers.js (2 handlers) — APPROVED
- Channels: `get-file-conflicts`, `check-file-conflicts`
- Pure delegation to `ctx.watcher`. Cleanest module (13 lines).

#### output-validation-handlers.js (3 handlers) — **BUG FOUND**
- Channels: `validate-output`, `validate-file`, `get-validation-patterns`
- **BUG at line 137:** `validate-file` calls `ipcMain.handle('validate-output', event, content, options)` — this attempts to REGISTER a second handler, not invoke the existing one. Will throw at runtime.
- **FIX:** Should call `calculateConfidence` or refactor to a shared function, not re-call `ipcMain.handle`.
- Lines 57-58: Sets `ctx.INCOMPLETE_PATTERNS` and `ctx.calculateConfidence` during registration — precommit-handlers depends on this. Tight coupling but functional.

#### completion-quality-handlers.js (3 handlers) — **BUG FOUND**
- Channels: `check-completion-quality`, `validate-state-transition`, `get-quality-rules`
- **BUG at line 109:** `validate-state-transition` calls `ipcMain.handle('check-completion-quality', event, paneId, '')` — same pattern as above. Will throw.
- **FIX:** Extract the quality check logic into a local function and call it directly.
- Line 45-48: `execSync('git status')` is synchronous and blocks the main process. Acceptable for now.

#### checkpoint-handlers.js (5 handlers) — APPROVED
- Channels: `create-checkpoint`, `list-checkpoints`, `get-checkpoint-diff`, `rollback-checkpoint`, `delete-checkpoint`
- Line 18-19: `fs.mkdirSync` at registration time — side effect during setup, not ideal but harmless
- Cleanup logic at lines 56-66 correctly prunes old checkpoints

#### activity-log-handlers.js (4 handlers) — APPROVED
- Channels: `get-activity-log`, `clear-activity-log`, `save-activity-log`, `log-activity`
- Pure delegation to `deps` functions. Clean.

## Full Registry Verification

### File count
- `ui/modules/ipc/` directory: 38 files
- Infrastructure: 2 (index.js, ipc-state.js)
- Handler modules: **36**
- Imports in ipc-handlers.js: **36** (lines 13-48)
- Registry entries: **36** (lines 67-102)
- **All match. No orphan files, no missing registrations.**

### ipc-handlers.js residue check
- `ipcMain.handle` calls: **0** — confirmed zero inline handlers
- `ipcMain.on` calls: **0**
- Remaining functions: `init`, `setDaemonClient`, `setupIPCHandlers`, `broadcastProcessList`, `getBackgroundProcesses`, `cleanupProcesses` — all infrastructure, correct

### Handler count by module (total: ~165 handlers)
| Module | Handlers |
|--------|----------|
| sdk-handlers | 5 |
| sdk-v2-handlers | 8 |
| mcp-handlers | 8 |
| mcp-autoconfig-handlers | 3 |
| test-execution-handlers | 4 |
| precommit-handlers | 4 |
| test-notification-handlers | 4+1 listener |
| message-queue-handlers | 10 |
| api-docs-handlers | 5 |
| perf-audit-handlers | 8 |
| error-handlers | 5 |
| state-handlers | 5 |
| shared-context-handlers | 3 |
| friction-handlers | 4 |
| screenshot-handlers | 4 |
| project-handlers | 11 |
| smart-routing-handlers | 3 |
| auto-handoff-handlers | 2 |
| conflict-queue-handlers | 4 |
| learning-data-handlers | 5 |
| output-validation-handlers | 3 |
| completion-quality-handlers | 3 |
| checkpoint-handlers | 5 |
| activity-log-handlers | 4 |
| auto-nudge-handlers | 2 |
| completion-detection-handlers | 2 |
| agent-claims-handlers | 4 |
| session-summary-handlers | 4 |
| performance-tracking-handlers | 5 |
| template-handlers | 5 |
| process-handlers | 4 |
| usage-stats-handlers | 2 |
| session-history-handlers | 1 |
| conflict-detection-handlers | 2 |
| settings-handlers | 3 |
| pty-handlers | 10 |

## All Pre-Existing Bugs (Consolidated)

These were present before the split and carried over unchanged:

1. **output-validation-handlers.js:137** — `ipcMain.handle()` used as invocation (will throw)
2. **completion-quality-handlers.js:109** — same pattern (will throw)
3. **mcp-autoconfig-handlers.js:43** — `ipcMain.emit()` won't reach handle callback
4. **test-notification-handlers.js:95** — same ipcMain.emit bug
5. **precommit-handlers.js:21** — duplicate `ipcMain.handle('run-tests')` registration
6. **error-handlers.js:122** — ipcMain.emit bug
7. **api-docs-handlers.js:533** — `ipcMain._events` undocumented access
8. **perf-audit-handlers.js:170** — `ipcMain._events` undocumented access
9. **perf-audit-handlers.js:192** — unclearable `setInterval`
10. **performance-tracking/smart-routing/learning-data** — 4-pane hardcoded defaults

## Summary

The IPC split is structurally complete and correct. 36 modules, ~165 handlers, zero residue in the master file. The split itself introduced no regressions — all bugs found are pre-existing. Two bugs (#1, #2) will throw at runtime if those specific code paths are hit.

**APPROVED for the split. Recommend a follow-up pass to fix the 10 pre-existing bugs.**
