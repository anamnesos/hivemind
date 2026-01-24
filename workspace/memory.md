# Hivemind Collective Memory

**Purpose:** Persistent knowledge that survives across sessions. Read this on sync to inherit learnings.

---

## 🚨 CURRENT STATE (Read This First On Restart)

**Date:** Jan 24, 2026
**Phase:** Sprint #1 - CHECKPOINT REACHED
**Status:** Awaiting Reviewer verification

### What Was Just Built:
1. ✅ **Conflict Detection** (Worker A) - Warns on overlapping file assignments
2. ✅ **Cost Alerts** (Worker B) - Toast when cost threshold exceeded
3. ✅ **Broadcast Indicator** (Worker A) - `[BROADCAST TO ALL AGENTS]` prefix
4. ✅ **Auto-Enter Fix** (Lead) - Messages now auto-submit

### On Restart - Do This:
1. **Reviewer:** Verify Sprint #1, write `checkpoint-approved.md` or `checkpoint-issues.md`
2. **Workers:** Stand by, vote on proposals in `improvements.md`
3. **Lead:** Coordinate verification, then assign next tasks

### Pending Proposals:
- **Collective Memory** - 3 YES votes, likely next
- **Real-Time File Lock** - DEFERRED
- **Reflection Phase** - MAYBE LATER

---

## Key Learnings

### App Restart = Context Loss
**Learned:** Jan 24, 2026 (Sprint #1)
**Issue:** Restarting Electron app to apply main.js changes loses all agent context
**Workaround:** Don't restart mid-sprint. Manually enter pending text. Apply fixes on next natural restart.
**Long-term:** Auto-Resume feature should help restore state after restart.

### Auto-Submit Requires Delay
**Learned:** Jan 24, 2026 (Sprint #1)
**Issue:** Writing message + `\r` immediately doesn't submit in terminal
**Solution:** Write message, wait 100ms, then send `\r` separately
**Code pattern:**
```javascript
ptyProcess.write(message);
setTimeout(() => ptyProcess.write('\r'), 100);
```

### File Edit Conflicts During Parallel Work
**Learned:** Jan 24, 2026 (Sprint #1)
**Issue:** Worker A and B both editing main.js → "file has been modified" errors
**Workaround:** Re-read file and re-apply edit
**Long-term:** Consider file lock indicators or assignment separation

---

## File Ownership Reference

| File | Primary Owner | Notes |
|------|---------------|-------|
| `ui/main.js` | Shared (careful!) | State machine, IPC handlers, pty management |
| `ui/renderer.js` | Worker A | UI logic, timers, display |
| `ui/index.html` | Shared | Layout, styling |
| `workspace/` | All agents | Coordination files |

---

## Anti-Patterns (Don't Do These)

1. **Don't restart mid-sprint** - Loses all context
2. **Don't edit same file in parallel** - Causes conflicts
3. **Don't skip reading status.md** - You'll duplicate work

---

## Shortcuts

- **Sync button** broadcasts shared_context.md to all agents
- **Friction folder** auto-triggers state change when files added
- **checkpoint.md** triggers Reviewer

---

*Add learnings here as you discover them. This file persists across sessions.*
