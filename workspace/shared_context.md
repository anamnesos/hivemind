# Hivemind Shared Context

**Last Updated:** Jan 25, 2026 - V16.11 SHIPPED
**Status:** 🟢 FULLY AUTONOMOUS - All panes working, no manual intervention needed!

---

## ⚠️ CRITICAL NOTE FOR ALL AGENTS - READ THIS

**How to tell where user input came from:**
- `[BROADCAST TO ALL AGENTS]` prefix → User typed in broadcast input bar
- NO prefix → User typed DIRECTLY in your terminal

**DO NOT ask "did you use broadcast?" - just look at the message format.**

---

## V16.11: Auto-Refocus Fix - ✅ SHIPPED (THE FIX!)

**Problem:** Messages arriving in terminal but not being processed by Claude. Panes 1 & 4 (Lead/Reviewer) affected more than panes 2 & 3 (Workers).

**Root Cause Discovery (via Lead + Reviewer debugging session):**
- Focus was being lost between `textarea.focus()` and Enter event dispatch
- The 50ms delay before sending Enter allowed focus to shift to another element
- Keyboard Enter events were dispatched to wrong element or no element

**Fix Applied:**
- `terminal.js` doSendToPane() - Added re-focus check before Enter dispatch
- If focus was lost during the 50ms delay, re-focus before sending Enter
- Added diagnostic logging to track focus state

**Code Change:**
```javascript
// V16.11: Re-check focus before dispatching
const stillFocused = document.activeElement === textarea;
if (!stillFocused) {
  textarea.focus();  // Re-focus if lost
}
// Then dispatch Enter event
```

**Result:** All 4 panes now receive messages automatically. User confirmed NO manual intervention needed!

---

## V16.10: Keyboard Events + sendUnstick() - ✅ SHIPPED

**Changes:**
- Replaced PTY `\r` with DOM keyboard events for Enter
- Added `_hivemindBypass` marker to allow synthetic events through isTrusted check
- Added `sendUnstick(paneId)` function - dispatches ESC keyboard event
- Added `(UNSTICK)` trigger command - agents can unstick each other

---

## V16.3: Auto-Unstick ESC Bug Fix - ✅ SHIPPED

**Problem:** Agents getting stuck in "thinking animation" even with NO messages being sent

**Root Cause Discovery (Jan 25 session):**
- User reported Worker B stuck for 1m44s with NO NEW MESSAGES
- V16 fixed trigger injection ESC, but missed the auto-unstick timer in main.js
- main.js line 366 was sending `\x1b` (ESC) via PTY every 30 seconds
- `autoNudge: true` is the DEFAULT setting
- This periodic ESC was killing/interrupting agents!

**Fix Applied:**
- `main.js` - Removed ESC sending from auto-unstick timer
- Now just notifies user via `agent-stuck-detected` IPC event
- `renderer.js` - Added handler to show visual notification + flash pane header

**New Behavior:**
- Auto-unstick timer detects stuck agents but does NOT send ESC
- User sees notification: "Pane X may be stuck - click pane and press ESC"
- User must manually press ESC to unstick (keyboard ESC is safe, PTY ESC kills)

**Key Learning (DOCUMENTED):** PTY ESC (`\x1b`) always kills/interrupts Claude Code agents. User keyboard ESC works to unstick. There is NO programmatic way to safely unstick agents.

**Full ESC/Control Character Audit (Jan 25, 2026):**

| Location | Char | Automatic? | Status |
|----------|------|------------|--------|
| `renderer.js:258` | `\x03` Ctrl+C | NO - user keyboard | ✅ INTENTIONAL |
| `main.js:366` | `\x1b` ESC | YES - 30s timer | ✅ FIXED V16.3 |
| `terminal-daemon.js:252-285` | ESC in heartbeat | YES | ✅ Fixed V16 |
| `terminal.js:470-475` | ESC in nudgePane | YES | ✅ Fixed V16 |

No other automatic control character sends found. All other PTY writes are user input, text, or Enter.

---

## V16 FINAL: Trigger System Fixed - SHIPPED

**Problem:** Triggers were killing active agents (ESC via PTY = interrupt)

**Root Cause Discovery (via stress test):**
- 3x ESC BEFORE message = killed active agents
- 1x ESC AFTER message = also killed (V17 attempt failed)
- PTY escape writes ≠ keyboard escape (different signal paths!)
- User keyboard ESC = safe unstick
- PTY \x1b write = always kills

**Final Fix:** Remove ALL ESC from trigger injection. Just send text + Enter.

**Files Changed:**
- `daemon-handlers.js` - Removed ESC spam from processQueue()
- `terminal.js` - Removed ESC from sendToPane()

**Current Behavior:**
- ✅ Triggers (file-based) = SAFE, no interrupts
- ⚠️ Broadcasts = may interrupt active agents (unavoidable Claude behavior)
- ⚠️ Stuck agents = user must manually ESC (documented limitation)

**Key Learning:** Cannot programmatically unstick agents via PTY. User keyboard ESC works, PTY ESC kills.

---

## V15: Trigger + Interrupt Fixes - SUPERSEDED BY V16

**Superseded** - V16 replaced the ESC handling entirely.

---

## V14: Random Interrupt Fix - SHIPPED

**Problem:** Agents getting interrupted randomly by auto-Enter and aggressive auto-sync.

**Fixes Implemented:**
1. ✅ Worker A: Removed `\r` from terminal.js:346-348 and daemon-handlers.js:188-191
2. ✅ Worker B: Added `autoSync` setting check in watcher.js handleFileChange()
3. ✅ Reviewer: Documented Claude Code limitations

---

---

## V13: Autonomous Operation

**Goal:** User gives task, walks away, system keeps working without babysitting.

**Problem:** Agents get stuck after completing tasks. User must manually nudge them. No way to give a large task and walk away.

**Solution:** Lead-as-supervisor with daemon watchdog fallback.

### Supervision Hierarchy

```
Normal:     Daemon timer → Lead → nudges workers
Fallback 1: Lead stuck → Daemon nudges Lead
Fallback 2: Lead still stuck → Daemon directly nudges workers
Fallback 3: Everyone stuck → Alert user (sound/notification)
```

### Tasks

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| HB1 | Worker B | ✅ DONE | Heartbeat timer in daemon (every 60s triggers Lead) |
| HB2 | Worker B | ✅ DONE | Track Lead response. If no response in 30s, nudge Lead again |
| HB3 | Worker B | ✅ DONE | If Lead unresponsive after 2 nudges, daemon directly nudges workers |
| HB4 | Worker A+B | ✅ DONE | User alert (Worker A: UI f8a917b, Worker B: daemon a3e78ad) |
| HB5 | Lead | ✅ DONE | Respond to heartbeat - check incomplete tasks, nudge stuck workers |
| R1 | Reviewer | ✅ DONE | Verified - PARTIAL PASS (core flow works, fallbacks untested) |
| BUG1 | Worker B | ✅ FIXED | Heartbeat timer not firing - removed overly aggressive activity check |
| BUG2 | Lead | ✅ FIXED | Heartbeat false positive - removed terminal activity check from checkLeadResponse |
| FX4-v2 | Worker A+B | ✅ READY | Ghost text fix - 4-layer defense (ESC, isTrusted, debounce, daemon dedup) |

### File Ownership

| Owner | Files |
|-------|-------|
| Worker B | ui/terminal-daemon.js, ui/modules/watcher.js |
| Lead | Heartbeat response logic (via triggers) |
| Worker A | UI for alert notification (if needed) |
| Reviewer | Verification |

### HB1-HB4: Daemon Watchdog (Worker B)

**File:** `ui/terminal-daemon.js`

```
- Add heartbeat timer (configurable, default 60s)
- On tick: write to triggers/lead.txt "(SYSTEM): Heartbeat - check team status"
- Track if Lead responds (check if triggers/lead.txt gets cleared or response in triggers/workers.txt)
- If no response after 30s: nudge Lead again
- If still no response after 2nd nudge: read shared_context.md, find incomplete tasks, directly nudge workers
- If workers don't respond: trigger desktop notification / sound alert
```

### HB5: Lead Heartbeat Response

When Lead receives "(SYSTEM): Heartbeat":
1. Read shared_context.md for incomplete tasks
2. Check which workers should be working on them
3. Send nudge via trigger: "(LEAD): You have task X assigned. Status?"
4. If worker responds with completion, update shared_context.md

---

## V12: Stability & Robustness ✅ SHIPPED

**Goal:** Fix critical bugs blocking normal usage.

**MANDATORY FOR ALL AGENTS:**
1. When you receive a trigger message → REPLY via triggers (not terminal)
2. When you complete a task → NOTIFY via triggers
3. When you're stuck → ASK via triggers
4. Terminal output = for USER only
5. Triggers = for OTHER AGENTS

**THIS IS NOT OPTIONAL. If you don't use triggers, coordination breaks down.**

Trigger files:
- `triggers/lead.txt` → Lead
- `triggers/worker-a.txt` → Worker A
- `triggers/worker-b.txt` → Worker B
- `triggers/reviewer.txt` → Reviewer
- `triggers/all.txt` → Everyone

### Tasks

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| FX1 | Worker A | ✅ DONE | ESC key interrupt - send Ctrl+C to focused terminal (fa2c8aa) |
| FX2 | Worker B | ✅ DONE | Session persistence - save/restore context on restart |
| FX3 | Lead | ✅ DONE | Unblock workflow gate during planning phase |
| FX4 | Worker A | ✅ DONE | Fix autocomplete bug PROPERLY - still injecting messages |
| CO1 | Worker B | ✅ DONE | Progress indicator when agents working |
| R1 | Reviewer | ✅ DONE | Verify all V12 fixes |
| BUG1 | Worker A | ✅ DONE | Self-sync bug - FIXED (3s debounce per pane) |
| BUG2 | Worker A | ✅ DONE | Trigger flood causes terminal UI glitch - FIXED (throttle 150ms) |

### File Ownership

| Owner | Files |
|-------|-------|
| Lead | ui/main.js (state logic), ui/modules/watcher.js |
| Worker A | ui/renderer.js, ui/modules/terminal.js, ui/index.html |
| Worker B | ui/modules/watcher.js (file ops), ui/terminal-daemon.js |
| Reviewer | Testing, verification |

### FX1: ESC Key Interrupt (Worker A)
- File: `ui/renderer.js`
- When ESC pressed, send `\x03` (Ctrl+C) to focused terminal
- Should interrupt running Claude process

### FX2: Session Persistence (Worker B)
- Save agent conversation context before restart
- Restore on app reopen
- Could use daemon to persist state

### FX3: Workflow Gate (Lead)
- File: `ui/modules/triggers.js`
- Allow worker triggers during `friction_sync` and `planning` states
- Current gate blocks workers unless state is `executing`

### FX4: Autocomplete Bug (Worker A) - ⚠️ EXTERNAL DEPENDENCY
- **RESOLVED:** Not a Hivemind bug
- **Root Cause:** Claude Code's ghost text suggestions in terminals
- User screenshot revealed: greyed-out text = Claude Code suggestions (Tab to accept, Enter submits)
- We cannot control Claude Code's internal UI from Hivemind
- Browser autocomplete fixes (v1-v5) were solving wrong problem
- **Action:** Document as expected Claude Code behavior

---

## Previous: V11 Shipped

**Commit:** `0ba5cb7` - Collaborative fix by Worker A + Worker B

**Issue:** During MCP testing, autocomplete suggestions were auto-submitted to agent terminals without user confirmation. Documented as HIGH PRIORITY in friction.md.

**Fix Applied:**
1. **Worker A:** Added `blurAllTerminals()` function + focusin listener to release xterm keyboard capture when input fields get focus
2. **Worker B:** Made broadcast keydown handler defensive (check !isComposing, trim, block empty sends) + added autocomplete="off" attributes

**Files Changed:**
- `ui/index.html` - autocomplete/autocorrect/autocapitalize="off" on inputs
- `ui/renderer.js` - defensive keydown handler + focusin blur
- `ui/modules/terminal.js` - blurAllTerminals() export

**Reviewer:** This fix was committed after your V11 verification. The friction.md you updated triggered this fix. No re-verification needed unless you want to confirm the autocomplete issue is resolved.

---

## V11: MCP Integration

**Goal:** Replace file-based triggers with Model Context Protocol for structured agent communication.

### Tasks

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MC1 | Lead | ✅ DONE | MCP server skeleton with stdio transport |
| MC2 | Lead | ✅ DONE | Core messaging tools (send_message, get_messages) |
| MC3 | Lead | ✅ DONE | Workflow tools (get_state, trigger_agent, claim_task) |
| MC4 | Worker B | ✅ DONE | Connect MCP server to existing message queue |
| MC5 | Worker B | ✅ DONE | Agent identification via MCP handshake |
| MC6 | Worker B | ✅ DONE | State machine integration |
| MC7 | Worker A | ✅ DONE | MCP status indicator in UI |
| MC8 | Worker A | ✅ DONE | Auto-configure MCP per agent on startup |
| MC9 | Worker A | ✅ DONE | MCP connection health monitoring |
| R1 | Reviewer | ✅ DONE | Verify all MCP tools work correctly |

### Feature Details

**MC1-MC3: MCP Server Core (Lead)**
- Stdio transport MCP server using @modelcontextprotocol/sdk
- Tools: send_message, get_messages, get_state, trigger_agent, claim_task, complete_task
- JSON-RPC protocol with proper error handling

**MC4-MC6: MCP Backend Integration (Worker B)**
- Bridge MCP tools to existing watcher.js message queue
- Agent auth via paneId passed in tool calls
- State machine reads/writes via MCP

**MC7-MC9: MCP UI & Setup (Worker A)**
- Connection status per agent in header
- Auto-run `claude mcp add` on app startup
- Health checks and reconnection handling

### Success Criteria

- [ ] MCP server starts and accepts connections
- [ ] Agents can send/receive messages via MCP tools
- [ ] State machine accessible via MCP
- [ ] UI shows MCP connection status
- [ ] Auto-configuration works on fresh start

---

## V10: Messaging System Improvements ✅ SHIPPED

Commit: `6d95f20` - All 7 tasks complete.

**Goal:** Make agent-to-agent messaging robust and production-ready based on team feedback.

### Tasks

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MQ1 | Lead | ✅ DONE | Message queue backend - JSON array with append (merged with MQ4) |
| MQ2 | Lead | ✅ DONE | Delivery confirmation IPC events (merged with MQ4) |
| MQ3 | Worker A | ✅ DONE | Message history UI panel |
| MQ4 | Worker B | ✅ DONE | Message queue file watcher integration |
| MQ5 | Worker B | ✅ DONE | Gate bypass for direct messages |
| MQ6 | Worker A | ✅ DONE | Group messaging UI (workers only, custom) |
| R1 | Reviewer | ✅ DONE | Verify all messaging features |

### Feature Details

**MQ1+MQ2: Message Queue Backend (Lead)**
- Replace single-message trigger files with JSON queue
- Format: `[{from, to, time, msg, delivered}, ...]`
- Append new messages, don't overwrite
- Emit `message-delivered` IPC event when processed
- Emit `message-received` IPC event for UI updates

**MQ3+MQ6: Message UI (Worker A)**
- New "Messages" tab in right panel
- Show conversation history between agents
- Filter by sender/recipient
- Group message composer (workers only, all, custom)

**MQ4+MQ5: Message Integration (Worker B)**
- File watcher for message queue files
- Process queue, mark as delivered
- Bypass workflow gate for direct messages
- Messages always allowed regardless of state

### Success Criteria

- [ ] Messages persist (no race condition overwrites)
- [ ] Delivery confirmation works
- [ ] Message history visible in UI
- [ ] Direct messages bypass workflow gate
- [ ] Group messaging works

---

## V9: Documentation & Polish ✅ SHIPPED

Commit: `ac4e13c` - All 7 tasks complete.

**Goal:** Prepare for stable release with docs and refinements.

### Tasks

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| DC1 | Lead | ✅ DONE | README and getting started guide |
| DC2 | Worker A | ✅ DONE | In-app help tooltips |
| DC3 | Worker B | ✅ DONE | API documentation generator |
| PL1 | Lead | ✅ DONE | Error message improvements |
| PL2 | Worker A | ✅ DONE | UI consistency pass |
| PL3 | Worker B | ✅ DONE | Performance audit |
| R1 | Reviewer | ✅ DONE | Final release verification |

### Feature Details

**DC1-DC3: Documentation**
- README with installation, usage, architecture
- Tooltips on UI elements for discoverability
- Auto-generate IPC handler docs

**PL1-PL3: Polish**
- Clear, actionable error messages
- Consistent styling, spacing, colors
- Profile and optimize slow paths

---

## V8: Testing & Automation ✅ SHIPPED

Commit: `4e8d7c3` - All 7 tasks complete:
- TE1/TE2 ✅ Test execution daemon
- TR1 Worker A ✅ Test results UI
- TR2 Lead ✅ Test failure notifications
- CI1 Worker B ✅ Pre-commit hooks
- CI2 Worker A ✅ CI status indicator

### Feature Details

**TE1+TE2: Test Runner** - Execute tests automatically
- Detect test framework (Jest, Mocha, pytest, etc.)
- Run tests on file save or on demand
- Capture and parse test output

**TR1+TR2: Test Results** - Display test status
- Test results panel with pass/fail counts
- Failure details with stack traces
- Notifications on test failures

**CI1+CI2: CI Integration** - Pre-commit checks
- Run tests before allowing commits
- Block commits on test failure
- Show CI status in header

---

## V7: Quality & Observability ✅ SHIPPED

Commit: `1df828b` - All 7 tasks complete:
- OB1 Lead ✅ Activity log aggregation
- OB2 Worker A ✅ Activity log UI panel
- QV1 Worker B ✅ Output validation hooks
- QV2 Lead ✅ Completion quality checks
- RB1 Worker B ✅ Checkpoint rollback support
- RB2 Worker A ✅ Rollback confirmation UI
- R1 Reviewer ✅ Verified all features

### Feature Details

**OB1+OB2: Activity Log** - Unified view of all agent activity
- Aggregate terminal output, file changes, state transitions
- Filterable by agent, time, event type
- Searchable for debugging

**QV1+QV2: Quality Validation** - Verify completed work
- Hooks to validate output (syntax check, tests)
- Auto-detect incomplete work
- Confidence scoring for completions

**RB1+RB2: Rollback Support** - Undo failed changes
- Checkpoint file state before changes
- One-click rollback on failure
- Diff view of pending rollback

---

## V6: Smart Automation ✅ SHIPPED

Commit: `98d3454` - All 8 tasks complete:
- SR1 Lead ✅ Smart routing algorithm
- SR2 Lead ✅ Routing IPC handlers
- AH1 Lead ✅ Auto-handoff logic
- AH2 Worker A ✅ Handoff notification UI
- CR1 Worker B ✅ Conflict queue system
- CR2 Worker A ✅ Conflict resolution UI
- LM1 Worker B ✅ Learning data persistence
- R1 Reviewer ✅ Verified all features

---

## V5: Multi-Project & Performance ✅ SHIPPED

Commit: `da593b1` - All tasks complete.

---

## V4: Self-Healing & Autonomy ✅ SHIPPED

Commit: `f4e9453` - All 8 tasks complete:
- AR1 Worker B ✅ Stuck detection in daemon
- AR2 Lead ✅ Auto-nudge IPC handler
- AR3 Lead ✅ Auto-unstick timer
- CB1 Worker A ✅ Startup state display
- CB2 Worker B ✅ Agent claim/release protocol
- AT1 Lead ✅ Completion detection patterns
- AT2 Worker A ✅ Auto-trigger UI feedback
- CP1 Worker B ✅ Session summary persistence

---

## V3: Developer Experience ✅ SHIPPED

**Goal:** Improve the development/testing workflow based on V2 feedback.

---

## V3 Features (Proposed)

### 1. Dry-Run Mode (HIGH PRIORITY)
Simulate multi-agent flow without spawning real Claude instances.
- Toggle in settings: "Dry Run Mode"
- When enabled, terminals show simulated agent responses
- Useful for: testing state transitions, demos, debugging orchestration
- **Why:** 3 of 4 agents requested this in feedback

### 2. Session History Tab (MEDIUM)
View and replay past sessions.
- New tab in right panel: "History"
- Shows: timestamp, agents involved, files touched, duration
- Click to view session details
- **Why:** Already tracking `usageStats.history`, just need UI

### 3. Projects Tab (MEDIUM)
Quick-switch between projects.
- New tab in right panel: "Projects"
- Recent projects list
- One-click to switch project folder
- **Why:** Deferred from Phase 4, users asked for it

### 4. Workflow Gate (HIGH - V3 REQUIRED)
Enforce Lead → Reviewer → Workers flow.
- Lead proposes plan → System blocks workers
- Reviewer approves → System unblocks workers
- Not optional. MANDATORY gate.
- **Why:** Lead just skipped Reviewer and triggered workers. Product must prevent this.

### 5. Context Handoff (LOW - FUTURE)
Better persistence between agent handoffs.
- Session state file agents can append to
- Context summarization between handoffs
- **Why:** Valid concern but complex, defer to later

---

## Task Assignments

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| P1 | Lead | ✅ DONE | Finalize V3 scope, break into tasks |
| D1 | Worker A | ✅ DONE | Dry-run mode UI toggle in settings |
| D2 | Worker B | ✅ DONE | Dry-run mode backend (mock terminal responses) |
| WG1 | Lead | ✅ DONE | Workflow Gate - block workers until Reviewer approves |
| H1 | Worker A | ✅ DONE | Session History tab UI |
| H2 | Worker B | ✅ DONE | Session History data persistence |
| J1 | Worker A | ✅ DONE | Projects tab UI |
| J2 | Worker B | ✅ DONE | Projects tab backend (recent projects) |
| R1 | Reviewer | ✅ DONE | Verify all V3 features |

---

## Sprint Breakdown

### Sprint 3.1: Dry-Run Mode
- D1: Settings toggle, UI indicator
- D2: Mock terminal responses, bypass Claude spawn

### Sprint 3.2: History & Projects
- H1 + H2: Session History tab
- J1 + J2: Projects tab

### Sprint 3.3: Polish
- R1: Full verification
- Bug fixes, UX tweaks

---

## File Ownership

| Owner | Files |
|-------|-------|
| Lead | main.js (state/IPC), SPRINT.md, shared_context.md |
| Worker A | renderer.js, index.html, modules/ui-*.js |
| Worker B | terminal-daemon.js, daemon-client.js, modules/watcher.js |
| Reviewer | __tests__/, workspace/build/reviews/ |

---

## Success Criteria

- [ ] Dry-run mode works (toggle on, terminals simulate)
- [ ] Session history tab shows past sessions
- [ ] Projects tab shows recent projects, allows switching
- [ ] All 86 existing tests still pass
- [ ] Reviewer verifies all features

---

## V2 Summary (Complete)

- Sprint 2.1: 86 tests added
- Sprint 2.2: Modularized (3036 lines → 9 files)
- Sprint 2.3: Polish (logging, health, scrollback, flash, kill all, others)
- Post-sprint: Fresh Start button, Nudge All button

---

**Ready for team sync. Agents: read this and confirm your assignments.**
