# Team Sync - URGENT

**Created:** Jan 25, 2026
**Issue:** Random interrupts breaking all agents. Triggers not reliable.

---

## THE PROBLEM

All agents are getting interrupted randomly mid-task. User is frustrated. We can't coordinate via triggers if the system itself is broken.

---

## WHAT EACH AGENT FOUND (add your findings here)

### Lead
- ESC handler in main.js looks fine (only fires on real keypress)
- triggers.js sends `\r` with every inject-message (line 104, 147)
- File watcher might be too aggressive - triggering syncs on every file change

### Worker A
- renderer.js (372 lines) - CLEAN
- terminal.js has DRY violations (FX4-v3 duplicated)
- Ghost text is Claude Code CLI behavior, not fixable from Hivemind
- Nested setTimeout patterns are messy

### Worker B
**Findings:**
- terminal-daemon.js had 2 functions sending ESC unconditionally:
  - `sendHeartbeatToLead()` - sent ESC before every heartbeat (every 5 min)
  - `directNudgeWorkers()` - sent ESC to workers when Lead unresponsive
- **FIXED:** Both functions now only send ESC if terminal actually idle (>10s)
- Also found: main.js:356-369 auto-unstick timer sends ESC+Enter every 30s
- Also found: daemon-handlers.js + terminal.js send 3 ESCs before EVERY message

**My task (add setting to disable auto-sync):** Will implement after app restart confirms ESC fix works

### Reviewer
**Ghost Text Root Cause:**
- Claude Code's autocomplete (greyed text) gets accepted when we send `\r`
- ESC timing (100ms) NOT enough - Claude Code needs more time
- Daemon dedup doesn't help - only blocks same-pane duplicates
- The 4-layer fix doesn't address the REAL issue (it's inside Claude Code)

**Codebase Audit (MAJOR ISSUES):**
1. **ipc-handlers.js = 3616 lines, 72 sections** - unmaintainable mess
2. **3 messaging systems in parallel:**
   - File triggers (triggers/*.txt)
   - MCP server (mcp-server.js + mcp-bridge.js)
   - Message queue (watcher.js)
   This is the "spiderweb" user mentioned - pick ONE
3. **tabs.js = 2092 lines** - also too big
4. **Nested setTimeout everywhere** - hard to debug timing

**My Action Item (document Claude Code limitations):**
✅ DONE - See `workspace/build/claude-code-limitations.md`

---

## PROPOSED FIX

1. **Disable auto-sync temporarily** - Stop the watcher from triggering on every file change
2. **Increase debounce times** - Currently 3s for sync, might need longer
3. **Remove auto-Enter** - Don't append `\r` to injected messages, let user/agent press Enter

---

## ACTION ITEMS

| Agent | Task | Status |
|-------|------|--------|
| Worker A | Remove `\r` from inject-message in terminal.js + daemon-handlers.js | ✅ DONE |
| Worker B | Add setting to disable auto-sync (watcher.js, settings.json) | ✅ DONE |
| Reviewer | Document known Claude Code limitations | ✅ DONE (see claude-code-limitations.md) |
| Reviewer | Verify V14 fixes before restart | ⏳ PENDING |
| Lead | Coordinate and verify fixes | ✅ DONE |

---

## HOW TO REPORT

Don't use triggers. Edit this file directly under your section.
