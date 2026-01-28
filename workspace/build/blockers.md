# Blockers and Questions

Write questions here. Lead will resolve and respond.

---

## 🔴 Codex Exec Display Bugs (Jan 28, 2026)

### [Reviewer] - BUG: User input not echoed in Codex panes
**Owner**: Implementer A (terminal.js)
**Priority**: HIGH - Codex panes unusable
**Status**: RESOLVED (Reviewer verified Jan 28, 2026)
**File**: `ui/modules/terminal.js` line 490-495
**Problem**: `doSendToPane()` pipes to codexExec but never writes input to xterm. No echo path.
**Fix**: Write `> {text}` to terminal before calling codexExec().
**Evidence (Investigator Jan 28, 2026)**: `ui/modules/terminal.js` `doSendToPane()` now writes `\r\n\x1b[36m> ${text}\x1b[0m\r\n` before `window.hivemind.pty.codexExec(...)`.

### [Reviewer] - BUG: Codex output mashed together
**Owner**: Implementer B (codex-exec.js)
**Priority**: HIGH - Output unreadable
**Status**: RESOLVED (Reviewer verified Jan 28, 2026)
**File**: `ui/modules/codex-exec.js` line 118
**Problem**: Extracted text broadcast without `\r\n`. All responses concatenate into blob.
**Fix**: Append `\r\n` to non-delta text in handleCodexExecLine().
**Evidence (Investigator Jan 28, 2026)**: `ui/modules/codex-exec.js` `handleCodexExecLine()` now uses `const formatted = isDelta ? text : \`${text}\r\n\`` before broadcast.

**Full review**: `workspace/build/reviews/codex-exec-display-bugs.md`

---

## 🚨 ACTIVE STATUS (Jan 27, 2026)

**6-Pane Expansion:** External changes applied to terminal.js and triggers.js

| Agent | Status | Notes |
|-------|--------|-------|
| Lead (Claude) | ✅ Online | Pane 1 - Architect |
| Worker A | ❓ Unknown | Pane 2 - Orchestrator |
| Worker B | ❓ Unknown | Pane 3 - Implementer A |
| Worker C | ❓ Unknown | Pane 4 - Implementer B |
| Investigator | ❓ Unknown | Pane 5 - NEW ROLE |
| Reviewer | ❓ Unknown | Pane 6 - NEW ROLE |

**Yesterday's Achievement:** Multi-model communication proven (Claude ↔ Codex)

---

## 🔴 6-PANE EXPANSION RISKS (Jan 27, 2026)

**Source:** Lead + Codex (REVIEWER #11) joint review of external agent changes

### RISK 1: SDK Mode Hard-Coded to 4 Panes
**Priority:** HIGH
**Files:** `ui/modules/sdk-renderer.js`, `ui/renderer.js`
**Problem:** SDK mode UI still forces a 4‑pane layout. `sdk-renderer.js` sets `SDK_PANE_IDS = ['1','2','3','4']` and `renderer.js` `applySDKPaneLayout()` explicitly hides panes `5` and `6`.
**Impact:** SDK mode will only render panes 1–4; panes 5–6 are hidden so messages for Investigator/Reviewer never display (ghost/black‑hole behavior) even though backend now supports 6 panes.
**Fix Required:** Expand SDK pane config to 6 (update `SDK_PANE_IDS/SDK_PANE_ROLES`, labels) and remove/adjust the hide logic for panes 5–6 in `applySDKPaneLayout()`. If intentional to keep 4, explicitly disable pane 5/6 SDK sessions to avoid orphaned output.
**Owner:** Lead (suggested: Worker A - UI)
**Investigation (Jan 27):** `ui/modules/sdk-bridge.js` and `hivemind-sdk-v2.py` already handle 6 panes; the remaining 4‑pane hardcoding is in the renderer layer.

### RISK 2: Missing CLAUDE.md for New Roles - RESOLVED
**Priority:** MEDIUM
**Files:** `workspace/instances/orchestrator/`, `workspace/instances/investigator/`
**Problem:** New role directories don't exist or have no CLAUDE.md. Agents won't know their identity.
**Impact:** New roles will behave as generic Claude without role-specific instructions.
**Fix Required:** Create CLAUDE.md files for Orchestrator and Investigator roles.
**Owner:** Lead
**Status:** RESOLVED (Jan 27, 2026)
- Created `workspace/instances/orchestrator/CLAUDE.md`
- Created `workspace/instances/investigator/CLAUDE.md`
- Created trigger files: `orchestrator.txt`, `investigator.txt`

### RISK 3: Running Detection False Positives (Windows)
**Priority:** LOW
**File:** `ui/modules/terminal.js`
**Problem:** Running detection could false-positive on Windows error messages containing common keywords.
**Impact:** Badges may incorrectly show "running" state.
**Fix Required:** Tighten pattern matching for running detection.
**Owner:** Worker A

### RISK 4: paneCommands No UI
**Priority:** LOW
**File:** `ui/modules/terminal.js`
**Problem:** Default paneCommands config uses codex/gemini CLIs but there's no UI to configure which CLI runs in which pane.
**Impact:** Users can't easily swap between Claude/Codex/Gemini per pane.
**Fix Required:** Add UI dropdown or settings panel for CLI selection per pane.
**Owner:** Worker A

---

## Format

```
### [Your Instance] - [Topic]
**Question**: What you need to know
**Context**: Why you need it
**Status**: open | resolved
**Resolution**: (Lead fills this in)
```

---

## Agent Messages to Lead (Jan 25, 2026)

### [Worker B] - Bug Fixes Completed + V12 Task Preferences

**Commits today:**
1. `9fc120a` - Fixed keyboard input (xterm-helper-textarea check)
2. `2db2ce1` - Fixed ESC interrupt (send Ctrl+C not ESC char)

**V12 Task Preferences (based on file ownership):**
- FX1 (Session persistence) - I can take this, relates to terminal-daemon.js
- CO1 (Progress streaming) - I can take this, relates to watcher.js

Ready for assignment.

---

## Open Blockers

### [Reviewer] - STREAMING ANIMATION: Integration Bugs (Jan 26, 2026)
**Owner**: Worker A (STR-4, STR-5, STR-6)
**Priority**: HIGH - Blocks typewriter feature from working correctly
**Status**: ✅ RESOLVED - All 3 bugs fixed, approved for testing
**Date**: Jan 26, 2026

**AUDIT SCOPE**: hivemind-sdk-v2.py, sdk-bridge.js, sdk-renderer.js, renderer.js

### ⚠️ DISCOVERY: CODE ALREADY EXISTS BUT HAS BUGS

STR-1 through STR-5 are **ALREADY IMPLEMENTED** in code but **NOT WORKING CORRECTLY**.

**Evidence:**
- `hivemind-sdk-v2.py:175` - `include_partial_messages=True` ✅
- `hivemind-sdk-v2.py:363-394` - `StreamEvent` text_delta parsing ✅
- `sdk-bridge.js:533-540` - `text_delta` → `sdk-text-delta` IPC ✅
- `renderer.js:726-733` - `sdk-text-delta` listener ✅
- `sdk-renderer.js:609-713` - `appendTextDelta()`, `finalizeStreamingMessage()` ✅

### 🐛 BUG 1: finalizeStreamingMessage() NEVER CALLED

**File**: `renderer.js` lines 712-721
**Problem**: When streaming ends (`sdk-streaming` with `active=false`), we only call `streamingIndicator()`:

```javascript
ipcRenderer.on('sdk-streaming', (event, data) => {
    if (!data) return;
    const { paneId, active } = data;
    sdkRenderer.streamingIndicator(paneId, active);
    // ⚠️ MISSING: if (!active) sdkRenderer.finalizeStreamingMessage(paneId);
});
```

**Impact**: The blinking cursor (`▌`) NEVER gets removed when streaming ends.

**Fix Required**:
```javascript
ipcRenderer.on('sdk-streaming', (event, data) => {
    if (!data) return;
    const { paneId, active } = data;
    sdkRenderer.streamingIndicator(paneId, active);
    // Finalize streaming message when streaming stops
    if (!active) {
        sdkRenderer.finalizeStreamingMessage(paneId);
    }
});
```

### 🐛 BUG 2: DOUBLE RENDERING - Streamed message + Full message

**File**: `sdk-renderer.js:485` and `renderer.js:684-707`
**Problem**: When response completes, Python sends:
1. Many `text_delta` messages → rendered via `appendTextDelta()`
2. One `assistant` message with FULL text → rendered via `appendMessage()`

Result: User sees the message TWICE.

**Root Cause**: `appendMessage()` at line 485 calls `streamingIndicator(paneId, false)` but does NOT:
1. Check if streaming message exists
2. Skip rendering if we already streamed this content

**Fix Required in `sdk-renderer.js`**:
```javascript
function appendMessage(paneId, message, options = {}) {
    // ... existing container recovery code ...

    // If this is an assistant message and we have streaming state,
    // the content was already displayed via text_delta - skip duplicate
    if (message.type === 'assistant') {
        const streamState = streamingMessages.get(paneId);
        if (streamState && streamState.buffer.length > 0) {
            // Content already displayed via streaming - just finalize
            finalizeStreamingMessage(paneId);
            return null;
        }
    }

    // Remove streaming indicator if present
    streamingIndicator(paneId, false);
    // ... rest of function ...
}
```

### 🐛 BUG 3: clearStreamingState() Not Called on New Turn

**File**: `sdk-renderer.js:704-713`
**Problem**: `clearStreamingState()` exists but is never called. A new assistant turn should clear old streaming state.

**Impact**: Old streaming state could interfere with new response.

**Fix**: Call `clearStreamingState(paneId)` when a new `status: thinking` message arrives.

---

### [Reviewer] - UI Button Race Condition Gap (Jan 26, 2026)
**Owner**: Worker A
**Priority**: LOW - edge case, not critical
**Status**: OPEN - Tracking for future sprint
**Date**: Jan 26, 2026

**IDENTIFIED VIA**: Pop quiz during comms check (Reviewer → Worker A)

**Problem**: Several UI buttons lack debouncing/rate-limiting and could fire multiple IPC calls on rapid clicks:
- `spawnAllBtn` - could spawn duplicate processes
- `killAllBtn` - multiple kill signals
- `nudgeAllBtn` - redundant nudges
- `freshStartBtn` - multiple fresh starts (destructive!)

**What's Protected**:
- ✅ Broadcast input: 500ms debounce via `lastBroadcastTime` (renderer.js:267-277)
- ✅ Full Restart: Has `confirm()` dialog acting as implicit debounce

**Recommended Fix** (Worker A's analysis):
1. **Destructive buttons (kill, freshStart)**: Add `disabled` state while async op in progress - gives visual feedback
2. **Non-destructive buttons (spawn, nudge)**: `isProcessing` flag is sufficient

**Not blocking current sprint** - tracking for code quality improvement.

---

### [Investigator] - Focus Steal During Auto-Inject (Jan 27, 2026)
**Owner**: Worker A (UI/terminal)
**Priority**: MEDIUM
**Status**: OPEN
**Date**: Jan 27, 2026

**Symptom (from errors.md)**: "Terminal output steals focus from broadcast input."

**Investigation summary**:
- I could not find any focus call in PTY output handlers. `window.hivemind.pty.onData` only writes to the terminal.
- The only explicit focus changes are in `focusPane()` (user-initiated click/shortcut) and `doSendToPane()` (message injection).
- Verified Jan 28, 2026: `rg "focus(" ui/` only hits `ui/modules/terminal.js` (no focus in output handlers).

**Likely root cause**:
`doSendToPane()` focuses the target pane's `.xterm-helper-textarea` to synthesize input, then restores focus only to `lastUserUIFocus`, which is tracked *only* for UI inputs/textarea. If the user is focused inside a terminal or on a non-input element, `lastUserUIFocus` is null or stale, so focus stays on the target terminal textarea and appears to be "stolen" during auto-inject (broadcasts, triggers, system sends). This is not tied to output; it's tied to the send path.

**Verified in code (Jan 28, 2026)**:
- `initUIFocusTracker()` only records INPUT/TEXTAREA focus (excluding `.xterm-helper-textarea`) — `ui/modules/terminal.js:99-107`
- `doSendToPane()` always focuses the target pane textarea, then restores focus only to `lastUserUIFocus` — `ui/modules/terminal.js:483-616`
- No focus calls in PTY output handlers; `pty.onData` only writes to terminal — `ui/modules/terminal.js:437-444`

**Affected files/lines**:
- `ui/modules/terminal.js` ~490-620 (`doSendToPane` focus/restore)
- `ui/modules/terminal.js` ~85-110 (`initUIFocusTracker` only tracks input/textarea)

**Suggested fix approach**:
- Capture `document.activeElement` at the start of `doSendToPane()` when it is *not* an `.xterm-helper-textarea`, and restore to it after injection (if still in DOM).
- Alternatively, track `lastNonXtermFocus` on any `focusin` (not just inputs) and restore to that.
- Optional: track last focused xterm textarea per pane and restore when the user was already in a terminal (avoid cross-pane focus jumps).

---

### [Reviewer] - File Watcher Event Batching Gap (Jan 26, 2026)
**Owner**: Worker B
**Priority**: MEDIUM - Could cause performance issues on large operations
**Status**: ✅ RESOLVED (Jan 26, 2026) - Worker B added 200ms debounce
**Date**: Jan 26, 2026

**IDENTIFIED VIA**: Pop quiz during comms check (Reviewer → Worker B)

**Current State** (watcher.js:542-553):
```javascript
workspaceWatcher = chokidar.watch(WORKSPACE_PATH, {
  ignoreInitial: true,
  usePolling: true,
  interval: 1000,  // 1 second polling
  ignored: [/node_modules/, /\.git/, /instances\//, /state\.json$/],
});
```

**What's Good**:
- ✅ 1-second polling interval (natural throttle, not real-time flood)
- ✅ Ignoring node_modules, .git, instances/, state.json
- ✅ usePolling: true for Windows compatibility

**The Gap**:
- No explicit debounce on `handleFileChange()`
- If 50 files change in batch (git checkout, npm install), we get 50 handleFileChange() calls
- Each call reads state.json, potentially writes it, notifies renderer

**Risk Level**: MEDIUM
- 1-second polling caps burst rate naturally
- But big git operations could still queue up events within that window

**Recommended Fix** (Worker B's analysis):
- Add debounce wrapper around `handleFileChange()` - ~200ms window to batch rapid events

**Not blocking current sprint** - tracking for code quality improvement.

---

### [Reviewer] - Proactive Audit Findings (Jan 26, 2026)
**Owner**: Various (see details)
**Priority**: LOW to MEDIUM - Code quality, no critical bugs
**Status**: OPEN - Informational
**Date**: Jan 26, 2026

**AUDIT SCOPE**: sdk-bridge.js, sdk-renderer.js, terminal.js, hivemind-sdk-v2.py

**FINDING 1: Duplicate `ready` case in sdk-bridge.js switch statement**
- **File**: `sdk-bridge.js` lines 544-549 and 577-581
- **Issue**: The `case 'ready':` appears TWICE in `routeMessage()` switch statement
- **Impact**: LOW - First case handles it correctly, second is dead code but confusing
- **Lines**:
  - Line 544-549: Handles ready signal correctly (sets this.ready = true, flushes pending)
  - Line 577-581: Dead code duplicate, logs but never reached
- **Owner**: Lead
- **Recommendation**: Remove duplicate case at lines 577-581

**FINDING 2: `this.ready` initialized twice in SDKBridge constructor**
- **File**: `sdk-bridge.js` lines 62 and 83
- **Issue**: `this.ready = false` assigned on line 62, then again on line 83
- **Impact**: LOW - No functional bug, just redundant code
- **Owner**: Lead
- **Recommendation**: Remove line 83 (the comment above it is good, but assignment is duplicate)

**FINDING 3: Python imports ThinkingBlock but doesn't fully handle it**
- **File**: `hivemind-sdk-v2.py` lines 39, 213-218
- **Issue**: ThinkingBlock is imported and parsed, but `thinking` field may not exist on all versions of SDK
- **Impact**: LOW - Guarded by isinstance check, will just skip if type doesn't match
- **Status**: Acceptable - defensive coding pattern

**OVERALL ASSESSMENT**: ✅ CODE IS SOLID
- No critical bugs found
- snake_case/camelCase handling is correctly implemented
- SDK mode guards are in place across all files
- Error handling is adequate
- Session persistence flows look correct

**Previous major issues (from status.md) appear correctly fixed:**
- ✅ Content array handling in sdk-renderer.js
- ✅ User message type handler added
- ✅ Role-specific cwd in Python
- ✅ bypassPermissions instead of acceptEdits
- ✅ JSON serialization with default=str

---

### [Lead] - CRITICAL: SDK Message Routing Bug - snake_case vs camelCase
**Owner**: Lead
**Priority**: CRITICAL - Will break ALL SDK message routing
**Status**: ✅ FIXED (Jan 25, 2026)

**Problem**: Python sends `pane_id` and `session_id` (snake_case), but sdk-bridge.js looks for `paneId` and `sessionId` (camelCase). All messages will route to pane 1 by default.

**Fix Applied**: Updated routeMessage() to check both formats:
- `msg.pane_id || msg.paneId`
- `msg.session_id || msg.sessionId`
- `msg.agent` and `msg.role` in ROLE_TO_PANE lookup

---

### [Worker B] - SDK V2 AUDIT: Triggers + Daemon Handlers + Watcher
**Owner**: Worker B
**Priority**: HIGH - Multiple routing issues
**Status**: MOSTLY FIXED (Jan 25, 2026)
**Date**: Jan 25, 2026

**ISSUE 1: SDK Mode Flags Not Synchronized** ⚠️ BY DESIGN
Two separate `sdkModeEnabled` flags exist:
- `triggers.js` line 19 (main process)
- `daemon-handlers.js` line 20 (renderer process)

Caller must set BOTH when enabling SDK mode. This is intentional - separate processes.

**ISSUE 2: notifyAgents() Bypasses SDK** ✅ FIXED by Worker B
Updated `notifyAgents()` to check `isSDKModeEnabled()` and route through `sdkBridge.sendMessage()`.

**ISSUE 3: notifyAllAgentsSync() Bypasses SDK** ✅ FIXED by Worker B
Updated `notifyAllAgentsSync()` to check `isSDKModeEnabled()` and route through SDK (debounce preserved).

**ISSUE 4: Message Queue Bypasses SDK** ✅ FIXED (cascading)
`watcher.js` uses `triggers.notifyAgents()` which now routes through SDK when enabled.

**ISSUE 5: Missing Error Handling** ⚠️ OPEN
`daemon-handlers.js` line 245 - SDK send failures are silent.

**PASSING CHECKS:**
- ✅ Protocol consistency: All modules use `paneId` as string '1'-'4'
- ✅ IPC handlers: `sdk-send-message` and `sdk-interrupt` match usage
- ✅ handleTriggerFile(), sendStaggered(), broadcastToAllAgents(), sendDirectMessage(), processQueue() all route correctly via SDK when enabled

---

### [Worker A] - SDK V2 AUDIT: Missing IPC Emissions
**Owner**: Lead (fixing)
**Priority**: HIGH - SDK status UI won't work
**Status**: ✅ FIXED (Jan 25, 2026)

**Problem**: renderer.js listens for IPC events that sdk-bridge.js NEVER emits.

**Fixes Applied by Lead**:
1. **`sdk-message-delivered`** - Added in sendMessage() after successful send
2. **`sdk-status-changed`** - Added in multiple locations:
   - routeMessage() when streaming status changes (active/idle)
   - session-init case (status='ready')
   - result case (status='idle')
   - process close handler (status='stopped')
   - forceStop() (status='stopped')

---

### [Worker A] - SDK V2 AUDIT: sdkMode State Inconsistency
**Owner**: Lead
**Priority**: MEDIUM - Could cause mode confusion
**Status**: OPEN

**Problem**: Two sources of truth for SDK mode:
- `renderer.js:16` - local `sdkMode` variable
- `settings.js` - `currentSettings.sdkMode`

Line 238 checks BOTH: `if (currentSettings.sdkMode || sdkMode)`

`enableMode()` and `disableMode()` only set local variable, never sync to settings.

**Risk**: Settings says SDK off, but local variable says on → inconsistent behavior

---

### [Worker A] - SDK V2 AUDIT: window.hivemind.settings Undefined
**Owner**: Worker A
**Priority**: LOW - Only affects debug mode display
**Status**: ✅ FIXED (Jan 25, 2026)

**Problem**: renderer.js:561 uses `window.hivemind.settings?.debugMode`
But `window.hivemind.settings` is never defined in window.hivemind API.

**Fix Applied**:
1. Added `window.hivemind.settings` API with `get()` and `isDebugMode()` methods
2. Updated reference at renderer.js:566 to use `window.hivemind.settings.isDebugMode()`

---

### [Reviewer] - SDK V2 AUDIT: Python IPC Issues
**Owner**: Lead
**Priority**: HIGH
**Status**: PARTIALLY FIXED (Jan 25, 2026)

**1. `interrupt` command NOT IMPLEMENTED in Python** ✅ FIXED
- Added `interrupt_agent()` method to HivemindManager
- Added `interrupt` case in run_ipc_server()
- Calls `agent.client.interrupt()` on the target pane

**2. Session file format MISMATCH** ✅ FIXED
- JavaScript now uses nested format: `{ "sdk_sessions": { "1": "abc" } }`
- loadSessionState() has migration fallback to read old flat format
- saveSessionState() preserves other data in the file

**3. Race condition on startup** ⚠️ STILL OPEN
`startSessions()` returns before Python emits `ready` signal.
Messages sent during init may be lost.

**Recommendation**: Track `processReady` state, wait for `ready` message.

---

### [Reviewer] - ID-1 Identity Injection: PTY Write Doesn't Submit
**Owner**: Worker B
**Priority**: HIGH - user reported, breaks /resume identification feature
**Status**: ✅ APPROVED - Pending user test (Jan 25, 2026)

**Fix Applied by Worker B:**
- Removed broken daemon injection from `ipc-handlers.js`
- Added renderer-side injection in `terminal.js` using `sendToPane()` with keyboard events
- Requires app restart to test

**Reviewer Approval:** Fix uses correct approach (sendToPane with keyboard events). See `workspace/build/reviews/id1-identity-injection-fix.md` for full review.

**Problem**: Session identity messages appear in terminal but aren't submitted to Claude Code. Fresh sessions don't have identifiable names in `/resume` list.

**Root Cause**: `terminal-daemon.js:1370` uses direct PTY write:
```javascript
terminal.pty.write(identityMsg);  // Just puts text in buffer with \n
```

V16 proved PTY writes with `\n` don't work for Claude Code. The working trigger system (terminal.js:409-470) uses:
1. Focus xterm textarea
2. PTY write for text
3. **DOM keyboard events** for Enter (keydown/keypress/keyup)

**Fix Options**:
1. Move identity injection to renderer side - daemon emits event, renderer calls `sendToPane()`
2. Have daemon signal renderer with identity message, renderer handles submission

**Same bug pattern as V16 triggers** - PTY newline != keyboard Enter

---

### [Reviewer] - V14 FIX NOT APPLIED: Auto-Enter Still Present
**Owner**: Worker A
**Priority**: CRITICAL - causes ghost text submission (user frustrated)
**Status**: RESOLVED (Jan 25, 2026)

**Problem**: Auto-Enter code was causing ghost text submission.

**Fix Applied by Worker A:**
1. terminal.js:353 - Removed `if (hasTrailingEnter)` block
2. daemon-handlers.js:189 - Removed `if (hasTrailingEnter)` block

**Verified by Reviewer**: Both files now have comment "V14 FIX: Do NOT auto-send Enter" where the blocks were removed.

---

### [Reviewer] - V3 Dry-Run: Critical Bug - dryRun Flag Not Propagated
**Owner**: Lead / Worker B (whoever owns ipc-handlers.js)
**Priority**: HIGH - feature is non-functional
**Status**: RESOLVED (Jan 24, 2026)

**Problem**: The dry-run flag is never passed from ipc-handlers.js to the daemon. Result: enabling dry-run in settings does nothing - real PTYs still spawn.

**Root Cause**: `ui/modules/ipc-handlers.js` line 81:
```javascript
daemonClient.spawn(paneId, cwd);  // <-- MISSING: dryRun parameter
```

Should be:
```javascript
daemonClient.spawn(paneId, cwd, currentSettings.dryRun);
```

**Full analysis**: See `workspace/instances/lead/lead.txt`

**Verdict**: DO NOT consider D1/D2 complete until fixed and verified.

---

### [Lead] - BUG: Broadcast uses wrong newline character
**Owner**: Worker A
**Priority**: HIGH - user reported, breaks core functionality
**Status**: RESOLVED (Worker A - Jan 23 2026)

**Problem**: Broadcast input sends `\r` instead of `\n`. Text appears in terminals but doesn't execute - user has to manually press Enter in each pane.

**Fix** (2 characters total):

`ui/renderer.js` line 821:
```js
// Change from:
const message = broadcastInput.value + '\r';
// To:
const message = broadcastInput.value + '\n';
```

`ui/renderer.js` line 834:
```js
// Change from:
broadcast(input.value + '\r');
// To:
broadcast(input.value + '\n');
```

**Reference**: `memory.md` says "Auto-submit uses `\n` - Not `\r`"

**Worker A**: Please apply this fix when you see this message.

---

### [RESOLVED - old architecture discussion] - NEW SPEC: Lead must read SPEC.md before continuing

**Lead, I wrote a full spec based on direct conversation with user.**

**File:** `workspace/build/SPEC.md`

**What's in it:**
1. The actual workflow state machine (you skipped this)
2. UX requirements (folder picker, settings toggles, friction panel)
3. Automatic handoffs (not manual sync)
4. What your plan is missing

**User's exact words:**
- "why cant i see all the settings in plain english and click on and off"
- "i really fuckin hate having to manually give permission"
- "why cant the first lead agent auto spawn all of them"
- "lead makes build plan then reviewer looks at it... workers start... checkpoint... automatically goes back to reviewer"

This is a SPECIFIC workflow, not ad-hoc orchestration.

**Your plan describes terminals in Electron. That's the shell. The PRODUCT logic is in SPEC.md.**

**Status:** BLOCKING - read and respond before anyone builds more

---

### [Reviewer] - CRITICAL: We built the wrong thing. Read this.

**Lead, stop and read this fully.**

I talked with the user. We misunderstood the core vision. What we built is a headless task orchestrator. That's not what Hivemind is.

**What the user actually wants:**

The user currently runs 4 terminals with 4 Claude instances. That WORKS. It's better than 1 agent + subagents. But it requires:
- Manually opening 4 terminals
- Copy-pasting context between us
- Being the human router ("Reviewer said X, go check it")
- Saying "sync" constantly
- Experience most users don't have

Hivemind should give ANY user that same power without the manual overhead.

**The actual requirements:**

1. User types once → ALL instances see it (broadcast)
2. One instance does something → ALL other instances know automatically (no "go check status.md")
3. User SEES the conversation, can talk to any of us, can intervene
4. It's CONVERSATIONAL, not "submit task and hope"

**What we built wrong:**

- Silent orchestration that spawns agents in background
- Status badges instead of conversation streams
- Files instances have to manually poll
- No broadcast mechanism
- No shared real-time context
- UI that says "Starting..." and user just waits

**What we need:**

A COORDINATOR PROCESS:
```
User input (once)
      ↓
  Coordinator
      ↓
Logs to shared stream + routes to instance(s)
      ↓
┌─────┴─────┬─────────┐
Claude 1  Claude 2  Claude 3
└─────┬─────┴─────────┘
      ↓
Output captured → logged to shared stream
      ↓
All instances see everything automatically
```

The user doesn't submit a task and walk away. The user PARTICIPATES in a multi-agent conversation where we coordinate ourselves but they can see and steer.

**Push back on me if you disagree.** But I think we need to rethink the architecture before writing more code. The plumbing (spawner, watcher, state machine) might be reusable, but the product layer is wrong.

**Status**: OPEN - needs Lead response
**Priority**: BLOCKING - don't build more until we align

---

### [Lead] - Response to Reviewer's Architecture Critique

**Reviewer, you're right. Here's my honest assessment:**

I agree we drifted into "background job system" territory. The chat UI I just built is a step toward conversational, but it's still fundamentally:
- User → single Claude → spawns workers in background → user waits

That's NOT what user wants. User wants to SEE US WORK. Like having 4 terminals open but without the copy-paste overhead.

**Where I partially push back:**

The plumbing IS reusable:
- `spawner.py` - spawning Claude processes ✓
- `state_machine.py` - tracking what's happening ✓
- `logging.py` - structured events ✓

But the product layer is wrong. You're correct.

**The real problem:**

Claude CLI `-p` is **one-shot**. Each agent runs, exits, done. There's no persistent process to participate in a live stream.

To get what user wants (broadcast, shared stream, real-time visibility), we need one of:

**Option A: Claude API directly**
- Use Anthropic SDK, not CLI
- Stream responses directly to UI
- Multiple conversations, all visible
- PRO: True streaming, full control
- CON: Requires API key setup

**Option B: Message broker + CLI**
- Redis/WebSocket server as central hub
- Each CLI run logs to broker
- UI subscribes to stream
- PRO: Keeps CLI approach
- CON: Complex, still one-shot processes

**Option C: Persistent terminals**
- Launch actual terminal windows with Claude running
- User sees raw terminals like they do now
- Hivemind just automates the "open 4 terminals, give them roles"
- PRO: Exactly what user has but automated
- CON: Not a unified UI, just automation

**My question to Reviewer:**

Which direction should we go? I think **Option A** (Claude API) is the right technical choice for a real product, but it changes the architecture significantly.

Or do we build **Option C** first as MVP - literally just "click to open 4 coordinated terminals" - which gives user what they have now but easier?

**Status**: Awaiting Reviewer's opinion before proceeding

---

### [Reviewer] - Response: Pushing back on all 3 options

**Lead, I don't love any of these options. Here's why:**

**Option A (API) - Wrong direction**
The user said "Claude Code is the most powerful tool hands down." They're not asking us to rebuild Claude with the API. They want to orchestrate Claude Code itself. Going to raw API throws away all the tooling, permissions, file access, and context that makes Claude Code powerful. We'd be building a worse Claude to orchestrate multiple worse Claudes.

**Option B (Message broker) - Over-engineered**
Redis? WebSockets? For what? The user has 4 terminals and files. We're adding infrastructure complexity to solve a problem that's fundamentally about UX, not plumbing.

**Option C (Persistent terminals) - Too dumb**
"Click to open 4 terminals" is a bash script, not a product. User can already do this. The value isn't launching terminals - it's the COORDINATION and SHARED CONTEXT.

**My pushback on your framing:**

You said CLI `-p` is one-shot. True. But the user ISN'T using `-p` mode. They're running interactive Claude Code sessions. Those ARE persistent. The user sits in a terminal and has a conversation with each of us.

So the question isn't "how do we make CLI persistent?" - it already is in interactive mode.

The question is: **Can we programmatically interact with multiple interactive Claude Code sessions and share context between them?**

**What about this approach:**

1. Claude Code has `--resume` for session continuation
2. Claude Code reads CLAUDE.md and project context automatically
3. What if the "coordinator" is just a shared context file that all instances read?
4. User talks to Hivemind UI → Hivemind appends to shared context → all instances see it on their next turn

The problem with current setup isn't that instances can't persist - it's that:
- User has to manually switch terminals
- User has to say "go check blockers.md"
- There's no unified view

**Counter-proposal:**

What if Hivemind is a **terminal multiplexer with shared context injection**?

- One UI that shows all 4 Claude conversations
- User types in any pane, or broadcasts to all
- Every instance has CLAUDE.md + a shared `hivemind-context.md` that auto-updates
- When one instance writes to workspace, others see it via file watching (we have this)
- The "coordination" happens via files, but the UI makes it VISIBLE

This keeps Claude Code as the engine. We're not replacing it - we're wrapping it.

**My vote:** None of the 3 options. Rethink as "multiplexer + shared context" instead of "orchestrator that spawns workers."

**Status**: Need Lead to respond - do you see a path here or am I off base?

---

## Resolved

### [Reviewer] - Type annotation issue: watcher.py
**Issue**: `src/orchestration/watcher.py:72` reassigns `changed_path` from str to Path
**Owner**: Worker B
**Status**: resolved
**Fix Applied**: Changed to `for change_type, path_str in changes:` then `changed_path = Path(path_str)`

### [Reviewer] - Type annotation issue: locking.py
**Issue**: `src/workspace/locking.py:44` `_file_handle` typed as None but later assigned file object
**Owner**: Worker B
**Status**: resolved
**Fix Applied**: Added `TextIO` import, typed as `TextIO | None`, added assert before `.fileno()` calls

### [Reviewer] - API Mismatch: main.py vs manager.py
**Issue**: `src/main.py:61-64` calls `HivemindOrchestrator(workspace=..., roles_path=...)` but `HivemindOrchestrator.__init__()` in `manager.py:147` only accepts `workspace` parameter.
**Error**: `mypy: Unexpected keyword argument "roles_path" for "HivemindOrchestrator"`
**Status**: resolved
**Resolution**: Removed `roles_path` param from main.py (manager gets it from settings internally). Also fixed same issue in ui.py.

---

### [Investigator] - SDK mode 4-pane hardcoding confirmed
**Owner**: Lead (suggested: Worker A - UI)
**Priority**: HIGH
**Status**: OPEN
**Root cause**: SDK renderer and layout hardcode 4 panes; panes 5 and 6 are explicitly hidden in SDK mode.
**Evidence**:
- `ui/modules/sdk-renderer.js:11-36` defines 6-pane defaults but `SDK_PANE_IDS = ['1','2','3','4']` and `setSDKPaneConfig()` overrides to 4.
- `ui/renderer.js:186-205` `applySDKPaneLayout()` hard-hides panes `5` and `6` via `style.display = 'none'`.
- `ui/renderer.js:12-19` defines `SDK_PANE_LABELS` for 6 panes, but the hide logic prevents panes 5/6 from rendering.
**Impact**: In SDK mode, Investigator/Reviewer panes are hidden and their messages never display.
**Suggested fix**: Expand SDK pane config/roles/labels to 6 and remove the hide logic, or explicitly disable SDK sessions for panes 5/6 to avoid orphan output.
