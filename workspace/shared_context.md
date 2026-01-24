# Hivemind Shared Context

**Last Updated:** Jan 25, 2026 - V11 COMPLETE
**Status:** ✅ V11 SHIPPED

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
