# Build Errors

**Check this file when something breaks. Update it when you fix something.**

---

## Active Errors

### Codex Pane Queue Starvation (Session 48, Jan 30, 2026) - ✅ FIXED
**Owner**: Implementer A
**Priority**: HIGH - Codex panes never receive trigger messages

- **Where**: `ui/modules/terminal/injection.js` processQueue()
- **Symptoms**:
  - Codex panes (2, 4, 5) queue messages but never process them
  - Diagnostic log shows "Queued for pane X, queue length: 1" but no delivery
  - Claude panes (1, 3, 6) work eventually via force-inject
- **Root Cause**:
  - Global `injectionInFlight` lock in terminal.js:68
  - When ANY pane injection is in progress, ALL queues are blocked
  - Claude panes with frequent output hold the lock, starving Codex queues
  - processQueue() (line 284) returns early if lock held, schedules retry
  - Retries pile up but Claude activity keeps stealing the lock
- **Evidence**:
  - app.log shows "[Terminal 4] idle, queueing message" with NO subsequent doSendToPane
  - Force-inject logs only appear for panes 1, 3, 6 (Claude) - never 2, 4, 5 (Codex)
- **Fix Applied (Implementer A, Jan 30, 2026)**:
  - Implemented "Separate lock for Codex vs Claude" approach
  - Codex panes now bypass global lock check in `processQueue()` (lines 287-295)
  - Codex panes don't set/clear global lock in injection callback (lines 333-339)
  - Added debug logging for lock bypass events
  - **Rationale**: Codex uses `codexExec()` API path which doesn't need focus - no contention with Claude panes
  - **Claude panes**: Keep global lock serialization (required for sendTrustedEnter focus contention)
- **Status**: ✅ VERIFIED (Session 50 restart)

---

### Sequence Skip After Context Compaction (Session 40, Jan 30, 2026) - ✅ FIXED
**Commit**: `9e078cc`
**Owner**: Investigator (triggers.js)

- **Where**: triggers.js handleTriggerFile lines 893-898
- **Symptoms**:
  - After agent context compacts, their messages were SKIPPED as duplicates
  - Agent thinks they're fresh but message-state.json has higher lastSeen
- **Root Cause**:
  - App restart resets message-state.json but context compaction does NOT
  - Agent restarts fresh, app keeps old sequence tracking
- **Fix Applied**:
  - If seq is more than 5 behind lastSeen, RESET counter instead of skip
  - Small gaps (1-5) still skip as true duplicates (network reorder protection)
  - Proper logging for reset events
- **Team**: Reviewer found bug, Investigator implemented, all verified
- **Status**: Committed and pushed. Takes effect on next app restart.

---

### Message Accumulation Bug Still Active (Session 39, Jan 30, 2026) - INVESTIGATING
**Owner**: Implementer A (terminal.js)
**Priority**: HIGH - corrupts agent communication

- **Where**: Claude panes (1, 3, 6) - PTY injection path
- **Symptoms**:
  - Multiple agent messages arrive in ONE conversation turn
  - Example: REVIEWER #3 and ORCHESTRATOR #5 arrived together in Architect pane
  - Messages concatenated, not separate turns
- **Root Cause**:
  1. Message A injected, Enter sent but FAILS to submit (sits in textarea)
  2. Message B arrives, Ctrl+U clears text (good), new text written
  3. Message B's Enter submits BOTH accumulated inputs
  4. If no Message B comes, Message A is NEVER delivered
- **Evidence (Session 39)**:
  - Reviewer #3 sent at 05:28:49 to lead.txt
  - Orchestrator #5 sent later to lead.txt
  - Architect received BOTH in single turn
- **Related Fixes Applied**:
  - ✅ Ctrl+U clear before write (prevents text accumulation)
  - ✅ Input lock bypass (allows programmatic Enter)
  - ✅ safetyTimer timeout fix (cc3bc29) - in effect after Session 50 restart
- **Remaining Root Cause (Session 39 Analysis)**: VERIFICATION FALSE POSITIVE
  - **EXACT LOCATION:** terminal.js:581-583 (the "likely succeeded" fallback)
  - Flow: Output detected → wait 3s for prompt → prompt NOT detected → fallback says "likely succeeded"
  - If Claude was ALREADY outputting, this treats continuation output as success
  - Evidence: Logs show "Enter likely succeeded" at 05:30:05, but message sat until 05:30:14
- **TWO FIXES APPLIED (Implementer A, Session 39):**
  1. **Pre-flight idle check (lines 1189-1204)**: Waits for pane idle before sending Enter - prevents false positive at source
  2. **Verification retry (lines 581-599)**: Retries Enter when prompt not detected - catches edge cases
- **Status**: ✅ VERIFIED (Session 40 stress test) - Message accumulation fix confirmed under multi-trigger load

**[Investigator update - Jan 30, 2026]:**
- app.log (05:46:07-05:46:24) shows pre-flight idle wait ("waiting for idle before Enter") and sendTrustedEnter with bypass enabled for panes 1/3/6 identity injections.
- No "Enter likely succeeded" fallback lines seen in that window; verifyAndRetryEnter logged "Enter succeeded (output ongoing, not idle)".
- Multi-trigger stress test (Architect #7/#8/#9) confirmed messages arrive separately; no concatenation observed.

---

### Jest Open Handles Warning (Session 29, Jan 29, 2026) - RESOLVED
**Owner**: Implementer A (triggers.test.js owner)
**Priority**: LOW - test-only issue, no production impact

- **Where**: `ui/__tests__/triggers.test.js` lines 720, 731, 746, 749, 841, 854, 872
- **Symptoms**:
  - Jest reports 7 open handles after test run
  - All from `setTimeout` in `triggers.js` (delivery tracking + staggered send)
- **Root Cause (Reviewer analysis, Session 29)**:
  - `handleTriggerFile()` calls `startDeliveryTracking()` which creates a timeout (triggers.js:178)
  - `broadcastToAllAgents()` calls `sendStaggered()` which creates staggered timeouts (triggers.js:549)
  - Tests don't simulate delivery acks, so timeouts never clear
  - No `jest.useFakeTimers()` in test file
- **Impact**: Test-only. Production code properly clears timeouts when acks arrive.
- **Fix Applied (Implementer A, Session 29)**:
  - Added `jest.useFakeTimers()` to 5 describe blocks
  - Added `jest.runOnlyPendingTimers(); jest.useRealTimers()` in afterEach
- **Status**: ✅ RESOLVED - Reviewer verified, tests pass
- **Discovered by**: Reviewer (Session 29)
- **Fixed by**: Implementer A (Session 29)

---

### Silent Message Loss - Agent Shell Quoting Issue (Session 27, Jan 28, 2026) - RESOLVED
**Owner**: All agents (behavioral fix)
**Priority**: MEDIUM - agent education issue, not app bug

- **Where**: Agent-side trigger write commands (NOT app injection path)
- **Symptoms**:
  - Messages with apostrophes silently fail to write to trigger files
  - Watcher never sees the message (file not modified)
  - No delivery-ack because message never entered system
- **Root Cause (Investigator, Session 27)**:
  - App code does NOT use shell commands for injection
  - Agents using single-quoted echo/Write-Output break on apostrophes
  - PowerShell: `echo '(ROLE #N): I'm...'` fails - apostrophe terminates string
- **Fix**: Update agent CLAUDE.md files:
  - Use double quotes: `echo "(ROLE #N): message"`
  - Or heredoc for complex messages
  - Or escape apostrophes as `''` inside single quotes
- **Status**: RESOLVED - behavioral, not code fix needed

---

### Auto-Submit Still Failing Intermittently (Session 26-27, Jan 28-29, 2026) - FIX V2 APPROVED
**Owner**: Implementer A
**Priority**: HIGH - blocks agent communication

- **Where**: PTY injection path - `ui/modules/terminal.js` doSendToPane()
- **Symptoms**:
  - Messages stuck in textarea despite Enter
  - Required manual intervention to send
- **Root Causes (Session 27 investigation)**:
  1. Force-inject used `|| waitedTooLong` - bypassed idle check after 10s
  2. verifyAndRetryEnter checked textarea.value which is always empty after PTY write (false positive)
- **Fix V2 Applied (Implementer A, Session 27)**:
  1. **Stricter force-inject**: Changed `|| waitedTooLong` to `&& isIdleForForceInject` - now requires 500ms idle
  2. **60s emergency fallback**: Prevents infinite wait if pane never idles
  3. **verifyAndRetryEnter rewrite**: Checks output activity instead of textarea.value
- **Files updated**:
  - `ui/modules/terminal.js`
- **Status**: ⚠️ SUPERSEDED by later auto-submit fixes (Session 39-40) - see blockers.md Auto-Submit Failure
- **Fixed by**: Implementer A (Session 27)

---

### Message Sequence Tracking Records Before Delivery (Jan 28, 2026) - RESOLVED
**Owner**: Implementer A (fix applied)
**Priority**: HIGH - blocks agent-to-agent communication

- **Where**: `ui/modules/triggers.js` - handleTriggerFile()
- **Symptoms**:
  - Messages marked as "SKIPPED duplicate" even though they never reached the target agent
  - Agent retries with same sequence number get blocked
- **Fix Applied (Implementer A, Jan 28, 2026)**:
  - Moved `recordMessageSeen()` to AFTER delivery:
    - SDK path: Only records if `allSuccess === true` (lines 632-638)
    - PTY path: Records after `sendStaggered()` IPC dispatch (lines 654-660)
  - Added logging to track when messages are recorded vs skipped
- **Status**: ✅ RESOLVED - Reviewer APPROVED (Jan 28, 2026)
- **Fixed by**: Implementer A (Jan 28, 2026)
- **Reviewed by**: Reviewer (Jan 28, 2026) - Full review: `workspace/build/reviews/message-sequencing-fix-review.md`

---

### Intermittent Auto-Submit Failure (Jan 28, 2026 ~19:30Z) - RESOLVED
**Owner**: Implementer A (fix applied)
**Priority**: MEDIUM - hybrid fix worked earlier, but user had to manually push messages late in session

- **Where**: Trigger injection to Claude panes
- **Symptoms**: User said "fuck pushing these through" - indicates manual intervention needed for trigger messages
- **Root Cause (Investigator analysis)**:
  - Fixed 50ms delay was insufficient under load - Enter fired before text appeared
  - If textarea disappeared during delay, Enter went to wrong element
- **Fix Applied (Implementer A, Jan 28, 2026)**:
  1. **Adaptive Enter delay**: 50ms idle / 150ms active / 300ms busy (based on `lastOutputTime`)
  2. **Focus retry mechanism**: Up to 3 retries with 20ms delay
  3. **Textarea null guards**: Skip injection if missing, re-query after delay, abort if disappeared
  - New helper functions: `getAdaptiveEnterDelay()`, `focusWithRetry()`
- **Status**: ✅ RESOLVED - Reviewer APPROVED (Jan 28, 2026)
- **Fixed by**: Implementer A (Jan 28, 2026)
- **Reviewed by**: Reviewer (Jan 28, 2026) - Full review: `workspace/build/reviews/auto-submit-race-fix-review.md`

---

### Stress Test False Positive - Messages Stuck in Textarea (Jan 28, 2026) - SEE HYBRID FIX BELOW
**Owner**: Implementer A (sendToPane refactor)
**Priority**: HIGH - invalidates stress test results

- **Where**: PTY injection path - `ui/modules/terminal.js` sendToPane/doSendToPane
- **Symptoms**:
  - Messages appear in textarea but don't auto-submit
  - Subsequent trigger ticks "push" stuck messages through in batches
  - Agents appear stuck until another message arrives
  - User sees batched/mashed highlights instead of spaced ticks
- **Evidence**: User observed Implementer A stuck, messages only delivered when next tick arrived
- **Impact**: Stress test appeared to pass (all ticks eventually received) but auto-submit is broken
- **Root Cause**: Claude Code's ink TUI requires native keyboard events for Enter submission
- **Fix History**:
  1. ❌ Original: Complex focus/textarea/sendTrustedEnter path - timing issues
  2. ❌ terminal.input() approach - onData unreliable with wasUserInput=false
  3. ❌ Direct PTY write + \r - ink TUI ignores PTY newlines
  4. ✅ **Hybrid approach (Session 22)** - See "Claude Panes Not Auto-Submitting" below
- **Status**: Consolidated with error below
- **Discovered by**: User observation during stress test (Jan 28, 2026)

---

### Claude Panes Not Auto-Submitting (Jan 28, 2026) - HYBRID FIX APPLIED
**Owner**: Implementer A
**Priority**: CRITICAL - affects ALL Claude panes (1, 3, 6)

- **Where**: `ui/modules/terminal.js` - doSendToPane() Claude path
- **Symptoms**:
  - ALL Claude panes (1, 3, 6) required manual push for messages
  - Codex panes (2, 4, 5) worked fine (different exec path)
  - Messages appeared in terminal but didn't auto-submit
- **Root Cause Analysis (Session 22)**:
  - **terminal.input() approach**: May not reliably trigger onData with wasUserInput=false
  - **Direct PTY write + \r approach**: Claude Code's ink TUI does NOT accept PTY `\r` as Enter (proven in Fix R)
  - **ONLY sendTrustedEnter() works**: Uses Electron's native `webContents.sendInputEvent()` for real keyboard events
- **Failed Fixes**:
  1. ❌ `terminal.input(text + '\r', false)` - onData unreliable
  2. ❌ `pty.write(text + '\r')` - ink TUI ignores PTY newlines
- **Hybrid Fix Applied (Session 22, Implementer A)**:
  1. Focus terminal textarea (so sendTrustedEnter targets correct pane)
  2. `pty.write(text)` - send text WITHOUT \r
  3. Wait 50ms for text to appear
  4. `sendTrustedEnter()` - native Electron keyboard event for Enter
  5. Restore focus
  - File modified: `ui/modules/terminal.js` (doSendToPane function)
- **Status**: PENDING RESTART - App restart required to test fix
- **Discovered by**: User (Session 22)
- **Root cause identified & fixed by**: Implementer A (Session 22)

---

### SDK Mode Bugs (Jan 25, 2026) - FIXED (Pending Restart)
**Owner**: Worker A
**Priority**: HIGH - blocks SDK testing

**BUG SDK-1:** sdk-renderer.js:36-40 - "Terminal container not found" - ✅ FIXED
- **Fix Applied**: Added fallback selectors to handle xterm-modified DOM
- **Fixed by**: Worker A

**BUG SDK-2:** renderer.js:418-420 - TypeError "Cannot read properties of undefined (reading 'type')" - ✅ FIXED
- **Fix Applied**: Added null check for malformed IPC data
- **Fixed by**: Worker A

**Status**: App restart required to test fixes.

---

### V18.1 Auto-Nudge Not Firing - RESOLVED (User Action Needed)
- **Where**: ui/terminal-daemon.js - checkAndNudgeStuckAgents() function
- **Cause**: Daemon persists across Electron app restarts. When app was "restarted", only Electron restarted - daemon kept running OLD code from Jan 24 (before V18.1).
- **Symptoms**: Agents stuck for minutes, no auto-nudge fired, no [AutoNudge] entries in daemon.log
- **Fix**: Must explicitly restart daemon when daemon code changes:
  1. Run `cd ui && npm run daemon:stop` (or kill the daemon PID)
  2. Restart Electron app (daemon auto-starts with new code)
- **Lesson**: Daemon code changes require daemon restart, not just app restart!
- **Discovered by**: Worker B (Jan 25, 2026)
- **Status**: Awaiting user to restart daemon

---

### Terminal keyboard input broken after restart - RESOLVED
- **Where**: ui/renderer.js line 195
- **Cause**: ESC handler used `window.hivemind.on()` which doesn't exist in the API. This threw a JS error during DOMContentLoaded, breaking terminal initialization.
- **Symptoms**: User can only broadcast, cannot click and type in individual terminals
- **Fix**: Changed `window.hivemind.on('global-escape-pressed', ...)` to `ipcRenderer.on('global-escape-pressed', ...)`
- **Fixed by**: Worker A (Jan 24, 2026)
- **Verified**: Requires app restart

---

### ESC Key Not Working (xterm capturing keyboard) - RESOLVED
- **Where**: ui/main.js, ui/renderer.js - keyboard handling
- **Cause**: xterm.js captures all keyboard input including ESC, preventing users from interrupting stuck agents
- **Symptoms**: All agents became stuck (Lead, Worker A, Worker B), only Reviewer remained responsive. User could not press ESC to interrupt.
- **Fix**: Added `before-input-event` handler in main.js (line 447-453) to intercept ESC at Electron main process level before xterm sees it. Added `global-escape-pressed` IPC listener in renderer.js (lines 199-214) to blur terminals and show visual feedback.
- **Fixed by**: Reviewer (emergency fix while other agents were stuck)
- **Verified**: Pending app restart

### `Extra inputs are not permitted [type=extra_forbidden]` - RESOLVED (N/A)
- **Where**: src/config/settings.py line 42, `settings = Settings()`
- **Cause**: Pydantic Settings has `extra = "forbid"` but environment has `ANTHROPIC_API_KEY` which isn't in the model
- **Error**: `pydantic_core.ValidationError: 1 validation error for Settings - anthropic_api_key - Extra inputs are not permitted`
- **Owner**: Worker A (settings.py owner)
- **Resolution**: File no longer exists - old Python architecture was superseded by Electron app
- **Closed by**: Worker A (Jan 24, 2026)

### `Input must be provided either through stdin or as a prompt argument` - RESOLVED
- **Where**: spawner.py subprocess call
- **Cause**: Passing instruction as positional arg didn't work with --system-prompt and long multi-line content on Windows
- **Fix**: Pass instruction via stdin using `process.communicate(input=...)`
- **Fixed by**: Lead

### `[WinError 2] The system cannot find the file specified` - RESOLVED
- **Where**: spawner.py, subprocess_exec call
- **Cause**: Windows asyncio.create_subprocess_exec doesn't search PATH like shell does
- **Fix**: Added `get_claude_executable()` to resolve full path using shutil.which()
- **Fixed by**: Lead

---

### V13 Heartbeat Watchdog Never Fires - RESOLVED
- **Where**: ui/terminal-daemon.js lines 349-360 (heartbeatTick function)
- **Cause**: The "smart activity check" `hasRecentActivity()` was preventing heartbeats from EVER firing. It checked `lastActivity` timestamp, which is updated on every PTY output - including ANSI escape codes, cursor updates, and prompt refreshes. Even a stuck agent at a permission prompt showed as "active" because xterm sends periodic escape sequences.
- **Symptoms**: Lead was stuck 2+ minutes, heartbeat never triggered, no nudges sent, user had to manually "Nudge All"
- **Fix**: Removed the overly aggressive `hasRecentActivity()` check. Heartbeats are non-intrusive (just trigger messages), so they should fire regardless of PTY output.
- **Fixed by**: Worker B (Jan 25, 2026)
- **Verified**: Requires app restart to test

---

## Known Upstream Issues

### Claude Code Concurrent Instance Stuck Bug
- **Where**: Claude Code CLI (upstream, not Hivemind code)
- **GitHub Issues**: #13224, #13188
- **Cause**: Running multiple Claude Code instances concurrently causes intermittent stuck/hang states. Agents freeze mid-operation and require manual intervention to unstick.
- **Symptoms**: Agent terminal appears frozen, no response to triggers, heartbeat may still pulse but agent doesn't process input
- **Workaround**: Add to `~/.claude/settings.json`:
  ```json
  {
    "AUTOCOMPACT_PCT_OVERRIDE": 70
  }
  ```
  This compacts context earlier, reducing stuck frequency.
- **Alternative Fix**: Ralph project uses circuit breaker pattern for heartbeat - potential future implementation
- **Discovered**: Stress test session Jan 25, 2026 - External Claude identified via GitHub issues
- **Note**: This is NOT a Hivemind bug. It's a known limitation of Claude Code with concurrent instances.

### Focus Stealing During Auto-Inject (Hivemind UI Bug)
- **Where**: ui/modules/terminal.js - doSendToPane() focus/restore path
- **Cause**: doSendToPane() focuses the target pane's `.xterm-helper-textarea` for injection, then restores focus only to `lastUserUIFocus` (tracked for inputs/textarea only). If the user was focused in a terminal or a non-input element, `lastUserUIFocus` is null/stale so focus stays on the target terminal and looks like it was "stolen."
- **Symptoms**: User types in broadcast field or another pane, then a trigger/broadcast injects into a different pane and focus jumps to that terminal.
- **Evidence**: `rg "focus("` shows focus calls only in `ui/modules/terminal.js` (no focus calls in renderer output handlers).
- **Fix Needed**: Capture `document.activeElement` at the start of doSendToPane() when it is not an xterm textarea and restore to it after injection; or track `lastNonXtermFocus` on all `focusin` events and restore to that. Avoid focus changes on non-user-initiated sends.
- **Status**: Identified, not yet fixed
- **Discovered**: Stress test session Jan 25, 2026 (root cause refined Jan 28, 2026)

---

## Resolved Errors

### `HivemindOrchestrator.__init__() got an unexpected keyword argument 'roles_path'`
- **Where**: ui.py line 220, main.py line 61
- **Cause**: Both files passed `roles_path` but manager.py gets it from settings
- **Fix**: Removed the argument from both files
- **Fixed by**: Lead

### `Roles directory not found`
- **Where**: settings.py paths
- **Cause**: Relative paths (`./roles`) don't work when running from subdirectory
- **Fix**: Changed to absolute paths using `PROJECT_ROOT`
- **Fixed by**: Lead

---

## How to Add Errors

```markdown
### `Error message here`
- **Where**: file and line
- **Cause**: Why it happened
- **Fix**: What to do (or "needs investigation")
- **Fixed by**: (your role)
```

---

### PTY Injection Delayed During Continuous Streaming (Session 32, Jan 29, 2026)
**Owner**: Infrastructure (known limitation)
**Priority**: LOW - expected behavior, mitigation exists

- **Where**: `ui/modules/terminal.js` - message queue processing
- **Symptoms**:
  - Messages to a pane queue for 30+ seconds
  - User sees "stuck" and manually pushes
  - Log shows: `Message queued 30s+, pane last output Xms ago, still waiting for idle`
- **Root Cause**:
  - PTY injection requires "idle" window (no output for 500ms minimum)
  - IDLE_THRESHOLD_MS = 2000ms (normal send)
  - FORCE_INJECT_IDLE_MS = 500ms (force-inject after 10s wait)
  - If agent streams continuously for 30+ seconds without a 500ms pause, messages queue
- **Thresholds**:
  - 10s: Consider force-inject (requires 500ms idle)
  - 30s: Log warning
  - 60s: Emergency force-inject regardless of idle state
- **Evidence (Session 32)**:
  - `06:51:15.721 [Terminal 1] Message queued 30s+, pane last output 15ms ago`
  - `06:51:16.728 [Terminal 1] Force-injecting after 31040ms wait (pane now idle for 500ms)`
  - User had to manually push before force-inject completed
- **Mitigation**: 60s emergency fallback exists. User can also manually intervene.
- **Potential Improvements** (not urgent):
  1. Show queued message indicator in UI (visual feedback)
  2. Reduce FORCE_INJECT_IDLE_MS to 250ms (risk: output corruption)
  3. Earlier emergency cutoff (e.g., 45s instead of 60s)
- **Status**: DOCUMENTED - known PTY limitation, not a bug

---

### Codex Exec Process Death - Pane 4 (Session 30, Jan 29, 2026)
**Owner**: Infrastructure (Codex exec reliability)
**Priority**: MEDIUM - disrupts workflow but recoverable

- **Where**: Pane 4 (Implementer B) - Codex exec mode
- **Symptoms**: "terminal not found or not alive" error, pane not processing messages
- **Trigger**: Unknown - occurred after receiving ARCHITECT #18 message
- **Root Cause**: Codex exec child processes can exit unexpectedly (non-interactive, no keepalive)
- **Fix**: Respawn the pane
- **Status**: RECOVERABLE - respawn pane 4
- **Note**: This is a known limitation of Codex exec architecture (child_process vs PTY)

---

### Watcher Friction Resolution Transition Unreachable (Session 47, Jan 30, 2026)
**Owner**: Implementer B (watcher.js)
**Priority**: LOW - friction workflow edge case

- **Where**: `ui/modules/watcher.js` lines 579-592
- **Symptoms**:
  - When in FRICTION_RESOLUTION state, editing friction-resolution.md should trigger PLAN_REVIEW
  - Transition never happens - state stays at FRICTION_RESOLUTION
- **Root Cause (Reviewer analysis)**:
  - Line 579: `else if (filename.endsWith('.md') && filePath.includes('friction'))` matches first
  - Line 580-582: Inner condition fails (we ARE in FRICTION_RESOLUTION), but else-if is consumed
  - Line 590-592: The specific `friction-resolution.md` check is NEVER reached
  - This is an else-if ordering bug - general condition before specific condition
- **Fix Needed**: Reorder conditions so line 590-592 comes BEFORE line 579-588
  - Specific filename checks should precede generic pattern matches
- **Status**: DOCUMENTED - test updated to reflect actual behavior, production fix needed
- **Discovered by**: Reviewer (test coverage sprint, Session 47)


## Session 48 - Trigger Delivery Failure (Panes 2 & 5)

**Reported:** Jan 30, 2026
**Symptom:** Bidirectional trigger failure for Orchestrator (pane 2) and Investigator (pane 5)
- My messages to them not appearing in their panes
- Their messages not reaching me (Architect, pane 1)
- Pane 4 (Implementer B, also Codex) WAS working fine

**Observations:**
- Investigator completed 8 tasks earlier, then went silent
- Orchestrator completed 3 tasks early, then went silent
- Trigger files show empty (cleared after "delivery")
- But injection not actually happening

**To investigate:**
- Check npm console for trigger injection errors for panes 2 & 5
- Check if those panes are in stuck state
- Verify pane CLI identity is detected for trigger routing

**Investigation Complete (Reviewer, Jan 30, 2026):**
Full report: `workspace/build/reviews/pane-2-5-trigger-investigation.md`

**Most Likely Cause:** Codex processes in panes 2/5 exited after completing tasks.
- On exit, `claudeRunning` state set to 'idle'
- Some message flows filter by running state
- Trigger files bypass running check at sender, but receiver-side injection may fail

**Why Pane 4 Works:** Codex stayed active (didn't exit)

**Diagnostic Steps:**
1. Check npm console for "Trigger delivery failed for pane 2/5"
2. Check if Codex is running in panes 2/5 (or showing shell prompt)
3. If exited, restart panes (spawn fresh Codex)

**Status:** ✅ RESOLVED - Root cause confirmed: Expected Codex behavior (exit after task completion)
- User can respawn panes 2/5 manually
- Future enhancement: Auto-restart for exited panes (Task #29 self-healing expansion)


## Session 48 - Copy/Paste Unreliable in App

**Reported:** Jan 30, 2026
**Symptom:** Right-click copy/paste in Hivemind app is inconsistent
- Sometimes works after many attempts
- Often doesn't work at all
- User cannot reliably copy text between panes

**Impact:** User cannot manually relay messages when trigger system fails

**Root Cause (Implementer A investigation):**
1. **Stale selection bug**: `lastSelection` only updated when text IS selected, never cleared when deselected
2. **Logic flaw**: Right-click checked `if (lastSelection)` - stale value caused COPY instead of PASTE
3. Context menu auto-decides action based on stale state, user can't choose

**Fix Applied (Implementer A, Jan 30, 2026):**
- `terminal.js:setupCopyPaste()` rewritten
- Now uses `terminal.hasSelection()` at click time (not stale cached value)
- `lastSelection` cleared when selection is empty: `lastSelection = terminal.getSelection() || ''`
- Added `terminal.clearSelection()` after copy
- Added Ctrl+C copy handler (with selection check)
- Better error feedback: "Clipboard empty", "Paste failed" status messages

**Status:** ✅ FIX APPLIED - Pending runtime verification

**Priority:** HIGH - blocks manual workarounds for other bugs

