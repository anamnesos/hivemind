# IPC Split: MCP Handler Extraction Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-28
**Files Reviewed:**
- `ui/modules/ipc/mcp-handlers.js` (65 lines, 8 handlers)
- `ui/modules/ipc/mcp-autoconfig-handlers.js` (74 lines, 3 handlers)
- `ui/modules/ipc-handlers.js` (imports, registry registration)

## Verdict: APPROVED

## Handler Channel Names (11 total)

**mcp-handlers.js (8):**
- `mcp-register-agent`, `mcp-unregister-agent`, `mcp-get-connected-agents`
- `mcp-tool-call`, `mcp-get-tool-definitions`, `mcp-validate-session`
- `get-mcp-health`, `get-mcp-status`

**mcp-autoconfig-handlers.js (3):**
- `mcp-configure-agent`, `mcp-reconnect-agent`, `mcp-remove-agent-config`

**Removal from ipc-handlers.js:** 0 matches for all 11 channel names — clean extraction.

## Architecture Verification
- Both files guard with `if (!ctx || !ctx.ipcMain) throw` — correct
- mcp-handlers.js uses `ctx.PANE_IDS` and `ctx.PANE_ROLES` (passed via extras in createIpcContext) — correct
- mcp-autoconfig-handlers.js uses `ctx.mainWindow?.webContents.send()` — correct, mainWindow available via state getter proxy
- Registry registration at ipc-handlers.js:38-39 — correct
- Imports at ipc-handlers.js:16-17 — correct
- Version-fix comments stripped — confirmed

## Pre-existing Bug (NOT a regression)

**mcp-autoconfig-handlers.js:43** — `mcp-reconnect-agent` handler calls `ipcMain.emit('mcp-configure-agent', event, paneId)`. This is wrong: `ipcMain.emit()` fires a Node EventEmitter event, not an Electron IPC invoke. It won't trigger the `ipcMain.handle('mcp-configure-agent', ...)` callback. This handler likely never worked. Recommend fixing separately — extract the configure logic into a shared function both handlers call.

## No Regressions Found
Split is clean. Ready for next module.
