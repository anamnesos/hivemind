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

### Messaging Stress Test Results
**Learned:** Jan 25, 2026 (Messaging Stress Test)
**Test:** User requested agents have casual conversation to stress test messaging.
**Results:**
- all.txt broadcasts include sender (use `others-{role}.txt` to exclude self)
- Write conflicts are normal - re-read file and retry (system handles gracefully)
- 3/4 quorum works when one agent unresponsive (Lead MIA didn't block consensus)
- Casual chat can evolve into real work (proposal → consensus → build in one session)
- Two-stage review pipeline proven: co-author sanity check → Reviewer formal review

**Bonus discovery:** Stress test accidentally became governance test - proved system can reach consensus and proceed without full attendance.

### Windows: Bash Echo vs Node.js Write
**Learned:** Jan 25, 2026 (Lead's MIA Mystery)
**Issue:** Lead was sending messages via `bash echo > trigger.txt` but no one received them.
**Root Cause:** On Windows, bash echo/redirect doesn't always trigger chokidar file watcher events.
**Solution:** Use Write tool (Node.js `fs.writeFileSync`) instead of bash echo for trigger files.

**What works:**
- ✅ Write tool → Node.js fs.writeFileSync → chokidar detects
- ❌ Bash echo → shell redirect → chokidar may miss on Windows

**Impact:** Lead appeared "stuck" for entire stress test, but was actually sending messages that weren't being detected.

---

### Contract-First Development
**Learned:** Jan 25, 2026 (V17 Adaptive Heartbeat)
**Context:** Worker A (UI) and Worker B (backend) needed to build in parallel.
**Solution:** Define interface contract BEFORE implementation:
1. Agree on event name and payload format
2. Lock contract with Reviewer approval
3. Build independently against the contract
4. Integration = plug-and-play

**Example contract:**
```javascript
// Event: 'heartbeat-state-changed'
// Payload: { state: 'idle'|'active'|'overdue'|'recovering', interval: ms }
```

**Result:** Review becomes verification, not discovery. No surprises at integration time.

**Bonus:** Always check if file exists before creating - avoid duplicates (learned from improvements.md duplication).

---

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

### Windows: Bash Echo vs Node.js Write (Chokidar Bug)
**Learned:** Jan 25, 2026 (Messaging Stress Test)
**Problem:** Lead appeared "stuck" during entire stress test - messages written to trigger files but never detected.
**Root cause:** On Windows, `bash echo "text" > file.txt` doesn't trigger chokidar file watcher, but Node.js `fs.writeFile()` / Write tool does.
**Symptoms:**
- Agent writes to trigger file successfully
- File content is correct (can verify with `cat`)
- Chokidar never fires change event
- Other agents never receive the message

**Solution:** Agents must use Node.js Write tool, NOT bash echo, for trigger file communication on Windows.
**Impact:** Critical for Windows users - explains "silent agent" scenarios.

---

## File Ownership Reference

| File | Primary Owner | Notes |
|------|---------------|-------|
| `ui/main.js` | Shared (careful!) | State machine, IPC handlers, pty management |
| `ui/renderer.js` | Worker A | UI logic, timers, display |
| `ui/index.html` | Shared | Layout, styling |
| `workspace/` | All agents | Coordination files |

---

## Testing Wisdom

1. **Best way to test stuck detection:** Have an agent actually get stuck during the discussion about stuck detection. Real-world validation > synthetic tests.
2. **Stress tests can become real work:** "Casual chat stress test" → messaging validation → governance test → real proposal → shipped feature. Emergent productivity is valid.
3. **The system debugs itself:** Testing feature X may accidentally validate feature Y. Let it happen.

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
