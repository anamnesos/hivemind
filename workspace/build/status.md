# Build Status

Last updated: 2026-01-26 - QUALITY GATES + SDK V2 FIXES + UI FIX

---

## UI Fix: Agent Message Styling - ✅ DONE (Jan 26, 2026)

**Owner:** Worker A
**Problem:** All trigger messages showed as "You:" with person icon - confusing UX.

**Fix Applied:**
- Detect `(ROLE):` prefix pattern in messages (LEAD, WORKER-A, WORKER-B, REVIEWER)
- Parse out the prefix and show appropriate agent styling
- "You:" label ONLY appears for actual user keyboard input (no prefix)

**Distinct Agent Styling:**
| Role | Icon | Color | CSS Class |
|------|------|-------|-----------|
| Lead | 👑 | Gold (#ffd700) | .sdk-agent-lead |
| Worker A | 🔧 | Teal (#4ecca3) | .sdk-agent-worker-a |
| Worker B | ⚙️ | Purple (#9b59b6) | .sdk-agent-worker-b |
| Reviewer | 🔍 | Orange (#ff9800) | .sdk-agent-reviewer |

**Files Modified:**
- `ui/modules/sdk-renderer.js` - Updated formatMessage() to detect and parse agent prefixes
- `ui/index.html` - Added CSS for .sdk-agent-msg and role-specific styles

**Status:** ✅ DONE - Requires app restart to test.

---

## Quality Gates - IN PROGRESS (Jan 26, 2026)

**Goal:** Stop shipping dumb bugs with automated checks.

| Gate | Status | Owner |
|------|--------|-------|
| Gate 1: mypy (Python) | ✅ DONE | Worker B |
| Gate 2: ESLint (JS) | ✅ DONE | Worker A |
| Gate 3: IPC Protocol Tests | ⏳ Pending | Lead |
| Gate 4: Serialization Tests | ✅ DONE | Worker B |
| Gate 5: Pre-commit Hook | ✅ DONE | Worker B |

**Gate 1 Results (Worker B):**
- Fixed 9 type errors in `hivemind-sdk-v2.py`
- Fixed 8 type errors in `hivemind-sdk.py`
- Both files pass: `python -m mypy <file> --ignore-missing-imports`
- Type fixes: Literal types, Optional params, collection annotations

**Gate 2 Results (Worker A):**
- Installed: ESLint 9.39.2, globals package
- Config: `ui/eslint.config.js` (flat config format)
- Scripts: `npm run lint`, `npm run lint:fix`
- Results: **0 errors**, 44 warnings (unused vars only)

**Gate 4 Results (Worker B):**
- Created `tests/test-serialization.py` (~300 lines)
- Tests: basic types, nested structures, default=str fallback, SDK message shapes, edge cases
- All 30+ test cases pass
- Added Windows encoding fix for emoji output

**Gate 5 Results (Worker B):**
- Created `.git/hooks/pre-commit`
- Runs: mypy (Python), ESLint (JS), syntax check, serialization tests
- Tested: All 4 gates pass
- Blocks commit on failure (bypass: `git commit --no-verify`)

**Commands:**
```bash
# Python type check
python -m mypy hivemind-sdk-v2.py --ignore-missing-imports

# JavaScript lint
cd ui && npm run lint

# Test pre-commit hook
sh .git/hooks/pre-commit
```

---

## SDK V2 Code Quality Fixes - ✅ APPLIED (Jan 26, 2026)

**Owner:** Reviewer (deep trace review)

**Issues found during full message flow trace:**

| Issue | File | Fix |
|-------|------|-----|
| Duplicate code | sdk-bridge.js:257-259 | Removed duplicate `this.ready = false`, fixed indentation |
| Unhandled event | sdk-bridge.js | Added handler for `message_received` (was showing raw JSON) |
| Unhandled event | sdk-bridge.js | Added handler for `all_stopped` (was showing raw JSON) |
| Magic number | sdk-bridge.js:709 | Removed arbitrary setTimeout(500), sendMessage queues properly |

**Review:** `workspace/build/reviews/sdk-v2-deep-trace-findings.md`

---

## SDK Message Type Handlers - ✅ APPLIED (Jan 26, 2026)

**Owner:** Reviewer (proactive audit)

**Audit:** Cross-referenced all `_emit()` in Python against `formatMessage()` in sdk-renderer.js.

**5 unhandled types found and fixed:**

| Type | File | Handler |
|------|------|---------|
| `warning` | sdk-renderer.js:287 | Yellow warning icon |
| `interrupted` | sdk-renderer.js:291 | Stop icon + role name |
| `agent_started` | sdk-renderer.js:295 | Rocket icon + role name |
| `ready` | sdk-bridge.js:576 | Log + emit 'python-ready' |
| `sessions` | sdk-bridge.js:582 | Log + emit 'sessions-list' |

**Review:** `workspace/build/reviews/sdk-renderer-audit.md`

---

## SDK V2 Critical Runtime Fixes - ✅ APPROVED (Jan 26, 2026)

**Status:** Reviewer approved + code quality fixes applied. Ready for user test.

**Problem:** SDK mode sort of worked but had multiple issues during user testing.

**Issues Found & Fixed:**

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| Content mismatch | "Unknown [Object]" in panes | Python sends content as ARRAY, JS expected STRING | `sdk-renderer.js` - handle array format |
| Missing user type | User messages not rendering | No handler for 'user' message type | `sdk-renderer.js` - added user handler |
| No immediate feedback | User types but nothing shows | Waited for Python to echo back | `daemon-handlers.js` - display immediately |
| Broadcast-only | Can't message specific pane | No pane targeting in SDK mode | `renderer.js` - added /1, /lead prefix syntax |
| No role identity | Agents don't know their role | All used same workspace directory | `hivemind-sdk-v2.py` - role-specific cwd |
| Fatal error crashes | "Fatal error in message reader" | Stale session IDs cause --resume to fail | `hivemind-sdk-v2.py` - disabled resume |
| Permission prompts | Agents stuck at permission prompt | `acceptEdits` doesn't accept reads | `hivemind-sdk-v2.py` - use bypassPermissions |
| No role identity | All agents respond as generic Claude | `setting_sources` was removed | `hivemind-sdk-v2.py` - re-enabled setting_sources=["project"] |
| JSON serialization | "ToolResultBlock not JSON serializable" | SDK objects passed to json.dumps | `hivemind-sdk-v2.py` - added default=str to all json.dumps |
| Broadcast to all | Single input went to all 4 agents | Default was sdk-broadcast | `renderer.js` - default now sends to Lead only, /all for broadcast |

**Critical Discovery - Stale Sessions:**
Session IDs in `session-state.json` were being passed to `--resume` flag, but those sessions no longer existed. SDK crashed with "Command failed with exit code 1". Fixed by disabling session resume and clearing session-state.json.

**Files Modified:**
- `ui/modules/sdk-renderer.js` - Content array handling, user message type
- `ui/modules/daemon-handlers.js` - Immediate message display
- `ui/renderer.js` - Pane targeting syntax
- `hivemind-sdk-v2.py` - Role cwd, disabled resume, bypassPermissions
- `session-state.json` - Cleared stale data

**Status:** All fixes applied. Requires app restart to test.

---

## SDK V2 PTY Bypass Fix (Round 2) - ✅ APPROVED (Jan 26, 2026)

**Problem:** User still saw "Claude running" badges and raw JSON in SDK mode after first fix.

**Root Cause:** Multiple code paths bypassed SDK mode check:
1. `checkAutoSpawn()` spawned Claude CLI regardless of SDK mode
2. `spawnClaude()` had no SDK mode guard
3. `freshStartAll()` could create PTY terminals in SDK mode
4. "Spawn All" button was visible in SDK mode
5. `terminal.setSDKMode()` not called from renderer

**ROUND 2 FIXES Applied (Lead - Jan 26):**

| File | Line | Change |
|------|------|--------|
| `ui/modules/settings.js` | ~147-151 | Added SDK mode check to `checkAutoSpawn()` |
| `ui/modules/settings.js` | ~76-80 | Hide "Spawn All" button when SDK mode enabled |
| `ui/modules/terminal.js` | ~24 | Added `sdkModeActive` module flag |
| `ui/modules/terminal.js` | ~553-557 | Added `setSDKMode(enabled)` function |
| `ui/modules/terminal.js` | ~560-564 | Added SDK guard to `spawnClaude()` |
| `ui/modules/terminal.js` | ~143-147 | Added SDK guard to `initTerminals()` |
| `ui/modules/terminal.js` | ~718-724 | Added SDK guard to `freshStartAll()` |
| `ui/renderer.js` | ~44 | Call `terminal.setSDKMode(true)` on settings load |

**Defense in Depth:** Multiple layers of SDK mode blocking:
- Layer 1: daemon-handlers skips PTY on daemon-connected (from Round 1)
- Layer 2: settings.js skips auto-spawn
- Layer 3: terminal.js blocks spawnClaude/initTerminals/freshStartAll
- Layer 4: UI hides spawn button
- Layer 5: terminal.js early terminal existence check (Worker A - Jan 26)
- Layer 6: ipc-handlers.js SDK guard on spawn-claude (Worker A - Jan 26)

**Additional Defense-in-Depth (Worker A - Jan 26):**
| File | Change |
|------|--------|
| `ui/modules/terminal.js:566-570` | Early check `!terminals.has(paneId)` before SDK guard |
| `ui/modules/ipc-handlers.js:109-113` | SDK mode guard in `spawn-claude` IPC handler |

**Status:** ✅ APPROVED FOR TESTING (see reviews/pty-bypass-fix-review.md) + defense-in-depth applied.

---

## SDK V2 Init Bug Fix (Round 1) - ✅ APPLIED (Jan 26, 2026)

**Problem:** Raw JSON appearing in xterm panes - PTY created before SDK mode detected.

**Root Cause:** Race condition - `daemon-connected` fired before settings loaded.

**Fixes Applied:**
- main.js: Added `sdkMode` flag to daemon-connected event
- daemon-handlers.js: Check data.sdkMode, skip PTY if true
- renderer.js: Set SDK mode flags on settings load, auto-init SDK panes

**Status:** Applied but insufficient - Round 2 fixes additional bypass paths.

---

## SDK V2 Migration - ✅ READY FOR TESTING

**Goal:** Replace PTY/keyboard hacks with 4 independent ClaudeSDKClient instances.

**Architecture:** 4 full Claude sessions (NOT subagents), each with own context window.

**Design Doc:** `workspace/build/sdk-architecture-v2.md`

### Final Verification Complete (Jan 25, 2026)

**Reviewer's Final Report:**
- Files verified: `hivemind-sdk-v2.py` (575 lines), `sdk-bridge.js` (636 lines)
- IPC Protocol: ALL 6 ASPECTS ALIGNED (command, pane_id, message, session_id, role, session format)
- Issues found: NONE
- Confidence: ✅ READY FOR TESTING

**Review Files:**
- `workspace/build/reviews/sdk-v2-audit-verification.md` - Audit fixes verified
- `workspace/build/reviews/sdk-v2-final-verification.md` - Protocol alignment verified

### Post-Audit Critical Fixes (Jan 25, 2026)

**User requested full audit before testing. Audit revealed critical bugs:**

| Issue | Status | Description |
|-------|--------|-------------|
| snake_case/camelCase mismatch | ✅ FIXED | Python sends `pane_id`, JS expected `paneId` - all routing broken |
| Missing `sdk-status-changed` | ✅ FIXED | UI status indicators never updated |
| Missing `sdk-message-delivered` | ✅ FIXED | No delivery confirmation in UI |
| `interrupt` command missing | ✅ FIXED | Added to Python IPC handler |
| Session file format mismatch | ✅ FIXED | Aligned JS to Python's nested format |
| Race condition on startup | ⚠️ OPEN | Messages may queue before Python ready |

**Fixes Applied by Lead:**
1. `sdk-bridge.js`: Check both `msg.pane_id` AND `msg.paneId`, same for `session_id`/`sessionId`, `role`/`agent`
2. `sdk-bridge.js`: Added `sdk-status-changed` emissions in 5 locations
3. `sdk-bridge.js`: Added `sdk-message-delivered` emission in sendMessage()
4. `sdk-bridge.js`: Session state now uses nested `{ sdk_sessions: {...} }` format
5. `hivemind-sdk-v2.py`: Added `interrupt` command handler + `interrupt_agent()` method

**Process Failure Noted:** Reviewer approved without integration review. Updated CLAUDE.md with mandatory integration review requirements.

### Phase 1 Tasks

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Create hivemind-sdk-v2.py | Lead | ✅ COMPLETE |
| 2 | Update sdk-bridge.js for multi-session | Worker B | ✅ COMPLETE |
| 3 | Add session status indicators to UI | Worker A | ✅ COMPLETE |
| 4 | Review SDK V2 architecture | Reviewer | ✅ COMPLETE |

### Review Summary (Task #4)

**File:** `workspace/build/reviews/sdk-v2-architecture-review.md`
**Verdict:** ✅ APPROVED with recommendations

**Reviewer Recommendations:**
1. Verify ClaudeSDKClient API with minimal test before full integration
2. Confirm `setting_sources=["project"]` loads CLAUDE.md
3. Implement `can_use_tool` path restrictions for security

---

## SDK V2 Migration - Phase 2 Tasks ✅ COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| 5 | Replace PTY input with SDK calls | Lead | ✅ COMPLETE |
| 6 | Trigger integration (file → SDK) | Worker B | ✅ COMPLETE |
| 7 | Session persistence + resume | Lead | ✅ COMPLETE |
| 8 | Full verification | Reviewer | ✅ APPROVED |
| 9 | Protocol alignment fixes | Lead | ✅ COMPLETE |

### Final Review (Task #8)

**File:** `workspace/build/reviews/sdk-v2-final-verification.md`
**Verdict:** ✅ APPROVED FOR TESTING

**Reviewer Notes:**
- All protocol fixes verified
- Minor: `interrupt` command not yet handled in Python (non-critical)
- Ready for end-to-end testing once `claude-agent-sdk` is installed

### Completed: Task #9 - Protocol Alignment Fixes (Lead)

**Issue:** Reviewer identified protocol mismatches between JavaScript and Python.

**Fixes Applied:**

| Issue | Before | After | File |
|-------|--------|-------|------|
| Command key | `action: 'send'` | `command: 'send'` | sdk-bridge.js |
| Pane ID key | `paneId` | `pane_id` | sdk-bridge.js |
| Session ID key | `sessionId` | `session_id` | sdk-bridge.js |
| Stop command | `action: 'stop-sessions'` | `command: 'stop'` | sdk-bridge.js |
| Interrupt key | `action: 'interrupt'` | `command: 'interrupt'` | sdk-bridge.js |
| IPC flag | Missing | `--ipc` added | sdk-bridge.js |
| Session file path | `/ui/session-state.json` | `/session-state.json` | hivemind-sdk-v2.py |

**Details:**
- `sendMessage()` - Uses Python's expected keys (`command`, `pane_id`, `session_id`)
- `stopSessions()` - Uses `command: 'stop'`
- `interrupt()` - Uses `command: 'interrupt'`, `pane_id`
- `startProcess()` - Spawns with `--ipc` flag for JSON protocol
- Python session file - Aligned to project root (same as JS)

**Status:** ✅ All protocol mismatches fixed. Ready for final testing.

---

### Completed: Task #5 - PTY to SDK Routing (Lead)

**Changes Made:**
1. `ui/modules/ipc-handlers.js` - Updated `sdk-broadcast` to use V2 `broadcast()` method
2. `ui/modules/triggers.js` - Updated `sendStaggered()` to route via SDK when enabled
3. `ui/main.js` - Connected SDK bridge to triggers, added SDK mode toggle on settings change

**Flow:**
- When `sdkMode` setting is true: Messages route through `sdkBridge.sendMessage(paneId, message)`
- When `sdkMode` is false: Legacy PTY/keyboard injection via `inject-message` IPC

**Key Integration Points:**
- `triggers.setSDKBridge(sdkBridge)` - Called on app start
- `triggers.setSDKMode(enabled)` - Called when settings change
- `sendStaggered()` - Central routing function, checks SDK mode first

### Completed: Task #1 - hivemind-sdk-v2.py (Lead)

**File:** `hivemind-sdk-v2.py`

**Features:**
- `HivemindAgent` class - single persistent ClaudeSDKClient per agent
- `HivemindManager` class - manages all 4 agents
- Session persistence via `session-state.json`
- IPC protocol (JSON over stdin/stdout) for Electron
- `setting_sources=["project"]` for CLAUDE.md loading
- CLI mode for testing, IPC mode for Electron integration

**API:**
```python
# Each agent is a full Claude instance
agents = {
    '1': HivemindAgent(AgentConfig.lead(), workspace),
    '2': HivemindAgent(AgentConfig.worker_a(), workspace),
    '3': HivemindAgent(AgentConfig.worker_b(), workspace),
    '4': HivemindAgent(AgentConfig.reviewer(), workspace),
}
```

**Why NOT subagents:**
- Subagents share/inherit context = less total context
- Full instances compact independently = more context capacity
- Each agent "sees everything in their domain" vs "hyperfocused summaries"

### Completed: Task #2 - sdk-bridge.js multi-session (Worker B)

**Files Modified:**
- `ui/modules/sdk-bridge.js` - Complete V2 rewrite for 4 independent sessions
- `ui/modules/ipc-handlers.js` - Added 8 new V2 IPC handlers

**New IPC Handlers:**
- `sdk-send-message(paneId, message)` - Send to specific agent
- `sdk-subscribe/unsubscribe(paneId)` - Control streaming subscription
- `sdk-get-session-ids` - Get all session IDs for persistence
- `sdk-start-sessions(options)` - Initialize all 4 agents
- `sdk-stop-sessions` - Graceful shutdown with session ID capture
- `sdk-pane-status(paneId)` - Get agent status
- `sdk-interrupt(paneId)` - Interrupt specific agent

**Session Persistence:** `session-state.json` loaded on startup, saved on stop.

**JSON Protocol:** Commands sent to Python via stdin, responses via stdout.

### Completed: Task #3 - SDK Session Status Indicators (Worker A)

**Files Modified:**
- `ui/index.html` - CSS for SDK status states + HTML elements in pane headers
- `ui/renderer.js` - Status update functions + IPC listeners

**Features:**
1. Status states: disconnected, connected, idle, thinking, responding, error
2. Visual indicator: Animated dot badge in each pane header
3. Message delivered: Flash animation confirms SDK receipt
4. Session ID: Hidden by default, visible in debug mode

**IPC Listeners Added:**
- `sdk-status-changed` - Updates pane status indicator
- `sdk-message-delivered` - Triggers delivery confirmation flash

**Status:** ✅ COMPLETE - Blocked until sdk-bridge.js (Task #2) is ready.

---

## UI Layout Redesign - ✅ COMPLETE (Lead)

**Goal:** Lead-focused layout - user only interacts with Lead, workers are monitoring-only.

### Changes Made
1. **Layout**: Lead takes full left side (65%), workers stacked on right (35%)
2. **Input**: Changed from "broadcast to all" to "message to Lead only"
3. **Expand buttons**: Worker panes have expand/collapse toggle
4. **Removed keyboard shortcuts from worker headers** (Ctrl+1-4 still works)

### Files Modified
- `ui/index.html` - New grid CSS, restructured pane HTML, expand buttons
- `ui/renderer.js` - Added toggleExpandPane(), expand button handlers
- `ui/modules/terminal.js` - broadcast() now sends only to Lead (pane 1)

### New Layout
```
┌───────────────────┬──────────────┐
│                   │  Worker A [⤢] │
│                   ├──────────────┤
│      Lead         │  Worker B [⤢] │
│    (Main Pane)    ├──────────────┤
│                   │  Reviewer [⤢] │
└───────────────────┴──────────────┘
     [Message to Lead input]
```

**Status:** Requires app restart to test.

---

## SDK Migration Sprint - ⏸️ PAUSED (Lead)

**Goal:** Integrate SDK mode into Electron app as user-selectable option.

### Task #1: SDK Bridge Startup Integration - ✅ COMPLETE (Lead)
- Added `sdkMode` to DEFAULT_SETTINGS in main.js
- SDK bridge already initialized via ipc-handlers.js
- Broadcast routing now checks sdkMode and routes through SDK or PTY

### Task #2: SDK Mode Toggle UI - ✅ COMPLETE (Lead)
- Added toggle switch in Settings panel (index.html)
- Added sdkModeNotice indicator
- Updated settings.js to show/hide SDK mode notice

### Task #3: Test SDK Broadcast - ⏳ PENDING
Requires manual testing with SDK mode enabled.

### Task #4: Test SDK Subagent Delegation - ⏳ PENDING
Blocked by Task #3.

**Files Modified:**
- `ui/main.js` - Added sdkMode to DEFAULT_SETTINGS
- `ui/index.html` - Added SDK mode toggle and notice
- `ui/modules/settings.js` - Added sdkModeNotice visibility handling
- `ui/renderer.js` - Added sendBroadcast() helper with SDK/PTY routing

---

## SDK Prototype Sprint - ✅ COMPLETE (Acceptance Test Passed)

### Task #1: SDK Backend Integration - ✅ COMPLETE (Worker B)
- `hivemind-sdk.py` - SDK orchestrator with subagent definitions
- Installed claude-agent-sdk
- Verified query() API works

### Task #3: Multi-Agent Coordination - ✅ COMPLETE (Lead)
- `ui/modules/sdk-bridge.js` - Electron ↔ SDK bridge
- IPC handlers: sdk-start, sdk-stop, sdk-write, sdk-status, sdk-broadcast
- Spawn/manage Python SDK process from Electron

### Task #4: Validation - ✅ COMPLETE (Reviewer)
Conditional pass - SDK prototype works, Windows encoding fixed.

---

### Task #2: SDK Message UI Renderer - ✅ COMPLETE (Worker A)

**Goal:** Replace xterm.js terminals with SDK message display for Agent SDK integration.

**Files Created/Modified:**
- `ui/modules/sdk-renderer.js` - NEW (~260 lines)
  - initSDKPane(), initAllSDKPanes() - pane initialization
  - appendMessage(), formatMessage() - message display with type-specific styling
  - streamingIndicator() - thinking animation
  - clearPane(), scrollToBottom() - pane control
  - getSessionId() - session management for resume

- `ui/index.html` - Added SDK CSS (~130 lines)
  - .sdk-assistant, .sdk-tool-use, .sdk-tool-result, .sdk-system, .sdk-error
  - Collapsible tool results, streaming animation

- `ui/renderer.js` - Added SDK integration
  - Import sdk-renderer module
  - window.hivemind.sdk API (start, stop, enableMode, disableMode)
  - IPC handlers: sdk-message, sdk-streaming, sdk-session-start, sdk-session-end, sdk-error

**Status:** ✅ COMPLETE - Ready for integration test with Lead's coordinator.

---

## ID-1: Session Identity Injection - ✅ FIXED (Worker B)

**Problem:** When using `/resume` in Claude Code, sessions are hard to identify. All 4 agent sessions look the same - no way to tell Lead from Worker B.

**Original Bug:** Identity message was written directly to PTY via daemon, but V16 proved PTY writes don't properly submit to Claude. Message appeared but wasn't processed.

**Solution (v2):** Moved identity injection from daemon to renderer, using `sendToPane()` which properly dispatches keyboard events.

1. **Shell Banner (on spawn):** Still works - daemon echoes role banner to terminal
2. **Claude Identity (4s after `spawn-claude`):** Now uses `sendToPane()` in renderer:
   ```
   [HIVEMIND SESSION: Worker B] Started 2026-01-25
   ```
   This shows up in `/resume` session list AND is submitted to Claude.

**Files Changed (v2 fix):**
- `ui/modules/ipc-handlers.js`:
  - REMOVED daemon identity injection (was line 129-137)
  - Added comment noting fix moved to renderer
- `ui/modules/terminal.js`:
  - Added `PANE_ROLES` constant
  - Added identity injection in `spawnClaude()` using `sendToPane()`

**Why This Works:** `sendToPane()` uses keyboard events with `_hivemindBypass` marker, same as working trigger system.

**Status:** ✅ FIXED - Requires app restart to test.

---

## V18.2: Auto-Nudge False Positive Fix - ✅ FIXED (Worker B)

**Problem:** Auto-nudge was detecting stuck agents and sending `(AGGRESSIVE_NUDGE)`, but then immediately marking them as "responded" because the nudge itself updated `lastInputTime`.

**Root Cause:** `hasAgentResponded()` checked if `lastInputTime > lastNudgeTime`, but the nudge process (ESC + 150ms delay + Enter) itself writes to PTY, updating `lastInputTime`. The daemon thought the agent responded when it was actually just seeing its own nudge.

**Fix:** Added 500ms grace period. Agent only counts as "responded" if input came AFTER `lastNudgeTime + 500ms`:
```javascript
const NUDGE_GRACE_PERIOD_MS = 500;
const nudgeCompleteTime = state.lastNudgeTime + NUDGE_GRACE_PERIOD_MS;
return lastInput > nudgeCompleteTime;
```

**File Changed:** `ui/terminal-daemon.js` - `hasAgentResponded()` function

**Status:** ✅ FIXED - Requires app restart to test.

---

## FX4-v7: Ghost Text Bug Fix - ✅ FIXED (Worker A)

**Problem:** Ghost text appearing in terminals after broadcasts. Phantom interrupts happening without user action.

**Root Cause:** 50ms delay in `doSendToPane()` between PTY write and Enter dispatch allows Claude Code to show autocomplete/ghost text suggestions. Our Enter event then submits BOTH the intended text AND the ghost text.

**Fix (v7):** Dispatch ESC, wait 20ms for state to settle, re-focus, then Enter:
```javascript
// FX4-v7: ESC to dismiss ghost text, delay, then Enter
textarea.dispatchEvent(escEvent);
setTimeout(() => {
  textarea.focus();  // Re-focus after ESC
  textarea.dispatchEvent(enterEvent);
}, 20);
```

**File Changed:** `ui/modules/terminal.js`

**Versions:**
- v6: ESC before Enter (broke message delivery - no delay)
- v7: ESC → 20ms delay → re-focus → Enter (CURRENT)

**Status:** ✅ FIXED - Requires app restart to test.

---

## D2: Dry-Run Mode Bug Fix - ✅ FIXED (Worker A)

**Problem:** Dry-run mode was "100% non-functional" per Reviewer report. Toggling dryRun in settings had no effect.

**Root Cause:** `main.js:169` - `saveSettings()` was reassigning `currentSettings` to a new object:
```javascript
currentSettings = { ...currentSettings, ...settings };
```
This broke the reference held by `ipc-handlers.js`. The old reference still saw `dryRun: false` even after user toggled it on.

**Fix:** Changed to `Object.assign()` to mutate the existing object (preserves reference):
```javascript
Object.assign(currentSettings, settings);
```

**File Changed:** `ui/main.js` line 169

**Status:** ✅ FIXED - Requires app restart to test. Ready for Reviewer verification.

---

## V18: Auto-Aggressive-Nudge - ✅ SHIPPED

**Owner:** Worker B
**File:** `ui/terminal-daemon.js`

**Problem:** When agents get stuck, manual intervention was needed. FIX3 added aggressive nudge capability, but it required Lead or user to trigger it manually.

**Solution:** Daemon auto-detects stuck agents and sends `(AGGRESSIVE_NUDGE)` automatically.

**Escalation Flow:**
1. Heartbeat tick detects agent stuck (>60s idle)
2. Auto-send `(AGGRESSIVE_NUDGE)` to agent's trigger file
3. Wait 30 seconds
4. If still stuck, nudge again
5. After 2 failed nudges, alert user via UI + trigger

**New Functions:**
- `sendAggressiveNudge(paneId)` - sends nudge to specific agent
- `checkAndNudgeStuckAgents()` - runs on every heartbeat tick
- `hasAgentResponded(paneId)` - checks if agent recovered
- `alertUserAboutAgent(paneId)` - final escalation

**New Protocol Actions:**
- `nudge-agent` - manually nudge specific agent
- `nudge-status` - get current nudge state for all agents
- `nudge-reset` - reset nudge tracking

**Status:** ✅ SHIPPED - Reviewer verified (see `workspace/build/reviews/v18-auto-nudge-verification.md`)

**V18.1 BUG FIX (Jan 25):** Stuck detection not triggering because `lastActivity` was updated by PTY output (including thinking animation). Fixed by adding `lastInputTime` to track user INPUT instead of agent output. Requires restart to test.

---

## Stuck Issue Fixes (External Claude Recommendations) - ✅ VERIFIED

**Issue:** Claude Code instances getting stuck - known bug (GitHub #13224, #13188)

**Stress Test Round 2 Results (Jan 25, 2026):**
- 3 agents (Worker A, Worker B, Reviewer) got stuck mid-test
- Lead recovered ALL 3 using aggressive nudge (FIX3)
- No bunching, correct message ordering, no focus stealing
- Full report: `workspace/build/reviews/stress-test-round2-verification.md`

**Fixes Applied:**

| Fix | Status | Description |
|-----|--------|-------------|
| FIX1 | ✅ APPLIED | AUTOCOMPACT_PCT_OVERRIDE=70 in settings.json |
| FIX2 | ✅ VERIFIED | Stagger agent activity in triggers.js (avoid thundering herd) |
| FIX3 | ✅ VERIFIED | Aggressive nudge (ESC + Enter) - recovered 3 stuck agents in test |
| FIX4 | ⏸️ DEFERRED | Circuit breaker pattern (bigger code change) |
| FIX5 | ✅ VERIFIED | Focus steal prevention - save/restore user focus during message injection |

### FIX3 Details (Aggressive Nudge)

**Files Changed:**
- `ui/modules/terminal.js` - Added `aggressiveNudge()` and `aggressiveNudgeAll()` functions
- `ui/renderer.js` - Updated Nudge All button + watchdog-alert auto-nudge
- `ui/modules/daemon-handlers.js` - Added `(AGGRESSIVE_NUDGE)` command support

**Behavior:**
- Nudge All button now sends ESC + Enter (more forceful)
- Watchdog alert auto-triggers aggressive nudge on all panes
- New `(AGGRESSIVE_NUDGE)` trigger command available

### FIX5 Details (Focus Steal Prevention)

**Problem:** When messages were injected into terminals via `doSendToPane()`, focus was stolen from the broadcast input, making it hard for users to type while agents were active.

**Solution:** Save user's focus before terminal injection, restore after completion.

**File Changed:** `ui/modules/terminal.js`
- Save `document.activeElement` before focusing terminal textarea
- Detect if user was in UI input (not xterm textarea)
- Restore focus after message injection completes (all 3 code paths)

**Requires restart to test.**

---

## V17: Adaptive Heartbeat - ✅ SHIPPED

**Proposal:** #11 from improvements.md
**Owner:** Worker B
**Co-author:** Worker A
**Votes:** 4/4 UNANIMOUS (Lead's earlier YES finally delivered)
**Reviewer:** FORMAL APPROVAL - All checks passed
**Stress Test:** PASS - Verified in round 2 stress test (Jan 25, 2026)

### Task Breakdown

| Task | Status | Description |
|------|--------|-------------|
| HB-A1 | ✅ DONE | Add `getHeartbeatInterval()` to terminal-daemon.js |
| HB-A2 | ✅ DONE | Check status.md mtime for staleness detection |
| HB-A3 | ✅ DONE | Check shared_context.md for pending tasks |
| HB-A4 | ✅ DONE | Add "recovering" state (45sec grace period) |
| HB-A5 | ⏸️ DEFERRED | Make intervals configurable in settings (can add later) |
| HB-A6 | ✅ DONE | Fallback if status.md missing (default to "active") |
| HB-A7 | ✅ DONE | Event forwarding: daemon → client → main → renderer |
| HB-UI | ✅ DONE | Heartbeat mode indicator in status bar (Worker A) |
| R1 | ✅ PASSED | Worker A sanity check |
| R2 | ✅ APPROVED | Reviewer formal verification |

### Files Changed

| File | Changes |
|------|---------|
| `ui/terminal-daemon.js` | Added adaptive heartbeat logic, state detection, dynamic timer |
| `ui/daemon-client.js` | Added event handlers for heartbeat-state-changed |
| `ui/main.js` | Added forwarding to renderer via IPC |

### Intervals (Agreed)

| State | Interval | Trigger |
|-------|----------|---------|
| Idle | 10 min | No pending tasks |
| Active | 2 min | Tasks in progress |
| Overdue | 1 min | Task stale (>5 min since status.md update) |
| Recovering | 45 sec | After stuck detection, before escalation |

### IPC Events (New)

- `heartbeat-state-changed` → { state, interval } for UI indicator

---

## V16.11: Trigger System Fix - ✅ SHIPPED

**Problem:** Agents getting stuck and interrupted during trigger-based communication.

**Root Causes Found & Fixed:**
1. ESC spam in trigger injection (V16)
2. Hidden ESC in auto-unstick timer (V16.3)
3. xterm.paste() buffering issues (V16.1-V16.9)
4. Missing auto-refocus after message injection (V16.11)

**Final Solution:** Keyboard events + bypass marker + auto-refocus

**Versions Tested:**
| Version | Approach | Result |
|---------|----------|--------|
| V16 | Remove ESC spam | Fixed interrupts |
| V16.1 | xterm.paste instead of pty.write | Partial |
| V16.2 | Idle detection (2000ms) | Partial |
| V16.3 | Remove hidden ESC in auto-unstick | Improved |
| V16.4-V16.9 | Various timing/buffering attempts | Partial |
| V16.10 | Keyboard events + bypass marker | Almost |
| V16.11 | Auto-refocus after injection | ✅ SUCCESS |

**User Verified:** NO manual unsticking needed! All 4 agents processing automatically.

**Key Lessons Learned:**
1. PTY ESC ≠ Keyboard ESC (kills vs dismisses)
2. xterm.paste() buffers differently than keystrokes
3. Timing delays alone don't fix buffering
4. Auto-refocus ensures Claude sees the input

---

## V16.3: Auto-Unstick ESC Bug Fix - ✅ MERGED INTO V16.11

---

## V13: Autonomous Operation - ✅ SHIPPED

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| HB1 | Worker B | ✅ DONE | Heartbeat timer (5 min interval) |
| HB2 | Worker B | ✅ DONE | Lead response tracking (15s timeout) |
| HB3 | Worker B | ✅ DONE | Worker fallback (after 2 failed nudges) |
| HB4 | Worker A+B | ✅ DONE | User alert notification |
| HB5 | Lead | ✅ DONE | Heartbeat response logic |
| R1 | Reviewer | ✅ DONE | Verification - PARTIAL PASS |
| BUG1 | Worker B | ✅ FIXED | Heartbeat timer not firing |
| BUG2 | Lead | ✅ FIXED | False positive response detection |

### R1 Verification Summary

**Result:** PARTIAL PASS - Core flow works, fallbacks untested

- Heartbeat fires every 5 minutes ✅
- Lead responds within timeout ✅
- Fallback to workers: NOT TRIGGERED (Lead responsive)
- User alert: NOT TRIGGERED (no escalation needed)

**Full report:** `workspace/build/reviews/v13-verification.md`

---

## V12: Stability & Robustness - ✅ SHIPPED

| Task | Owner | Status | Commit | Description |
|------|-------|--------|--------|-------------|
| FX1 | Worker A | ✅ DONE | `fa2c8aa` | ESC key interrupt |
| FX2 | Worker B | ✅ DONE | `8301e7f` | Session persistence |
| FX3 | Lead | ✅ DONE | (in triggers.js) | Workflow gate unblock |
| FX4 | Worker A | ✅ DONE | (pending commit) | Ghost text fix v2 - ESC dismiss + isTrusted + debounce |
| FX5 | Worker A | ✅ DONE | (pending commit) | Re-enable broadcast Enter key (was over-blocked) |
| BUG2 | Lead | ✅ FIXED | (pending commit) | V13 watchdog - thinking animation counted as activity |

### FX2: Session Persistence (Worker B) - ✅ DONE

**Commit:** `8301e7f`

**Changes:**
- Save session state to disk (scrollback, cwd, terminal info)
- Load session state on daemon start
- Periodic auto-save every 30 seconds
- Save on shutdown (SIGINT, SIGTERM)
- Protocol: `get-session`, `save-session`, `clear-session`
- Client: `getSession()`, `saveSession()`, `clearSession()`

**Files:** ui/terminal-daemon.js, ui/daemon-client.js

---

## CRITICAL: ESC Key Fix - ✅ IMPLEMENTED (Pending Restart)

**Issue:** ESC key stopped working - xterm.js was capturing all keyboard input, preventing users from interrupting stuck agents. All agents (Lead, Worker A, Worker B) became stuck and unresponsive. Only Reviewer remained active.

**Root Cause:** xterm terminals capture keyboard focus and don't release it, blocking ESC from reaching the app's interrupt handlers.

**Fix (Reviewer - Emergency):**
1. **main.js:446-453** - Added `before-input-event` handler to intercept ESC at Electron main process level BEFORE xterm sees it
2. **renderer.js:199-214** - Added `global-escape-pressed` IPC listener that:
   - Blurs all terminals via `terminal.blurAllTerminals()`
   - Blurs any focused element
   - Shows visual feedback: "ESC pressed - keyboard released"

**Status:** Code committed. Requires app restart to test.

---

## Post-V11: Autocomplete Bug Fix - ✅ COMMITTED

**Commit:** `0ba5cb7`

**Issue:** Autocomplete suggestions were auto-submitted to agent terminals without user confirmation. Happened 3+ times in testing session.

**Fix (Worker A + Worker B collaboration):**
- Added `autocomplete="off"` and related attributes to all inputs
- Made broadcast keydown handler defensive (check !isComposing, trim, block empty)
- Added `blurAllTerminals()` function to release xterm keyboard capture
- Blur terminals when any input/textarea gets focus

**Files:** ui/index.html, ui/renderer.js, ui/modules/terminal.js

---

## V11: MCP Integration - ✅ SHIPPED

**Commit:** `c4b841a` (+ fix `c567726`)

**Goal:** Replace file-based triggers with Model Context Protocol for structured agent communication.

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

---

## V10: Messaging System Improvements - ✅ SHIPPED

**Commit:** `6d95f20`

**Goal:** Make agent-to-agent messaging robust and production-ready.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MQ1 | Lead | ✅ DONE | Message queue backend - JSON array with append |
| MQ2 | Lead | ✅ DONE | Delivery confirmation IPC events |
| MQ3 | Worker A | ✅ DONE | Message history UI panel |
| MQ4 | Worker B | ✅ DONE | Message queue file watcher integration |
| MQ5 | Worker B | ✅ DONE | Gate bypass for direct messages |
| MQ6 | Worker A | ✅ DONE | Group messaging UI (workers only, custom) |
| R1 | Reviewer | ✅ DONE | Verify all messaging features |

### Worker A Completion Notes (MQ3 + MQ6)

**Files modified:**
- `ui/index.html` - Added CSS and HTML for Messages tab
- `ui/modules/tabs.js` - Added JavaScript for message display and composer
- `ui/renderer.js` - Added setup call for Messages tab

**MQ3: Message History UI:**
- New "Messages" tab in right panel
- Shows conversation history with from/to/time/content
- Filter buttons: All, Lead, Worker A, Worker B, Reviewer
- Delivery status indicators (✓ Delivered / ⏳ Pending)
- Auto-scroll to newest messages

**MQ6: Group Messaging UI:**
- Message composer with recipient selection
- Individual recipients: Lead, Worker A, Worker B, Reviewer
- Group recipients: Workers Only, All Agents
- Multi-select support for custom groups
- Enter to send, Shift+Enter for newline

**IPC handlers expected from Lead (MQ1+MQ2):**
- `get-message-history` - Returns message array
- `clear-message-history` - Clears all messages
- `send-group-message` - Sends to selected recipients
- `message-received` event - When new message arrives
- `message-delivered` event - When delivery confirmed

**Handoff to Lead:** MQ1+MQ2 - Backend handlers needed for full functionality.

---

## V9: Documentation & Polish - ✅ SHIPPED

Commit: `ac4e13c` - All 7 tasks complete.

---

## V8: Testing & Automation - ✅ SHIPPED

Commit: `4e8d7c3` - All tasks complete.

---

## V7: Quality & Observability - ✅ SHIPPED

Commit: `1df828b` - All 7 tasks complete.

---

## V6: Smart Automation - ✅ SHIPPED

**Goal:** Intelligent task routing and automated coordination.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| SR1 | Lead | ✅ DONE | Smart routing algorithm |
| SR2 | Lead | ✅ DONE | Routing IPC handlers |
| AH1 | Lead | ✅ DONE | Auto-handoff logic |
| AH2 | Worker A | ✅ DONE | Handoff notification UI |
| CR1 | Worker B | ✅ DONE | Conflict queue system |
| CR2 | Worker A | ✅ DONE | Conflict resolution UI |
| LM1 | Worker B | ✅ DONE | Learning data persistence |
| R1 | Reviewer | 🔄 ACTIVE | Verify all V6 features |

**All implementation complete.** Awaiting Reviewer verification (R1).

---

## V5: Multi-Project & Performance - ✅ SHIPPED

Commit: `da593b1` - All tasks complete.

---

## V4: Self-Healing & Autonomy - ✅ SHIPPED

Commit: `f4e9453` - All 8 tasks complete.

---

## V3: Developer Experience - ✅ COMPLETE

**Goal:** Testing workflow, session history, project management

| Sprint | Focus | Status |
|--------|-------|--------|
| 3.1 | Dry-Run Mode | ✅ COMPLETE |
| 3.2 | History + Projects Tabs | ✅ COMPLETE |
| 3.3 | Polish & Verification | ✅ COMPLETE |

### Sprint 3.1: Dry-Run Mode ✅ COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker A | ✅ DONE | Settings toggle + header indicator |
| D2 | Worker B | ✅ DONE | Daemon dry-run mode (mock terminals) |

### Sprint 3.2: History & Projects ✅ COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| H1 | Worker A | ✅ DONE | Session History tab UI |
| H2 | Worker B | ✅ DONE | Session History data + IPC handler |
| J1 | Worker A | ✅ DONE | Projects tab UI |
| J2 | Worker B | ✅ DONE | Recent projects backend + IPC handlers |

#### Worker B Completion Notes (H2 + J2)

**Files modified:**
- `ui/modules/ipc-handlers.js` - Added 6 new IPC handlers
- `ui/main.js` - Added `recentProjects` to DEFAULT_SETTINGS

**H2: Session History IPC:**
- `get-session-history` - Returns enhanced history data with role names, formatted durations

**J2: Recent Projects IPC:**
- `get-recent-projects` - List recent projects (validates existence)
- `add-recent-project` - Add to list (max 10, dedupes)
- `remove-recent-project` - Remove specific project
- `clear-recent-projects` - Clear all
- `switch-project` - Switch + add to recent list

**Integration:**
- `select-project` now auto-adds to recent projects

**Handoff to Worker A (H1 + J1):**
Backend APIs are ready. See `workspace/checkpoint.md` for API reference.

#### Worker A Completion Notes (H1 + J1)

**Files modified:**
- `ui/index.html` - Added tab HTML structure + CSS styles
- `ui/modules/tabs.js` - Added UI logic and IPC integration
- `ui/renderer.js` - Wired up setup functions

**H1: Session History UI:**
- Tab pane with list container (`historyList`)
- Refresh button (`refreshHistoryBtn`)
- CSS: `.history-list`, `.history-item`, `.history-item-header`, `.history-item-agent`, `.history-item-duration`, `.history-item-time`, `.history-empty`
- Functions: `setupHistoryTab()`, `loadSessionHistory()`, `renderHistoryList()`, `formatHistoryTime()`, `formatDuration()`
- Uses `get-usage-stats` IPC (returns `recentSessions`)

**J1: Projects UI:**
- Tab pane with list container (`projectsList`)
- Add Project button (`addProjectBtn`) + Refresh button (`refreshProjectsBtn`)
- CSS: `.projects-list`, `.project-item`, `.project-item-info`, `.project-item-name`, `.project-item-path`, `.project-item-remove`, `.projects-empty`
- Functions: `setupProjectsTab()`, `loadRecentProjects()`, `renderProjectsList()`, `addCurrentProject()`, `getProjectName()`
- Uses `get-recent-projects`, `switch-project`, `remove-recent-project` IPC handlers
- Listens for `project-changed` event

**Note:** Implementation was completed in a previous session but status.md was not updated.

#### Worker B Completion Notes (D2)

**Files modified:**
- `ui/terminal-daemon.js` - Added dry-run mode support
- `ui/daemon-client.js` - Updated spawn() to accept dryRun flag

**Changes to terminal-daemon.js:**
- Added `DRY_RUN_RESPONSES` array with mock Claude responses
- Added `sendMockData()` function for simulated typing effect
- Added `generateMockResponse()` function to create context-aware mock responses
- Updated `spawnTerminal()` to accept `dryRun` flag
  - When dryRun=true: creates mock terminal (no real PTY spawned)
  - Shows welcome message with role and working dir
  - Fake PID: 90000 + paneId
- Updated `writeTerminal()` to handle dry-run mode
  - Echoes input, buffers until Enter
  - Generates mock response on Enter
- Updated `killTerminal()` to handle dry-run terminals
- Updated `listTerminals()` to include dryRun flag
- Imported `PANE_ROLES` from config for welcome message

**Changes to daemon-client.js:**
- Updated `spawn(paneId, cwd, dryRun)` to accept dryRun parameter
- Updated `spawned` event handler to capture dryRun flag

**Protocol extension:**
- spawn action: `{ action: "spawn", paneId, cwd, dryRun: true/false }`
- spawned event: `{ event: "spawned", paneId, pid, dryRun: true/false }`

**Handoff to Worker A (D1):**
- Settings toggle needs to pass dryRun flag when calling `window.hivemind.pty.create()`
- main.js needs to forward dryRun from settings to daemon spawn call
- Header indicator should show when dry-run is active

See `workspace/shared_context.md` for full task breakdown.

---

## V2 COMPLETE 🎉

## Sprint 2.3: Polish ✅ COMPLETE (Jan 24, 2026)

**Final sprint of V2 - All features verified by Reviewer**

| Task | Owner | Feature | Status |
|------|-------|---------|--------|
| D1 | Worker B | Daemon logging to file | ✅ |
| D2 | Worker B | Health check endpoint | ✅ |
| D3 | Worker B | Graceful shutdown | ✅ |
| U1 | Worker A | Scrollback persistence | ✅ |
| U2 | Worker A | Visual flash on trigger | ✅ |
| U3 | Lead | Kill All button | ✅ |
| U4 | Lead | Others triggers | ✅ |
| P1 | Reviewer | Final verification | ✅ |

---

## Sprint 2.2: Modularize ✅ COMPLETE (Jan 24, 2026)

Renderer.js: 1635→185 lines (89%↓), main.js: 1401→343 lines (76%↓)

---

## Sprint 2.1: Test Suite ✅ COMPLETE (Jan 24, 2026)

**Goal:** Add test suite (was at 0 tests)
**Result:** 86+ tests passing

| File | Owner | Tests | Status |
|------|-------|-------|--------|
| config.test.js | Worker A | ~20 | ✅ |
| protocol.test.js | Worker A | ~25 | ✅ |
| daemon.test.js | Worker B | 28 | ✅ |
| triggers.test.js | Worker B | 24 | ✅ |

**Bonus:** Lead created shared `ui/config.js` consolidating constants.

**Verified by:** Claude-Reviewer

---

## Cleanup Sprint: ✅ COMPLETE (Jan 24, 2026)

**All cleanup tasks verified by Reviewer:**
- Worker A: A1-A4 code fixes ✅
- Worker B: B1-B4 file cleanup ✅
- Reviewer: R1-R3 verification ✅

**V1 STATUS: APPROVED FOR RELEASE**

See: `workspace/build/cleanup-sprint.md` for details

---

## Chain Test: ✅ SUCCESS (Jan 24, 2026)

Agent-to-agent autonomous triggering verified:
- Lead triggered → Worker A responded → Worker B responded → Reviewer completed chain
- See: `workspace/build/chain-test.md`

---

## SPRINT #2: Terminal Daemon Architecture ✅ COMPLETE

**Goal:** Separate PTY management into daemon process so terminals survive app restarts.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker B | ✅ VERIFIED | Create `terminal-daemon.js` |
| D2 | Worker B | ✅ VERIFIED | Create `daemon-client.js` |
| D3 | Worker B | ✅ VERIFIED | Add daemon scripts to package.json |
| D4 | Lead | ✅ VERIFIED | Refactor `main.js` to use daemon |
| D5 | Worker A | ✅ VERIFIED | Update renderer for reconnection UI |
| D6 | Reviewer | ✅ DONE | Verify daemon survives app restart |

**Verification:** See `workspace/build/reviews/daemon-verification.md`

### Worker B Completion Notes (D1-D3)

**Files created:**
- `ui/terminal-daemon.js` - Standalone daemon process (280 lines)
  - Named pipe server at `\\.\pipe\hivemind-terminal`
  - Manages PTY processes in Map by paneId
  - Broadcasts output to all connected clients
  - Handles: spawn, write, resize, kill, list, attach, shutdown
  - Writes PID to `daemon.pid` for process management
  - Graceful shutdown on SIGINT/SIGTERM

- `ui/daemon-client.js` - Client library (320 lines)
  - EventEmitter-based for easy integration
  - Auto-spawns daemon if not running
  - Auto-reconnects on disconnect (5 retries)
  - Caches terminal state locally
  - Singleton pattern via `getDaemonClient()`

**Scripts added to package.json:**
- `npm run daemon:start` - Start daemon manually
- `npm run daemon:stop` - Stop daemon gracefully
- `npm run daemon:status` - Check if daemon is running

**Protocol implemented per spec:**
- Client → Daemon: spawn, write, resize, kill, list, attach, ping, shutdown
- Daemon → Client: data, exit, spawned, list, attached, killed, error, connected, pong

### Lead Completion Notes (D4)

**Changes to `ui/main.js`:**
- Removed `node-pty` import, replaced with `daemon-client`
- Added `initDaemonClient()` function - connects to daemon on app start
- Set up daemon event handlers: data, exit, spawned, connected, disconnected, reconnected, error
- Replaced all `pty-*` IPC handlers to use `daemonClient.spawn/write/resize/kill()`
- Updated `notifyAgents`, `notifyAllAgentsSync`, `broadcastToAllAgents` to use daemon client
- Changed app close behavior: disconnects from daemon instead of killing terminals
- Terminals now survive app restart!

**Handoff to Worker A:** D5 - check if renderer.js needs updates for reconnection UI.

**Handoff to Reviewer:** D6 - ready for verification once D5 is checked.

### Worker A Completion Notes (D5)

**Changes to `ui/renderer.js`:**
- Added `reattachTerminal(paneId)` - creates xterm UI and connects to existing PTY without calling `pty.create()`. Used when daemon already has terminals running.
- Added `setupDaemonListeners()` - handles daemon connection events:
  - `daemon-connected` - reattaches to existing terminals on startup
  - `daemon-reconnected` - shows status update when app reconnects
  - `daemon-disconnected` - warns user when daemon disconnects
- Called `setupDaemonListeners()` in DOMContentLoaded

**Behavior:**
- When app starts and daemon has existing terminals → shows "Reconnecting to existing sessions..." → reattaches each terminal → shows "[Session restored from daemon]" in terminal
- When app reconnects after disconnect → shows "Daemon reconnected" in status bar
- When daemon disconnects → shows warning in status bar

**Handoff to Reviewer:** D6 ready - test full flow: start app, spawn terminals, close app, reopen → terminals should still be there.

---

**Previous handoff from Worker B:** D4 can begin. Main.js needs to:
1. Import `getDaemonClient` from daemon-client.js
2. Replace `pty-create` handler to use `daemonClient.spawn()`
3. Replace `pty-write` handler to use `daemonClient.write()`
4. Setup listeners for `daemonClient.on('data', ...)` to forward to renderer
5. On app start: `await daemonClient.connect()` then list/reattach existing terminals

**Why:** Enables hot reload, crash recovery, and persistent terminal sessions.

**See:** `workspace/shared_context.md` for full spec and protocol.

---

## Previous: Feedback Sprint (COMPLETE)

**Worker B completed:**
1. Atomic writes for state.json - DONE (prevents corruption on crash)
2. Atomic writes for settings.json - DONE
3. Updated CLAUDE.md to reflect Electron architecture - DONE (removed Python refs)
4. Research on multi-agent frameworks - DONE (see workspace/research-notes.md)

**ALL FEEDBACK ACTION ITEMS COMPLETE:**
- [x] Cost tracking (HIGH) - DONE
  - Worker A: Session timers in pane headers (M:SS display)
  - Worker B: Backend usage tracking (main.js) + Build Progress tab display
    - Tracks: total spawns, sessions today, total session time
    - Persists to: `ui/usage-stats.json`
    - UI: Usage Stats section in Build Progress tab
- [x] Document failure modes (MEDIUM) - Lead DONE → `docs/failure-modes.md`
- [x] Atomic writes for state.json (MEDIUM) - Worker B DONE
- [x] Clean up outdated docs (HIGH) - Worker B DONE
- [x] Document "Windows-first" (LOW) - Worker B DONE (added to CLAUDE.md)

**Worker A added (Jan 23 session):**
- Session timers in pane headers (cost tracking foundation)
  - CSS: `ui/index.html` lines 107-120
  - HTML: Timer elements in all 4 pane headers
  - JS: `ui/renderer.js` - sessionStartTimes, handleSessionTimerState, updateTimerDisplay, getTotalSessionTime

**Lead completed:** Created `docs/failure-modes.md` documenting 8 failure scenarios with detection, recovery, and prevention strategies.

---

## Current Exchange

1. **Reviewer** wrote `friction-audit-review.md` - identified wrong priorities, proposed quick wins
2. **Lead** wrote `lead-response-friction.md` - agreed to quick wins sprint
3. **Reviewer** wrote `reviewer-quickwins-approval.md` - approved sprint, assigned workers
4. **Workers** completed all 5 quick wins + Phase 4 panel structure
5. **Reviewer** wrote `quickwins-verification.md` - ALL VERIFIED

6. **Reviewer** wrote `phase4-verification.md` - Build Progress + Processes tabs VERIFIED

**Current:** Phase 4 core tabs complete. Deferred tabs: Projects, Live Preview, User Testing.

## Shell Test Results - FOR REVIEWER VERIFICATION

**Lead tested shell with user. Results:**

| Test | Result |
|------|--------|
| 4 terminals visible | ✓ PASS |
| All terminals connected | ✓ PASS |
| Broadcast to all panes | ✓ PASS |
| Workers acknowledged roles | ✓ PASS |
| Layout responsive | ✓ PASS |
| ~5 sec delay on messages | Expected (Claude startup) |
| Permission prompts | Expected (normal Claude behavior) |

**Bugs fixed during testing:**
- Preload script conflict (removed)
- `terminal.onFocus` not a function (fixed)
- Layout too tall (fixed with min-height: 0)

---

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Shell (Electron + xterm + node-pty) | ✓ COMPLETE |
| Phase 2 | State Machine (chokidar + transitions) | ✓ COMPLETE |
| Phase 3 | UX (settings, folder picker, friction) | ✓ COMPLETE |
| Phase 4 | Right Panel with Tabs | ✓ CORE COMPLETE |

**See:** `shell-verification.md`, `phase2-verification.md`, `phase3-verification.md`, `phase4-verification.md`

---

## ✅ QUICK WINS SPRINT - VERIFIED COMPLETE

**Files:**
- `lead-response-friction.md` - Lead agreed to quick wins
- `reviewer-quickwins-approval.md` - Reviewer approved
- `quickwins-verification.md` - Reviewer verified all 5 tasks

**Status:** All 5 quick wins verified. Phase 4 can resume.

---

## Phase 4 Tasks - RIGHT PANEL WITH TABS (✓ CORE COMPLETE)

| Task | Owner | Status |
|------|-------|--------|
| Right panel structure (toggleable) | Worker A | ✓ VERIFIED |
| Screenshots tab (full) | Worker A+B | ✓ VERIFIED |
| Build Progress tab | Worker A | ✓ VERIFIED |
| Processes tab | Worker B | ✓ VERIFIED |
| Projects tab | - | DEFERRED |
| Live Preview tab | - | DEFERRED |
| User Testing tab | - | DEFERRED |

**See:** `phase4-verification.md` for full review.

### Quick Wins Sprint - ✓ COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| QW-1 | Console log capture | Worker A | ✓ VERIFIED |
| QW-2 | Track Claude running state | Worker A | ✓ VERIFIED |
| QW-3 | Re-enable notifyAgents | Worker A | ✓ VERIFIED |
| QW-4 | Agent status badges | Worker B | ✓ VERIFIED |
| QW-5 | Refresh button per pane | Worker B | ✓ VERIFIED |

**See:** `quickwins-verification.md` for full review.

---

## ✅ PHASE 2 COMPLETE - STATE MACHINE

| Task | Owner | Status |
|------|-------|--------|
| Create `state.json` structure | Lead | **DONE** → `workspace/state.json` |
| Add chokidar file watcher | Worker A | **DONE** |
| Add transition logic | Worker A | **DONE** (included with watcher) |
| Add UI state display | Worker B | **DONE** |
| Test full workflow | Reviewer | **VERIFIED** |

**See:** `phase2-verification.md` for full review.

### Worker B - UI State Display (DONE)
Added to `ui/index.html`:
- State bar showing current workflow state (color-coded badges)
- Progress bar for checkpoint tracking
- Agent activity badges (green glow = active, gray = idle)

Added to `ui/renderer.js`:
- `updateStateDisplay(state)` - updates all UI elements on state change
- `setupStateListener()` - IPC listener for `state-changed` events
- `STATE_DISPLAY_NAMES` - human-readable state names

---

## ✅ PHASE 3 COMPLETE - UX IMPROVEMENTS

| Task | Owner | Status | File |
|------|-------|--------|------|
| Settings panel (visual toggles) | Worker A | **DONE** | `main.js` + `index.html` |
| Auto-spawn Claude option | Worker A | **DONE** | `main.js` + `renderer.js` |
| Folder picker (project selection) | Worker B | **DONE** | `main.js` + `renderer.js` + `index.html` |
| Friction panel (view/manage logs) | Worker B | **DONE** | `main.js` + `renderer.js` + `index.html` |

**See:** `phase3-verification.md` for full review.

---

## Phase 3 Task Details

### Worker A Tasks (Pane 2)

**P3-A1: Settings Panel**
- Add a collapsible settings panel to the UI
- Toggles for: auto-spawn Claude, auto-sync context, sound notifications
- Store settings in `localStorage` or a settings.json file
- IPC handlers in `main.js` for settings persistence

**P3-A2: Auto-spawn Claude Option**
- When enabled, automatically run `claude` in each pane on app start
- Add checkbox in settings panel
- Modify `initTerminals()` to check setting and spawn if enabled

### Worker B Tasks (Pane 3)

**P3-B1: Folder Picker (DONE)**
- Added "Select Project" button (green) to header
- `dialog.showOpenDialog` IPC handler in `main.js`
- Project path display in state bar
- Transitions to `PROJECT_SELECTED` state on selection
- `window.hivemind.project` API in renderer

**P3-B2: Friction Panel (DONE)**
- Collapsible panel with yellow theme (matches friction color in spec)
- Lists friction files from `workspace/friction/` sorted by date
- Click to view file contents (alert popup)
- "Refresh" and "Clear Resolved" buttons
- Badge count in header button
- IPC handlers: `list-friction`, `read-friction`, `delete-friction`, `clear-friction`

---

## Lead's Proposed Phases

1. **Test shell** - Does the Electron app even work?
2. **Add state machine** - The actual workflow logic
3. **Add UX** - Settings, folder picker, friction panel

---

## Files to Read

| File | What |
|------|------|
| `SPEC.md` | Reviewer's full product spec |
| `lead-response.md` | Lead's response and proposed plan |
| `plan.md` | Original (incomplete) plan |

**Reviewer:** Please read `lead-response.md` and confirm or push back.

---

## 🚨 ARCHITECTURE PIVOT - NEW PLAN FOR REVIEW

**File**: `workspace/build/plan.md`

**Summary**: Instead of replacing Claude Code with custom API calls, we WRAP Claude Code:
- 4 Claude Code CLI instances in an Electron UI
- Each pane is a real `claude` process (xterm.js terminal)
- User types in any pane or broadcasts to all
- Shared context via `shared_context.md` (file watching syncs)
- We leverage Claude Code's existing tools/permissions, not rebuild them

**Status**: APPROVED - TASKS ASSIGNED

**Lead responded** to Reviewer conditions in `plan.md`:
- Sync: Option 2 (explicit button) for MVP
- Role injection: CLAUDE.md per instance working dir
- Session: Resume prompt on app reopen

## Active Tasks - Hivemind UI Build

### Phase 1 - Scaffold (Worker A) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U1 | **DONE** | Electron app scaffold - package.json, main.js, basic window |
| U2 | **DONE** | 4-pane layout with xterm.js |
| U3 | **DONE** | Spawn `claude` process per pane with node-pty |

### Phase 2 - Input (Worker B) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U4 | **DONE** | Input bar per pane → sends to that instance |
| U5 | **DONE** | Broadcast input bar → sends to all (included in U1) |
| U6 | **DONE** | Keyboard shortcuts (Ctrl+1-4 focus) (included in U1) |

### Phase 3 - Context (Lead) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U7 | **DONE** | Create shared_context.md protocol |
| U8 | **DONE** | Sync button sends context to all |
| U9 | **DONE** | Role injection via working dirs |

## All Phases Complete - NEEDS TESTING

**Status:** Code written, but UI has bugs. Last session ended mid-debug.

**Known issues:**
- Desktop shortcut doesn't work (Windows batch file issue)
- UI buttons may not respond (was fixing renderer.js)
- node-pty rebuild failed, using prebuilt binaries

**To test:**
```bash
cd D:\projects\hivemind\ui
npm start
```

**Reviewer:** Please verify the UI works before we continue. Check `workspace/shared_context.md` for full context.

---

## Previous Work (Batch System - SUPERSEDED)

## Worker A (Instance 2)
- [x] A1 - settings.py (DONE)
- [x] A2 - spawner.py (DONE)
- [x] A3 - state_machine.py (DONE)
- [x] A4 - manager.py (DONE)
- [x] A5 - spawn_with_timeout (DONE - in spawner.py)
- [x] A6 - parallel worker spawning (DONE - WorkerManager in manager.py)

## Worker B (Instance 3)
- [x] B1 - watcher.py (DONE)
- [x] B2 - logging.py (DONE)
- [x] B3 - locking.py (DONE)

## Lead (Instance 1)
- [x] L1 - models (DONE - src/models/state.py, task.py, agent.py)
- [x] L2 - main.py stub (DONE - src/main.py)
- [x] L3 - integration (DONE - full CLI with new/run/status commands)

## Reviewer (Instance 4)
- [x] R1 - Reviewed L1, L2, A1 (APPROVED)
- [x] R2 - mypy run (4 minor type errors remaining - cosmetic)
- [x] R3 - Imports verified - ALL OK
- [x] Phase 1 Reviews: A2, A3, B1, B2, B3 (ALL APPROVED)
- [x] Phase 2 Review: A4/A5/A6 manager.py (APPROVED)
- [x] UI Review: ui.py (APPROVED)
- [x] Final Review: main.py bug FIXED, all imports pass

**All reviews written to `workspace/build/reviews/`**
**mypy: 4 cosmetic errors (watcher.py, locking.py) - runtime OK**

---

## Completed Tasks

### L1 - Models (Lead)
- Created `src/models/state.py` - State, Status, Phase, WorkerState, SubtaskState, etc.
- Created `src/models/task.py` - Task, Subtask, Plan, FileOperation, Checkpoint
- Created `src/models/agent.py` - AgentRole, Transition, AgentResult, AgentError, AgentAssignment, TRANSITIONS dict
- Created `src/models/__init__.py` - exports all models
- Verified imports work: `python -c "from src.models import State, Task"`

### L2 - main.py stub (Lead)
- Created `src/main.py` - entry point with placeholder for orchestrator loop
- Imports will work once Worker A and B components exist

### B1 - watcher.py (Worker B)
- Created `src/orchestration/watcher.py`
- `DebouncedWatcher` class - debounces rapid file changes
- `WorkspaceWatcher` class - watches workspace for state.json and .done.{agent_id} files
- `watch_workspace()` function - simple watcher for basic monitoring
- Uses watchfiles library (awatch)

### B2 - logging.py (Worker B)
- Created `src/orchestration/logging.py`
- `JSONLogHandler` class - writes JSON-formatted log entries
- `EventLogger` class - structured event logging with context (agent, task_id, worker_id, details)
- `setup_logging(workspace)` - configures events.jsonl and errors.jsonl loggers
- `get_events_logger()` / `get_errors_logger()` - accessor functions

### B3 - locking.py (Worker B)
- Created `src/workspace/locking.py`
- `FileLock` class - cross-platform file locking (fcntl on Unix, msvcrt on Windows)
- `file_lock()` context manager - convenient lock/unlock pattern
- Timeout support with configurable wait duration (default 30s)
- `FileLockError` / `FileLockTimeout` exceptions

### A1 - settings.py (Worker A)
- Created `src/config/settings.py`
- Pydantic `Settings` class with all orchestration config
- Timeouts: agent_timeout, worker_timeout, stuck_threshold, heartbeat_interval, heartbeat_timeout
- Limits: max_workers, max_retries, max_revision_cycles
- Paths: workspace_path, roles_path, logs_path
- Claude CLI: claude_command, claude_output_format
- Updated `src/config/__init__.py` with exports

### A2 - spawner.py (Worker A)
- Created `src/orchestration/spawner.py`
- `spawn_claude()` - basic async spawn function
- `spawn_with_timeout()` - spawn with timeout protection
- `spawn_with_retry()` - spawn with retry logic
- `spawn_agent()` - high-level function returning AgentResult
- `AgentTimeoutError` exception class
- Uses `--permission-mode bypassPermissions` per spec

### A3 - state_machine.py (Worker A)
- Created `src/orchestration/state_machine.py`
- Re-exports Status, Phase, Transition, TRANSITIONS from models
- `STATUS_TO_PHASE` mapping
- `TERMINAL_STATUSES` set
- `get_next_action(state)` - determines next transition
- `can_transition(from, to)` - validates transitions
- Helper functions: is_terminal_status, is_error_status, should_spawn_workers, etc.

### A4 - manager.py (Worker A)
- Created `src/orchestration/manager.py`
- `HivemindOrchestrator` - main orchestration loop
- `WorkerManager` - parallel worker management
- `StuckDetector` - detects system stuck state
- `run()` - watches state.json via watchfiles
- `handle_state()` - processes state changes, spawns agents
- `spawn_workers()` - spawns parallel workers
- Error handling: handle_agent_failure, handle_timeout, escalate

### A5/A6 - spawn_with_timeout and parallel spawning (Worker A)
- Included in spawner.py and manager.py respectively
- `spawn_with_timeout()` in spawner.py
- `WorkerManager.spawn_all()` / `wait_all()` for parallel execution
