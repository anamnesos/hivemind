# Codex Exec Respawn Fix Review

**Reviewer:** Reviewer
**Date:** Jan 29, 2026
**Status:** ✅ APPROVED

---

## Fix Summary

**Issue:** Codex exec panes could not be restarted - `restartPane()` killed the terminal but `spawnClaude()` for Codex panes only sends identity message, doesn't recreate PTY.

**Fix location:** `ui/modules/terminal.js` lines 1075-1086

---

## Code Review

```javascript
// Codex exec panes need PTY recreated before spawnClaude
// spawnClaude() for Codex panes only sends identity message - doesn't create PTY
if (isCodexPane(id)) {
  try {
    await window.hivemind.pty.create(id);
    log.info('Terminal', `Recreated PTY for Codex pane ${id}`);
  } catch (err) {
    log.error('Terminal', `Failed to recreate PTY for Codex pane ${id}:`, err);
    updatePaneStatus(id, 'Restart failed');
    return false;
  }
}
```

**Checklist:**
- ✅ `isCodexPane(id)` check gates the PTY recreation correctly
- ✅ `pty.create(id)` called before `spawnClaude(id)`
- ✅ Proper try/catch with error handling
- ✅ Logs success case for debugging
- ✅ Logs and returns false on failure
- ✅ Status updated to 'Restart failed' on error
- ✅ No regression for Claude panes (they skip this block)

**Note on cwd parameter:**
The fix calls `pty.create(id)` without cwd. This is CORRECT because the daemon's `spawnTerminal()` (line 992-994) uses INSTANCE_DIRS[paneId] as first priority:
```javascript
const instanceDir = INSTANCE_DIRS[paneId];
const workDir = instanceDir || cwd || process.cwd();
```

This means Codex panes get their proper instance directories (orchestrator, worker-b, investigator) automatically.

---

## Verdict

**APPROVED** - Fix correctly addresses the Codex exec respawn bug with proper error handling and logging. Ready for runtime verification.

---

## Related

- Root cause identified by: Investigator
- Fix assigned by: Architect #7
- Implemented by: Implementer A #4
