# Blockers and Questions

Write questions here. Lead will resolve and respond.

---

## UI Audit Findings (Jan 29, 2026)

### [Investigator] - Codex pane restart loses resume context (no `resume --last` fallback)
**Owner**: Implementer B (daemon/codex-exec) + Implementer A (terminal.js)
**Priority**: HIGH - restart/respawn drops Codex context
**Status**: ✅ COMMITTED (`be2e4d0`) - Jan 30, 2026
**Symptom**: After killing a Codex pane and clicking Restart, subsequent Codex exec runs start a *new* session. Expected behavior is to resume prior context (e.g., `resume --last` or preserved session id).
**Root cause (code trace)**:
- `killTerminal()` deletes the terminal entry, including `codexSessionId` and scrollback (`ui/terminal-daemon.js:1200-1224`).
- `restartPane()` calls `pty.create()` for Codex panes, which initializes a *new* codex-exec terminal with `codexSessionId: null` (`ui/terminal-daemon.js:1032-1057`, `ui/modules/terminal.js:1452-1483`).
- `codex-exec` only uses `resume <sessionId>` when `codexSessionId` exists; otherwise it starts a new session with `--cd` (`ui/modules/codex-exec.js:186-193`).
- There is no persistence of `codexSessionId` in `session-state.json`, and no `resume --last` fallback when the session id is missing.
  - `saveSessionState()` only stores `paneId`, `cwd`, `alive`, `dryRun`, `scrollback`, `lastActivity` (no codex session fields), so even daemon session restore can't recover a Codex session id (`ui/terminal-daemon.js:204-226`).
**Additional note**:
- `codexIdentityInjected` (renderer) is not reset on restart; if a new session starts, the identity banner may be skipped, hurting `/resume` list identification (`ui/modules/terminal.js:239-277`).
**Suggested fix options**:
1) Persist `codexSessionId` per pane across restarts (session-state or renderer memory) and restore into daemon terminal on `pty.create`.
2) Add a fallback: if `codexSessionId` missing after restart, use `codex exec ... resume --last -` (if supported) or request `/resume` list then pick last.
3) Reset `codexIdentityInjected` for the pane on restart so new sessions get identity header.

**[Implementer A Fix - Jan 30, 2026]**
**Analysis update:** Code review found that session ID persistence and caching were ALREADY implemented:
- `killTerminal()` (line 1236-1238): Caches `codexSessionId` in `codexSessionCache` before killing
- `saveSessionState()` (line 220): Already saves `codexSessionId` and `codexHasSession`
- `getCachedCodexSession()` (lines 271-284): Retrieves from cache or disk
- `spawnTerminal()` for codex-exec (lines 1062-1078): Calls getCachedCodexSession and restores session ID

**The actual bug:** `codexIdentityInjected` Set was not reset on restart, causing identity header to be skipped for new sessions.

**Fix applied:**
1. Added `resetCodexIdentity(paneId)` function to `terminal.js` (line 252-256) - clears identity tracking for pane
2. Passed `resetCodexIdentity` to `createRecoveryController` options (line 318)
3. Called `resetCodexIdentity(id)` in `restartPane()` in `recovery.js` (line 227-229) before PTY recreation

**Files modified:**
- `ui/modules/terminal.js` - Added resetCodexIdentity function + passed to recovery controller
- `ui/modules/terminal/recovery.js` - Accept and call resetCodexIdentity in restartPane

**Tests:** All terminal.test.js (69 tests) and recovery.test.js (53 tests) pass

### [Investigator] - Command bar input blocked ~1s during trigger injections (focus steal)
**Owner**: Implementer A (terminal.js)
**Priority**: HIGH - interrupts user typing during triggers
**Status**: ⚠️ PARTIAL FIX (Session 41 runtime test) - still mild focus steal
**Symptom**: While typing in the command bar, incoming trigger messages briefly make the input unresponsive (~1s). Keystrokes are ignored until the delay passes.
**Likely root cause**:
- `doSendToPane()` explicitly focuses the xterm textarea to inject text/Enter, then only restores focus after `verifyAndRetryEnter()` completes. That verification includes delays (ENTER_VERIFY_DELAY_MS=200ms) and can wait up to `PROMPT_READY_TIMEOUT_MS=3000ms`. During that time, focus sits on the terminal, and with per-pane input lock enabled, all keystrokes are blocked - making the command bar feel frozen.
- The global UI focus tracker (`lastUserUIFocus`) is set but never used for restoration; `doSendToPane()` uses `document.activeElement` at injection start and restores only at the end.
**Affected files / lines**:
- `ui/modules/terminal.js:1099-1163` - focus set to xterm and restored only after verification
- `ui/modules/terminal.js:553-599` - `verifyAndRetryEnter()` wait loop can hold focus for 200ms-3s
- `ui/modules/terminal.js:640-668` - `userIsTyping()` only defers injection, does not prevent focus steal once it begins
**Suggested fix approaches** (choose one):
1) Restore focus immediately after sending Enter (or after PTY write) when `savedFocus` is a UI input; only re-focus xterm if a retry is needed.
2) If `Terminal.input()` is available and succeeds, skip focusing the textarea entirely (avoid focus steal on successful focus-free path).
3) Use `lastUserUIFocus` as the restore target (even if activeElement changed), and restore before long verification loops.
4) Optionally add a flag to skip focus changes when panes are locked (view-only mode).

**[Implementer A Fix - Jan 30, 2026]**
Combined approaches #1 and #2:
- Skip initial focus when Terminal.input() is available (lines 1113-1120)
- Skip focusWithRetry inside setTimeout when Terminal.input() is available (lines 1147-1154)
- Restore focus IMMEDIATELY after Enter sent, before verification loop (lines 1159-1161)
- Added `restoreSavedFocus()` helper with DOM existence check (lines 1102-1111)
- Verification loop now runs with focus already restored to user

**[User Runtime Test - Jan 30, 2026 Session 41]**
- **Finding:** Still can't type in command bar while messages are being injected
- **Severity:** LOW - "not a huge issue but kind of annoying"
- **Analysis:** Terminal.input() is DISABLED for Claude panes (uses sendTrustedEnter which requires focus). The focus → write → Enter sequence still steals focus briefly. For queued messages, this repeats per message.
- **Status:** PARTIAL FIX - focus restored faster but not eliminated
- **Potential future improvements:**
  1. Batch coalescing - combine rapid messages to reduce focus-steal events
  2. Typing-guard tuning - longer defer when user actively typing
  3. Background injection via offscreen terminal (complex)

### [Investigator] - Templates tab broken (IPC name mismatch + payload shape)
**Owner**: Implementer B (IPC aliases)
**Priority**: HIGH - Templates tab non-functional
**Status**: ✅ RESOLVED - Task #4 IPC Alias Implementation (Reviewer approved Session 33)  
**Root cause**:
- UI calls `ipcRenderer.invoke('get-templates')`, but IPC handler is `list-templates` (`ui/modules/ipc/template-handlers.js`).  
- UI calls `save-template` with a **string** name, but handler expects an object with `template.name` (fails with "Template name is required").  
**Affected files**:
- `ui/modules/tabs.js` (loadTemplates/saveTemplate)  
- `ui/modules/ipc/template-handlers.js` (save-template expects object; list-templates handler name)  
**Suggested fix**:
- UI: change `get-templates` → `list-templates` and pass object `{ name, config, paneProjects }` (even if config empty), **or**  
- IPC: add alias handlers for `get-templates` and accept string name in `save-template` (coerce to `{name}`), then extend UI later to save config.  

### [Investigator] - Performance tab broken (IPC name + response shape mismatch)
**Owner**: Implementer B (IPC aliases)
**Priority**: MEDIUM - Performance tab shows no data / reset no-op
**Status**: ✅ RESOLVED - Task #4 IPC Alias Implementation (Reviewer approved Session 33)  
**Root cause**:
- UI calls `get-performance-stats` / `reset-performance-stats`, but IPC handlers are `get-performance` / `reset-performance` (`ui/modules/ipc/performance-tracking-handlers.js`).  
- UI expects `result.stats`, but handler returns `{ success, agents }` (field mismatch).  
**Affected files**:
- `ui/modules/tabs.js` (loadPerformanceData/resetPerformanceData)  
- `ui/modules/ipc/performance-tracking-handlers.js`  
**Suggested fix**:
- UI: call `get-performance` / `reset-performance` and read `result.agents`, **or**  
- IPC: add alias handlers returning `{ stats: agents }` for backward compatibility.  

## Individual Trigger Files Empty (Jan 29, 2026)

### [Reviewer] - Direct trigger files (lead.txt, worker-a.txt, etc.) read as empty
**Owner**: Implementer B (watcher.js)
**Priority**: LOW - cosmetic log noise only (messages deliver correctly)
**Status**: BACKLOGGED (LOW/cosmetic) - Log noise, not delivery failure
**Symptom**: Writing to `lead.txt` triggers "Empty trigger file after 3 retries" in npm console. Broadcast via `all.txt` works fine.
**Likely cause**: Race condition in `handleTriggerFileWithRetry` (watcher.js:686-716). The 3 retries × 50ms = 150ms window may not be enough for Windows file system to flush individual file writes. Broadcast may use different code path.
**Affected files**:
- `ui/modules/watcher.js` (handleTriggerFileWithRetry, TRIGGER_READ_MAX_ATTEMPTS, TRIGGER_READ_RETRY_MS)
**Suggested fix**:
- Increase TRIGGER_READ_MAX_ATTEMPTS to 5 or TRIGGER_READ_RETRY_MS to 100ms
- Or investigate why broadcast works but individual triggers don't

**[Investigator update - Jan 30, 2026]**
- `workspace/logs/app.log` shows **Accepted** trigger lines immediately followed (~200–250ms later) by **"Empty trigger file after 3 retries"** for the same file. This matches `triggers.handleTriggerFile()` clearing the file after delivery (triggers.js ~935/981), which triggers another change event that the fast watcher retries and then logs as empty.
- Example pattern in logs:  
  `Accepted: implementer-a #1 → lead` → `Sent via inject-message` → `Empty trigger file after 3 retries: lead.txt`.
- Conclusion: the empty-file log is **expected post-clear noise**, not proof of failed delivery. If direct delivery appears missing, likely causes are:
  - **SKIPPED duplicate** sequence drops (log shows many reviewer → lead duplicates when seq resets without session banner).
  - **Workflow gate** blocking triggers.
- Suggested tweak: suppress/trace-level the empty-file log when it follows a successful `handleTriggerFile()` clear, or add a guard to ignore empty change events immediately after clearing.

**[Reviewer update - Jan 30, 2026]**
- Confirmed Investigator analysis: log is post-clear noise, not delivery failure
- Architect decision (Session 34 #8-#9): No fix needed, backlogged as LOW/cosmetic
- **Optional future tweak** (watcher.js:34-35) if log verbosity becomes an issue:
  ```javascript
  const TRIGGER_READ_RETRY_MS = 100;   // Was 50
  const TRIGGER_READ_MAX_ATTEMPTS = 5; // Was 3
  ```
- **Resolution**: Not a bug - working as designed

---

## Auto-Submit Failure (Jan 29, 2026)

### [Investigator] - Auto-submit intermittently fails (Enter ignored / false delivery)
**Owner**: Implementer A (terminal.js) + Implementer B (IPC/input)  
**Priority**: CRITICAL - agents require manual Enter  
**Status**: OPEN  
**Symptom**: Message text appears at prompt but is not submitted; user must press Enter. Delivery metrics show 100% because we count injection, not actual submission.  
**Likely causes (code review)**:
1) **Idle ≠ ready**: `processQueue()` only waits for output silence. Claude can be silent but still busy (“thinking”), so Enter is ignored. `verifyAndRetryEnter()` treats any later output as success, even if it was unrelated continuation → false delivered.  
2) **Focus/Enter routing**: `sendTrustedEnter` depends on focus. If focus fails/drifts between `pty.write` and Enter, the key event goes to the wrong element; input stays at prompt.  
3) **Synthetic Enter blocked?** `attachCustomKeyEventHandler` blocks untrusted Enter unless bypassed. If `sendInputEvent` produces `isTrusted=false` in some conditions, Enter could be dropped.  
**Affected files**:
- `ui/modules/terminal.js` (doSendToPane, verifyAndRetryEnter, idle gating, focusWithRetry, key handler)  
- `ui/modules/ipc/pty-handlers.js` (send-trusted-enter uses sendInputEvent with keyCode 'Return')  
**Suggested investigation / fix**:
- Add logging around sendTrustedEnter: activeElement tag/class, focus success, `event.isTrusted` for Enter in `attachCustomKeyEventHandler`.
- Replace "output activity = success" with **prompt‑ready detection** before marking delivered (detect prompt marker or ready state).
- Consider stricter gating: require prompt‑ready, or delay until prompt appears rather than idle silence.

**[Reviewer Validation - Session 33]:**
Code review confirms all 3 concerns:
1. `verifyAndRetryEnter` (terminal.js:322-384): Uses `lastOutputTime` comparison. Any output after Enter = success. Could be continuation output, not response to submitted message.
2. `doSendToPane` (terminal.js:828-831): After `focusWithRetry` fails, code proceeds with "sending Enter anyway" - Enter goes to wrong element.
3. `attachCustomKeyEventHandler` (terminal.js:543-550): Blocks `!event.isTrusted` Enter unless `_hivemindBypass` set. Bypass is only set for ESC events (lines 1152-1163), NOT for Enter from `sendInputEvent`. Question: does Electron's `webContents.sendInputEvent` produce trusted events? If not, all programmatic Enter would be blocked.

**[Investigator update - Jan 30, 2026]:**
- Confirmed `_hivemindBypass` is only set for ESC in `terminal.js` (aggressiveNudge) and is never set around `sendTrustedEnter`. Both init and reattach attachCustomKeyEventHandler blocks will reject untrusted Enter unless bypassed.
- `send-trusted-enter` (ui/modules/ipc/pty-handlers.js) only emits keyDown/char/keyUp via `webContents.sendInputEvent` with no bypass metadata; if those events surface as `isTrusted=false` to xterm, Enter is always blocked.
- Suggested quick runtime check: trigger a programmatic send and look for `Blocked synthetic Enter (isTrusted=false)` vs `Allowing programmatic Enter (hivemind bypass)` in logs to confirm trust behavior.
- Docs: `Terminal.input(data, wasUserInput?)` emits `onData` as if typed input; `wasUserInput` only affects UI-side behavior (focus/selection). API introduced in xterm.js 5.4.0. If onData routes to PTY, `terminal.input('\\r')` should act like Enter without focus, but still needs runtime validation on Windows/Claude ink.

**[Investigator update - Jan 30, 2026 - V3 sanity check]:**
- `@xterm/xterm` is pinned to 6.0.0 in `ui/package.json` and `package-lock.json`, so `Terminal.input()` should exist at runtime (feature-detect still recommended).
- `sendEnterToPane()` now prefers `terminal.input('\\r', false)`; note this still routes through xterm `onData` → `pty.write` (similar to prior PTY newline path). If Claude ink ignores PTY `\\r` on Windows, input() may still fail; needs runtime validation.
- Prompt-ready detection (`isPromptReady`) only matches line endings `> $ # :` and may miss Claude prompt if it uses `❯` or other glyphs; could also false-positive on output lines ending with `:` or `#`. Current logic treats output+idle as success even without prompt, so prompt detection mostly affects logging, not gating.
- Risk: if Claude accepts input but delays output >100ms, `verifyAndRetryEnter()` sees no output, sees idle, and may resend Enter quickly (possible double-submit). Consider increasing initial verify delay or requiring a longer idle wait before retry.

**[Investigator update - Jan 30, 2026 - Terminal.input fallback risk]:**
- `sendEnterToPane()` always uses `Terminal.input()` when available; it only falls back to `sendTrustedEnter` if `Terminal.input()` throws.
- If `Terminal.input('\\r')` is a no-op for Claude submission (as with direct PTY `\\r`), `verifyAndRetryEnter()` will retry Enter using the same method repeatedly and never reach the trusted Enter path.
- Suggested fix: after first retry with no output, switch to `sendTrustedEnter` (or add a per-pane flag to disable `Terminal.input` for Claude panes). Alternatively, detect failure and temporarily flip a `preferTrustedEnter` flag for that pane.

**[Investigator update - Jan 30, 2026 - log evidence]:**
- `workspace/logs/app.log` shows repeated `verifyAndRetryEnter` retries with **no output activity** and eventual failure for pane 6:
  - `04:25:53.815` Enter sent via `Terminal.input()`
  - `04:25:54.016` "No output activity, will retry Enter (5 left)"
  - Multiple retries (4..1 left), all via `Terminal.input()`
  - `04:25:56.249` "Enter verification failed after retries" + `StuckSweeper` marked
- This matches user observation of batching (message may sit until next injection/enter). Indicates `Terminal.input()` path can still fail in practice.

**[Investigator update - Jan 30, 2026 - post-fix log evidence]:**
- `workspace/logs/app.log` (04:49:25-04:49:30) shows identity injections for panes 1/3/6 using `sendTrustedEnter` (bypass enabled) still hit max retries with no output activity, then `StuckSweeper` marked and cleared within ~1s once output started.
- This suggests `verifyAndRetryEnter()`'s short initial wait and retry loop can misclassify "slow start" as failure and spam Enter, even when `sendTrustedEnter` is working.
- Possible tweaks to consider: skip verification for identity injection, extend initial verify delay/retry window for first prompt after spawn, or treat "pane just spawned" as a special case.

**[Investigator update - Jan 30, 2026 - input lock / Enter bypass suspicion]:**
- `workspace/logs/app.log` shows **no** `Allowing programmatic Enter (hivemind bypass)` or `Blocked synthetic Enter` lines, even when `sendTrustedEnter` is invoked repeatedly.
- If Electron `sendInputEvent` marks Enter as `isTrusted=true` (or `event.key` is `'Return'`), the current bypass check (`event.key === 'Enter' && !event.isTrusted`) never runs, and the per‑pane input lock blocks the key.
- This matches user symptom: text appears in Claude prompt but never submits when panes are locked by default.
- Suggested verification: log `event.key` + `event.isTrusted` for Enter in `attachCustomKeyEventHandler` to confirm; if true/Return, allow `terminal._hivemindBypass` to bypass lock regardless of `isTrusted`, and/or treat `'Return'` as Enter.

**[Investigator update - Jan 30, 2026 - delivery timeout noise]:**
- `Trigger delivery failed for pane X: timeout` appears ~1s after injection; `INJECTION_LOCK_TIMEOUT_MS` is 1000ms, but `verifyAndRetryEnter` can exceed this.
- This can mark deliveries failed even when Enter eventually succeeds; consider raising timeout or finishing earlier for Claude path to avoid false "delivery failed".

**[Implementer A update - Jan 30, 2026]:**
- Fix applied: key handler now checks `_hivemindBypass` **before** `isTrusted` gate and accepts `key='Return'` + `keyCode=13`. Added debug logs for `event.key`/`isTrusted`.  
- Status: **Needs runtime verification** (no post-restart test recorded for locked-pane Enter).

**[Mitigation - Task #6]:** Stuck message sweeper approved (Session 33). 30s periodic retry for panes marked stuck after verifyAndRetryEnter fails. Addresses symptom, not root cause.

**[Architect update - Jan 30, 2026 Session 38 - ROOT CAUSE FIX ASSIGNED]:**
- **Confirmed root cause**: Investigator's analysis at line 154-158 is correct. The bypass check condition `event.key === 'Enter' && !event.isTrusted` is TOO NARROW:
  - Electron's `sendInputEvent` likely produces `event.key === 'Return'` (not 'Enter')
  - OR it produces `event.isTrusted === true`
  - Either way, the condition is FALSE, bypass check never runs, input lock blocks the key
- **Fix assigned to Implementer A**: Change bypass check to:
  - Check BOTH 'Enter' AND 'Return' keys
  - Allow bypass regardless of isTrusted when `terminal._hivemindBypass` is set
- **Locations**: terminal.js lines ~808-815 and ~924-931 (both attachCustomKeyEventHandler blocks)

**[Architect verification - Jan 30, 2026]:**
- ✅ Fix implemented correctly by Implementer A
- ✅ `isEnterKey` covers 'Enter', 'Return', and keyCode 13
- ✅ Bypass check runs FIRST before isTrusted check
- ✅ Both attachCustomKeyEventHandler blocks match
- ✅ Debug logging added for key/isTrusted

**[Reviewer approval - Jan 30, 2026]:**
- ✅ APPROVED - Review: `session38-input-lock-bypass-review.md`
- Both handler blocks verified (initTerminal 806-821, reattachTerminal 929-944)
- **Status**: ✅ RUNTIME VERIFIED (Session 39) - Auto-submit working

**[Reviewer update - Jan 30, 2026 Session 39 - TIMEOUT NOISE PERSISTS]:**
- Input lock bypass VERIFIED working: logs show `Allowing programmatic Enter (hivemind bypass, key=Enter, isTrusted=true)`
- BUT `Trigger delivery failed for pane X: timeout` STILL appears
- **ROOT CAUSE**: safetyTimer at terminal.js:1064-1066 fires at 1000ms BEFORE verifyAndRetryEnter completes (~2-3s)
- The previous fix (lines 1191-1195) only catches `finishWithClear` returns, not safetyTimer
- **FIX NEEDED (Implementer A)**:
  - Option 1: Increase INJECTION_LOCK_TIMEOUT_MS from 1000ms to 5000ms
  - Option 2: Clear safetyTimer IMMEDIATELY after Enter sent (before verification loop)
  - Option 3: Make timeout return `{success: true, verified: false}` to suppress error log
- **Priority**: LOW (cosmetic) - messages ARE delivered, just logs false failures
- **Status**: ✅ ALREADY FIXED (code audit Jan 30, 2026) - Pending runtime verification

**[Implementer A code audit - Jan 30, 2026]**
Fix already applied in `ui/modules/terminal/injection.js`:
- **Option 2 applied**: Line 460 - `clearTimeout(safetyTimer)` called at start of setTimeout callback
- **Option 3 applied**: Lines 364-367 - safetyTimer returns `{ success: true, verified: false, reason: 'timeout' }`
Since `success: true`, daemon-handlers.js line 586 (`if (result.success === false)`) should NOT trigger "delivery failed" log.
Needs runtime verification to confirm log noise is gone.

## Performance Tab Non-Functional (Jan 29, 2026)

### [Reviewer] - IPC contract mismatch breaks Performance tab
**Owner**: Implementer B (IPC aliases)
**Priority**: MEDIUM - tab displays no data
**Status**: ✅ RESOLVED - Task #4 IPC Alias Implementation (Reviewer approved Session 33)

**Triple Mismatch Identified:**
1. **Channel names:** Frontend calls `get-performance-stats` / `reset-performance-stats`, backend defines `get-performance` / `reset-performance`
2. **Response field:** Frontend expects `result.stats`, backend returns `result.agents`
3. **Missing field:** Frontend expects `successes` field, backend only has `completions` and `errors`

**Files:**
- Frontend: `ui/modules/tabs.js:996-1009`
- Backend: `ui/modules/ipc/performance-tracking-handlers.js:86-110`

**Recommended Fix (Backend Normalization):**
1. Rename channels to `get-performance-stats` and `reset-performance-stats`
2. Rename response field from `agents` to `stats`
3. Add `successes` field (can equal `completions` if completion implies success)

---

## PTY Injection Serialization Race (Jan 28, 2026)

### [Investigator] - Claude PTY injections collide when triggers fire together
**Owner**: Implementer B (renderer/daemon-handlers/terminal)
**Priority**: HIGH - trigger deliveries can misfire or land in wrong pane
**Status**: ✅ RESOLVED (Reviewer approved Jan 28, 2026)
**Problem**: Multiple `inject-message` IPC events can arrive back-to-back when several trigger files change at once. Each triggers a `terminal.sendToPane()` call that focuses a pane and schedules `sendTrustedEnter()` via `setTimeout()`. These injections overlap across panes; focus can shift between timers, so Enter goes to the wrong pane or text interleaves.
**Evidence**:
- `ui/modules/triggers.js` sends `inject-message` for each trigger file (PTY mode) without cross-pane serialization.
- `ui/modules/daemon-handlers.js` queues per-pane but releases after a fixed 150ms delay (not tied to injection completion).
- `ui/modules/terminal.js` `doSendToPane()` uses focus + delayed Enter (50ms) and retry loops; not awaitable.
**Suggested fix approach**:
- Add a global Claude injection mutex/queue (not per-pane) so only one PTY injection runs at a time; skip Codex panes.
- Convert `doSendToPane()` to async or callback-driven completion, and only release the lock after the Enter/restore cycle (or textarea retry/fallback) completes.
- Alternatively, move serialization into `daemon-handlers` with a global queue and await a new `terminal.sendToPaneAsync()` promise.

**Update (Jan 28, 2026)**: Implementer B added a global injection mutex in ui/modules/terminal.js (injectionInFlight + onComplete). Needs runtime verification; consider skipping the lock for Codex exec to avoid unnecessary serialization.

## Hybrid Fix Focus-Restore Bug (Jan 28, 2026)

### [Reviewer] - Cross-pane focus not restored after injection
**Owner**: Implementer A (terminal.js)
**Priority**: LOW - user inconvenience only
**Status**: ✅ RESOLVED (Implementer A, Jan 28, 2026)
**Problem**: In `doSendToPane()` lines 604 and 617, the condition `!wasXtermTextarea` prevents focus restore when user was in ANY xterm textarea (including a different pane).
**Impact**: If user is working in pane 3's terminal and trigger injects to pane 1, focus stays on pane 1 instead of returning to pane 3.
**Fix applied**: Removed `!wasXtermTextarea` check from both lines. The `savedFocus !== textarea` condition already ensures we don't restore to the same element. Also removed unused `wasXtermTextarea` variable declaration.

---

## lead.txt Trigger Not Delivering (Jan 28, 2026)

### [Investigator] - lead.txt dropped due to duplicate sequence after agent restart
**Owner**: Implementer B (triggers/message sequencing) + Architect (workflow decision)
**Priority**: MEDIUM - blocks Reviewer → Architect direct messages
**Status**: ✅ CODE VERIFIED (Reviewer, Jan 29, 2026) - Runtime verification on next agent restart
**Root cause**:
- `ui/modules/triggers.js` deduplicates messages by `(sender, seq, recipient)` using `message-state.json`.
- When an agent restarts, its sequence counter resets to `#1`, but the main app does **not** reset `lastSeen` for that sender unless the **entire app restarts**.
- Result: reviewer sends `(REVIEWER #1)` to `lead.txt`, `isDuplicateMessage()` treats it as already seen and silently drops it (file is cleared, no delivery).
- This does **not** affect `all.txt` because `recipientRole` becomes `all`, which is **not** in `messageState.sequences`, so duplicates are never checked for broadcasts.
**Evidence**:
- `parseMessageSequence()` + `isDuplicateMessage()` in `ui/modules/triggers.js` (around lines 100–150).
- `recipientRole = filename.replace('.txt','')` → `lead` triggers dedupe; `all` does not.
- `loadMessageState()` only runs at triggers.init (app startup) and resets `lastSeen`; no per-agent/session reset.
**Suggested fix approach**:
1. **Session-aware sequencing**: include a session id/date in the message prefix and store `lastSeen` per `(sender, recipient, sessionId)`.
2. **Reset-on-regression**: if `seq` drops and message contains a session banner (e.g., `# HIVEMIND SESSION: ...`), reset `lastSeen[sender]` for that recipient.
3. **Time-based expiry**: expire `lastSeen` entries after N hours/days to allow fresh sessions without app restart.

**Update (Jan 28, 2026)**: Architect requested a minimal fix path for Implementer B. Proposed smallest-change rule:
- **Reset-on-session-banner**: if `seq == 1` AND message includes a session banner line (e.g., `# HIVEMIND SESSION:`), then clear `lastSeen[sender]` for that recipient before duplicate check.
  - Covers the common agent-restart case without introducing session maps.
  - Keeps existing dedupe behavior for mid-session repeats.
- Optional fallback: time-based expiry of `lastSeen` entries (e.g., 24h) to handle missing banner cases.

**Implementation detail (suggested)**:
- **Where**: `ui/modules/triggers.js` inside `handleTriggerFile()` immediately after `parseMessageSequence()` and before `isDuplicateMessage()`.
- **How** (pseudocode):
  - `const hasSessionBanner = /#\\s*HIVEMIND SESSION:/i.test(message);`
  - `if (parsed.seq === 1 && parsed.sender && hasSessionBanner) {`
    - `const recipientState = messageState.sequences[recipientRole] || { outbound: 0, lastSeen: {} };`
    - `if (recipientState.lastSeen[parsed.sender] > 0) { recipientState.lastSeen[parsed.sender] = 0; saveMessageState(); }`
  - `}`
  - Then proceed to `isDuplicateMessage(...)`.
- **Logging**: add a `log.info('Trigger', 'Reset lastSeen …')` entry to help verify reset in daemon logs.

**Verification (Jan 28, 2026)**:
  - Code audit: `handleTriggerFile()` still calls `isDuplicateMessage()` immediately after `parseMessageSequence()` with no reset-on-session-banner logic. Issue persists in `ui/modules/triggers.js` (~620-640).

**Update (Jan 29, 2026)**:
  - Code audit: `handleTriggerFile()` now includes reset-on-session-banner logic before duplicate check:
    - `if (parsed.seq === 1 && message.includes('# HIVEMIND SESSION:')) { ... lastSeen[sender] = 0; saveMessageState(); }`
    - Logs `Reset lastSeen for sender restart: ...`
  - **Still needs runtime verification**: restart an agent, send `(ROLE #1)` with session banner, confirm no `SKIPPED duplicate` for `lead.txt`.

**Edge cases from audit**:
- `parseMessageSequence()` only matches messages starting with `(ROLE #N):`. If a sender drops this format, dedupe never runs (duplicates may pass).
- Broadcast `all.txt` bypasses dedupe because `recipientRole='all'` is not in `messageState.sequences` (by design).
- Reset rule depends on session banner being present **in the same message** as `#1`; otherwise duplicates still drop after agent restart.
**Files**: `ui/modules/triggers.js` (message sequencing + duplicate check), `workspace/message-state.json` (persistence).
**Next step**: Verify by sending `(REVIEWER #1)` to `lead.txt` after reviewer restart and checking trigger logs for "SKIPPED duplicate".

## ðŸ”´ Codex Exec Display Bugs (Jan 28, 2026)

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

## ðŸš¨ ACTIVE STATUS (Jan 27, 2026)

**6-Pane Expansion:** External changes applied to terminal.js and triggers.js

| Agent | Status | Notes |
|-------|--------|-------|
| Lead (Claude) | âœ… Online | Pane 1 - Architect |
| Worker A | â“ Unknown | Pane 2 - Orchestrator |
| Worker B | â“ Unknown | Pane 3 - Implementer A |
| Worker C | â“ Unknown | Pane 4 - Implementer B |
| Investigator | â“ Unknown | Pane 5 - NEW ROLE |
| Reviewer | â“ Unknown | Pane 6 - NEW ROLE |

**Yesterday's Achievement:** Multi-model communication proven (Claude â†” Codex)

---

## ðŸ”´ 6-PANE EXPANSION RISKS (Jan 27, 2026)

**Source:** Lead + Codex (REVIEWER #11) joint review of external agent changes

### RISK 1: SDK Mode Hard-Coded to 4 Panes
**Priority:** HIGH
**Files:** `ui/modules/sdk-renderer.js`, `ui/renderer.js`
**Problem:** SDK mode UI still forces a 4â€‘pane layout. `sdk-renderer.js` sets `SDK_PANE_IDS = ['1','2','3','4']` and `renderer.js` `applySDKPaneLayout()` explicitly hides panes `5` and `6`.
**Impact:** SDK mode will only render panes 1â€“4; panes 5â€“6 are hidden so messages for Investigator/Reviewer never display (ghost/blackâ€‘hole behavior) even though backend now supports 6 panes.
**Fix Required:** Expand SDK pane config to 6 (update `SDK_PANE_IDS/SDK_PANE_ROLES`, labels) and remove/adjust the hide logic for panes 5â€“6 in `applySDKPaneLayout()`. If intentional to keep 4, explicitly disable pane 5/6 SDK sessions to avoid orphaned output.
**Owner:** Lead (suggested: Worker A - UI)
**Investigation (Jan 27):** `ui/modules/sdk-bridge.js` and `hivemind-sdk-v2.py` already handle 6 panes; the remaining 4â€‘pane hardcoding is in the renderer layer.

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
**Status**: âœ… RESOLVED - All 3 bugs fixed, approved for testing
**Date**: Jan 26, 2026

**AUDIT SCOPE**: hivemind-sdk-v2.py, sdk-bridge.js, sdk-renderer.js, renderer.js

### âš ï¸ DISCOVERY: CODE ALREADY EXISTS BUT HAS BUGS

STR-1 through STR-5 are **ALREADY IMPLEMENTED** in code but **NOT WORKING CORRECTLY**.

**Evidence:**
- `hivemind-sdk-v2.py:175` - `include_partial_messages=True` âœ…
- `hivemind-sdk-v2.py:363-394` - `StreamEvent` text_delta parsing âœ…
- `sdk-bridge.js:533-540` - `text_delta` â†’ `sdk-text-delta` IPC âœ…
- `renderer.js:726-733` - `sdk-text-delta` listener âœ…
- `sdk-renderer.js:609-713` - `appendTextDelta()`, `finalizeStreamingMessage()` âœ…

### ðŸ› BUG 1: finalizeStreamingMessage() NEVER CALLED

**File**: `renderer.js` lines 712-721
**Problem**: When streaming ends (`sdk-streaming` with `active=false`), we only call `streamingIndicator()`:

```javascript
ipcRenderer.on('sdk-streaming', (event, data) => {
    if (!data) return;
    const { paneId, active } = data;
    sdkRenderer.streamingIndicator(paneId, active);
    // âš ï¸ MISSING: if (!active) sdkRenderer.finalizeStreamingMessage(paneId);
});
```

**Impact**: The blinking cursor (`â–Œ`) NEVER gets removed when streaming ends.

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

### ðŸ› BUG 2: DOUBLE RENDERING - Streamed message + Full message

**File**: `sdk-renderer.js:485` and `renderer.js:684-707`
**Problem**: When response completes, Python sends:
1. Many `text_delta` messages â†’ rendered via `appendTextDelta()`
2. One `assistant` message with FULL text â†’ rendered via `appendMessage()`

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

### ðŸ› BUG 3: clearStreamingState() Not Called on New Turn

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

**IDENTIFIED VIA**: Pop quiz during comms check (Reviewer â†’ Worker A)

**Problem**: Several UI buttons lack debouncing/rate-limiting and could fire multiple IPC calls on rapid clicks:
- `spawnAllBtn` - could spawn duplicate processes
- `killAllBtn` - multiple kill signals
- `nudgeAllBtn` - redundant nudges
- `freshStartBtn` - multiple fresh starts (destructive!)

**What's Protected**:
- âœ… Broadcast input: 500ms debounce via `lastBroadcastTime` (renderer.js:267-277)
- âœ… Full Restart: Has `confirm()` dialog acting as implicit debounce

**Recommended Fix** (Worker A's analysis):
1. **Destructive buttons (kill, freshStart)**: Add `disabled` state while async op in progress - gives visual feedback
2. **Non-destructive buttons (spawn, nudge)**: `isProcessing` flag is sufficient

**Not blocking current sprint** - tracking for code quality improvement.

---

### [Investigator] - Focus Steal During Auto-Inject (Jan 27, 2026)
**Owner**: Worker A (UI/terminal)
**Priority**: MEDIUM
**Status**: LIKELY RESOLVED IN CODE (Jan 28, 2026) - pending runtime verification
**Date**: Jan 27, 2026

**Symptom (from errors.md)**: "Terminal output steals focus from broadcast input."

**Investigation summary**:
- I could not find any focus call in PTY output handlers. `window.hivemind.pty.onData` only writes to the terminal.
- The only explicit focus changes are in `focusPane()` (user-initiated click/shortcut) and `doSendToPane()` (message injection).
- Verified Jan 28, 2026: `rg "focus(" ui/` only hits `ui/modules/terminal.js` (no focus in output handlers).

**Likely root cause (historical)**:
At time of report, `doSendToPane()` restored focus via `lastUserUIFocus` (inputs/textarea only). If the user was in a terminal or a non-input element, restore target was null/stale, so focus stayed on the injected pane. This is not tied to output; it's tied to the send path.

**Update (Jan 28, 2026)**:
`rg "focus("` shows focus calls only in `ui/modules/terminal.js` (no focus calls in renderer output handlers), so the errors.md note blaming output handlers is inaccurate.

**Verified in code (Jan 28, 2026)**:
- `initUIFocusTracker()` only records INPUT/TEXTAREA focus (excluding `.xterm-helper-textarea`) â€” `ui/modules/terminal.js:105-118`
- `doSendToPane()` now captures `document.activeElement` as `savedFocus`, focuses the target textarea for injection, then restores `savedFocus` (if still in DOM) â€” `ui/modules/terminal.js:~630-700`
- `lastUserUIFocus` is now only used for typing-guard, not for focus restore
- No focus calls in PTY output handlers; `pty.onData` only writes to terminal and updates idle timestamps â€” `ui/modules/terminal.js:375-379`, `ui/modules/terminal.js:468-472`

**Additional findings (Jan 28, 2026)**:
- Codex exec path shares the same `savedFocus` restore logic (should now restore terminal focus too).
- Focus tracking still ignores buttons/contenteditable; if user focus is on a non-focusable element, restore can no-op and focus may remain on injected pane.
**Impact detail**:
- Broadcasts or trigger injections while user is active in any terminal will often leave focus on the last-injected pane, interrupting typing in the original pane.
**Affected files/lines**:
- `ui/modules/terminal.js:526-668` (`doSendToPane` focus/restore)
- `ui/modules/terminal.js:105-118` (`initUIFocusTracker` only tracks input/textarea)

**Suggested fix approach**:
- Capture `document.activeElement` at the start of `doSendToPane()` when it is *not* an `.xterm-helper-textarea`, and restore to it after injection (if still in DOM).
- Alternatively, track `lastNonXtermFocus` on any `focusin` (not just inputs) and restore to that.
- Optional: track last focused xterm textarea per pane and restore when the user was already in a terminal (avoid cross-pane focus jumps).
 - If using a global focus tracker, consider a short-lived "injection in progress" flag so focusin events from injected textareas do not overwrite the true user focus (avoids staggered-broadcast issues).

---

### [Investigator] - Intermittent Auto-Submit Race (PTY text vs trusted Enter) (Jan 28, 2026)
**Owner**: Implementer A (terminal.js)
**Priority**: MEDIUM - causes late-session manual Enter
**Status**: ✅ RESOLVED (Implementer A, Jan 28, 2026)
**Root cause**:
- Fixed 50ms delay was insufficient under load - Enter fired before text appeared
- If textarea disappeared during delay, Enter went to wrong element
**Fix applied (Implementer A)**:
- Implemented approach #2 (adaptive delay): 50ms idle / 150ms active / 300ms busy
- Implemented approach #3 (focus verification): `focusWithRetry()` with up to 3 attempts
- Implemented approach #4 (textarea guard): Skip if null, re-query after delay, abort if disappeared
**Files updated**:
- `ui/modules/terminal.js` - `doSendToPane()` refactored with adaptive delay + guards

---

### [Reviewer] - File Watcher Event Batching Gap (Jan 26, 2026)
**Owner**: Worker B
**Priority**: MEDIUM - Could cause performance issues on large operations
**Status**: âœ… RESOLVED (Jan 26, 2026) - Worker B added 200ms debounce
**Date**: Jan 26, 2026

**IDENTIFIED VIA**: Pop quiz during comms check (Reviewer â†’ Worker B)

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
- âœ… 1-second polling interval (natural throttle, not real-time flood)
- âœ… Ignoring node_modules, .git, instances/, state.json
- âœ… usePolling: true for Windows compatibility

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

**OVERALL ASSESSMENT**: âœ… CODE IS SOLID
- No critical bugs found
- snake_case/camelCase handling is correctly implemented
- SDK mode guards are in place across all files
- Error handling is adequate
- Session persistence flows look correct

**Previous major issues (from status.md) appear correctly fixed:**
- âœ… Content array handling in sdk-renderer.js
- âœ… User message type handler added
- âœ… Role-specific cwd in Python
- âœ… bypassPermissions instead of acceptEdits
- âœ… JSON serialization with default=str

---

### [Lead] - CRITICAL: SDK Message Routing Bug - snake_case vs camelCase
**Owner**: Lead
**Priority**: CRITICAL - Will break ALL SDK message routing
**Status**: âœ… FIXED (Jan 25, 2026)

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

**ISSUE 1: SDK Mode Flags Not Synchronized** âš ï¸ BY DESIGN
Two separate `sdkModeEnabled` flags exist:
- `triggers.js` line 19 (main process)
- `daemon-handlers.js` line 20 (renderer process)

Caller must set BOTH when enabling SDK mode. This is intentional - separate processes.

**ISSUE 2: notifyAgents() Bypasses SDK** âœ… FIXED by Worker B
Updated `notifyAgents()` to check `isSDKModeEnabled()` and route through `sdkBridge.sendMessage()`.

**ISSUE 3: notifyAllAgentsSync() Bypasses SDK** âœ… FIXED by Worker B
Updated `notifyAllAgentsSync()` to check `isSDKModeEnabled()` and route through SDK (debounce preserved).

**ISSUE 4: Message Queue Bypasses SDK** âœ… FIXED (cascading)
`watcher.js` uses `triggers.notifyAgents()` which now routes through SDK when enabled.

**ISSUE 5: Missing Error Handling** âš ï¸ PARTIALLY RESOLVED
`daemon-handlers.js` now logs send failures in the SDK path (catch block), but UI still doesn't show a failed delivery state.

**PASSING CHECKS:**
- âœ… Protocol consistency: All modules use `paneId` as string '1'-'4'
- âœ… IPC handlers: `sdk-send-message` and `sdk-interrupt` match usage
- âœ… handleTriggerFile(), sendStaggered(), broadcastToAllAgents(), sendDirectMessage(), processQueue() all route correctly via SDK when enabled

---

### [Worker A] - SDK V2 AUDIT: Missing IPC Emissions
**Owner**: Lead (fixing)
**Priority**: HIGH - SDK status UI won't work
**Status**: âœ… FIXED (Jan 25, 2026)

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

**Risk**: Settings says SDK off, but local variable says on â†’ inconsistent behavior

**Investigator update (Jan 29, 2026)**:
- Confirmed 4 separate SDK mode flags can drift:
  - `ui/renderer.js` local `sdkMode` (line ~17), toggled in `markTerminalsReady` (line ~68) and `window.hivemind.sdk.enableMode/disableMode` (lines ~144-157).
  - `ui/modules/settings.js` `currentSettings.sdkMode` (load/toggle).
  - `ui/modules/daemon-handlers.js` `sdkModeEnabled` (line ~31, `setSDKMode` line ~88).
  - `ui/modules/terminal.js` `sdkModeActive` (set via `setSDKMode`, line ~895).
- `markSettingsLoaded()` sets `daemonHandlers.setSDKMode(true)` and `terminal.setSDKMode(true)` when settings say SDK mode is on (renderer.js lines ~52-55) but does **not** set local `sdkMode`, so `window.hivemind.sdk.isActive()` can still report false.
- `window.hivemind.sdk.enableMode()` flips local `sdkMode` and initializes SDK UI (renderer.js lines ~144-153) but does **not** update settings or call `daemonHandlers.setSDKMode` / `terminal.setSDKMode`, so PTY guards may remain enabled.
- Mixed checks: `sendBroadcast()` uses `currentSettings.sdkMode || sdkMode` (renderer.js line ~507), but other call sites check only `sdkMode`, so behavior can diverge depending on entry point.
**Suggested fix approach**: collapse to a single source of truth (settings + main-process event). Options: (1) remove local `sdkMode` and always read `settings.getSettings().sdkMode` plus daemon-reported `sdkMode`; (2) centralize a `setSDKMode(enabled)` helper in renderer that updates local, settings via IPC, and calls `daemonHandlers.setSDKMode` + `terminal.setSDKMode` in one place (used by `markSettingsLoaded`, `sdk-session-start`, and UI toggles).

---

### [Worker A] - SDK V2 AUDIT: window.hivemind.settings Undefined
**Owner**: Worker A
**Priority**: LOW - Only affects debug mode display
**Status**: âœ… FIXED (Jan 25, 2026)

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

**1. `interrupt` command NOT IMPLEMENTED in Python** âœ… FIXED
- Added `interrupt_agent()` method to HivemindManager
- Added `interrupt` case in run_ipc_server()
- Calls `agent.client.interrupt()` on the target pane

**2. Session file format MISMATCH** âœ… FIXED
- JavaScript now uses nested format: `{ "sdk_sessions": { "1": "abc" } }`
- loadSessionState() has migration fallback to read old flat format
- saveSessionState() preserves other data in the file

**3. Race condition on startup** âš ï¸ LIKELY RESOLVED IN CODE (Jan 28, 2026) - pending runtime verification
`sdk-bridge.js` now queues messages until `ready` and flushes on `ready` signal; Python emits `ready` on startup and on `ping`.
Messages should no longer be lost during init, but needs runtime validation.

**Recommendation**: Verify by sending a message immediately after `sdk-start` and confirming it is delivered after `ready`.

---

### [Reviewer] - ID-1 Identity Injection: PTY Write Doesn't Submit
**Owner**: Worker B
**Priority**: HIGH - user reported, breaks /resume identification feature
**Status**: âœ… APPROVED - Pending user test (Jan 25, 2026)

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

1. User types once â†’ ALL instances see it (broadcast)
2. One instance does something â†’ ALL other instances know automatically (no "go check status.md")
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
      â†“
  Coordinator
      â†“
Logs to shared stream + routes to instance(s)
      â†“
â”Œâ”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
Claude 1  Claude 2  Claude 3
â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â†“
Output captured â†’ logged to shared stream
      â†“
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
- User â†’ single Claude â†’ spawns workers in background â†’ user waits

That's NOT what user wants. User wants to SEE US WORK. Like having 4 terminals open but without the copy-paste overhead.

**Where I partially push back:**

The plumbing IS reusable:
- `spawner.py` - spawning Claude processes âœ“
- `state_machine.py` - tracking what's happening âœ“
- `logging.py` - structured events âœ“

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
4. User talks to Hivemind UI â†’ Hivemind appends to shared context â†’ all instances see it on their next turn

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
**Status**: LIKELY RESOLVED (pending runtime verification)
**Root cause**: SDK renderer and layout hardcode 4 panes; panes 5 and 6 are explicitly hidden in SDK mode.
**Update (Jan 28, 2026)**: Code now shows 6-pane SDK config and no hide logic in the renderer.
**Evidence (current code)**:
- `ui/modules/sdk-renderer.js:17-34` `SDK_PANE_IDS` now includes `['1','2','3','4','5','6']` and `SDK_PANE_ROLES` includes panes 5/6; `setSDKPaneConfig()` uses this.
- `ui/renderer.js:15-24` `SDK_PANE_LABELS` includes panes 1-6.
- `ui/renderer.js:186-223` `applySDKPaneLayout()` no longer hides panes 5/6; it iterates `Object.keys(SDK_PANE_LABELS)` and sets `pane.style.display = ''`.
**Impact**: If runtime matches code, SDK mode should show panes 5/6 normally.
**Next**: Verify in a fresh app restart with SDK mode enabled; if panes 5/6 still missing, re-open this blocker.

---

## Codex Exec Respawn Failure (Jan 29, 2026)

### [Investigator] - Restart/unstick kills Codex exec terminal and never recreates it
**Owner**: Implementer A (renderer/terminal.js) + Implementer B (daemon/client if needed)
**Priority**: HIGH - pane cannot be respawned without full app restart
**Status**: ✅ FIXED - Committed `3f93384` (Jan 29, 2026) - Runtime verification pending
**Problem**:
- `restartPane()` calls `window.hivemind.pty.kill(id)` then `spawnClaude(id)`.
- For Codex exec panes, `spawnClaude()` only sends the identity prompt (via `sendToPane`) and does NOT call `pty.create`.
- `pty.kill` removes the daemon terminal entry; subsequent `codex-exec` calls hit `runCodexExec()` and fail with "Terminal not found or not alive".
- Same risk applies to unstick escalation step 3 (restart) and any per-pane restart flow.

**Evidence**:
- `ui/modules/terminal.js` `restartPane()` kills then spawns; no recreate call.
- `ui/modules/terminal.js` codex exec path in `spawnClaude()` returns early after sending identity.
- `ui/terminal-daemon.js` `killTerminal()` deletes terminal from map.
- `ui/modules/codex-exec.js` `runCodexExec()` returns `Terminal not found or not alive` when the daemon map entry is missing.

**Suggested fix approach**:
1. In `restartPane()`, call `window.hivemind.pty.create(id, cwd)` before `spawnClaude(id)` (for all panes or at least codex exec).
2. Alternatively, add a `recreateTerminal()` helper that kills + creates + reattaches (mirror `freshStartAll` logic per pane).
3. Optional: for codex exec, change kill path to only terminate `execProcess` and keep the virtual terminal alive.

**Notes**:
- Nudge/interrupt are no-ops for codex exec (daemon ignores PTY writes in codex-exec mode), so restart is the first effective action; currently it removes the terminal.
- Explains Session 30 note: pane 4 died mid-session with no respawn until full restart.

**Files**: `ui/modules/terminal.js`, `ui/terminal-daemon.js`, `ui/modules/codex-exec.js`

## Runtime Verification Findings (Jan 30, 2026)

### [Investigator] - Codex activity indicator not visible (header spinner)
**Owner**: Implementer A (renderer/CSS)
**Priority**: HIGH - user-visible regression in Session 45 verification
**Status**: ✅ REVIEWER APPROVED (Jan 30, 2026) - Ready for restart verification
**Symptom**: During Codex exec runs, header activity indicator (glyph spinner + status) does not appear. Output styling is confirmed working.

**[Implementer A Fix - Jan 30, 2026]**
Applied fix #1 from suggested approaches: `updateAgentStatus()` now checks for `activity-*` classes and skips status text/class override when codex activity indicator is active. This prevents `claude-state-changed` from clobbering the activity state.
- File: `ui/modules/daemon-handlers.js` lines 982-1006
- Logic: If `statusEl` has any `activity-*` class AND has spinner element, skip text/class update (only badge updates)

**Most likely causes (code trace)**:
1) **Status clobbering by claude-state-changed**: `ui/modules/daemon-handlers.js:updateAgentStatus()` uses `statusEl.textContent = ...` and removes classes; this wipes out the spinner element and any `activity-*` classes set by the codex-activity handler. If `claude-state-changed` fires after a codex activity update, it overrides the indicator and leaves only "Agent running" (no spinner).  
   - Affected: `ui/modules/daemon-handlers.js:970-995` (updateAgentStatus), `ui/renderer.js:1395-1434` (codex-activity handler).
2) **Spinner glyph only set by codex-activity handler**: The `<span class="pane-spinner">` element in HTML is empty by default. If no codex-activity event is received (or it is short-lived and then overwritten), the spinner has no glyph and is invisible even when `.pane-status.working` is applied.  
   - Affected: `ui/renderer.js:1350-1434` (spinner glyph cycle), `ui/styles/layout.css:333-347` (spinner display).
3) **Header overcrowding in side panes**: The right header cluster has many icons; `.pane-status` can shrink to near-zero width on narrow panes, effectively hiding the indicator. (No flex constraints/min-width set.)  
   - Affected: `ui/styles/layout.css` `.pane-header-right`, `.pane-status`.

**Suggested fix approaches**:
- Preserve spinner & activity classes when updating agent running state (e.g., only update badges in `updateAgentStatus`, or skip status updates if `statusEl` has `activity-*` class / `data-activity="true"`).
- Set a default glyph via CSS (`.pane-spinner::before { content: '◐'; }`) or initialize glyph text in HTML so the spinner is visible even without codex-activity events.
- Ensure `.pane-status` stays visible in side panes (e.g., `flex: 1 1 auto; min-width: 60px;` or move indicator to a dedicated inline element).

**Note**: Codex activity events are emitted in `ui/modules/codex-exec.js` via `broadcast({ event: 'codex-activity', ... })` and forwarded by `ui/main.js` to renderer. If UI still doesn't show, confirm event arrival (add temporary log in renderer handler).

---

## Sprint Code Review Findings (Jan 30, 2026)

### [Reviewer] - CRITICAL BUG: Task #18 review-staged handler broken
**Owner**: Implementer A (code-review-handlers.js)
**Priority**: HIGH - IPC channel completely non-functional
**Status**: ✅ FULLY RESOLVED (Reviewer, Jan 30, 2026) - Code fix + test fix complete, pending runtime verification
**File**: `ui/modules/ipc/code-review-handlers.js:159-161`
**Review**: `workspace/build/reviews/task18-review-staged-bug.md`

**[Implementer A Fix - Jan 30, 2026]**
Extracted review logic into shared `performDiffReview(projectPath, mode)` helper function.
- `review-diff` handler now calls `performDiffReview(projectPath, mode)`
- `review-staged` handler now calls `performDiffReview(payload.projectPath, 'staged')`
- Both handlers have proper try/catch error handling

**Code:**
```javascript
ipcMain.handle('review-staged', async (event, payload = {}) => {
  return ipcMain.handle('review-diff', event, { ...payload, mode: 'staged' });
});
```

**Problem:** `ipcMain.handle()` registers a handler and returns the handler function itself. It does NOT invoke the handler. This code is calling the registration function, not executing the review logic.

**Result:** The `review-staged` IPC channel returns the handler function object instead of review results. The channel is **completely broken**.

**Fix Required:** Extract shared logic into a helper function that both handlers call, or duplicate the review-diff logic for staged mode.

**Example Fix:**
```javascript
// Option 1: Helper function
async function performReview(projectPath, mode) {
  const cwd = projectPath || path.join(WORKSPACE_PATH, '..');
  // ... existing review-diff logic ...
}

ipcMain.handle('review-diff', async (event, payload = {}) => {
  return performReview(payload.projectPath, payload.mode || 'all');
});

ipcMain.handle('review-staged', async (event, payload = {}) => {
  return performReview(payload.projectPath, 'staged');
});
```

### [Reviewer] - BUG: workflow-apply-template handler broken (same pattern as Task #18)
**Owner**: Implementer A (workflow-handlers.js)
**Priority**: HIGH - IPC channel non-functional
**Status**: ✅ APPROVED (Reviewer, Jan 30, 2026) - Pending commit
**File**: `ui/modules/ipc/workflow-handlers.js:826`
**Review**: `workspace/build/reviews/workflow-apply-template-bug.md`

**Code:**
```javascript
const { success, templates } = await ipcMain.handle('workflow-get-templates');
```

**Problem:** Same bug as Task #18 - calling `ipcMain.handle()` inside a handler to invoke another handler. This is the registration function, not invocation.

**Fix Required:** Extract templates into shared constant that both handlers access directly.


---

## Enhancement: Auto-Restart for Exited Codex Panes (Session 49, Jan 30, 2026)
**Related to**: Task #29 Self-Healing Error Recovery
**Priority**: LOW - workaround exists (manual respawn)
**Owner**: Unassigned

**Issue**: Codex exec panes (2, 5) become unresponsive after completing tasks because the CLI exits. This is expected Codex behavior (non-interactive), but breaks trigger delivery.

**Current State**:
- Task #29 Self-Healing detects stuck agents and can restart them
- But it may not detect CLI *exit* as a failure condition
- Pane 4 (Codex) stayed responsive because it had ongoing work (Voice Control)

**Proposed Enhancement**:
- Detect CLI exit in recovery-manager.js
- Auto-respawn Codex panes when they exit unexpectedly
- Or: Keep Codex processes alive with a keepalive mechanism

**Workaround**: User can manually respawn panes via Health tab or restart app.

**Investigation**: See `workspace/build/reviews/pane-2-5-trigger-investigation.md`
