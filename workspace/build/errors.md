# Build Errors

**Check this file when something breaks. Update it when you fix something.**

---

## Active Errors

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
- **Status**: ✅ FIX V2 APPROVED (Reviewer #15, Session 27) - Pending restart verification
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
