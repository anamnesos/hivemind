# Build Friction Log

Track problems and patterns as we build Hivemind. This feeds into improving the system.

---

## Format

```
### [Date] - [Category] - [Summary]
**What happened**: Description
**Root cause**: Why it happened
**Resolution**: How we fixed it
**Pattern**: Is this likely to recur?
**Improvement**: What should Hivemind do differently?
```

---

## Categories

- `onboarding` - New instance setup issues
- `coordination` - Communication between instances
- `conflict` - File conflicts or ownership issues
- `spec` - Unclear or missing spec
- `tooling` - CLI, imports, dependencies
- `review` - Review process issues

---

## Friction Log

### Jan 18 2026 - onboarding - Instances didn't auto-register

**What happened**: New instances opened with "how can I help you today" - didn't know their role or what to do.

**Root cause**: CLAUDE.md existed but didn't have auto-registration instructions. Expected user to manually assign roles.

**Resolution**: Created `docs/claude/REGISTRY.md` with role tracking. Updated CLAUDE.md with "AUTO REGISTER" instructions - instances now claim first OPEN role automatically.

**Pattern**: Yes - any new multi-instance project will hit this.

**Improvement**: Hivemind should auto-generate CLAUDE.md and REGISTRY.md when initializing a new project workspace.

---

### Jan 18 2026 - onboarding - No CLAUDE.md initially

**What happened**: Project had docs but no CLAUDE.md, so instances had no entry point.

**Root cause**: Initial brainstorm session created architecture docs but not the instance onboarding file.

**Improvement**: Hivemind project template should include CLAUDE.md as mandatory file.

---

### Jan 18 2026 - integration - UI called manager with wrong arguments

**What happened**: UI passed `roles_path` to HivemindOrchestrator but the constructor only accepts `workspace`.

**Root cause**: Lead wrote ui.py without checking manager.py's actual signature. Worker A wrote manager.py to get roles_path from settings internally. No integration test caught the mismatch.

**Resolution**: Removed `roles_path` argument from ui.py.

**Pattern**: YES - parallel development without integration testing.

**Improvement**:
1. Reviewer should run actual integration tests, not just type checks
2. Before wiring components, verify function signatures match
3. Hivemind should validate component interfaces match before spawning

---

### Jan 18 2026 - integration - Relative paths broke when running from task directory

**What happened**: `roles_path` was `./roles` (relative). When orchestrator ran from `workspace/tasks/task_xxx/`, it couldn't find roles.

**Root cause**: Settings used relative paths. No one tested running from a subdirectory.

**Resolution**: Changed settings.py to use absolute paths via `PROJECT_ROOT`.

**Pattern**: YES - relative paths are fragile.

**Improvement**:
1. Always use absolute paths in settings
2. Hivemind should resolve all paths to absolute at startup
3. Add startup validation that required directories exist

---

### Jan 18 2026 - process - No integration testing before "done"

**What happened**: All components passed individual review but failed when wired together.

**Root cause**: Reviewer checked types and imports but didn't run a full integration test.

**Resolution**: Lead did manual integration after the fact.

**Pattern**: YES - this is exactly what Hivemind is supposed to prevent.

**Improvement**:
1. Sprint should include explicit integration task
2. Reviewer should run actual end-to-end test before approving
3. Hivemind's Reviewer agent should be required to test, not just read

---

### Jan 18 2026 - integration - Orchestrator didn't process initial state

**What happened**: UI showed "task created, spawning orchestrator" but nothing happened. Stuck forever.

**Root cause**: `HivemindOrchestrator.run()` used `awatch()` to watch for file CHANGES, but never processed the INITIAL state. Since state.json was already `task_created` when orchestrator started, it just waited for a change that never came.

**Resolution**: Added initial state processing before the watch loop.

**Pattern**: YES - event-driven systems need to handle initial state, not just changes.

**Improvement**:
1. Always process initial state before entering watch loops
2. Hivemind should log "waiting for changes" vs "processing" so it's obvious when stuck
3. Add timeout for initial processing - if nothing happens in 10s, something's wrong

---

### Jan 18 2026 - tooling - Claude Code CLI headless mode permissions and CLAUDE.md

**What happened**: Multiple issues getting spawned Claude to write files:
1. `--dangerously-skip-permissions` didn't work
2. `--permission-mode bypassPermissions` didn't work
3. `--system-prompt` with role files caused issues
4. CLAUDE.md in parent directories overrode instructions

**Root cause**:
1. Permission flags don't work the way docs suggest for file writes
2. CLAUDE.md is auto-discovered and followed, even with custom system prompts
3. Multi-line prompts cause argument parsing issues

**Resolution**:
1. Use `--allowedTools "Read,Edit,Write,Bash,Glob,Grep"` for permissions
2. Keep instructions simple single-line
3. Put workspace OUTSIDE any CLAUDE.md project directory (`~/.hivemind/workspace`)
4. Don't use complex system prompts - just give clear instructions

**Pattern**: YES - headless Claude Code requires specific incantations.

**Improvement**:
1. Document the exact CLI flags that work for headless automation
2. Hivemind workspace should be in user home, not project dir
3. Test CLI invocation thoroughly before building on it
4. **Enable WebSearch for agents** - when unsure about APIs or CLI, agents should search for current info

---

### Jan 18 2026 - tooling - Claude CLI argument parsing issue with long system prompt

**What happened**: Claude CLI failed with "Input must be provided either through stdin or as a prompt argument when using --print".

**Root cause**: Passing the instruction as a positional argument after `--system-prompt` with a long multi-line role prompt caused argument parsing issues on Windows.

**Resolution**: Pass instruction via stdin using `process.communicate(input=instruction.encode())` instead of as positional argument.

**Pattern**: YES - complex CLI arguments with multi-line content are fragile.

**Improvement**:
1. Prefer stdin for passing prompts to CLI tools
2. Consider writing system prompts to temp files for very long content
3. Test CLI invocation with real-world length arguments

---

### Jan 18 2026 - tooling - Windows subprocess can't find claude command

**What happened**: Spawner tried to run `claude` but got `[WinError 2] The system cannot find the file specified`.

**Root cause**: `asyncio.create_subprocess_exec` on Windows doesn't search PATH like a shell does. It needs the full path to the executable.

**Resolution**: Added `get_claude_executable()` function that uses `shutil.which()` to resolve the full path.

**Pattern**: YES - Windows vs Unix subprocess behavior is a common gotcha.

**Improvement**:
1. Always resolve executable paths explicitly, don't rely on PATH search
2. Test on Windows early - most devs test on Mac/Linux first
3. Hivemind should validate claude CLI is accessible at startup

---

### Jan 18 2026 - coordination - User had to relay Reviewer findings to Lead

**What happened**: Reviewer found main.py bug (line 61), wrote it to blockers.md. User had to manually copy/paste the finding to Lead instance.

**Root cause**: Instances don't actively check shared files (blockers.md, errors.md). Each instance works in isolation until user relays information.

**Resolution**: Updated CLAUDE.md to instruct all instances to check blockers.md before AND after their work.

**Pattern**: YES - this defeats the purpose of multi-agent coordination.

**Improvement**:
1. CLAUDE.md must instruct instances to poll shared files
2. Hivemind should have a "notification" mechanism - when Reviewer writes a blocker, Lead gets notified
3. Consider a shared "inbox" per role that other instances can write to
4. The orchestrator (when running) should handle this - but manual builds need workaround

---

### Jan 24 2026 - conflict - File write conflicts during consensus voting

**What happened**: When all 4 agents tried to add their vote to `improvements.md` simultaneously, each agent got "File has been modified since read" errors repeatedly. Took 3-4 retries per agent to get their vote recorded.

**Root cause**: Multiple agents reading the same file, then trying to edit it. First writer wins, others fail and must re-read.

**Resolution**: Agents manually retry until their edit succeeds. Tedious but worked.

**Pattern**: YES - any time multiple agents need to write to the same file (voting, status updates, logs), this will happen.

**Improvement**:
1. **Append-only protocol** - Instead of editing, agents append to files. Coordinator merges.
2. **Agent-specific files** - Each agent writes to `improvements-agent4.md`, system aggregates.
3. **Lock acquisition** - Agents request lock before editing shared files.
4. **Conflict Detection we're building** - Ironic that we hit the exact problem during the vote to fix it!

**Note**: This friction validates the Conflict Detection feature we're currently building.

---

### Jan 24 2026 - coordination - No visibility into worker progress during EXECUTING

**What happened**: While Workers are building features, Reviewer has no visibility into their progress. Just waiting for checkpoint.md with no idea if they're stuck, done, or still working.

**Root cause**: File-based coordination is async. No real-time streaming of worker activity.

**Resolution**: (none yet - this is what Progress Streaming proposal addresses)

**Pattern**: YES - every EXECUTING phase has this visibility gap.

**Improvement**: The "Progress Streaming" proposal (currently DEFERRED) would solve this. Consider moving it up in priority after current sprint.

---

### Jan 25 2026 - tooling - Terminal autocomplete auto-submits to agent terminals

**What happened**: Terminal autocomplete suggestions were automatically entered into agent terminals without user confirmation. Agents received unintended commands like "commit this" or "start mcp" that the user didn't intentionally send.

**Root cause**: Autocomplete feature auto-submits recommended messages to terminal panes without requiring explicit user confirmation (Enter/Tab).

**Resolution**: Fixed in commit 0ba5cb7 - added autocomplete="off" attributes and defensive keydown handler. However, this fix introduced a REGRESSION (see next entry).

**Pattern**: YES - any time autocomplete is active, accidental submissions can occur. Happened multiple times in same session.

**Severity**: HIGH - actively disrupting workflow. Occurred 3+ times in 10 minutes.

**Improvement**:
1. Require explicit Enter/Tab to accept autocomplete suggestions
2. Add confirmation before injecting suggested messages to agent terminals
3. Consider disabling autocomplete in agent terminal panes entirely
4. Add visual distinction between "suggestion" and "submitted" states

---

### Jan 25 2026 - tooling - Terminal keyboard input broken after autocomplete fix

**What happened**: After the autocomplete bug fix (commit 0ba5cb7), users could not type in any terminal panes. Only broadcast input worked. Clicking on terminals didn't give them keyboard focus. ESC key didn't interrupt agents.

**Root cause**: The autocomplete fix added a `focusin` event listener that called `blurAllTerminals()` whenever ANY textarea got focus. However, xterm.js uses an internal textarea (`xterm-helper-textarea`) for keyboard input. When user clicked a terminal, xterm focused its internal textarea, which triggered the focusin handler, which immediately blurred the terminal.

**Resolution**: Modified renderer.js focusin handler to check for `xterm-helper-textarea` class and skip blurring for xterm's internal textarea.

**Pattern**: YES - fixing one bug can introduce regressions in related functionality.

**Severity**: CRITICAL - app was unusable, terminals couldn't receive keyboard input.

**Improvement**:
1. Test terminal focus/keyboard input after any changes to focus handling
2. Understand how xterm.js manages focus internally before modifying focus behavior
3. Consider integration tests for basic terminal input/output

---

### Jan 25 2026 - tooling - Auto-spawn Claude on start unreliable

**What happened**: User had to press "Spawn All Claude" button 4 times to get all agents to load, even though "auto spawn claude on start" was toggled on.

**Root cause**: Race condition in startup sequence. Three async operations racing:
1. `loadSettings()` - fetches settings from main process
2. `daemon-connected` event - initializes terminals
3. `checkAutoSpawn()` - runs on fixed 1-second setTimeout

If settings aren't loaded OR daemon isn't connected within 1 second, auto-spawn fails silently because:
- `currentSettings.autoSpawn` is undefined (settings not loaded), OR
- Terminals aren't initialized yet (daemon not connected)

**Resolution**: Fixed - added init state tracking in renderer.js:
- `initState` object tracks `settingsLoaded` and `terminalsReady` flags
- `checkInitComplete()` only calls `checkAutoSpawn()` when BOTH are true
- `markSettingsLoaded()` called from settings.js after loadSettings completes
- `markTerminalsReady()` called from daemon-handlers after daemon-connected handling completes
- Removed the fixed 1-second setTimeout that caused the race condition

**Pattern**: YES - any startup feature that depends on multiple async initializations will have this issue.

**Severity**: MEDIUM - annoying but user can work around with manual button click.

**Improvement**:
1. Use a proper initialization state machine instead of fixed timeouts
2. Track both `settingsLoaded` and `terminalsReady` flags
3. Only call `checkAutoSpawn()` when both are true
4. Or use Promise.all to wait for both before proceeding

---

### Jan 25 2026 - coordination - Triggers interrupt active agents during stress test

**What happened**: During trigger stress test, all agents except Worker A got repeatedly interrupted mid-response. Messages were being delivered but agents couldn't complete their replies before next trigger came in.

**Root cause**: Trigger injection sends messages to terminal regardless of agent state. When agent is actively generating a response, injected text interrupts the Claude process (similar to Ctrl+C).

**Observations**:
- Worker A survived because was idle when triggers arrived
- Active agents (Lead, Worker B, Reviewer) were in chat loop, constantly cut off
- Race condition on trigger file writes also caused "file modified since read" errors

**Resolution**: (none yet - needs V15+ fix)

**Pattern**: YES - any time multiple agents are actively chatting, triggers will disrupt.

**Severity**: HIGH - breaks real-time collaboration.

**Improvement** (from Reviewer):
1. Message queuing - hold triggers until agent is idle
2. Non-interruptive injection - append without disrupting current output
3. Agent state awareness - check if Claude is mid-response before injecting

---

(Add new entries as friction occurs)
