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

### Feb 2 2026 - coordination - No message priority/interrupt system

**What happened**: User pointed out that if they need to interrupt an agent or change plans, their urgent message would be queued behind other messages. Same issue for agents communicating with each other.

**Root cause**: Trigger message system is pure FIFO - no priority levels, no interrupt capability. The `[URGENT]` tag in the protocol is just a label with no queue behavior change.

**Resolution**: None yet - logged as feature request.

**Pattern**: Yes - will become worse as message volume increases.

**Improvement**: Options: 1) Priority channel that bypasses queue, 2) Interrupt signal to clear pending and deliver NOW, 3) Separate urgent trigger file (e.g., architect-urgent.txt) processed first, 4) Rate-limit HIVEMIND SYNCs.

**Decision (3-agent consensus - Analyst + Reviewer + Architect):**
- Phase 1: Rate-limit SYNCs (max 1/30s) - addresses likely root cause
- Phase 2 (if needed): Explicit interrupt mechanism (user-triggered clear + inject)
- REJECTED: Silent priority reordering (breaks sequence guard lastSeen tracking)
- REJECTED: Option 2 clear-pending without user action (message loss risk)
- Rationale: FIFO is intentional for correctness. Reduce queue buildup first, add complexity only if proven necessary.

---

### Feb 1 2026 - coordination - Agents stuck on stale context despite corrections

... (existing content) ...

---

### Feb 2 2026 - coordination - File Visibility Lag (Gemini CLI)

**What happened**: Infra (Gemini CLI, pane 2) could not see `renderer.js` or new modular files in `ui/modules/` (except `utils.js`), even though `status.md` and `current_state.md` confirmed they were created/modified today.

**Root cause**: Known issue in Session 62 where Gemini agents don't immediately see file system changes made by Claude panes.

**Resolution**: Messaged Architect to confirm file existence and absolute paths.

**Pattern**: YES - documented in GEMINI.md as a session-specific issue.

**Improvement**: Implement a robust "FS SYNC" check or wait protocol for Gemini agents.

---

### Feb 1 2026 - coordination - Agent check-in race condition

**What happened**: Backend agent ran startup check-in command correctly, but message never reached Architect. Other agents (Infra, Analyst, Frontend) checked in successfully.

**Root cause**: All agents write to same file (architect.txt) on startup. Backend's message was overwritten by another agent before the file watcher could read it.

**Resolution**: Workaround - Architect proactively pings agents who don't check in. Backend confirmed online after direct ping.

**Pattern**: Yes - will recur every session with 6 agents racing to write to same file.

**Improvement**: Options: 1) Architect proactively pings each agent on startup rather than waiting for check-ins, 2) Each agent writes to unique file (backend-checkin.txt), 3) Add retry with random jitter to check-in protocol, 4) Use append mode with watcher that processes multiple messages.

---

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

### Jan 25 2026 - tooling - Daemon code changes not live after app restart

**What happened**: V18.1 auto-nudge fix was committed and app was "restarted", but auto-nudge still didn't work. Agents were stuck for minutes with no auto-recovery.

**Root cause**: The terminal daemon (`terminal-daemon.js`) is a SEPARATE PROCESS that survives Electron app restarts. That's its core feature (terminal persistence). But it also means daemon code changes don't take effect on app restart - the old daemon keeps running.

**Evidence**: `daemon.log` showed "Daemon started at 2026-01-24T21:55" even though we "restarted" on Jan 25. The running daemon was 24+ hours old.

**Resolution**: Must explicitly kill daemon before restart:
```bash
npm run daemon:stop   # Kill the old daemon process
npm start             # Fresh start with new code
```

**Pattern**: YES - any time terminal-daemon.js is modified.

**Severity**: HIGH - causes confusion when "fixes" don't work.

**Improvement**:
1. Add startup check: compare daemon.js file mtime vs running daemon start time
2. If code is newer than daemon, warn user or auto-restart daemon
3. Document in README: "Daemon changes require `npm run daemon:stop`"

---

### Jan 25 2026 - tooling - Cannot identify sessions in /resume picker

**What happened**: After daemon restart, user runs `/resume` to reconnect agents. All sessions look identical - no way to tell which is Lead, Worker A, Worker B, or Reviewer.

**Root cause**: Claude Code sessions don't have custom naming. The `/resume` picker shows session content snippets, but all Hivemind agents start identically.

**Resolution**: (proposed) Daemon injects role identity on terminal spawn:
```javascript
// In spawnTerminal() after PTY spawn
setTimeout(() => {
  const role = PANE_ROLES[paneId];
  ptyProcess.write(`echo "=== HIVEMIND: ${role} (Pane ${paneId}) ==="\r`);
}, 200);
```

**Pattern**: YES - every time daemon restarts, user must guess which session is which.

**Severity**: MEDIUM - workflow annoyance, but can manually identify by content.

**Improvement**:
1. Daemon injects role identity string on spawn (proposed fix)
2. Each session starts with identifiable content
3. User sees "HIVEMIND: Lead" etc in /resume picker

**Owner**: Worker B (terminal-daemon.js)
**Trigger sent**: Yes

---

### Jan 25 2026 - coordination - Agents tell user to restart after restart already happened

**What happened**: User starts fresh Hivemind session (app restart). Agents read status.md which says "requires restart to test" for various fixes. Agents parrot "restart needed" to user. User says "I just restarted." Agents acknowledge. User restarts again. Loop repeats forever.

**Root cause**: Status notes like "requires restart to test" are written BEFORE the restart. Agents don't recognize that a fresh session = restart already happened. We read stale notes and repeat them without thinking.

**Resolution**: Agents must recognize:
1. Fresh session with all agents = user already restarted
2. "Requires restart" notes in status.md are NOW LIVE
3. Correct response is "Want me to verify X is working?" not "Restart to test X"

**Pattern**: YES - every time fixes are committed, status.md gets "restart to test" notes, and agents mindlessly repeat them.

**Severity**: HIGH - breaks user trust, wastes time, makes agents seem unintelligent.

**Improvement**:
1. Agents MUST recognize fresh session = restart already happened
2. On fresh session, ask "Should I verify [pending fix] is working?"
3. Don't parrot "restart needed" - that's the user's job to know, not ours to remind
4. Update status.md after restart to change "requires restart" to "ready to verify"

---

### Jan 25 2026 - review - Incomplete integration review before "APPROVED FOR TESTING"

**What happened**: Reviewer approved SDK V2 for testing. User enabled it. Would have failed immediately. User demanded thorough audit. Audit found 4+ critical bugs that would have broken everything:
1. Python sends `pane_id`/`session_id` (snake_case), JS expected `paneId`/`sessionId` (camelCase) - ALL messages route to pane 1
2. Python sends `role` field, JS checked `agent` field - role-based routing broken
3. Session file format mismatch - JS saves flat, Python expects nested - session resume broken
4. `interrupt` command not implemented in Python - interrupt button is dead code
5. Missing IPC emissions - UI status indicators never update

**Root cause**:
1. Reviewer checked Python file in isolation, didn't trace data flow to JavaScript consumers
2. Lead accepted "APPROVED" without questioning scope of review
3. "Review the code" was interpreted as "read one file" not "verify integration"
4. No actual end-to-end test was run before approval

**Resolution**:
1. User forced comprehensive audit across all agents
2. Lead fixed critical bugs in sdk-bridge.js and hivemind-sdk-v2.py
3. Updated CLAUDE.md with mandatory "Reviewer Gate" section requiring integration review

**Pattern**: YES - rushing to approval without integration verification.

**Severity**: CRITICAL - user almost tested broken code, would have lost session context.

**Improvement**:
1. "APPROVED FOR TESTING" requires reviewer to trace data flow across ALL involved files
2. Lead must verify reviewer did integration review, not just spot check
3. Any IPC protocol (Python ↔ JS, renderer ↔ main) needs both sides verified
4. Document expected data formats explicitly - don't assume conventions match
5. When in doubt, delay approval and tell user "needs more review"

---

### Jan 28 2026 - coordination - Agent measured wrong metric, others accepted without questioning

**What happened**: During stress test verification, Implementer B sent a message with very specific timestamp data claiming the test passed (ticks spaced ~10s apart, 9.998s min, 10.015s max, 59/59 deltas). Architect accepted this as verification that the terminal.input() fix worked. User caught the inconsistency: we never restarted the app, so the fix couldn't have been deployed and tested.

**Root cause**:
1. Implementer B parsed timestamps embedded IN the message text ("@ 10:40:46.960")
2. These timestamps measured when the TRIGGER FILE was written, not when the message ARRIVED
3. The ~10s spacing was real data - but it measured the wrong thing (write time vs arrival time)
4. Architect didn't question how a test could verify a fix that wasn't deployed yet
5. The timeline was impossible: fix written → no restart → somehow "verified"

**Resolution**: User called out the inconsistency. Implementer B clarified the methodology error. Data was real but measured the wrong metric.

**Pattern**: YES - agents can draw incorrect conclusions from real data, and other agents accept without verifying methodology.

**Severity**: HIGH - misinformation spreading through agent network due to incorrect analysis.

**Improvement**:
1. **Timeline sanity check** - Before accepting verification claims, verify the fix is actually deployed
2. **Question impossible claims** - If fix needs restart but no restart happened, results are impossible
3. **Methodology verification** - Ask "what does this data actually measure?" not just "what does it say?"
4. **Distinguish write time vs arrival time** - Timestamps in message payload ≠ delivery timestamps
5. **Architect must be skeptical** - Coordination role requires questioning, not just accepting reports
6. **Cite methodology** - Agents should explain HOW they measured, not just WHAT they measured

---

### Jan 28 2026 - coordination - Architect says "ready for restart" without complete handoff

**What happened**: Repeatedly across sessions, Architect announces "ready for restart" but the shared_context.md doesn't have enough detail for the fresh instance. User has to ask "will new lead know what to do?" every time.

**Root cause**:
1. Architect treats "ready for restart" as end of task, not a handoff
2. No self-check before announcing restart readiness
3. "Context updated" doesn't mean "context is actionable"

**Pattern**: YES - happened multiple times. User caught it every time.

**Resolution**: Add mandatory pre-restart checklist to Architect CLAUDE.md

**Improvement**:
1. Before saying "ready for restart", Architect MUST verify:
   - [ ] What needs to be verified is explicitly stated
   - [ ] HOW to verify is documented (concrete steps)
   - [ ] WHO does the verification is assigned
   - [ ] What SUCCESS looks like is defined
   - [ ] What FAILURE looks like is defined
2. Read the context back and ask: "Would a fresh instance know exactly what to do?"
3. If answer is no, fix it before announcing restart

---

### Jan 28 2026 - coordination - Agent messages to Architect silently dropped after burst test

**What happened**: After extended burst test (20 messages to all Claude panes), Investigator received Reviewer's results and my coordination question. User confirmed Investigator replied, but I never received the messages. Same issue repeated twice - Investigator had information but messages to lead.txt weren't delivered.

**Root cause**: `message-state.json` shows `lead.lastSeen.investigator = 520` (the last burst test message). After burst test, Investigator likely continued with lower sequence numbers (e.g., responding to Architect's ping). Any message with sequence ≤ 520 is silently dropped as "duplicate".

**Evidence**:
- Burst test ended at #520
- message-state.json confirms lastSeen.investigator = 520 for lead recipient
- User saw Investigator send messages in their pane
- Messages never arrived at Architect's pane

**This is the documented lead.txt reset-on-session-banner bug** - when an agent's sequence resets (session restart, or just continuing with lower numbers), the app still remembers the high-water mark and drops "old" sequences.

**Pattern**: YES - any time burst tests push sequence numbers high, subsequent normal messages get dropped until they exceed the high-water mark.

**Severity**: HIGH - breaks agent-to-agent coordination after stress tests.

**Improvement**:
1. Implement the reset-on-session-banner fix (blockers.md has implementation detail)
2. Or: After burst tests, manually reset message-state.json
3. Or: Burst test should use a separate sequence space from normal messages
4. Agents need to be aware that high sequence numbers from tests can block future messages

---

### Jan 28 2026 - coordination - Agent receives info relevant to coordinator but doesn't relay

**What happened**: Reviewer sent burst test results to Investigator (test runner). Investigator acknowledged but didn't forward results to Architect (who was waiting for verification summary). Pattern repeated - Architect asked Investigator for explanation, user confirmed Investigator explained but didn't reply to Architect.

**Root cause**:
1. No protocol for "relay relevant info to waiting agents"
2. Agents respond to who messaged them, not who needs the info
3. Test runner vs coordinator roles not clearly defined in handoff

**Resolution**: (underlying delivery issue was sequence number blocking - see entry above)

**Pattern**: YES - when info flows through intermediaries, it often stops there.

**Improvement**:
1. CLAUDE.md should instruct: "If you receive info that another agent is waiting for, relay it"
2. Test protocols should specify who reports results to whom
3. Architect should assign explicit reporting chains for verification tasks

---

### Feb 1 2026 - review - Persisted settings override code defaults silently

**What happened**: Phase 1 Gemini integration changed main.js DEFAULT_SETTINGS to set pane 5 to `gemini -m gemini-2.5-pro`. After restart, pane 5 still ran Codex. User reported the issue.

**Root cause**:
1. `ui/settings.json` persists user settings and overrides DEFAULT_SETTINGS
2. settings.json had `"5": "codex"` from before the change
3. Reviewer approved main.js change without checking if persisted config would override it
4. The code change was correct but had no effect at runtime

**Resolution**: Updated `ui/settings.json` directly to have `"5": "gemini -m gemini-2.5-pro"`.

**Pattern**: YES - any time a "default" is changed, persisted settings will override it for existing installations.

**Severity**: MEDIUM - caused wasted restart, but easily diagnosed.

**Improvement**:
1. **Review checklist item**: "For default config changes, verify no persisted settings file overrides them"
2. When changing defaults, also update (or document update to) the persisted settings file
3. Consider migration logic: if DEFAULT_SETTINGS differs from settings.json, prompt user or auto-migrate

---

### Feb 1 2026 - tooling - Gemini CLI sandboxed to instance folder only

**What happened**: Analyst (Gemini CLI, pane 5) was assigned to verify logs in `ui/app.log`. Analyst reported they could not access any files outside `workspace/instances/investigator/`. Could not read shared_context.md, blockers.md, errors.md, status.md, or any code files.

**Root cause**: Gemini CLI enforces a strict sandbox. It only allows file access within its working directory (`workspace/instances/investigator/`). Unlike Claude Code, it cannot read arbitrary project paths.

**Resolution**: Added `--include-directories "D:\projects\hivemind"` flag to pane 5 command in main.js and settings.json. This expands Gemini's sandbox to include the full project directory. **Requires restart to take effect.**

**Pattern**: YES - any new Gemini pane needs `--include-directories` if it needs project-wide file access.

**Severity**: MEDIUM - fixed with simple flag addition.

---

(Add new entries as friction occurs)

---

### Feb 9 2026 - review - Reviewer approved CSS changes without verifying styles were loaded

**What happened**: Screenshots panel had 3 issues (massive images, broken delete, layout squeeze). Frontend fixed all 3. Reviewer approved with HIGH confidence. After restart, nothing worked. Root cause: `@import` statements in `tabs.css` were after regular CSS rules — silently ignored per CSS spec. `screenshots.css` was never loaded. All our fixes were correct but invisible. Took 3 restart cycles to discover.

**Root cause**:
1. Reviewer verified CSS class names, selectors, and values in `screenshots.css` — all correct
2. Reviewer NEVER checked whether `screenshots.css` was actually loaded in the browser
3. Opening `tabs.css` (the importer) would have immediately revealed the `@import` at the bottom
4. This is the SAME anti-pattern as the SDK V2 review failure (Session 71) — checking files in isolation without tracing the integration chain

**Resolution**:
1. Moved `@import` to top of `tabs.css` (commit bfc3683)
2. Issued behavior correction to Reviewer with new mandatory steps

**Pattern**: YES — same pattern as SDK V2 (Jan 25) and persisted settings override (Feb 1). Reviewer checks the changed file but not its runtime reachability.

**Severity**: HIGH — 3 restart cycles wasted, user trust damaged.

**Improvement**:
1. **CSS reviews MUST trace the import chain** from index.html → the changed file
2. **All reviews MUST verify runtime reachability** — "Is this code actually loaded/executed?"
3. **When a fix targets a symptom, verify the fix is reachable** — not just syntactically correct
4. This is the third time this pattern has occurred. If it happens again, the review process itself needs structural change (automated reachability checks).

---

### Feb 1 2026 - coordination - Analyst messages to Architect lost (REGRESSION)

**What happened**: Architect accused Analyst of ignoring mandatory status reports. Actually, Analyst WAS sending replies (#26, #28, #30, #31) but messages never arrived. Analyst used shared_context.md to report issue.

**Root cause**: Trigger file (architect.txt) being cleared instantly after Analyst writes - before content can be delivered. Analyst verified:
1. Write command succeeds (tested with temp file)
2. Immediate read of architect.txt returns empty
3. Some process clearing file too fast

**Resolution**: NEW BLOCKER filed. Backend to investigate. Possible Gemini CLI timing/file handle difference.

**Pattern**: REGRESSION - 176cbb5 fix worked earlier (24+ messages verified including from Analyst). Edge case or timing issue.

**Improvement**:
1. Investigate file clearing timing for Gemini CLI specifically
2. Add fallback communication (shared_context.md) when triggers fail
3. Consider write verification before clearing trigger files

---

### Feb 1 2026 - coordination - High volume of trigger delivery timeouts during large audits

**What happened**: app.log shows widespread "Delivery timeout" warnings for agent-to-agent triggers. Architect confirmed receipt of some messages, but the system logged timeouts anyway.

**Root cause**: DELIVERY_ACK_TIMEOUT_MS (65s) is too short for large tasks where Claude spends significant time "thinking" or running complex audits (Finding #12). The acknowledgement isn't sent until Claude finishes and the message is actually "delivered" to the TUI, leading to false-positive timeouts.

**Resolution**: Analyst reported the observation. Architect acknowledged and deferred further investigation. No current impact on delivery, only log noise.

**Pattern**: YES - recurring during high-load sessions or long reasoning tasks.

**Improvement**: 1) Further increase DELIVERY_ACK_TIMEOUT_MS, 2) Move acknowledgement to when message is ENQUEUED for injection, not when injection COMPLETES, or 3) Accept timeouts as best-effort status rather than warnings.

