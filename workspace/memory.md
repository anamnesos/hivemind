# Hivemind Collective Memory

**Purpose:** Persistent knowledge that survives across sessions. Read this on sync to inherit learnings.

---

## 🚨 CURRENT STATE (Read This First On Restart)

**Date:** Jan 25, 2026
**Phase:** V16.11 SHIPPED
**Status:** Stable - triggers and messages working automatically

### What Was Just Shipped:
1. ✅ **V16.11** - Keyboard events + auto-refocus fix for message delivery
2. ✅ **Triggers working** - Agent-to-agent communication fully operational
3. ✅ **No manual intervention** - User confirmed messages process automatically

### On Restart - Do This:
1. Read memory.md (this file) for context
2. Check shared_context.md for current tasks
3. All agents should be able to communicate via triggers immediately

### Known Issues (Non-Critical):
- Console errors for missing IPC handlers: `get-performance-stats`, `get-templates`, `get-pane-projects`
- These are UI tab features, not blocking core functionality

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

### NEVER Send ESC via PTY (V16 Lesson)
**Learned:** Jan 25, 2026 (V16 Stress Test)
**Issue:** Sending ESC (`\x1b`) via PTY kills active Claude agents mid-response
**Discovery:** Stress test exposed this - tried ESC before (V15), ESC after (V17), both killed agents
**Solution:** V16 FINAL - no ESC via PTY at all
**Key insight:**
- PTY ESC → interrupts Claude (BAD)
- User keyboard ESC → safe manual unstick (OK)
- Triggers (file-based) → safe for agent comms
- Broadcasts → user should wait for agents to finish first

### Triggers vs Broadcasts
**Learned:** Jan 25, 2026 (V16 Stress Test)
**Triggers (file-based):** Safe. Message written to file, watcher injects to terminal. Doesn't interrupt active agents.
**Broadcasts (direct input):** Can interrupt. Text injected directly to PTY while agent is generating = interruption.
**Best practice:** Use triggers for agent-to-agent comms. User broadcasts when agents are idle.

### V16.11: Keyboard Events + Auto-Refocus (THE FIX)
**Learned:** Jan 25, 2026 (V16 → V16.11 journey)
**Problem:** Messages would arrive in terminal but not process - user had to manually press Enter to flush the buffer.
**Failed attempts:**
- V16.4: Double Enter with timing delays
- V16.5: Triple Enter with longer delays (300ms gaps)
- V16.6: Bracketed paste mode (`\x1b[200~...\x1b[201~`)
- V16.7-V16.9: Various PTY write approaches

**Solution (V16.10/V16.11):** Keyboard events + bypass marker + auto-refocus
- Use keyboard events instead of direct PTY write for message delivery
- Bypass marker to allow programmatic Enter through input filters
- Auto-refocus terminal after message delivery
- Result: Messages process automatically, no manual intervention needed

**Key insight:** `xterm.paste()` and `pty.write()` can buffer differently than real keyboard input. Simulating keyboard events is more reliable for triggering Claude Code's input processing.

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
