# Build Errors

**Check this file when something breaks. Update it when you fix something.**

---

## Active Errors

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

### Focus Stealing on Terminal Output (Hivemind UI Bug)
- **Where**: ui/renderer.js - terminal output handling
- **Cause**: When agents respond, their terminal pane calls `.focus()`, stealing input focus from wherever user is typing (including broadcast input)
- **Symptoms**: User tries to type in broadcast field, focus jumps to active terminal mid-typing, input gets hijacked
- **Fix Needed**: Prevent auto-focus on terminal write/output events. Only focus terminal on explicit user click.
- **Status**: Identified, not yet fixed
- **Discovered**: Stress test session Jan 25, 2026

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
