# Sprint 2 Review: IPC Null-Check Guards + Auto-Interrupt

**Reviewer:** Reviewer
**Date:** 2026-01-28
**Status:** APPROVED

---

## Scope

1. IPC null-check guards in 6 modules (per status.md assignment)
2. Auto-interrupt behavior (Ctrl+C after 120s)
3. Codex running-state detection fix (case-insensitive)

---

## 1. IPC Null-Check Guards Review

### Files Reviewed
- `ui/modules/ipc/state-handlers.js`
- `ui/modules/ipc/auto-handoff-handlers.js`
- `ui/modules/ipc/smart-routing-handlers.js`
- `ui/modules/ipc/completion-quality-handlers.js`
- `ui/modules/ipc/conflict-queue-handlers.js`
- `ui/modules/ipc/activity-log-handlers.js`

### Findings

**All 6 modules PASS review.**

| Module | Guard Pattern | Return Shape | Fallbacks | 6-Pane Support |
|--------|---------------|--------------|-----------|----------------|
| state-handlers | `getWatcher()`, `getTriggers()` | `{ success, error }` | `get-state`: `{ state: 'idle', agent_claims: {} }` | N/A |
| auto-handoff-handlers | `getTriggers()` + function check | `{ success, error }` | `[]` for chain | N/A |
| smart-routing-handlers | `getTriggers()` + function checks | `{ success, error }` | DEFAULT_PERFORMANCE | **YES** (panes 1-6) |
| completion-quality-handlers | `getWatcher()` + inline guards | `{ success, allowed, ... }` | Fail-open (intentional) | N/A |
| conflict-queue-handlers | `getWatcher()` | `{ success, error }` | None needed | N/A |
| activity-log-handlers | Function existence checks | `{ success, error }` | `get-activity-log`: `{ entries: [], total: 0 }` | N/A |

### Guard Pattern Analysis

All modules use consistent `missingDependency()` helper:
```javascript
const missingDependency = (name, fallback = {}) => ({
  success: false,
  error: `${name} not available`,
  ...fallback,
});
```

This ensures:
- Consistent return shape across all handlers
- Graceful degradation instead of crashes
- Clear error messages for debugging

### Minor Observations (Non-blocking)

1. **conflict-queue-handlers.js**: Assumes watcher methods exist once watcher is present. Low risk since watcher is a known module with stable interface.

2. **completion-quality-handlers.js**: Uses fail-open for `validate-state-transition` (returns `allowed: true` on error). This is intentional and documented in the reason field.

---

## 2. Auto-Interrupt (Ctrl+C) Review

### Files Reviewed
- `ui/modules/ipc/pty-handlers.js` (lines 37-47)
- `ui/main.js` (lines 42, 64, 477-496, 579-596)

### IPC Handler (`interrupt-pane`)

```javascript
ipcMain.handle('interrupt-pane', (event, paneId) => {
  if (!ctx.daemonClient || !ctx.daemonClient.connected) {
    return { success: false, error: 'Daemon not connected' };
  }
  if (!paneId) {
    return { success: false, error: 'paneId required' };
  }
  ctx.daemonClient.write(paneId, '\x03');
  log.info('PTY', `Interrupt sent to pane ${paneId}`);
  return { success: true };
});
```

**APPROVED** - Proper guards, correct SIGINT character (`\x03`), consistent return shape.

### Auto-Interrupt Logic (main.js)

- `stuckThreshold`: 120000ms (120 seconds) - configurable
- `lastInterruptAt`: Map tracking per-pane interrupt timestamps
- Clears on output received: `lastInterruptAt.delete(paneId)`
- Only fires when:
  1. Pane is `running`
  2. No activity for > threshold
  3. No interrupt sent in last threshold period (prevents spam)
- Sends `\x03` (Ctrl+C) to daemon
- Sends `agent-stuck-detected` IPC to UI

**APPROVED** - No race conditions, proper spam prevention, UI notification included.

---

## 3. Codex Running-State Detection Fix

### File Reviewed
- `ui/main.js` (lines 489-498)

### Fix Applied

```javascript
const currentState = claudeRunning.get(paneId);
if (currentState === 'starting' || currentState === 'idle') {
  const lower = data.toLowerCase();  // <-- Case-insensitive!
  if (data.includes('>') || lower.includes('claude') || lower.includes('codex') || lower.includes('gemini')) {
    claudeRunning.set(paneId, 'running');
```

Before: Only detected "codex" (lowercase)
After: Detects "Codex", "CODEX", "codex", etc.

This fixes the issue where `[Codex exec mode ready]` was not triggering running state.

**APPROVED** - Simple, correct fix.

---

## Verdict

**APPROVED FOR PRODUCTION**

All reviewed code:
- Has proper null/undefined guards
- Returns consistent shapes
- Provides meaningful fallbacks where appropriate
- Supports 6-pane configuration
- Has no critical bugs or regressions

---

## Recommendations (Future Sprint)

1. Consider adding TypeScript types for IPC return shapes to catch inconsistencies at compile time
2. Add unit tests for IPC handlers to verify guard behavior
3. Document the `missingDependency()` pattern in a shared module

---

*Reviewed by Reviewer - 2026-01-28*
