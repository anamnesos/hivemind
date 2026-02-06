# Shared Context Archive

**Archived:** Jan 31, 2026 (Session 52)
**Contents:** Sessions 1-48 historical context

---

## 🚀 SESSION 48: MEGA SPRINT - FINAL STATUS (Jan 30, 2026)

**Goal:** Substantial feature build + competitive research - prove this isn't for toy apps
**Result:** EXCEPTIONAL - 35 tasks complete, 1 in progress

### Sprint Metrics (FINAL)
- **Tasks Complete:** 35
- **Tasks In Progress:** 1 (#10 Voice Control ~50%)
- **Code Output:** ~37,000+ lines
- **Tests:** 2,949 (from 1,181 - 2.5x increase this session)
- **Test Coverage:** 90.23% statements

### Final Task Summary (35 Complete, 1 In Progress)
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Competitive Research | Investigator | Complete |
| 2 | Agent memory/context persistence | Implementer A | Complete (4,859 lines) |
| 3 | Real-time task queue visualization | Implementer B | Complete |
| 5 | Smart auto-routing with learning | Orchestrator | Complete (355 lines) |
| 6 | Git integration for agents | Implementer B | Complete |
| 7 | Test coverage push to 90%+ | Reviewer | Complete (2,949 tests, 90.23%) |
| 8 | Conversation history viewer | Implementer A | Complete |
| 9 | Plugin/Extension system | Implementer B | Complete |
| 10 | Voice control for agents | Implementer B | Complete |
| 11-37 | Various features | Various | Complete |

### Competitive Research Summary
**Key finding:** Competitors weak on production reliability and observability
- CrewAI: Slow, weak observability
- AutoGen: "Not production-ready" (Microsoft's words)
- LangGraph: interrupt() restarts nodes
- MetaGPT/ChatDev: Research demos, not ops-ready

**Our positioning:** "Frameworks are easy to demo; production reliability is the hard part. Hivemind ships the latter."

---

## Sessions 34-47 Summary

### UI Polish Sprint (Session 47)
- 25/25 tasks completed
- CSS design system with variables
- Micro-animations, glass effects, gradients
- Command palette, notifications, tooltips

### UI Overhaul Sprint (Session 34)
- Main pane (left, 60%) + Side column (right, 40%)
- Click side pane to swap with main
- Command bar with target selector

### Key Fixes Across Sessions
- Message accumulation bug fix (Session 39)
- Input lock bypass for programmatic Enter (Session 38)
- Auto-submit adaptive delay (Session 35)
- Per-pane input lock (Session 36)
- Focus-steal typing-guard (Session 18-19)

---

## Sessions 1-33 Summary

### Core Infrastructure
- Trigger file communication system
- PTY injection with verification
- Codex exec pipeline (non-interactive)
- 6-pane layout with CLI identity detection
- Structured logging (modules/logger)

### Key Commits
- Hybrid injection: PTY write + sendTrustedEnter
- xterm.js upgrade 5.3.0 → 6.0.0
- Global injection mutex
- IPC handler splits (20+ modules)
- Error handling hardening (37 handlers across 9 files)

### Fix History (Highlights)
- Fix S: Codex exec pipeline (non-interactive)
- Fix T: Codex auto-start identity injection
- Fix U: shell:true for Codex on Windows
- Fix Z: Trigger file encoding normalization

---

## Agent Identity Reference

| Pane | Role | Trigger File | CLI |
|------|------|--------------|-----|
| 1 | Architect | architect.txt | Claude |
| 2 | Infra | infra.txt | Codex |
| 3 | Frontend | frontend.txt | Claude |
| 4 | Backend | backend.txt | Codex |
| 5 | Analyst | analyst.txt | Codex |
| 6 | Reviewer | reviewer.txt | Claude |

---

*For full historical details, see git history or ask Architect.*

---

## Sessions 57-73 (Archived from shared_context.md - Session 80)

# Hivemind Shared Context

**Last Updated:** Feb 5, 2026 (Session 73)
**Status:** Session 73 - Reliability & Modularization complete

---

## SESSION 73 UPDATE - Smart Watchdog (Feb 5, 2026)

**Owner:** Analyst  
**Status:** ✅ APPROVED (Reviewer #10)

**Change:**
- Implemented Smart Watchdog in `terminal-daemon.js` to detect "churning stalls" (spinner animations masking lack of progress).
- Added `MEANINGFUL_ACTIVITY_TIMEOUT_MS` (30s threshold).
- Added spinner character allowlist filter.
- Updated `getStuckTerminals` to flag agents churning for >30s as stuck.

**Files:** `ui/terminal-daemon.js`  
**Reviewer:** ✅ Approved (REV #10)

## SESSION 73 UPDATE - Reliability & Modularization (Feb 5, 2026)

**Owner:** Analyst  
**Status:** ✅ DONE  

**Change:**
- **Daemon Error Handling:** Added missing `error` listener for `daemonClient` in `hivemind-app.js`.
- **SDK Race Condition:** Added `busy` flag to `BaseAgent` in `hivemind-sdk-v2.py`.
- **Triggers Modularization:** Split `triggers.js` into `metrics.js`, `sequencing.js`, `war-room.js`, and `routing.js`.
- **node-pty Analysis:** Identified environment-level `require` resolution issue; resolved via global reinstallation of `@google/gemini-cli`.

**Files:** `ui/modules/main/hivemind-app.js`, `hivemind-sdk-v2.py`, `ui/modules/triggers.js`, `ui/modules/triggers/*.js`  

---

## SESSION 71 UPDATE - Stale Scrollback False Positives (Feb 4, 2026)

**Owner:** Backend  
**Status:** ✅ DONE (tests added)  

**Change:**
- Hardened CLI-detection on reconnect to avoid stale scrollback false positives
- Detects CLI prompts in recent scrollback tail, filters shell prompts
- Uses lastActivity as a short grace window for active streaming sessions

**Files:** `ui/modules/daemon-handlers.js`, `ui/__tests__/daemon-handlers.test.js`  
**Tests:** `npm test -- __tests__/daemon-handlers.test.js` (PASS)  
**Reviewer:** ⏳ Pending  
**Next:** Reviewer to verify; Architect to merge

## SESSION 71 UPDATE - War Room Routing + Ambient Awareness (Feb 4, 2026)

**Owner:** Backend  
**Status:** ✅ DONE (tests added)  

**Change:**
- Added war-room.log persistence + IPC `war-room-message` events
- Routed trigger/direct/broadcast messages into War Room stream
- Implemented relevance filter + real-time ambient injection (mentions, broadcasts, correction keywords)

**Files:** `ui/modules/triggers.js`, `ui/__tests__/triggers-full.test.js`  
**Tests:** `npm test -- __tests__/triggers-full.test.js` (PASS)  
**Reviewer:** ⏳ Pending  
**Next:** Frontend to render war-room-message stream + wire UI

## SESSION 69 UPDATE - Pane Header Cleanup (Feb 3, 2026)

**Owner:** Frontend  
**Status:** ✅ APPROVED - ready for commit  

**Change:**
- Removed `pane-timer`, `sdk-status`, `sdk-session-id`, `delivery-indicator` from pane headers
- Cleaned related JS handlers (renderer SDK header status/session) and UI view delivery indicator
- Removed header-only CSS for SDK status/session/timer and delivery indicator

**Reviewer:** ✅ Approved (Session 69 pane header cleanup review)  
**Next:** Architect/Infra to commit; Frontend to update injection paths after folder renames

## SESSION 70 UPDATE - SDK Injection Paths (Feb 4, 2026)

**Owner:** Frontend  
**Status:** ✅ APPROVED  

**Change:**
- Updated `hivemind-sdk-v2.py` role_dir values to new instance folders: arch/front/back/ana/rev
- Ensures SDK context injection reads from renamed `workspace/instances/*` folders after auto-migration

**Files:** `hivemind-sdk-v2.py`  
**Reviewer:** ✅ Approved (Reviewer #2) - tests 2637/2637 PASS

## SESSION 70 UPDATE - SDK UI Phase A (Feb 4, 2026)

**Owner:** Frontend  
**Status:** ✅ APPROVED  

**Change:**
- Added `ui/sdk-ui/bubble-canvas.js` with static bubbles (6 agents) and input area
- Colors and positions follow organic UI spec

**Files:** `ui/sdk-ui/bubble-canvas.js`  
**Reviewer:** ✅ Approved (note addressed: prefers-reduced-motion)

## SESSION 70 UPDATE - SDK UI Phase B (Feb 4, 2026)

**Owner:** Frontend  
**Status:** ✅ APPROVED  

**Change:**
- Added bubble state classes (idle/thinking/active) + GPU-safe breathing animation
- Default arch bubble set to thinking to showcase animation
- Pauses animations when document is hidden (Page Visibility API)

**Files:** `ui/sdk-ui/bubble-canvas.js`  
**Reviewer:** ⏳ Pending

## SESSION 70 UPDATE - SDK UI Phase C (Feb 4, 2026)

**Owner:** Frontend  
**Status:** ✅ IMPLEMENTED - needs review  

**Change:**
- Added SVG stream layer + pooled particle streams for message routing
- Reuses DOM nodes, caps particle count, GPU-safe motion via offset-path
- Streams pause when document is hidden (inherits canvas hidden state)
- Added prefers-reduced-motion override to disable stream/breathe animations

**Files:** `ui/sdk-ui/bubble-canvas.js`  
**Reviewer:** ⏳ Pending

## SESSION 70 UPDATE - Organic UI v2 IPC (Send/Receive) (Feb 4, 2026)

**Owner:** Backend  
**Status:** ✅ APPROVED  

**Change:**
- Emit organic message-routing events for trigger/direct/auto-handoff sends (drives container breathing)
- Added short-role mappings for sender → pane resolution
- Added sender/receiver pane IDs to `direct-message-sent` and `auto-handoff` payloads

**Files:** `ui/modules/triggers.js`  
**Tests:** `npm test -- __tests__/triggers-full.test.js` (PASS)  
**Reviewer:** ✅ Approved (Reviewer #22)  
**Next:** Frontend can use `message-routing` or new payload fields

## SESSION 70 UPDATE - Reconnect Auto-Spawn Per-Pane (Feb 4, 2026)

**Owner:** Backend  
**Status:** ✅ IMPLEMENTED - needs review  

**Change:**
- On reconnect, detect CLI content per pane (alive + scrollback signals)
- Spawn CLIs only for panes missing CLI content (including missing panes)
- Respect `autoSpawn` setting on reconnect
- Added test for partial-shell case

**Files:** `ui/modules/daemon-handlers.js`, `ui/__tests__/daemon-handlers.test.js`  
**Tests:** `npm test -- __tests__/daemon-handlers.test.js` (PASS)  
**Reviewer:** ✅ Approved (Reviewer #5)  
**Next:** Architect to merge/commit; optional runtime reconnect verification

## SESSION 68 UPDATE - Architect Context Injection Delay (Feb 3, 2026)

**Owner:** Frontend  
**Status:** ✅ IMPLEMENTED - Reviewer verified  

**Change:**
- Pane 1 (Architect) context injection delay set to 3000ms; other Claude panes remain 6000ms
- Files: `ui/modules/terminal.js`, `ui/modules/constants.js`

**Reviewer:** ✅ Verified, tests 134/134 PASS, ready for commit

## SESSION 60 STATUS (Feb 1, 2026) - IN PROGRESS

### Current Focus
Model Switch feature verification + Model switch notification feature gap

### Commits Shipped (Session 60)
| Commit | Description |
|--------|-------------|
| `415a363` | Queue function renames for clarity |
| `e62c32b` | triggers.js comprehensive tests (20 tests) |
| `0cd906c` | daemon-handlers SDK mode + watcher API tests |
| `89afc50` | Model Switch: per-pane dropdown |
| `742c8db` | Model Switch: dropdown/spawn bug fixes |
| `cdf135c` | Model Switch: Gemini default to gemini-3-flash |
| `c67ae03` | Simplified Gemini spawn (--yolo, no model flag) |
| `aab538e` | Context injection on model switch |
| `COMPLETE` | Finding #14: Context injection on startup |
| `COMPLETE` | Fixed 64/64 backend test failures (backward compatibility) |

### Runtime Verification
| Check | Status |
|-------|--------|
| Gemini `--yolo` flag | ✅ VERIFIED (Analyst) |
| Dropdown stays open | ⏳ Pending |
| Model switch spawns correct CLI | ⏳ Pending |
| Context injection (`aab538e`) | ⏳ Pending (requires restart) |

### Context Injection Feature ✅ COMMITTED
**Commit:** `aab538e` - feat: auto-inject context on model switch
**What:** Auto-inject CLAUDE.md/AGENTS.md after model switch spawn
**Status:** Committed + pushed, awaiting restart to verify
**Tests:** 2714/2714 passing

---

## SESSION 58 STATUS - COMPLETE

### Tasks Completed
| Task | Owner | Status |
|------|-------|--------|
| Fix message timing (DELIVERY_ACK_TIMEOUT_MS → 65s) | Backend | ✅ DONE |

---

## SESSION 57 STATUS (Feb 1, 2026) - IN PROGRESS

### Backlog Fixes Completed (Backend)
- Finding #13: Comprehensive tests for model-switch-handlers.js (14 tests)
- restartPane spawn failure now sets status to "Spawn failed"
- delete-screenshot rejects path traversal filenames
- Gemini Oracle retries 429 with 1s/2s/4s backoff
- Added screenshot handler test for invalid filename
- Added Gemini Oracle unit tests (analysis, retry, error paths)
- Fixed watcher friction-resolution condition ordering
- Updated watcher test for friction-resolution fix
### Current Tasks
| Task | Owner | Status |
|------|-------|--------|
| Review backlog fixes | Reviewer | Approved |
| Review watcher.js condition ordering fix | Reviewer | Approved |
| Review watcher.js test update | Reviewer | ✅ Committed in 4db00b4 |
| Tech debt audit | Analyst | ✅ Complete (12 findings) |
| CI workflow improvements | Infra | Complete |
| Gemini respawn fix | Architect | Committed `5279b1c` |
| Message injection fix | Frontend | Committed `176cbb5` |
| Analyst -> Architect message loss | Backend | Complete (root cause found) |
| Fix message timing (ack timeout / queue latency) | Backend | In progress (Session 58) |
### Session 57 Commits (ALL PUSHED TO REMOTE)
| Commit | Description |
|--------|-------------|
| `5279b1c` | Gemini respawn fix - PTY recreated for all panes |
| `176cbb5` | Message injection race condition - queue lock in onComplete |
| `4db00b4` | watcher.js condition ordering + auth template security |
| `34a7c5f` | Stuck detection grace period |

### Testing Required After Restart
1. **Gemini respawn:** Click Respawn on pane 5, verify `gemini` command runs
2. **Message injection:** Send 20+ messages Analyst ↔ Architect, verify no loss

### Other Notes
- User upgraded to Google AI Ultra (25/mo promo)
- Analyst now has 1,500 Gemini requests/day
- Backend investigation: app.log shows pane 1 inject queue length ~64 with trigger delivery timeouts; delivery-ack timeout (30s) is shorter than injection max wait (60s), so bursts can time out even if eventually delivered. Fix options: raise ack timeout, reduce queue latency, or batch/priority acks.
- Session 58: raised DELIVERY_ACK_TIMEOUT_MS to 65s (pending review/test).

---


## Agent Identity

| Pane | Role | Trigger File | CLI |
|------|------|--------------|-----|
| 1 | Architect | architect.txt | Claude |
| 2 | Infra | infra.txt | Codex |
| 3 | Frontend | frontend.txt | Codex |
| 4 | Backend | backend.txt | Claude |
| 5 | Analyst | analyst.txt | Gemini |
| 6 | Reviewer | reviewer.txt | Claude |

**CRITICAL FOR CODEX AGENTS:** If you are reading this, your pane number and role come from your AGENTS.md file header, NOT from this table. Do NOT guess your role from this table.

Legacy trigger names still work (lead.txt, orchestrator.txt, etc.)

---


## Recent Sessions Summary

| Session | Date | Key Results |
|---------|------|-------------|
| 56 | Feb 1 | Gemini sandbox fix, debug logging cleanup |
| 55 | Feb 1 | Gemini CLI default, Oracle Visual QA, Respawn+Kickoff button |
| 54 | Jan 31 | Task-pool watcher, stuck detection, button debounce, constants |
| 53 | Jan 31 | Smart parallelism UI, PTY Enter timing fix |
| 52 | Jan 31 | Slim context files, feedback collection |
| 51 | Jan 30 | Dead code audit (removed 12,955 lines) |
| 50 | Jan 30 | Role rename (Infra/Frontend/Backend/Analyst) |

For full details on older sessions, see `shared_context_archive.md`.

---

## ARCHITECT TO ANALYST - Push Complete (Session 57)

All 4 session commits pushed to remote. Your audit findings #1 and #2 are shipped in `4db00b4`.

Backend is investigating the message loss issue (Task #5). Once resolved, trigger communication should work again.

Stand by - no new assignments currently. Good work this session.


---

## SESSION 66 STATUS (Feb 2, 2026) - CRITICAL FINDING

### SDK Mode Sequential Execution - BLOCKER

**User discovered:** Agents cannot work in parallel in SDK mode - they execute sequentially.

**Root Cause Investigation (Architect):**

**The Problem:**
- `hivemind-sdk-v2.py` has a **single-threaded command loop** (`while True:` at line 1315)
- When Electron sends a message to Agent 1, Python calls `await manager.send_message()`
- This does `async for response in agent.send(message):` which **blocks until the entire conversation completes**
- Agent 2's message sits QUEUED in stdin, not processed until Agent 1 finishes
- All 6 agents execute SEQUENTIALLY through one command loop

**Impact:**
- PTY mode: 6 independent terminal processes → true parallelism ✅
- SDK mode: 6 API sessions → processed through ONE loop → sequential execution ❌
- SDK mode is actually SLOWER than PTY mode for multi-agent work
- Defeats the entire purpose of multi-agent orchestration

**Critical Files:**
- `hivemind-sdk-v2.py:1315` - Single command loop
- `hivemind-sdk-v2.py:1150` - Blocking send_message implementation
- `hivemind-sdk-v2.py:1167` - The `async for` that blocks everything

**Architecture Decision Required:**

**Option 1: Fix SDK V2 for Parallelism**
- Spawn asyncio tasks for each `send_message()` call
- Don't await in the command loop, let tasks run concurrently
- Complex: need to manage task lifecycle, interrupts, output ordering

**Option 2: Return to PTY Mode as Primary**
- SDK mode was meant to fix PTY issues, but introduces worse ones
- PTY mode works, has true parallelism, proven stable
- SDK mode becomes experimental/fallback only

**Option 3: Polling Architecture**
- Agents poll MCP message queue instead of stdin push
- Command loop just updates queues, doesn't block
- Requires agents to check queue periodically (adds latency)

**Status:** Investigation complete, awaiting user/Architect decision on path forward.

**Logged in:** `workspace/build/errors.md`

---

## SESSION 66 UPDATE - PTY Startup Injection Ready-Gate (Feb 2, 2026)

**Owner:** Frontend  
**Status:** IMPLEMENTED - Ready for review + runtime verification  

**Fix Summary:**
- Replace fixed startup timers with PTY output readiness detection
- Inject identity/context only after prompt ready (">" or "How can I help")
- Fallback inject after 30s if pattern never appears

**Follow-up Fix (Reviewer #2):**
- Added ready-gate hook to initTerminal pty.onData (previously only reattach)
- Clear startup state on initTerminal exit
- Tests: `npm test -- terminal.test.js` (PASS, 134/134; Jest open-handles warning)

---

## SESSION 73 UPDATE - Reliability & Modularization (Feb 5, 2026)

**Owner:** Analyst  
**Status:** ✅ IMPLEMENTED  

**Change:**
- **Daemon Error Handling:** Added missing `error` listener for `daemonClient` in `hivemind-app.js`. Prevents "Unhandled error" crashes and improves visibility of pane-specific failures.
- **SDK Race Condition:** Added `busy` flag to `BaseAgent` in `hivemind-sdk-v2.py`. Prevents concurrent `send` tasks from overwriting process state, resolving `'NoneType' object has no attribute 'wait'` errors.
- **Triggers Modularization:** Monolithic `triggers.js` (2100+ lines) split into focused sub-modules: `metrics.js`, `sequencing.js`, `war-room.js`, and `routing.js`.
- **node-pty Analysis:** Traced shell tool failure to an environment-level `require` resolution issue in the Gemini CLI's tool execution shell. Binary verified as present but unreachable.

**Files:** `ui/modules/main/hivemind-app.js`, `hivemind-sdk-v2.py`, `ui/modules/triggers.js`, `ui/modules/triggers/*.js`  
**Blockers:** `node-pty` regression (Infra owner)  
**Strategy:** Hybrid Consensus confirmed (Hivemind as outer loop, native teams as opt-in).
