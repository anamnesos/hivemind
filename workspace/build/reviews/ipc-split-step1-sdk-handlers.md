# IPC Split Step 1-3: SDK Handler Extraction Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-27
**Files Reviewed:**
- `ui/modules/ipc/ipc-state.js` (41 lines)
- `ui/modules/ipc/index.js` (59 lines)
- `ui/modules/ipc/sdk-handlers.js` (63 lines)
- `ui/modules/ipc/sdk-v2-handlers.js` (75 lines)
- `ui/modules/ipc-handlers.js` (modified: imports, ctx creation, registry setup)

## Verdict: APPROVED

## Verification Summary

### Handler Channel Names
- **sdk-handlers.js (5 handlers):** `sdk-start`, `sdk-stop`, `sdk-write`, `sdk-status`, `sdk-broadcast` — all correct
- **sdk-v2-handlers.js (8 handlers):** `sdk-send-message`, `sdk-subscribe`, `sdk-unsubscribe`, `sdk-get-session-ids`, `sdk-start-sessions`, `sdk-stop-sessions`, `sdk-pane-status`, `sdk-interrupt` — all correct
- **Removal from ipc-handlers.js:** Grep confirms 0 matches for all 13 channel names in the original file — clean extraction

### Architecture Verification
1. **ipc-state.js:** Shared module-scope state with `initState(deps)` for initialization and `setDaemonClient(client)` setter. Clean.
2. **ipc/index.js:** `createIpcContext()` creates getter/setter proxies over state so split modules share live references. `createIpcRegistry()` collects register functions and calls them via `setup(ctx, deps)`. Clean.
3. **ctx.ipcMain:** Passed as extra in `createIpcContext(state, { ipcMain, ... })` at ipc-handlers.js:21-31. Both handler files guard with `if (!ctx || !ctx.ipcMain) throw`. Correct.
4. **ctx.mainWindow:** Read from `ipcState.state.mainWindow` via getter proxy. Set by `initState(deps)` at line 41, before `registry.setup(ctx, deps)` at line 69. `sdkBridge.setMainWindow(ctx.mainWindow)` in sdk-handlers.js:10 gets the correct reference. Correct.
5. **Execution order:** `setupIPCHandlers(deps)` → `initState(deps)` (line 41) → `registry.setup(ctx, deps)` (line 69) → remaining inline handlers. SDK handlers register before any other handlers, which is fine since order doesn't matter for `ipcMain.handle`.

### Extra `deps` Argument
`registry.setup(ctx, deps)` passes `deps` as second arg, but both `registerSdkHandlers(ctx)` and `registerSdkV2Handlers(ctx)` only use `ctx`. The extra arg is silently ignored by JS — no issue, but future handler modules could use `deps` if needed.

### No Regressions Found
- No duplicate channel registrations
- No missing imports
- No broken require paths
- SDK bridge initialization (`setMainWindow`) correctly relocated

## Notes
- Good defensive guards (`if (!ctx || !ctx.ipcMain) throw`) in both handler files
- Clean separation of concerns
- Ready for next extraction module (recommend MCP handlers next per Phase 1 plan)
