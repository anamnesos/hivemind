# IPC Split: Docs/Perf/Error Handler Extraction Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-28
**Files Reviewed:**
- `ui/modules/ipc/api-docs-handlers.js` (590 lines, 5 handlers)
- `ui/modules/ipc/perf-audit-handlers.js` (202 lines, 8 handlers)
- `ui/modules/ipc/error-handlers.js` (170 lines, 5 handlers)
- `ui/modules/ipc-handlers.js` (imports, registry, ctx extension)

## Verdict: APPROVED

## Handler Channel Names (18 total)

**api-docs-handlers.js (5):**
- `generate-api-docs`, `get-api-docs`, `get-handler-doc`, `list-api-handlers`, `search-api-docs`

**perf-audit-handlers.js (8):**
- `get-perf-profile`, `set-perf-enabled`, `set-slow-threshold`, `reset-perf-profile`, `save-perf-profile`, `get-slow-handlers`, `get-handler-perf`, `benchmark-handler`

**error-handlers.js (5):**
- `get-error-message`, `show-error-toast`, `list-error-codes`, `handle-error`, `full-restart`

**Removal from ipc-handlers.js:** 0 matches for all 18 channel names. Clean extraction.

## Architecture Verification
- Imports at lines 22-24 — correct
- Registry at lines 55-57 — correct
- Defensive guards in all three files — correct
- `ctx.recordHandlerPerf` set at perf-audit-handlers.js:63 — correctly exposed on ctx during registration. No consumers in ipc-handlers.js yet (available for future use).
- `deps.logActivity` used in error-handlers.js:83 — correct, receives deps from registry.setup(ctx, deps)
- Version-fix comments stripped — confirmed

## Pre-existing Bugs (NOT regressions)

**Bug 1 — error-handlers.js:122:** `ipcMain.emit('show-error-toast', ...)` — same class of bug as mcp-reconnect and test-notification. Node EventEmitter emit won't invoke handle-registered callback.

**Bug 2 — api-docs-handlers.js:533:** `ipcMain._events['generate-api-docs']?.[0]?.()` — accesses undocumented Electron/Node internals. Fragile but functional if event array structure holds.

**Bug 3 — perf-audit-handlers.js:170:** `ipcMain._events[handlerName]?.[0]?.()` in benchmark-handler — same fragile internal access.

**Bug 4 — perf-audit-handlers.js:192:** `setInterval` for auto-save never cleared. Would stack if module re-registered. Minor.

**Running tally of ipcMain.emit bugs:** mcp-autoconfig:43, test-notification:95, precommit:21, error:122. Recommend a consolidated fix pass.

## No Regressions Found
Split is clean. Ready for next module.
