# IPC Split: Test/CI Handler Extraction Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-28
**Files Reviewed:**
- `ui/modules/ipc/test-execution-handlers.js` (204 lines, 4 handlers)
- `ui/modules/ipc/precommit-handlers.js` (155 lines, 4 handlers)
- `ui/modules/ipc/test-notification-handlers.js` (103 lines, 4 handlers + 1 listener)
- `ui/modules/ipc-handlers.js` (imports, registry, ctx extensions)

## Verdict: APPROVED

## Handler Channel Names (12 handlers + 1 listener)

**test-execution-handlers.js (4):**
- `detect-test-framework`, `run-tests`, `get-test-results`, `get-test-status`

**precommit-handlers.js (4):**
- `run-pre-commit-checks`, `get-ci-status`, `set-ci-enabled`, `should-block-commit`

**test-notification-handlers.js (4 + 1):**
- `notify-test-failure`, `get-test-notification-settings`, `set-test-notification-settings`, `should-block-on-test-failure`
- Plus `ipcMain.on('test-run-complete', ...)` listener

**Removal from ipc-handlers.js:** Zero `ipcMain.handle()` registrations for these channels remain. 7 string-key references exist in an IPC capability map (documentation metadata object around line 2460) — not handler registrations, no issue.

## Architecture Verification

1. **Imports:** Lines 18-20 — correct require paths
2. **Registry:** Lines 43-45 — all three registered
3. **ctx.calculateConfidence + ctx.INCOMPLETE_PATTERNS:** Set at ipc-handlers.js:1608-1609 (during setupIPCHandlers execution). precommit-handlers.js reads these at IPC call time, not registration time, so they're available. Correct.
4. **deps.logActivity:** test-notification-handlers.js:45 uses `deps.logActivity` — receives `deps` as second arg from `registry.setup(ctx, deps)`. Correct pattern, logActivity is in deps.
5. **Defensive guards:** All three files have `if (!ctx || !ctx.ipcMain) throw`. Correct.

## Pre-existing Bugs (NOT regressions)

**Bug 1 — precommit-handlers.js:21:**
```javascript
ipcMain.handle('run-tests', event, projectPath).then(resolve);
```
`ipcMain.handle()` registers a handler — it does NOT invoke one. This will throw `Error: Attempted to register a second handler for 'run-tests'` since test-execution-handlers.js already registered it. This is a **pre-existing bug** that will crash the pre-commit flow.

**Bug 2 — test-notification-handlers.js:95:**
```javascript
ipcMain.emit('notify-test-failure', event, results);
```
Same class of bug as `mcp-reconnect-agent`: `ipcMain.emit()` fires a Node EventEmitter event, won't trigger an `ipcMain.handle`-registered callback. Pre-existing, not a regression.

**Recommendation:** Both bugs existed before the split. They should be fixed in a separate pass — extract shared logic into callable functions instead of trying to invoke IPC handlers internally.

## No Regressions Found
Split is clean. Ready for next module.
