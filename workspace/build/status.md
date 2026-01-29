# Build Status

Last updated: 2026-01-29 - P1 Visibility: Unstick Escalation + Sync Indicator (Implementer B)

---

## P1 Visibility - Unstick Escalation + Sync Indicator (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Added per-pane unstick escalation (nudge -> interrupt -> restart) and sync indicator for shared_context/blockers/errors.

**Files updated:**
- `ui/modules/terminal.js` - unstick escalation, interrupt/restart helpers, syncSharedContext returns success
- `ui/modules/daemon-handlers.js` - sync indicator UI + IPC listeners
- `ui/modules/watcher.js` - sync-file-changed event + auto-sync for blockers/errors
- `ui/renderer.js` - unstick button wiring + manual sync marker + sync indicator setup
- `ui/styles/layout.css` - status bar sync indicator styling

**Notes:** Sync indicator uses runtime DOM injection; auto-sync for blockers/errors respects autoSync setting.

**Status:** READY FOR REVIEW

---

## Renderer Unit Tests Sprint (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Added comprehensive unit tests for renderer-side modules.

**Test Files Created/Updated:**
- `ui/__tests__/triggers.test.js` - 115 tests (message sequencing, SDK mode, routing)
- `ui/__tests__/terminal.test.js` - 104 tests (PTY, idle detection, queuing)
- `ui/__tests__/daemon-handlers.test.js` - 78 tests (IPC handlers, state display)
- `ui/__tests__/sdk-renderer.test.js` - 34 tests (streaming, delivery tracking)

**Coverage Results:**
- Statements: **60.99%**
- Branches: **45.75%** (target 50% not met)
- Functions: **59.63%**
- Lines: **61.84%**
- Total Tests: **418 passing** (9 test suites)

**Coverage Gap Analysis:**
The 4.25% branch gap is primarily due to IPC event handler callbacks and complex state machine transitions that require integration testing rather than unit tests.

**Status:** COMPLETE - Ready for Reviewer verification

---

## Unit Tests - Main Process Modules (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Added Jest coverage for `modules/watcher.js` and `modules/logger.js`, plus test scaffolding.

**Files updated:**
- `ui/__tests__/watcher.test.js` - state transitions, conflict queue, message queue, auto-sync, trigger routing
- `ui/__tests__/logger.test.js` - log levels, formatting, scope, file output
- `ui/__tests__/setup.js` - global logger mock for non-logger tests
- `ui/jest.config.js` - expanded coverage collection + thresholds

**Coverage (npm run test:coverage):**
- Statements: **63.9%**
- Branches: **51.58%**
- Functions: **71.42%**
- Lines: **64.45%**

**Notes:** Jest warns about open handles after tests; all suites pass.

**Status:** COMPLETE (watcher/logger). Remaining targets: `mcp-server.js`, `codex-exec.js`, `modules/ipc/*.js`.

---

## Error Handling Fixes - Batch A (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Added try/catch and .catch() handlers to 21 unhandled async operations.

**Files updated:**
- `ui/renderer.js` - 5 fixes (SDK broadcast/send, full-restart, sync, ESC handler)
- `ui/modules/terminal.js` - 14 fixes (clipboard, pty.write, sendTrustedEnter, codexExec, claude.spawn)
- `ui/modules/daemon-handlers.js` - 2 fixes (sdk-interrupt)

**Status:** APPROVED (Reviewer)

---

## Error Handling Fixes - Batch B (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Guarded watcher init and file reads, MCP file IO, daemon PID write, checkpoint rollback dir, and test framework detection.

**Files updated:**
- `ui/main.js` - wrapped did-finish-load init with retry + activity log on failure
- `ui/modules/watcher.js` - try/catch for checkpoint-approved read + initMessageQueue + mkdirs; added watcher error handlers
- `ui/mcp-server.js` - guarded message queue dir, atomic writes, state/status/trigger writes
- `ui/terminal-daemon.js` - guarded PID file write
- `ui/modules/ipc/checkpoint-handlers.js` - rollback dir guard + handler-level checks
- `ui/modules/ipc/test-execution-handlers.js` - safe package.json parse in detect()

**Status:** APPROVED (Reviewer)

**Review:** See `workspace/build/reviews/batch-b-error-handling-review.md` - 50+ error handlers verified across all 6 files.

**Docs commit:** `b35e0b8` - status + review notes recorded.

**Process note:** All Sprint 2 items reviewed and APPROVED. HYBRID fix verified and committed (f52a403).

---

## Logger File Output (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Logger now mirrors console output to `workspace/logs/app.log` and creates `workspace/logs/` if missing. No rotation.

**Files updated:**
- `ui/modules/logger.js`

**Status:** COMPLETE

---

## Version-fix Comment Cleanup Follow-up (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Removed remaining version/fix prefixes while preserving comment meaning. No behavior changes.

**Files updated:**
- `ui/terminal-daemon.js`
- `ui/modules/terminal.js`
- `ui/modules/triggers.js`

**Status:** COMPLETE

---

## Enter Verification + Retry During Active Output (Session 26, Jan 28, 2026)

**Owner:** Implementer A

**Problem:** Force-inject after `MAX_QUEUE_TIME_MS` (10s) fired `sendTrustedEnter()` during active Claude output. Enter was ignored because Claude was still processing, leaving text stuck in textarea.

**Root Cause (Investigator):** The adaptive delay fix handles race conditions at injection time, but doesn't address the case where Enter fires successfully but is ignored by Claude during active output.

**Fix Applied (Implementer A, Jan 28, 2026):**

1. **New `verifyAndRetryEnter()` helper function**:
   - Waits 100ms after Enter for processing
   - Checks if textarea is empty (submit succeeded)
   - If text remains, waits for pane idle (`isIdle()`)
   - Retries `sendTrustedEnter()` up to 5 times

2. **New constants**:
```javascript
const ENTER_VERIFY_DELAY_MS = 100;    // Delay before checking if Enter succeeded
const MAX_ENTER_RETRIES = 5;          // Max Enter retry attempts if text remains
const ENTER_RETRY_INTERVAL_MS = 200;  // Interval between idle checks for retry
```

3. **Integration**: `doSendToPane()` now calls `verifyAndRetryEnter()` after `sendTrustedEnter()` and returns success/failure accordingly

**Files updated:**
- `ui/modules/terminal.js` - verifyAndRetryEnter() + doSendToPane() changes

**Status:** ✅ RUNTIME VERIFIED (Session 27) - 10/10 messages delivered via delivery-ack, no stuck messages

---

## Sequence Reset on Sender Restart (Jan 28, 2026)

**Owner:** Implementer B

**Problem:** Burst tests pushed `lastSeen` high (e.g., 520). When an agent restarts and sends `#1`, subsequent messages are dropped as duplicates (e.g., seq 6 < 520).

**Fix Applied (Implementer B, Jan 28, 2026):**
- In `handleTriggerFile()` after `parseMessageSequence()` and before `isDuplicateMessage()`:
  - If `seq === 1` **and** message contains `# HIVEMIND SESSION:`, reset `lastSeen[sender]` for that recipient to `0`
  - Persist to `message-state.json` and log reset

**Files updated:**
- `ui/modules/triggers.js`

**Status:** COMPLETE - restart to pick up change

---

## Auto-Submit Race Condition Fixed (Jan 28, 2026)

**Owner:** Implementer A

**Problem:** Fixed 50ms delay between PTY text write and `sendTrustedEnter()` was insufficient under load. Enter could fire before text appeared in terminal, leaving messages unsent until manual intervention.

**Root Cause (Investigator analysis):** `doSendToPane()` used hardcoded 50ms delay. Under heavy output or input backlog, terminal needs more time. Also, if textarea disappears during delay, Enter goes to wrong element.

**Fix Applied (Implementer A, Jan 28, 2026):**

1. **Adaptive Enter delay** based on pane activity:
   - Idle pane (no output > 500ms): 50ms delay (fast)
   - Active pane (output in last 500ms): 150ms delay (medium)
   - Busy pane (output in last 100ms): 300ms delay (safe)

2. **Focus retry mechanism**: Up to 3 retry attempts with 20ms delay if initial focus fails

3. **Textarea null guards**:
   - Skip injection if textarea not found (prevents Enter to wrong element)
   - Re-query textarea after delay (handles DOM changes)
   - Abort with warning if textarea disappears before Enter

**New constants added:**
```javascript
const ENTER_DELAY_IDLE_MS = 50;
const ENTER_DELAY_ACTIVE_MS = 150;
const ENTER_DELAY_BUSY_MS = 300;
const PANE_ACTIVE_THRESHOLD_MS = 500;
const PANE_BUSY_THRESHOLD_MS = 100;
const FOCUS_RETRY_DELAY_MS = 20;
const MAX_FOCUS_RETRIES = 3;
```

**New helper functions:**
- `getAdaptiveEnterDelay(paneId)` - Returns delay based on `lastOutputTime`
- `focusWithRetry(textarea, retries)` - Async focus with retry loop

**Files updated:**
- `ui/modules/terminal.js` - doSendToPane() refactored

**Status:** COMPLETE - Ready for review

---

## Message Sequencing Bug Fixed (Jan 28, 2026)

**Owner:** Architect (diagnosis) / Implementer A (fix)

**Problem:** Agent-to-agent messages blocked as "SKIPPED duplicate" even though they never reached the target agent. User had to manually copy-paste messages between panes.

**Root Cause:** In `triggers.js` `handleTriggerFile()`, `recordMessageSeen()` was called BEFORE `sendStaggered()`. If injection failed, the message was already marked as "seen" and retries got blocked.

**Fix Applied (Implementer A, Jan 28, 2026):**
- Moved `recordMessageSeen()` from line 589 (before sending) to AFTER delivery:
  - **SDK path (lines 632-638):** Only records if `allSuccess === true`
  - **PTY path (lines 654-660):** Records after `sendStaggered()` IPC dispatch
- Added logging to track when messages are recorded vs skipped

**Files updated:**
- `ui/modules/triggers.js` - recordMessageSeen timing fix

**Follow-up Fix (Implementer B, Jan 28, 2026):**
- Added deliveryId tracking with pending delivery map + timeout
- Renderer sends `trigger-delivery-ack` after `sendToPane` completion; main forwards ack to triggers
- PTY path now records sequence only after all target panes ack delivery

**Files updated (follow-up):**
- `ui/modules/triggers.js` - delivery tracking + ack handling
- `ui/modules/daemon-handlers.js` - pass deliveryId and send acks
- `ui/modules/terminal.js` - onComplete callbacks for sendToPane
- `ui/main.js` - IPC forwarder for delivery acks

**Status:** COMPLETE - Pending Reviewer verification

---

## Codex Exec Event Handling Fix (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Fixed warning spam from unhandled `item.started` and `item.completed` events in Codex exec JSONL parser. These are lifecycle events from the OpenAI Responses API that were not being recognized.

**Changes:**
- Added `item.started` to `isStartEvent` check for proper [Working...] marker emission
- Added `item.completed` to `isCompleteEvent` check for proper [Task complete] marker emission
- Added fallback in `extractCodexText()` to return `''` (silent) for `item.started` and `item.completed` events without extractable text

**Logic flow:**
1. If `item.completed` has `item.text`, text is extracted (line 76)
2. If no text, event returns `''` (silent lifecycle) instead of `null` (warning)
3. `item.started` is always silent (pure lifecycle event)

**Files updated:**
- `ui/modules/codex-exec.js` - Event type handling

**Status:** APPROVED (Reviewer, Jan 28, 2026)

---

## Activity Log Integration for Triggers (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Added trigger event logging to the Activity Log. The existing "Trigger" filter button in the Activity tab now shows all trigger events with timestamps, target panes, message previews, and context.

**Changes:**
- Added `logActivityFn` module variable to store activity log function
- Updated `init()` to accept `logActivity` parameter
- Added `logTriggerActivity()` helper function (action, panes, message preview, extras)
- Added 8 logging calls at all trigger send points:
  - `notifyAgents` (SDK + PTY paths)
  - `handleTriggerFile` (SDK + PTY paths)
  - `routeTask`
  - `triggerAutoHandoff`
  - `sendDirectMessage` (SDK + PTY paths)

**Files updated:**
- `ui/modules/triggers.js` - Activity logging implementation
- `ui/main.js` - Pass `logActivity` to `triggers.init()`

**Log entry format:**
- Type: `trigger`
- Pane: Target pane ID(s)
- Message: `{action}: {preview}...`
- Details: `{ panes, preview, sender?, mode?, file?, taskType?, from?, to? }`

**Status:** APPROVED (Reviewer, Jan 28, 2026) - Note: 12 logging calls, not 8

---

## Focus-Restore Bug Fix (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Fixed cross-pane focus not restoring after trigger injection. The `!wasXtermTextarea` condition in `doSendToPane()` prevented focus restore when user was in ANY xterm textarea (including a different pane).

**Changes:**
- Removed `!wasXtermTextarea` check from lines 603 and 616
- Removed unused `wasXtermTextarea` variable declaration

**Files updated:**
- `ui/modules/terminal.js`

**Status:** APPROVED (Reviewer, Jan 28, 2026)

---

## Priority 1 — Runtime Stress Test (Jan 28, 2026)

**Owner:** Implementer B (executor) + Reviewer (observer)

**Purpose:** Verify PTY serialization + typing-guard work together after restart.

**Status:** 🟡 **PARTIAL** — Auto-submit + arrival spacing **confirmed by user**; typing-guard + Codex exec throughput still pending.

### Initial Test (Reviewer)

**Test 1: Burst Trigger Delivery**
- Sent 4 rapid burst messages + 47/60 ticks (10s intervals)
- **FALSE POSITIVE**: Messages appeared to arrive but were stuck in textareas
- Subsequent ticks "pushed" stuck messages through in batches
- User observed Implementer A stuck, needed manual intervention

**Root Cause Analysis (Reviewer):**
1. **PTY `\r` write is redundant** (`terminal.js:629`): Writes `\r` before trusted Enter, but PTY newlines don't submit in Claude Code's ink TUI (proven in Fix R/H/I)
2. **Injection lock released too early** (`terminal.js:644-648`): `finishWithClear()` releases global mutex after only 10ms, before Enter is fully processed
3. **Focus not verified** (`terminal.js:633`): `textarea.focus()` called but success not confirmed

### Re-test (Implementer B, 2026-01-28 18:49–18:59Z)

- Sent 4 rapid burst messages + 60 ticks (10s intervals) via `workspace/triggers/all.txt`
- `console.log`: global injection queue active (in-flight/queue/force-inject), **no mutex/lock errors** observed
- `session-state.json`: pane 6 shows ticks 1–60 in order + burst 1–4; panes 1/3 only last ticks (likely scrollback churn)
- **Note:** Tick timestamps are embedded in the message payload (written at trigger time), not actual arrival time. They do **not** prove spaced vs batched arrival. Need manual observation or instrumentation.
- `daemon.log`: codex-exec invoked 10× each for panes 2/4/5 in window (not per-tick); indicates possible throttling/backlog for Codex exec path
- Typing-guard not directly validated (no UI input automation available)
- Warnings observed: `CodexExec` “Unhandled event type=item.started/completed” for pane 4 during run

### User Confirmation (Implementer B, 2026-01-28 19:23–19:26Z)

- Sent 4 burst messages + 20 ticks (10s intervals) via `workspace/triggers/workers.txt`
- **User-confirmed**: messages arrived **without manual Enter** and were **spaced ~10s apart** (no batching)

**Next Steps:**
- [x] ~~Investigate if xterm 6.0.0 `terminal.input()` API bypasses these issues~~ - APPLIED (Priority 2b sendToPane refactor)
- [x] ~~Consider removing redundant PTY `\r` write~~ - Removed (terminal.input() replaces entire approach)
- [x] ~~Increase delay before releasing injection lock, or await Enter confirmation~~ - N/A (terminal.input() is synchronous)
- [x] **VERIFY FIX ON RESTART** - User confirmed auto-submit + spacing on Jan 28, 2026 (19:23–19:26Z)
- [x] Validate typing-guard while user is actively typing in another pane — console.log shows “user typing, queueing message” followed by delayed/forced injection (Jan 28 18:43–18:46Z).
- [x] Validate Codex exec throughput under sustained tick load — Investigator ran 8-tick load @3s to orchestrator/worker-b/investigator; daemon.log shows codex-exec received for panes 2/4/5 throughout (Jan 28 22:55:55–22:56:20Z).

**See:** `errors.md` for full error documentation

---

## Priority 2 — xterm.js Upgrade to 6.0.0 (Jan 28, 2026)

**Owner:** Implementer A

**Goal:** Enable `terminal.input(data, wasUserInput?)` API for focus-free injection.

**Summary:** Upgraded xterm.js from 5.3.0 to 6.0.0 (scoped package migration).

**Changes:**
- `xterm@5.3.0` → `@xterm/xterm@6.0.0`
- `xterm-addon-fit@0.8.0` → `@xterm/addon-fit@0.11.0`
- `xterm-addon-web-links@0.9.0` → `@xterm/addon-web-links@0.12.0`

**Files updated:**
- `ui/package.json` - dependency versions
- `ui/modules/terminal.js` - import paths (lines 6-8)
- `ui/index.html` - CSS path (line 7)

**Breaking change review:**
- `windowsMode` option removed - not used in our code
- `fastScrollModifier` option removed - not used in our code
- Canvas addon removed - not used (we use default renderer)
- Scroll bar redesign - should be transparent

**New API available:**
```typescript
terminal.input(data: string, wasUserInput?: boolean): void
```
Setting `wasUserInput=false` allows injection without focus-related side effects.

**Status:** COMPLETE

---

## Priority 2b — sendToPane() Refactor (Jan 28, 2026)

**Owner:** Implementer A

**Goal:** Fix stuck messages bug - auto-submit for Claude panes.

**Status:** ⚠️ **HYBRID FIX APPLIED (Session 22)** - Previous approaches failed, new fix pending restart verification.
**Review:** CONDITIONALLY APPROVED (Reviewer, Jan 28, 2026) — Strategy correct (PTY text + sendTrustedEnter). Minor bug: cross-pane focus not restored if user was in different terminal (lines 604/617 `!wasXtermTextarea` condition). Low impact (UX only). Restart verification pending.

### Fix Attempt History

**Attempt 1: terminal.input() (FAILED)**
```javascript
terminal.input(text + '\r', false);  // ~5 lines
```
- Reviewer APPROVED this approach
- **FAILED IN PRACTICE**: `wasUserInput=false` may prevent onData from firing reliably
- Messages didn't reach PTY

**Attempt 2: Direct PTY write (FAILED)**
```javascript
window.hivemind.pty.write(id, text + '\r');
```
- **FAILED**: Claude Code's ink TUI does NOT accept PTY `\r` as Enter (proven in Fix R)
- Text appeared but didn't submit

**Attempt 3: HYBRID FIX (Session 22, CURRENT)**
```javascript
// 1. Focus terminal textarea
textarea.focus();
// 2. Write text to PTY (no \r)
window.hivemind.pty.write(id, text);
// 3. Wait 50ms, then sendTrustedEnter()
window.hivemind.pty.sendTrustedEnter();
// 4. Restore focus
```
- **Why this works**: sendTrustedEnter() uses Electron's native `webContents.sendInputEvent()` which sends real keyboard events
- Claude Code's ink TUI requires actual keyboard events, not PTY stdin
- Focus is needed so sendTrustedEnter() targets the correct pane

**Files updated:**
- `ui/modules/terminal.js` - `doSendToPane()` function

**Key insight:** Only `sendTrustedEnter()` works for Claude Enter submission because it uses native Electron keyboard events, not PTY writes.

**Expected outcome:**
- Auto-submit works for Claude panes
- Minimal focus steal (brief focus, then restore)
- Codex panes unaffected (use separate exec path)

**Review: CONDITIONALLY APPROVED (Reviewer, Jan 28, 2026)**
- Correct strategy: PTY for text + sendTrustedEnter for Enter (proven in Fix H)
- Focus save/restore logic present with try/catch
- **BUG (minor):** Cross-pane focus not restored if user was in different terminal (lines 604, 617). `!wasXtermTextarea` condition prevents restore when user was in any xterm textarea.
- Impact: User inconvenience only, not functional breakage
- **REQUIRES RESTART to verify auto-submit works**

---

## Sprint 2 — Version-fix Comment Cleanup (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Removed 134 version-fix comment markers (`//V#`, `//BUG`, `//FIX` prefixes) across all ui/ source files while preserving meaningful comment content. Comments now describe what the code does without referencing legacy version numbers.

**Files updated:**
- `ui/renderer.js` (12 markers)
- `ui/modules/terminal.js` (16 markers)
- `ui/terminal-daemon.js` (40 markers)
- `ui/modules/watcher.js` (13 markers)
- `ui/modules/triggers.js` (24 markers)
- `ui/main.js` (17 markers)
- `ui/modules/sdk-bridge.js` (8 markers)
- `ui/modules/sdk-renderer.js` (3 markers)
- `ui/daemon-client.js` (1 marker)

**Status:** COMPLETE - Ready for review

---

## Sprint 2 — Logger Conversion: renderer.js (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Converted all 30 console.* calls in renderer.js to use the structured logger module. Subsystems: Init, SDK, Broadcast, Watchdog, Heartbeat, StuckDetection. No errors (warnings only from pre-existing unused vars).

**Files updated:**
- `ui/renderer.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - 32 log calls verified across 6 subsystems. Zero console.* remaining. Levels appropriate, format consistent.

---

## Sprint 2 — Codex Running-State Detection (Jan 28, 2026)

**Owner:** Architect

**Summary:** Made running-state detection case-insensitive so Codex exec panes marked "Codex exec mode ready" are treated as running. This prevents trigger delivery from being skipped due to `claudeRunning` staying idle.

**Files updated:**
- `ui/main.js`

---

## Sprint 2 — Ctrl+C Auto-Interrupt (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added `interrupt-pane` IPC channel to send Ctrl+C (0x03) to a pane's PTY. Updated main-process stuck detection to auto-send Ctrl+C after 120s of no output, with UI notification.

**Files updated:**
- `ui/modules/ipc/pty-handlers.js`
- `ui/main.js`

**Self-review (Implementer B, Jan 28, 2026):**
- interrupt-pane returns `{ success: boolean, error?: string }` and checks daemon connection/paneId.
- auto Ctrl+C uses daemonClient lastActivity (output) with throttle via lastInterruptAt.
- Known limitation: codex-exec terminals ignore PTY writes, so Ctrl+C is a no-op there; stuck notice may repeat every 30s while idle.

**Review: APPROVED (Reviewer, Jan 28, 2026)** - interrupt-pane IPC + auto Ctrl+C behavior verified.

**Review: APPROVED (Reviewer, Jan 28, 2026)**
- interrupt-pane IPC: Correct null checks for daemon connection, paneId validation, `\x03` for Ctrl+C, consistent return shape
- Auto Ctrl+C: 30s check interval, 120s threshold, throttling via lastInterruptAt, clears on output (line 480), UI notification via `agent-stuck-detected` IPC

---

## Sprint 2 — Daemon Client Logger Conversion (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Replaced 16 `console.*` calls in `daemon-client.js` with structured logger (`modules/logger`) to match renderer.js logging pattern. No behavior change.

**Files updated:**
- `ui/daemon-client.js`

**Review: APPROVED (Reviewer, Jan 28, 2026)** - All 17 console.* calls converted to structured logger. Consistent subsystem 'DaemonClient'. Appropriate log levels. Zero console.* remnants.

---

## Sprint 2 — Terminal Daemon + MCP Logger Cleanup (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Removed remaining `console.*` in `terminal-daemon.js` (use stdout/stderr writes in daemon logger) and `mcp-server.js` (modules/logger with stderr-safe warn/error to avoid MCP stdio interference). No behavior change.

**Files updated:**
- `ui/terminal-daemon.js`
- `ui/mcp-server.js`

**Next:** Reviewer optional spot-check that MCP logs still stay on stderr.

---

## Sprint 2 — PTY Injection Serialization (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added GLOBAL injection mutex and completion callback in `terminal.js` so PTY message injections serialize across panes (prevents focus/Enter races). `sendToPane` now always queues; `processQueue` respects in-flight injection with a safety timeout.

**Status:** DONE

**Files updated:**
- `ui/modules/terminal.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - Traced all code paths. Safety timer (1000ms) prevents lock. completed flag prevents double-callback. All paths call finishWithClear(). MAX_QUEUE_TIME_MS (10s) prevents deadlock. No race conditions. Minor: lines 259-262 dead code, global lock serializes all panes.

---

## Sprint 2 — Trigger Prefix + Status Bar Hint (Jan 28, 2026)

**Owner:** Investigator

**Summary:** Added ANSI bold yellow `[TRIGGER]` prefix for PTY-injected messages (notifyAgents, auto-sync, trigger file handling, routing, auto-handoff, direct messages). Updated status bar hint text for quick targeting commands.

**Files updated:**
- `ui/modules/triggers.js`
- `ui/index.html`

---

## Sprint 2 — IPC Null-Check Guards (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added defensive null checks for ctx dependencies in 6 IPC modules (state, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Guards prevent crashes when watcher/triggers/log providers are unset and return safe defaults or errors.

**Files updated:**
- `ui/modules/ipc/state-handlers.js`
- `ui/modules/ipc/completion-quality-handlers.js`
- `ui/modules/ipc/conflict-queue-handlers.js`
- `ui/modules/ipc/smart-routing-handlers.js`
- `ui/modules/ipc/auto-handoff-handlers.js`
- `ui/modules/ipc/activity-log-handlers.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - All guards consistent, proper fallbacks, 6-pane support confirmed. See `workspace/build/reviews/sprint2-ipc-null-checks-review.md`.

---

## IPC Bug Fix Pass — Consolidated (Jan 28, 2026)

**Owner:** Implementer B

**Fixes applied**
- output-validation: `validate-file` now uses local `runValidation` helper (no `ipcMain.handle` invocation)
- completion-quality: `validate-state-transition` now calls local `runQualityCheck` helper (no `ipcMain.handle` invocation)
- mcp-autoconfig: `mcp-reconnect-agent` uses local `configureAgent` helper (no `ipcMain.emit`)
- test-notification: `test-run-complete` uses local `notifyTestFailure` helper (no `ipcMain.emit`)
- error-handlers: `handle-error` now calls local `showErrorToast` helper (no `ipcMain.emit`)
- precommit: uses `ctx.runTests` (from test-execution-handlers) instead of `ipcMain.handle('run-tests')`
- api-docs: `get-api-docs` uses local `generateApiDocs` helper (no `ipcMain._events` access)
- perf-audit: `benchmark-handler` uses `ctx.benchmarkHandlers` map (no `ipcMain._events`), interval stored in `ctx.perfAuditInterval`
- defaults: expanded 4-pane defaults to 6 panes in performance-tracking, smart-routing, learning-data

**Smoke test:**
- `npx eslint modules/ipc/output-validation-handlers.js modules/ipc/completion-quality-handlers.js modules/ipc/mcp-autoconfig-handlers.js modules/ipc/test-notification-handlers.js modules/ipc/error-handlers.js modules/ipc/precommit-handlers.js modules/ipc/test-execution-handlers.js modules/ipc/api-docs-handlers.js modules/ipc/perf-audit-handlers.js modules/ipc/performance-tracking-handlers.js modules/ipc/smart-routing-handlers.js modules/ipc/learning-data-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

---

## Hardening Phase 2 — CSS Extraction COMPLETE (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Extracted ALL inline CSS from `ui/index.html` into 8 external files. File reduced from 4164 to 564 lines (zero inline CSS remaining).

| Module | Files Created | Status |
|--------|---------------|--------|
| Module 1 | `styles/base.css`, `styles/layout.css` | DONE |
| Module 2 | `styles/panes.css`, `styles/state-bar.css` | DONE |
| Module 3 | `styles/settings-panel.css`, `styles/friction-panel.css` | DONE |
| Module 4 | `styles/tabs.css`, `styles/sdk-renderer.css` | DONE |

**Files:** All 8 `<link>` tags in `<head>`, no remaining `<style>` block.

**Review:** APPROVED (Reviewer, Jan 28, 2026) - All 8 CSS files linked in index.html, Module 4 (tabs.css + sdk-renderer.css) verified.

---

## Hardening Phase 2 — ipc-handlers Split (Step 1–3) (Jan 28, 2026)

**Owner:** Implementer B

**Step 1: ipc registry + ctx**
- Added `ui/modules/ipc/index.js` with `createIpcContext` (state getters) + `createIpcRegistry`

**Step 2: shared state module**
- Added `ui/modules/ipc/ipc-state.js` for shared IPC state
- `ui/modules/ipc-handlers.js` now uses `ctx` getters instead of module globals

**Step 3: SDK handlers extracted**
- Added `ui/modules/ipc/sdk-handlers.js` and `ui/modules/ipc/sdk-v2-handlers.js`
- `ui/modules/ipc-handlers.js` registers SDK modules via registry
- Removed SDK sections from `ipc-handlers.js`
- Stripped version-fix comments from extracted SDK code

**Smoke tests:**
- `npx eslint modules/ipc/index.js modules/ipc/ipc-state.js modules/ipc/sdk-handlers.js modules/ipc/sdk-v2-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (sdk-handlers, sdk-v2-handlers)
- Implementer B: proceed to MCP split after review

---

## Hardening Phase 2 — ipc-handlers Split (MCP) (Jan 28, 2026)

**Owner:** Implementer B

**MCP bridge handlers**
- Added `ui/modules/ipc/mcp-handlers.js` (MCP bridge IPC)
- Registered via ipc registry; removed MCP bridge block from `ui/modules/ipc-handlers.js`
- Stripped version-fix comments from extracted MCP code

**MCP auto-configuration**
- Added `ui/modules/ipc/mcp-autoconfig-handlers.js` (configure/reconnect/remove)
- Registered via ipc registry; removed auto-config block from `ui/modules/ipc-handlers.js`
- Adjusted MCP server path for new module location

**Smoke tests:**
- `npx eslint modules/ipc/mcp-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/mcp-autoconfig-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (mcp-handlers, mcp-autoconfig-handlers)
- Implementer B: proceed to test/CI handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Test/CI) (Jan 28, 2026)

**Owner:** Implementer B

**Test execution**
- Added `ui/modules/ipc/test-execution-handlers.js` (detect/run tests, results/status)
- Registered via ipc registry; removed test execution block from `ui/modules/ipc-handlers.js`

**Pre-commit validation**
- Added `ui/modules/ipc/precommit-handlers.js` (pre-commit checks, CI status/enable/block)
- Registered via ipc registry; removed pre-commit block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.calculateConfidence` + `ctx.INCOMPLETE_PATTERNS` for shared validation helpers

**Test failure notifications**
- Added `ui/modules/ipc/test-notification-handlers.js` (notify/settings/block-on-failure)
- Registered via ipc registry; removed notification block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/test-execution-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/precommit-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/test-notification-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (test-execution, precommit, test-notification)
- Implementer B: proceed to messaging handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Messaging) (Jan 28, 2026)

**Owner:** Implementer B

**Message queue handlers**
- Added `ui/modules/ipc/message-queue-handlers.js` (init/send/get/clear queue + watcher start)
- Registered via ipc registry; removed MQ4 block from `ui/modules/ipc-handlers.js`
- Stripped version-fix comments from extracted messaging code

**Smoke tests:**
- `npx eslint modules/ipc/message-queue-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (message-queue-handlers)
- Implementer B: proceed to docs/perf/error handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Docs/Perf/Error) (Jan 28, 2026)

**Owner:** Implementer B

**API docs**
- Added `ui/modules/ipc/api-docs-handlers.js`
- Registered via ipc registry; removed API docs block from `ui/modules/ipc-handlers.js`

**Performance audit**
- Added `ui/modules/ipc/perf-audit-handlers.js`
- Registered via ipc registry; removed perf audit block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.recordHandlerPerf` for future instrumentation

**Error handling**
- Added `ui/modules/ipc/error-handlers.js`
- Registered via ipc registry; removed error message block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/api-docs-handlers.js modules/ipc/perf-audit-handlers.js modules/ipc/error-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (api-docs, perf-audit, error-handlers)
- Implementer B: proceed to remaining modules after review

---

## Hardening Phase 2 — ipc-handlers Split (State) (Jan 28, 2026)

**Owner:** Implementer B

**State handlers**
- Added `ui/modules/ipc/state-handlers.js` (get-state, set-state, trigger-sync, broadcast-message, start-planning)
- Registered via ipc registry; removed state handlers block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/state-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (state-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Smart Routing) (Jan 28, 2026)

**Owner:** Implementer B

**Smart routing handlers**
- Added `ui/modules/ipc/smart-routing-handlers.js` (route-task, get-best-agent, get-agent-roles)
- Registered via ipc registry; removed smart routing block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/smart-routing-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (smart-routing-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Auto-Handoff) (Jan 28, 2026)

**Owner:** Implementer B

**Auto-handoff handlers**
- Added `ui/modules/ipc/auto-handoff-handlers.js` (trigger-handoff, get-handoff-chain)
- Registered via ipc registry; removed auto-handoff block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/auto-handoff-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (auto-handoff-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Conflict Queue) (Jan 28, 2026)

**Owner:** Implementer B

**Conflict queue handlers**
- Added `ui/modules/ipc/conflict-queue-handlers.js` (request-file-access, release-file-access, get-conflict-queue-status, clear-all-locks)
- Registered via ipc registry; removed conflict queue block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/conflict-queue-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (conflict-queue-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Learning Data) (Jan 28, 2026)

**Owner:** Implementer B

**Learning data handlers**
- Added `ui/modules/ipc/learning-data-handlers.js` (record-task-outcome, get-learning-data, get-best-agent-for-task, reset-learning, get-routing-weights)
- Registered via ipc registry; removed learning data block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/learning-data-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (learning-data-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Output Validation) (Jan 28, 2026)

**Owner:** Implementer B

**Output validation handlers**
- Added `ui/modules/ipc/output-validation-handlers.js` (validate-output, validate-file, get-validation-patterns)
- Registered via ipc registry; removed output validation block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.INCOMPLETE_PATTERNS` + `ctx.calculateConfidence` for quality checks

**Smoke tests:**
- `npx eslint modules/ipc/output-validation-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (output-validation-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Completion Quality) (Jan 28, 2026)

**Owner:** Implementer B

**Completion quality handlers**
- Added `ui/modules/ipc/completion-quality-handlers.js` (check-completion-quality, validate-state-transition, get-quality-rules)
- Registered via ipc registry; removed completion quality block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/completion-quality-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (completion-quality-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Checkpoint) (Jan 28, 2026)

**Owner:** Implementer B

**Checkpoint handlers**
- Added `ui/modules/ipc/checkpoint-handlers.js` (create-checkpoint, list-checkpoints, get-checkpoint-diff, rollback-checkpoint, delete-checkpoint)
- Registered via ipc registry; removed checkpoint rollback block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/checkpoint-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (checkpoint-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Activity Log) (Jan 28, 2026)

**Owner:** Implementer B

**Activity log handlers**
- Added `ui/modules/ipc/activity-log-handlers.js` (get-activity-log, clear-activity-log, save-activity-log, log-activity)
- Registered via ipc registry; removed activity log block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/activity-log-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (activity-log-handlers)
- Implementer B: proceed to next module after review

---

## Fix Z — Trigger File Encoding Normalization (Jan 28, 2026)

**Owner:** Architect

**Problem:** Codex panes writing trigger files via Windows cmd.exe echo or PowerShell produced garbled messages. cmd.exe uses OEM CP437, PowerShell defaults to UTF-16LE, but trigger reader assumed UTF-8.

**Investigation (Investigator):**
- cmd.exe echo ASCII-only: OK
- cmd.exe echo with `& | % ^ !`: breaks/truncates file
- PowerShell default redirect: writes UTF-16LE BOM — garbles on UTF-8 read
- PowerShell `Set-Content -Encoding UTF8`: works correctly
- Codex exec degrades unicode to `???` before cmd even runs

**Fix:** `triggers.js` `handleTriggerFile()` now reads raw bytes and detects encoding:
1. UTF-16LE BOM (FF FE) → convert via `utf16le`
2. UTF-8 BOM (EF BB BF) → strip BOM
3. Default → UTF-8
4. Strip null bytes and control characters

**File Modified:** `ui/modules/triggers.js` (lines 491-515)

**Verification:** Reviewer approved Jan 28, 2026. Needs restart to test live.

---

## Codex CLAUDE.md Trigger Instructions Update (Jan 28, 2026)

**Owner:** Architect

**Problem:** Orchestrator (Codex pane) failed 4 consecutive times to reply via trigger files. Responded in terminal output instead. User had to manually push messages. Other Codex panes (Implementer B, Investigator) worked correctly.

**Root Cause:** Codex defaults to conversational terminal output. Conceptual instructions ("write to trigger file") didn't translate to action. Only succeeded when given exact bash command to execute.

**Fix:** Updated CLAUDE.md for all 3 Codex panes with:
- Explicit "EVERY REPLY MUST USE THIS COMMAND" section with copy-paste echo template
- Command-first framing (bash template before explanation)
- Orchestrator gets additional "PRIME DIRECTIVE" section at top of file

**Files Modified:**
- `workspace/instances/orchestrator/CLAUDE.md`
- `workspace/instances/worker-b/CLAUDE.md`
- `workspace/instances/investigator/CLAUDE.md`

**Next:** Verify on next session that Orchestrator uses triggers without manual push.

---

## Bug 2 - Codex Exec Output Line Breaks (Jan 28, 2026)

**Owner:** Implementer B

**Problem:** Codex exec responses render as a single mashed line with no separation between events or runs.

**Fix:** Append `\r\n` to non-delta text in `handleCodexExecLine()` so completed messages are line-broken while streaming deltas remain unmodified.

**File Modified:** `ui/modules/codex-exec.js`

**Next:** Reviewer verify Codex panes show proper line breaks.
**Verification:** Reviewer approved on Jan 28, 2026.\r\n
---

## Fix Y - Codex Exec JSONL Format Mismatch + windowsHide (Jan 27, 2026)

**Owner:** Architect

**Problem:** Codex panes showed "[Codex exec mode ready]" then "Codex exec exited 0" with no output. Also 3 external cmd.exe windows appeared on desktop.

**Root Cause (confirmed via manual test):** Codex exec outputs `{"type":"item.completed","item":{"text":"Hello!"}}` but the JSONL parser only checked `payload.delta.text`, `payload.text`, etc. The `item.text` path was missing entirely, so all response text was silently discarded as "Unhandled event". Additionally, `shell: true` without `windowsHide: true` spawned visible cmd.exe windows. Session tracking expected `session_meta` but Codex uses `thread.started` with `thread_id`.

**Fixes (3 in 1):**
1. Added `payload.item.text` extraction in `extractCodexText()` â€” catches `item.completed` events
2. Added `windowsHide: true` to `spawn()` options â€” hides cmd.exe windows
3. Added `thread.started` handler to capture `thread_id` for session resume
4. Added `turn.started`, `turn.completed` (dot notation) to `SILENT_EVENT_TYPES`

**File Modified:** `ui/modules/codex-exec.js`

**Next:** Restart and verify Codex panes display actual responses, no external windows, resume works.

---

## Fix X - Unsilence `message_delta` Event (Jan 27, 2026) â€” FAILED

**Owner:** Architect

**Problem:** Codex panes showed "Codex exec mode ready" then "Codex exec exited 0" with no agent output. Fix W's `SILENT_EVENT_TYPES` included `message_delta`, which carries `payload.delta.text` â€” the actual streamed response text.

**Fix:** Removed `message_delta` from `SILENT_EVENT_TYPES`. Added debug logging for silent events.

**File Modified:** `ui/modules/codex-exec.js` (lines 31, 101)

**Next:** Restart and verify Codex panes display actual responses.

---

## Fix V - Remove Conflicting `--full-auto` Flag (Jan 27, 2026)

**Owner:** Architect

**Problem:** Codex panes failed with `the argument '--full-auto' cannot be used with '--dangerously-bypass-approvals-and-sandbox'` â€” the two flags are mutually exclusive in Codex CLI.

**Fix:** Removed `--full-auto` from both initial and resume exec arg arrays. `--dangerously-bypass-approvals-and-sandbox` already implies full autonomy.

**File Modified:** `ui/modules/codex-exec.js` (lines 108-109)

**Next:** Restart and verify Codex panes spawn cleanly.

---

## Codex Exec Swap Assessment (Jan 27, 2026)

**Owner:** Worker B

**What:** Mapped current Codex spawn path (ipc-handlers -> terminal.js -> daemon PTY) and assessed `codex exec --json --full-auto` swap. Conclusion: non-interactive exec needs a new child_process path (no PTY), JSONL parsing for outputs, and per-pane session id/resume handling; PTY-based piping would be brittle due to shell prompts/quoting.

**Notes:** `codex exec --help` confirms prompt via stdin/arg, `--json` for JSONL events, `--full-auto` and `--dangerously-bypass-approvals-and-sandbox`, plus `--cd` for per-pane cwd. Session logs in `~/.codex/sessions/` include `session_meta` with `payload.id` (UUID), likely emitted in `--json` output for tracking.

**Next:** Architect decide whether to implement exec-mode process path + JSON parsing for Codex panes.

## Fix S - Codex Exec Mode (Jan 27, 2026)

**Owner:** Worker B

**What:** Implemented Codex exec pipeline for Codex panes (non-interactive). New module `ui/modules/codex-exec.js` spawns `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox` and streams JSONL to xterm; renderer sends prompts via new `codex-exec` IPC and injects identity prefix on first prompt. PTY remains for Claude/Gemini.

**Files Modified:**
- `ui/terminal-daemon.js`
- `ui/modules/codex-exec.js`
- `ui/modules/terminal.js`
- `ui/modules/ipc-handlers.js`
- `ui/daemon-client.js`
- `ui/preload.js`
- `ui/renderer.js`
- `ui/config.js`

**Notes:** Initial exec uses `--cd <instanceDir>` and stdin prompt; subsequent exec uses `resume <sessionId>` (captured from JSONL `session_meta`). JSONL parsing extracts text when possible, falls back to raw JSON line.
**Update:** Reviewer requested resume flag ordering fix (flags before `resume`); applied in `ui/modules/codex-exec.js`.

**Next:** Reviewer verify Codex panes run via exec, output renders, and resume continuity holds; Investigator to confirm `resume --last` keeps full context.

## Codex Auto-Submit Fix B - Dynamic Codex Panes (Jan 27, 2026)

**Owner:** Worker B

**What:** terminal.js now uses a dynamic CLI identity map (from pane-cli-identity) to detect Codex panes instead of a hardcoded list.

**Files Modified:**
- `ui/modules/terminal.js`

**Next:** Reviewer verify Codex panes auto-submit and non-Codex panes use trusted Enter.


## CLI Identity Badge - IPC Forwarding + Detection DONE (Jan 27, 2026)

**Owner:** Worker B

**What:** main.js now forwards `pane-cli-identity` to renderer and infers CLI identity from pane spawn command on daemon spawn/reconnect.

**Files Modified:**
- `ui/main.js`

**Next:** Reviewer verify badges render for Claude/Codex/Gemini panes.


## Codex Prompt Suppression Hardening - DONE (Jan 27, 2026)

**Owner:** Worker B

**Problem:** Codex CLI still showed approval prompts on some panes even with `--full-auto --ask-for-approval never`.

**Fixes Applied:**
- Codex spawn now appends `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`) for maximum suppression
- Daemon auto-approval fallback: detects approval prompt text and sends `2` ("Yes and don't ask again")

**Files Modified:**
- `ui/modules/ipc-handlers.js`
- `ui/terminal-daemon.js`

**Notes:** Best-effort fallback; Windows Codex prompts may still occur due to upstream behavior.

## ðŸŽ¯ MULTI-MODEL MILESTONE (Jan 26, 2026)

**STATUS:** PROVEN WORKING

Claude (Anthropic) and Codex (OpenAI) successfully collaborated in real-time:
- Codex replaced Claude in Reviewer pane (pane 4)
- Cross-model messaging via trigger files works
- Codex autonomously diagnosed and fixed ESC dispatch bug
- Direct pane routing restored after fix

### Fixes Applied by Codex (Reviewer)

| Fix | File | Lines | Description |
|-----|------|-------|-------------|
| ESC dispatch removal | `ui/modules/terminal.js` | - | Removed ESC being sent after message injection - was interrupting agents |
| Trigger diagnostics | `ui/modules/triggers.js` | - | Added logging for lead.txt debugging (KEEP - useful for multi-model) |

### Learnings for Multi-Model Setup

1. **Any pane can run any AI CLI** - just swap the binary
2. **Trigger file system is model-agnostic** - Claude, Codex, Gemini can all read/write files
3. **Different models bring different perspectives** - Codex found bugs Claude might miss
4. **Broadcast more reliable than direct** - use `all.txt` as fallback if `lead.txt` fails
5. **Restart clears context** - document everything before shutdown

### Upcoming: 6 Panes, 2 New Roles, 3 AI Models

External agent is expanding architecture:
- 6 panes (up from 4)
- 2 new roles (TBD)
- Claude Code + Codex CLI + Gemini CLI

---

## ðŸ’¡ FUTURE IDEAS

| Idea | Doc | Status |
|------|-----|--------|
| Distributed Hivemind (NAS) | `distributed-hivemind-nas-setup.md` | Documented, untested |
| Telegram Bot Messaging | `telegram-agent-messaging.md` | Documented, untested |
| SDKâ†’xterm hybrid mode | - | Concept only |

---

## â³ PENDING SDK TESTS (Switch to SDK mode to verify)

These features are code-complete and Reviewer-approved but untested because app is in PTY mode:

| Feature | Tag | Status | Blocker |
|---------|-----|--------|---------|
| Honeycomb thinking animation | `[SDK]` | âœ… Approved | Needs SDK mode |
| Streaming typewriter effect | `[SDK]` | âœ… Approved | Needs SDK mode |
| SDK session status indicators | `[SDK]` | âœ… Approved | Needs SDK mode |

**To test:** Enable SDK mode in settings, restart app.

---

## ðŸ”§ File Watcher Debounce Fix - âœ… DONE `[BOTH]` (Jan 26, 2026)

**Owner:** Worker B
**Priority:** MEDIUM (from blockers.md)

**Problem:** No debounce on `handleFileChange()` - big git operations (checkout, npm install) could queue up 50+ events within the 1-second polling window.

**Solution:** Added 200ms debounce wrapper with Set-based deduplication.

**Changes to `ui/modules/watcher.js`:**
- Added `DEBOUNCE_DELAY_MS = 200` constant
- Added `pendingFileChanges` Set for deduplication
- Added `handleFileChangeDebounced()` - batches events within 200ms window
- Renamed original logic to `handleFileChangeCore()`
- Updated watcher event handlers to use debounced version
- Export `handleFileChange` points to debounced version for backward compatibility

**How it works:**
1. File change triggers `handleFileChangeDebounced()`
2. File path added to `pendingFileChanges` Set (dedupes same file)
3. Debounce timer reset to 200ms
4. After 200ms of no new changes, all pending files processed together
5. Log shows: `[Watcher] Processing N batched file change(s)`

**Status:** âœ… DONE - Requires app restart to test.

---

## ðŸ Hivemind Honeycomb Animation - âœ… APPROVED `[SDK]` (Jan 26, 2026)

**Goal:** Replace generic braille spinner with branded honeycomb pulse animation.

**User Request:** "Make the thinking animation feel alive, use your imagination"

### Design
- 7 hexagons (1 center + 6 surrounding) in honeycomb pattern
- Wave pulse animation radiating from center
- Color-coded by tool type (thinking=gold, read=teal, write=red, search=blue, bash=purple)
- Respects `prefers-reduced-motion`
- Fade in/out transitions

### Files Modified
- `ui/index.html` - ~140 lines CSS (honeycomb styles, keyframes, tool colors)
- `ui/modules/sdk-renderer.js` - `generateHoneycombHTML()` + updated `streamingIndicator()`

### Status
| Task | Status |
|------|--------|
| Research & design | âœ… DONE |
| CSS implementation | âœ… DONE |
| JS implementation | âœ… DONE |
| Lead's preliminary audit | âœ… PASS |
| Reviewer full audit | âœ… PASS |
| Live testing | â³ PENDING (needs SDK mode) |

**Proposal doc:** `workspace/build/thinking-animation-proposals.md`
**Review doc:** `workspace/build/reviews/honeycomb-animation-audit.md`

---

## ðŸŽ¬ SDK Streaming Animation Sprint - âœ… COMPLETE (Jan 26, 2026)

**Goal:** Make SDK mode feel ALIVE - typewriter effect like real Claude Code CLI.

**Discovery:** SDK supports `include_partial_messages=True` for real character-by-character streaming via `StreamEvent` with `text_delta`.

### Task Status

| ID | Task | Owner | Status |
|----|------|-------|--------|
| STR-1 | Add `include_partial_messages=True` to Python | Worker B | âœ… DONE |
| STR-2 | Handle StreamEvent, emit text_delta to JS | Worker B | âœ… DONE |
| STR-3 | Handle text_delta in sdk-bridge.js | Worker B | âœ… DONE |
| STR-4 | Handle sdk-text-delta IPC in renderer | Worker A | âœ… DONE |
| STR-5 | Typewriter effect in sdk-renderer.js | Worker A | âœ… DONE |
| STR-6 | CSS polish for streaming text | Worker A | âœ… DONE |
| R-1 | Integration review - trace end-to-end | Lead (acting) | âœ… APPROVED |
| R-2 | UX review - does it feel alive? | Lead (acting) | âœ… APPROVED |

### Worker A Completion Notes (STR-4, STR-5, STR-6)

**Files Modified:**
- `ui/renderer.js` - Added `sdk-text-delta` IPC listener, status update to 'responding'
- `ui/modules/sdk-renderer.js` - Added typewriter streaming functions:
  - `appendTextDelta(paneId, text)` - Appends text with blinking cursor
  - `finalizeStreamingMessage(paneId)` - Removes cursor when streaming stops
  - `clearStreamingState(paneId)` - Clears state on new turn
- `ui/index.html` - Added CSS for `.sdk-streaming-text`, `.sdk-cursor`, `.sdk-typewriter`

**How It Works:**
1. Worker B sends `sdk-text-delta` IPC event with `{ paneId, text }`
2. `appendTextDelta()` creates or updates a streaming message element
3. New text is inserted before a blinking cursor (â–Œ)
4. When streaming stops (`sdk-streaming` with active=false), cursor is removed

**Handoff to Worker B:** STR-1,2,3 - Python backend needs to:
1. Set `include_partial_messages=True` in ClaudeAgentOptions
2. Handle `StreamEvent` messages and extract `text_delta`
3. Emit to JS via IPC: `{"type": "text_delta", "pane_id": "1", "text": "partial..."}`
4. sdk-bridge.js routes this as `sdk-text-delta` to renderer

**Status:** âœ… UI layer complete, waiting for Worker B's backend work.

### Worker B Completion Notes (STR-1, STR-2, STR-3)

**Files Modified:**
- `hivemind-sdk-v2.py` - Added streaming support:
  - Imported `StreamEvent` from claude_agent_sdk
  - Added `include_partial_messages=True` to ClaudeAgentOptions (line ~170)
  - Added `StreamEvent` handler in `_parse_message()` (lines ~360-395)
  - Extracts `text_delta` from `content_block_delta` events
  - Also handles `thinking_delta` for extended thinking streaming
- `ui/modules/sdk-bridge.js` - Added routing:
  - Added `text_delta` case in `routeMessage()` (lines ~533-540)
  - Forwards to renderer via `sdk-text-delta` IPC event
  - Also added `thinking_delta` handler for future use

**How It Works (Full Pipeline):**
1. `include_partial_messages=True` enables `StreamEvent` messages from SDK
2. SDK emits `StreamEvent` with raw Anthropic API events during response
3. Python `_parse_message()` detects `content_block_delta` with `text_delta` type
4. Emits `{"type": "text_delta", "pane_id": "1", "text": "partial..."}`
5. sdk-bridge.js routes as `sdk-text-delta` to renderer
6. Worker A's `appendTextDelta()` displays with blinking cursor

**Message Format:**
```json
{"type": "text_delta", "pane_id": "1", "text": "Hello", "session_id": "..."}
```

**Status:** âœ… Backend complete! Ready for Reviewer integration test (R-1).

### Lead Review Notes (R-1, R-2) - âœ… APPROVED

Lead performed integration review while user was AFK.

**Review Document:** `workspace/build/reviews/streaming-animation-review.md`

**Commits:**
- `66ff886` - feat: Add real-time text streaming with typewriter effect (SDK mode)
- `4e52899` - fix: Improve UTF-8 encoding for Python-JS communication

**Integration Trace:** Full data flow verified from Python StreamEvent â†’ sdk-bridge â†’ renderer â†’ typewriter display.

**Status:** âœ… APPROVED FOR TESTING - User can restart app to test streaming animation.

---

## UI Fix: Agent Message Styling - âœ… DONE (Jan 26, 2026)

**Owner:** Worker A
**Problem:** All trigger messages showed as "You:" with person icon - confusing UX.

**Fix Applied:**
- Detect `(ROLE):` prefix pattern in messages (LEAD, WORKER-A, WORKER-B, REVIEWER)
- Parse out the prefix and show appropriate agent styling
- "You:" label ONLY appears for actual user keyboard input (no prefix)

**Distinct Agent Styling:**
| Role | Icon | Color | CSS Class |
|------|------|-------|-----------|
| Lead | ðŸ‘‘ | Gold (#ffd700) | .sdk-agent-lead |
| Worker A | ðŸ”§ | Teal (#4ecca3) | .sdk-agent-worker-a |
| Worker B | âš™ï¸ | Purple (#9b59b6) | .sdk-agent-worker-b |
| Reviewer | ðŸ” | Orange (#ff9800) | .sdk-agent-reviewer |

**Files Modified:**
- `ui/modules/sdk-renderer.js` - Updated formatMessage() to detect and parse agent prefixes
- `ui/index.html` - Added CSS for .sdk-agent-msg and role-specific styles

**Status:** âœ… DONE - Requires app restart to test.

---

## Quality Gates - IN PROGRESS (Jan 26, 2026)

**Goal:** Stop shipping dumb bugs with automated checks.

| Gate | Status | Owner |
|------|--------|-------|
| Gate 1: mypy (Python) | âœ… DONE | Worker B |
| Gate 2: ESLint (JS) | âœ… DONE | Worker A |
| Gate 3: IPC Protocol Tests | â³ Pending | Lead |
| Gate 4: Serialization Tests | âœ… DONE | Worker B |
| Gate 5: Pre-commit Hook | âœ… DONE | Worker B |

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

## SDK V2 Code Quality Fixes - âœ… APPLIED (Jan 26, 2026)

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

## SDK Message Type Handlers - âœ… APPLIED (Jan 26, 2026)

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

## SDK V2 Critical Runtime Fixes - âœ… APPROVED (Jan 26, 2026)

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

## SDK V2 PTY Bypass Fix (Round 2) - âœ… APPROVED (Jan 26, 2026)

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

**Status:** âœ… APPROVED FOR TESTING (see reviews/pty-bypass-fix-review.md) + defense-in-depth applied.

---

## SDK V2 Init Bug Fix (Round 1) - âœ… APPLIED (Jan 26, 2026)

**Problem:** Raw JSON appearing in xterm panes - PTY created before SDK mode detected.

**Root Cause:** Race condition - `daemon-connected` fired before settings loaded.

**Fixes Applied:**
- main.js: Added `sdkMode` flag to daemon-connected event
- daemon-handlers.js: Check data.sdkMode, skip PTY if true
- renderer.js: Set SDK mode flags on settings load, auto-init SDK panes

**Status:** Applied but insufficient - Round 2 fixes additional bypass paths.

---

## SDK V2 Migration - âœ… READY FOR TESTING

**Goal:** Replace PTY/keyboard hacks with 4 independent ClaudeSDKClient instances.

**Architecture:** 4 full Claude sessions (NOT subagents), each with own context window.

**Design Doc:** `workspace/build/sdk-architecture-v2.md`

### Final Verification Complete (Jan 25, 2026)

**Reviewer's Final Report:**
- Files verified: `hivemind-sdk-v2.py` (575 lines), `sdk-bridge.js` (636 lines)
- IPC Protocol: ALL 6 ASPECTS ALIGNED (command, pane_id, message, session_id, role, session format)
- Issues found: NONE
- Confidence: âœ… READY FOR TESTING

**Review Files:**
- `workspace/build/reviews/sdk-v2-audit-verification.md` - Audit fixes verified
- `workspace/build/reviews/sdk-v2-final-verification.md` - Protocol alignment verified

### Post-Audit Critical Fixes (Jan 25, 2026)

**User requested full audit before testing. Audit revealed critical bugs:**

| Issue | Status | Description |
|-------|--------|-------------|
| snake_case/camelCase mismatch | âœ… FIXED | Python sends `pane_id`, JS expected `paneId` - all routing broken |
| Missing `sdk-status-changed` | âœ… FIXED | UI status indicators never updated |
| Missing `sdk-message-delivered` | âœ… FIXED | No delivery confirmation in UI |
| `interrupt` command missing | âœ… FIXED | Added to Python IPC handler |
| Session file format mismatch | âœ… FIXED | Aligned JS to Python's nested format |
| Race condition on startup | âš ï¸ OPEN | Messages may queue before Python ready |

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
| 1 | Create hivemind-sdk-v2.py | Lead | âœ… COMPLETE |
| 2 | Update sdk-bridge.js for multi-session | Worker B | âœ… COMPLETE |
| 3 | Add session status indicators to UI | Worker A | âœ… COMPLETE |
| 4 | Review SDK V2 architecture | Reviewer | âœ… COMPLETE |

### Review Summary (Task #4)

**File:** `workspace/build/reviews/sdk-v2-architecture-review.md`
**Verdict:** âœ… APPROVED with recommendations

**Reviewer Recommendations:**
1. Verify ClaudeSDKClient API with minimal test before full integration
2. Confirm `setting_sources=["project"]` loads CLAUDE.md
3. Implement `can_use_tool` path restrictions for security

---

## SDK V2 Migration - Phase 2 Tasks âœ… COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| 5 | Replace PTY input with SDK calls | Lead | âœ… COMPLETE |
| 6 | Trigger integration (file â†’ SDK) | Worker B | âœ… COMPLETE |
| 7 | Session persistence + resume | Lead | âœ… COMPLETE |
| 8 | Full verification | Reviewer | âœ… APPROVED |
| 9 | Protocol alignment fixes | Lead | âœ… COMPLETE |

### Final Review (Task #8)

**File:** `workspace/build/reviews/sdk-v2-final-verification.md`
**Verdict:** âœ… APPROVED FOR TESTING

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

**Status:** âœ… All protocol mismatches fixed. Ready for final testing.

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

**Status:** âœ… COMPLETE - Blocked until sdk-bridge.js (Task #2) is ready.

---

## UI Layout Redesign - âœ… COMPLETE (Lead)

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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   â”‚  Worker A [â¤¢] â”‚
â”‚                   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚      Lead         â”‚  Worker B [â¤¢] â”‚
â”‚    (Main Pane)    â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                   â”‚  Reviewer [â¤¢] â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     [Message to Lead input]
```

**Status:** Requires app restart to test.

---

## SDK Migration Sprint - â¸ï¸ PAUSED (Lead)

**Goal:** Integrate SDK mode into Electron app as user-selectable option.

### Task #1: SDK Bridge Startup Integration - âœ… COMPLETE (Lead)
- Added `sdkMode` to DEFAULT_SETTINGS in main.js
- SDK bridge already initialized via ipc-handlers.js
- Broadcast routing now checks sdkMode and routes through SDK or PTY

### Task #2: SDK Mode Toggle UI - âœ… COMPLETE (Lead)
- Added toggle switch in Settings panel (index.html)
- Added sdkModeNotice indicator
- Updated settings.js to show/hide SDK mode notice

### Task #3: Test SDK Broadcast - â³ PENDING
Requires manual testing with SDK mode enabled.

### Task #4: Test SDK Subagent Delegation - â³ PENDING
Blocked by Task #3.

**Files Modified:**
- `ui/main.js` - Added sdkMode to DEFAULT_SETTINGS
- `ui/index.html` - Added SDK mode toggle and notice
- `ui/modules/settings.js` - Added sdkModeNotice visibility handling
- `ui/renderer.js` - Added sendBroadcast() helper with SDK/PTY routing

---

## SDK Prototype Sprint - âœ… COMPLETE (Acceptance Test Passed)

### Task #1: SDK Backend Integration - âœ… COMPLETE (Worker B)
- `hivemind-sdk.py` - SDK orchestrator with subagent definitions
- Installed claude-agent-sdk
- Verified query() API works

### Task #3: Multi-Agent Coordination - âœ… COMPLETE (Lead)
- `ui/modules/sdk-bridge.js` - Electron â†” SDK bridge
- IPC handlers: sdk-start, sdk-stop, sdk-write, sdk-status, sdk-broadcast
- Spawn/manage Python SDK process from Electron

### Task #4: Validation - âœ… COMPLETE (Reviewer)
Conditional pass - SDK prototype works, Windows encoding fixed.

---

### Task #2: SDK Message UI Renderer - âœ… COMPLETE (Worker A)

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

**Status:** âœ… COMPLETE - Ready for integration test with Lead's coordinator.

---

## ID-1: Session Identity Injection - âœ… FIXED (Worker B)

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

**Status:** âœ… FIXED - Requires app restart to test.

---

## V18.2: Auto-Nudge False Positive Fix - âœ… FIXED (Worker B)

**Problem:** Auto-nudge was detecting stuck agents and sending `(AGGRESSIVE_NUDGE)`, but then immediately marking them as "responded" because the nudge itself updated `lastInputTime`.

**Root Cause:** `hasAgentResponded()` checked if `lastInputTime > lastNudgeTime`, but the nudge process (ESC + 150ms delay + Enter) itself writes to PTY, updating `lastInputTime`. The daemon thought the agent responded when it was actually just seeing its own nudge.

**Fix:** Added 500ms grace period. Agent only counts as "responded" if input came AFTER `lastNudgeTime + 500ms`:
```javascript
const NUDGE_GRACE_PERIOD_MS = 500;
const nudgeCompleteTime = state.lastNudgeTime + NUDGE_GRACE_PERIOD_MS;
return lastInput > nudgeCompleteTime;
```

**File Changed:** `ui/terminal-daemon.js` - `hasAgentResponded()` function

**Status:** âœ… FIXED - Requires app restart to test.

---

## FX4-v7: Ghost Text Bug Fix - âœ… FIXED (Worker A)

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
- v7: ESC â†’ 20ms delay â†’ re-focus â†’ Enter (CURRENT)

**Status:** âœ… FIXED - Requires app restart to test.

---

## D2: Dry-Run Mode Bug Fix - âœ… FIXED (Worker A)

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

**Status:** âœ… FIXED - Requires app restart to test. Ready for Reviewer verification.

---

## V18: Auto-Aggressive-Nudge - âœ… SHIPPED

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

**Status:** âœ… SHIPPED - Reviewer verified (see `workspace/build/reviews/v18-auto-nudge-verification.md`)

**V18.1 BUG FIX (Jan 25):** Stuck detection not triggering because `lastActivity` was updated by PTY output (including thinking animation). Fixed by adding `lastInputTime` to track user INPUT instead of agent output. Requires restart to test.

---

## Stuck Issue Fixes (External Claude Recommendations) - âœ… VERIFIED

**Issue:** Claude Code instances getting stuck - known bug (GitHub #13224, #13188)

**Stress Test Round 2 Results (Jan 25, 2026):**
- 3 agents (Worker A, Worker B, Reviewer) got stuck mid-test
- Lead recovered ALL 3 using aggressive nudge (FIX3)
- No bunching, correct message ordering, no focus stealing
- Full report: `workspace/build/reviews/stress-test-round2-verification.md`

**Fixes Applied:**

| Fix | Status | Description |
|-----|--------|-------------|
| FIX1 | âœ… APPLIED | AUTOCOMPACT_PCT_OVERRIDE=70 in settings.json |
| FIX2 | âœ… VERIFIED | Stagger agent activity in triggers.js (avoid thundering herd) |
| FIX3 | âœ… VERIFIED | Aggressive nudge (ESC + Enter) - recovered 3 stuck agents in test |
| FIX4 | â¸ï¸ DEFERRED | Circuit breaker pattern (bigger code change) |
| FIX5 | âœ… VERIFIED | Focus steal prevention - save/restore user focus during message injection |

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

## V17: Adaptive Heartbeat - âœ… SHIPPED

**Proposal:** #11 from improvements.md
**Owner:** Worker B
**Co-author:** Worker A
**Votes:** 4/4 UNANIMOUS (Lead's earlier YES finally delivered)
**Reviewer:** FORMAL APPROVAL - All checks passed
**Stress Test:** PASS - Verified in round 2 stress test (Jan 25, 2026)

### Task Breakdown

| Task | Status | Description |
|------|--------|-------------|
| HB-A1 | âœ… DONE | Add `getHeartbeatInterval()` to terminal-daemon.js |
| HB-A2 | âœ… DONE | Check status.md mtime for staleness detection |
| HB-A3 | âœ… DONE | Check shared_context.md for pending tasks |
| HB-A4 | âœ… DONE | Add "recovering" state (45sec grace period) |
| HB-A5 | â¸ï¸ DEFERRED | Make intervals configurable in settings (can add later) |
| HB-A6 | âœ… DONE | Fallback if status.md missing (default to "active") |
| HB-A7 | âœ… DONE | Event forwarding: daemon â†’ client â†’ main â†’ renderer |
| HB-UI | âœ… DONE | Heartbeat mode indicator in status bar (Worker A) |
| R1 | âœ… PASSED | Worker A sanity check |
| R2 | âœ… APPROVED | Reviewer formal verification |

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

- `heartbeat-state-changed` â†’ { state, interval } for UI indicator

---

## V16.11: Trigger System Fix - âœ… SHIPPED

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
| V16.11 | Auto-refocus after injection | âœ… SUCCESS |

**User Verified:** NO manual unsticking needed! All 4 agents processing automatically.

**Key Lessons Learned:**
1. PTY ESC â‰  Keyboard ESC (kills vs dismisses)
2. xterm.paste() buffers differently than keystrokes
3. Timing delays alone don't fix buffering
4. Auto-refocus ensures Claude sees the input

---

## V16.3: Auto-Unstick ESC Bug Fix - âœ… MERGED INTO V16.11

---

## V13: Autonomous Operation - âœ… SHIPPED

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| HB1 | Worker B | âœ… DONE | Heartbeat timer (5 min interval) |
| HB2 | Worker B | âœ… DONE | Lead response tracking (15s timeout) |
| HB3 | Worker B | âœ… DONE | Worker fallback (after 2 failed nudges) |
| HB4 | Worker A+B | âœ… DONE | User alert notification |
| HB5 | Lead | âœ… DONE | Heartbeat response logic |
| R1 | Reviewer | âœ… DONE | Verification - PARTIAL PASS |
| BUG1 | Worker B | âœ… FIXED | Heartbeat timer not firing |
| BUG2 | Lead | âœ… FIXED | False positive response detection |

### R1 Verification Summary

**Result:** PARTIAL PASS - Core flow works, fallbacks untested

- Heartbeat fires every 5 minutes âœ…
- Lead responds within timeout âœ…
- Fallback to workers: NOT TRIGGERED (Lead responsive)
- User alert: NOT TRIGGERED (no escalation needed)

**Full report:** `workspace/build/reviews/v13-verification.md`

---

## V12: Stability & Robustness - âœ… SHIPPED

| Task | Owner | Status | Commit | Description |
|------|-------|--------|--------|-------------|
| FX1 | Worker A | âœ… DONE | `fa2c8aa` | ESC key interrupt |
| FX2 | Worker B | âœ… DONE | `8301e7f` | Session persistence |
| FX3 | Lead | âœ… DONE | (in triggers.js) | Workflow gate unblock |
| FX4 | Worker A | âœ… DONE | (pending commit) | Ghost text fix v2 - ESC dismiss + isTrusted + debounce |
| FX5 | Worker A | âœ… DONE | (pending commit) | Re-enable broadcast Enter key (was over-blocked) |
| BUG2 | Lead | âœ… FIXED | (pending commit) | V13 watchdog - thinking animation counted as activity |

### FX2: Session Persistence (Worker B) - âœ… DONE

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

## CRITICAL: ESC Key Fix - âœ… IMPLEMENTED (Pending Restart)

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

## Post-V11: Autocomplete Bug Fix - âœ… COMMITTED

**Commit:** `0ba5cb7`

**Issue:** Autocomplete suggestions were auto-submitted to agent terminals without user confirmation. Happened 3+ times in testing session.

**Fix (Worker A + Worker B collaboration):**
- Added `autocomplete="off"` and related attributes to all inputs
- Made broadcast keydown handler defensive (check !isComposing, trim, block empty)
- Added `blurAllTerminals()` function to release xterm keyboard capture
- Blur terminals when any input/textarea gets focus

**Files:** ui/index.html, ui/renderer.js, ui/modules/terminal.js

---

## V11: MCP Integration - âœ… SHIPPED

**Commit:** `c4b841a` (+ fix `c567726`)

**Goal:** Replace file-based triggers with Model Context Protocol for structured agent communication.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MC1 | Lead | âœ… DONE | MCP server skeleton with stdio transport |
| MC2 | Lead | âœ… DONE | Core messaging tools (send_message, get_messages) |
| MC3 | Lead | âœ… DONE | Workflow tools (get_state, trigger_agent, claim_task) |
| MC4 | Worker B | âœ… DONE | Connect MCP server to existing message queue |
| MC5 | Worker B | âœ… DONE | Agent identification via MCP handshake |
| MC6 | Worker B | âœ… DONE | State machine integration |
| MC7 | Worker A | âœ… DONE | MCP status indicator in UI |
| MC8 | Worker A | âœ… DONE | Auto-configure MCP per agent on startup |
| MC9 | Worker A | âœ… DONE | MCP connection health monitoring |
| R1 | Reviewer | âœ… DONE | Verify all MCP tools work correctly |

---

## V10: Messaging System Improvements - âœ… SHIPPED

**Commit:** `6d95f20`

**Goal:** Make agent-to-agent messaging robust and production-ready.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MQ1 | Lead | âœ… DONE | Message queue backend - JSON array with append |
| MQ2 | Lead | âœ… DONE | Delivery confirmation IPC events |
| MQ3 | Worker A | âœ… DONE | Message history UI panel |
| MQ4 | Worker B | âœ… DONE | Message queue file watcher integration |
| MQ5 | Worker B | âœ… DONE | Gate bypass for direct messages |
| MQ6 | Worker A | âœ… DONE | Group messaging UI (workers only, custom) |
| R1 | Reviewer | âœ… DONE | Verify all messaging features |

### Worker A Completion Notes (MQ3 + MQ6)

**Files modified:**
- `ui/index.html` - Added CSS and HTML for Messages tab
- `ui/modules/tabs.js` - Added JavaScript for message display and composer
- `ui/renderer.js` - Added setup call for Messages tab

**MQ3: Message History UI:**
- New "Messages" tab in right panel
- Shows conversation history with from/to/time/content
- Filter buttons: All, Lead, Worker A, Worker B, Reviewer
- Delivery status indicators (âœ“ Delivered / â³ Pending)
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

## V9: Documentation & Polish - âœ… SHIPPED

Commit: `ac4e13c` - All 7 tasks complete.

---

## V8: Testing & Automation - âœ… SHIPPED

Commit: `4e8d7c3` - All tasks complete.

---

## V7: Quality & Observability - âœ… SHIPPED

Commit: `1df828b` - All 7 tasks complete.

---

## V6: Smart Automation - âœ… SHIPPED

**Goal:** Intelligent task routing and automated coordination.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| SR1 | Lead | âœ… DONE | Smart routing algorithm |
| SR2 | Lead | âœ… DONE | Routing IPC handlers |
| AH1 | Lead | âœ… DONE | Auto-handoff logic |
| AH2 | Worker A | âœ… DONE | Handoff notification UI |
| CR1 | Worker B | âœ… DONE | Conflict queue system |
| CR2 | Worker A | âœ… DONE | Conflict resolution UI |
| LM1 | Worker B | âœ… DONE | Learning data persistence |
| R1 | Reviewer | ðŸ”„ ACTIVE | Verify all V6 features |

**All implementation complete.** Awaiting Reviewer verification (R1).

---

## V5: Multi-Project & Performance - âœ… SHIPPED

Commit: `da593b1` - All tasks complete.

---

## V4: Self-Healing & Autonomy - âœ… SHIPPED

Commit: `f4e9453` - All 8 tasks complete.

---

## V3: Developer Experience - âœ… COMPLETE

**Goal:** Testing workflow, session history, project management

| Sprint | Focus | Status |
|--------|-------|--------|
| 3.1 | Dry-Run Mode | âœ… COMPLETE |
| 3.2 | History + Projects Tabs | âœ… COMPLETE |
| 3.3 | Polish & Verification | âœ… COMPLETE |

### Sprint 3.1: Dry-Run Mode âœ… COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker A | âœ… DONE | Settings toggle + header indicator |
| D2 | Worker B | âœ… DONE | Daemon dry-run mode (mock terminals) |

### Sprint 3.2: History & Projects âœ… COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| H1 | Worker A | âœ… DONE | Session History tab UI |
| H2 | Worker B | âœ… DONE | Session History data + IPC handler |
| J1 | Worker A | âœ… DONE | Projects tab UI |
| J2 | Worker B | âœ… DONE | Recent projects backend + IPC handlers |

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

## V2 COMPLETE ðŸŽ‰

## Sprint 2.3: Polish âœ… COMPLETE (Jan 24, 2026)

**Final sprint of V2 - All features verified by Reviewer**

| Task | Owner | Feature | Status |
|------|-------|---------|--------|
| D1 | Worker B | Daemon logging to file | âœ… |
| D2 | Worker B | Health check endpoint | âœ… |
| D3 | Worker B | Graceful shutdown | âœ… |
| U1 | Worker A | Scrollback persistence | âœ… |
| U2 | Worker A | Visual flash on trigger | âœ… |
| U3 | Lead | Kill All button | âœ… |
| U4 | Lead | Others triggers | âœ… |
| P1 | Reviewer | Final verification | âœ… |

---

## Sprint 2.2: Modularize âœ… COMPLETE (Jan 24, 2026)

Renderer.js: 1635â†’185 lines (89%â†“), main.js: 1401â†’343 lines (76%â†“)

---

## Sprint 2.1: Test Suite âœ… COMPLETE (Jan 24, 2026)

**Goal:** Add test suite (was at 0 tests)
**Result:** 86+ tests passing

| File | Owner | Tests | Status |
|------|-------|-------|--------|
| config.test.js | Worker A | ~20 | âœ… |
| protocol.test.js | Worker A | ~25 | âœ… |
| daemon.test.js | Worker B | 28 | âœ… |
| triggers.test.js | Worker B | 24 | âœ… |

**Bonus:** Lead created shared `ui/config.js` consolidating constants.

**Verified by:** Claude-Reviewer

---

## Cleanup Sprint: âœ… COMPLETE (Jan 24, 2026)

**All cleanup tasks verified by Reviewer:**
- Worker A: A1-A4 code fixes âœ…
- Worker B: B1-B4 file cleanup âœ…
- Reviewer: R1-R3 verification âœ…

**V1 STATUS: APPROVED FOR RELEASE**

See: `workspace/build/cleanup-sprint.md` for details

---

## Chain Test: âœ… SUCCESS (Jan 24, 2026)

Agent-to-agent autonomous triggering verified:
- Lead triggered â†’ Worker A responded â†’ Worker B responded â†’ Reviewer completed chain
- See: `workspace/build/chain-test.md`

---

## SPRINT #2: Terminal Daemon Architecture âœ… COMPLETE

**Goal:** Separate PTY management into daemon process so terminals survive app restarts.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker B | âœ… VERIFIED | Create `terminal-daemon.js` |
| D2 | Worker B | âœ… VERIFIED | Create `daemon-client.js` |
| D3 | Worker B | âœ… VERIFIED | Add daemon scripts to package.json |
| D4 | Lead | âœ… VERIFIED | Refactor `main.js` to use daemon |
| D5 | Worker A | âœ… VERIFIED | Update renderer for reconnection UI |
| D6 | Reviewer | âœ… DONE | Verify daemon survives app restart |

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
- Client â†’ Daemon: spawn, write, resize, kill, list, attach, ping, shutdown
- Daemon â†’ Client: data, exit, spawned, list, attached, killed, error, connected, pong

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
- When app starts and daemon has existing terminals â†’ shows "Reconnecting to existing sessions..." â†’ reattaches each terminal â†’ shows "[Session restored from daemon]" in terminal
- When app reconnects after disconnect â†’ shows "Daemon reconnected" in status bar
- When daemon disconnects â†’ shows warning in status bar

**Handoff to Reviewer:** D6 ready - test full flow: start app, spawn terminals, close app, reopen â†’ terminals should still be there.

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
- [x] Document failure modes (MEDIUM) - Lead DONE â†’ `docs/failure-modes.md`
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
| 4 terminals visible | âœ“ PASS |
| All terminals connected | âœ“ PASS |
| Broadcast to all panes | âœ“ PASS |
| Workers acknowledged roles | âœ“ PASS |
| Layout responsive | âœ“ PASS |
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
| Phase 1 | Shell (Electron + xterm + node-pty) | âœ“ COMPLETE |
| Phase 2 | State Machine (chokidar + transitions) | âœ“ COMPLETE |
| Phase 3 | UX (settings, folder picker, friction) | âœ“ COMPLETE |
| Phase 4 | Right Panel with Tabs | âœ“ CORE COMPLETE |

**See:** `shell-verification.md`, `phase2-verification.md`, `phase3-verification.md`, `phase4-verification.md`

---

## âœ… QUICK WINS SPRINT - VERIFIED COMPLETE

**Files:**
- `lead-response-friction.md` - Lead agreed to quick wins
- `reviewer-quickwins-approval.md` - Reviewer approved
- `quickwins-verification.md` - Reviewer verified all 5 tasks

**Status:** All 5 quick wins verified. Phase 4 can resume.

---

## Phase 4 Tasks - RIGHT PANEL WITH TABS (âœ“ CORE COMPLETE)

| Task | Owner | Status |
|------|-------|--------|
| Right panel structure (toggleable) | Worker A | âœ“ VERIFIED |
| Screenshots tab (full) | Worker A+B | âœ“ VERIFIED |
| Build Progress tab | Worker A | âœ“ VERIFIED |
| Processes tab | Worker B | âœ“ VERIFIED |
| Projects tab | - | DEFERRED |
| Live Preview tab | - | DEFERRED |
| User Testing tab | - | DEFERRED |

**See:** `phase4-verification.md` for full review.

### Quick Wins Sprint - âœ“ COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| QW-1 | Console log capture | Worker A | âœ“ VERIFIED |
| QW-2 | Track Claude running state | Worker A | âœ“ VERIFIED |
| QW-3 | Re-enable notifyAgents | Worker A | âœ“ VERIFIED |
| QW-4 | Agent status badges | Worker B | âœ“ VERIFIED |
| QW-5 | Refresh button per pane | Worker B | âœ“ VERIFIED |

**See:** `quickwins-verification.md` for full review.

---

## âœ… PHASE 2 COMPLETE - STATE MACHINE

| Task | Owner | Status |
|------|-------|--------|
| Create `state.json` structure | Lead | **DONE** â†’ `workspace/state.json` |
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

## âœ… PHASE 3 COMPLETE - UX IMPROVEMENTS

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

## ðŸš¨ ARCHITECTURE PIVOT - NEW PLAN FOR REVIEW

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
| U4 | **DONE** | Input bar per pane â†’ sends to that instance |
| U5 | **DONE** | Broadcast input bar â†’ sends to all (included in U1) |
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

## Jan 27, 2026 - Codex Sandbox Config Fix (Worker B) - DONE
- Ensured %USERPROFILE%\.codex\config.toml includes sandbox_mode = "workspace-write" (appended, no overwrite).

## Jan 27, 2026 - Codex Config Bootstrap in main.js (Worker B) - DONE
- Added ensureCodexConfig() to create/append sandbox_mode = "workspace-write" before window creation.
- File: ui/main.js

## Jan 27, 2026 - Codex Config Bootstrap Refinement (Worker B) - DONE
- main.js: ensureCodexConfig() updates sandbox_mode value to "workspace-write" if present; appends if missing. Added comment on dependency.
## Delivery-Ack Enhancement Review (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Reviewer approved delivery-ack enhancement for trigger sequencing. recordMessageSeen now occurs only after renderer confirmation; failed injections do not ack; 30s timeout cleanup verified; SDK path unchanged.

**Review:** APPROVED (Reviewer, Jan 28, 2026) – see `workspace/build/reviews/delivery-ack-enhancement-review.md`

**Files updated:**
- `ui/modules/triggers.js`
- `ui/modules/daemon-handlers.js`
- `ui/modules/terminal.js`
- `ui/main.js`

---

---

## Session 30 - P1 Implementation

### Task #1: Agent Health Dashboard - DONE (Implementer A)
- HTML: Added health indicators, stuck warnings, action buttons to all 6 pane headers
- CSS: Color-coded health states (.recent green, .active gray, .stale yellow), stuck pulse animation
- JS: updateHealthIndicators() with 1-second interval, formatTimeSince() helper, button handlers for Ctrl+C and ESC

### Task #2: Message Delivery Visibility - DONE (Implementer A)
- HTML: Added delivery-indicator elements to all 6 pane headers
- CSS: Delivery indicator styling with pop animation, delivery-flash on pane header
- JS: showDeliveryIndicator() and showDeliveryFailed() in daemon-handlers.js
- Hooked into both SDK and PTY delivery completion paths in processQueue()

All 418 tests pass. Awaiting Reviewer audit.
