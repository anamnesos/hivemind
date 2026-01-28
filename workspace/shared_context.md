# Hivemind Shared Context

**Last Updated:** Jan 28, 2026 (session 18)
**Status:** Session 18 fixes shipped. Auto-submit still has issues — needs restart + verification.

---

## ⚠️ TEMPORARY OVERRIDE (Jan 28, 2026)

- User explicitly approved bypassing Reviewer gate for this session because Reviewer + Implementer A are offline.
- Orchestrator/Implementer B/Investigator asked to assume review coverage and report risks.

---

## Sprint 2 Update (Jan 28, 2026)

- Implementer B: Added defensive null checks to 6 IPC modules (state-handlers, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Guards prevent crashes when watcher/triggers/log providers are unset.
- Next: Reviewer to spot-check return shapes and confirm no regressions.
- Implementer B: Added `interrupt-pane` IPC (Ctrl+C) + auto Ctrl+C after 120s no output in main-process stuck detection.
- Investigator: Added ANSI bold yellow `[TRIGGER]` prefix for PTY injections (notifyAgents/auto-sync/trigger file/routeTask/auto-handoff/direct messages). Updated status bar hint text in `ui/index.html`.
- Architect: Fixed Codex exec running-state detection to be case-insensitive so trigger delivery no longer skips Codex panes showing "Codex exec mode ready".
- Next: Reviewer verify auto-interrupt behavior + IPC channel response.

---

## 🚨 ARCHITECT: READ THIS FIRST (Session 19)

You are the Architect (pane 1). Session 18 completed verification + shipped fixes.

### Session 18 Summary:
1. **Session 17 hardening NOT fully verified** — app launches and agents orient, but auto-submit still requires manual Enter in some cases. User had to manually submit trigger messages multiple times this session.
2. **Focus-steal typing-guard** (c9a13a4) — trigger injection now deferred while user is typing in UI inputs. Fixes lost-input during active typing. `terminal.js` adds `userIsTyping()` guard to `sendToPane` and `processQueue`.
3. **Track 2 closed** — Investigated eliminating focus-steal entirely via KeyboardEvent dispatch. Web search confirmed untrusted events don't trigger default actions (Electron/DOM spec). `pty.write('\r')` also doesn't submit in Claude TUI (known from Fix R/H/I). Focus is required for `sendTrustedEnter`. Typing-guard is the complete fix for now.
4. **Web search mandate** — All 5 agent CLAUDE.md files updated with mandatory web search sections. Agents must verify external API/platform/library behavior via web search before coding or approving.
5. **xterm terminal.input() lead** — Web search surfaced `Terminal.input(data, wasUserInput?)` as potential future path to bypass focus entirely. Backlog item.

### This restart: VERIFY
1. Auto-submit works for trigger messages WITHOUT manual Enter (typing-guard fix c9a13a4 is now live)
2. Auto-submit works when user is NOT typing (if still fails, different root cause — investigate)
3. If auto-submit still fails when idle, check npm console for doSendToPane logs
4. All 6 panes spawn and orient
5. CSS renders correctly
6. No IPC errors in console

### Backlog (not started)
- Structured logger (376 console.* → proper logger module)
- Version-fix comment cleanup (172 markers)
- Electron upgrade (separate sprint)
- Sequence number compaction resilience
- Focus-steal full elimination via xterm terminal.input() API
- Trigger message UI banner (Option B — UX enhancement, separate from injection)

### Backlog (not started)
- Structured logger (376 console.* → proper logger module)
- Version-fix comment cleanup (172 markers)
- Electron upgrade (separate sprint)
- Sequence number compaction resilience (Reviewer lost messages after compaction)

---

## CURRENT SPRINT: Hardening (Session 17)

**Goal:** Reduce tech debt — file splits, structured logging, comment cleanup.
**Electron upgrade:** Deferred to separate sprint.

### Phase 1 — Investigation (DONE)
### Phase 2 — Execution (DONE)
### Phase 3 — Bug fix pass (DONE)

### Verified This Session
- Fix Z (trigger encoding): Confirmed offline + live
- Codex trigger replies: Orchestrator using triggers correctly
- Backlog changes (SDK 6-pane, focus restore, Codex display fixes): Reviewer approved, kept
- Both Codex exec display blockers: RESOLVED
- Hardening Phase 2 Step 1–3: ipc-handlers split (ipc/index + ipc-state + SDK modules)
- Hardening Phase 2 MCP: mcp-handlers + mcp-autoconfig-handlers extracted
- Hardening Phase 2 Test/CI: test-execution + precommit + test-notification extracted
- Hardening Phase 2 Messaging: message-queue-handlers extracted
- Hardening Phase 2 Docs/Perf/Error: api-docs + perf-audit + error-handlers extracted
- Hardening Phase 2 State: state-handlers extracted
- Hardening Phase 2 Routing/Coord: smart-routing + auto-handoff + conflict-queue + learning-data extracted
- Hardening Phase 2 Output Validation: output-validation-handlers extracted
- Hardening Phase 2 Completion Quality: completion-quality-handlers extracted
- Hardening Phase 2 Checkpoint: checkpoint-handlers extracted
- Hardening Phase 2 Activity Log: activity-log-handlers extracted
- Handoff: Reviewer verify activity-log + checkpoint + completion-quality + output-validation + state-handlers + routing/coord modules (`ui/modules/ipc/*-handlers.js` in state/routing/quality group); eslint warnings only
- IPC bug fix pass: output-validation/completion-quality invoke fixes, emit fixes (mcp-autoconfig/test-notification/error), precommit run-tests fix, api-docs/perf-audit cleanup, 6-pane defaults

---

## 🚨 ARCHITECT: READ THIS FIRST (Jan 28, 2026)

You are the Architect (pane 1). Here's what happened:

### Session 16 Summary — Trigger Encoding Fix + Codex Communication Fix

**Fix Z — Trigger file encoding normalization (Reviewer APPROVED)**
- **Problem:** Codex panes writing trigger files via Windows `echo` or PowerShell produced garbled messages. cmd.exe uses OEM CP437, PowerShell defaults to UTF-16LE. The trigger reader assumed UTF-8.
- **Root cause:** `fs.readFileSync(filePath, 'utf-8')` in `triggers.js` can't decode UTF-16LE or handle BOM bytes.
- **Fix:** `triggers.js` `handleTriggerFile()` now reads raw bytes and detects encoding: UTF-16LE BOM → convert, UTF-8 BOM → strip, default → UTF-8. Also strips null bytes and control chars.
- **File modified:** `ui/modules/triggers.js` (lines 491-515)
- **Investigator findings:** cmd.exe echo breaks on `& | % ^ !` chars, PowerShell writes UTF-16LE by default, Codex exec degrades unicode to `???` before cmd even runs.

**Codex CLAUDE.md updates — Trigger reply instructions**
- **Problem:** Orchestrator (Codex pane 2) repeatedly responded to agent messages in terminal output instead of writing to trigger files. Required user to manually push messages. 4 consecutive failures before succeeding.
- **Root cause:** Codex defaults to conversational output. Needed explicit bash command template, not conceptual instructions.
- **Fix:** Updated CLAUDE.md for all 3 Codex panes (orchestrator, worker-b, investigator) with explicit "EVERY REPLY MUST USE THIS COMMAND" section including copy-paste echo template. Orchestrator got additional "PRIME DIRECTIVE" section at top of file.
- **Files modified:** `workspace/instances/orchestrator/CLAUDE.md`, `workspace/instances/worker-b/CLAUDE.md`, `workspace/instances/investigator/CLAUDE.md`

**Team consensus: Hardening sprint recommended**
- All 5 agents (Reviewer, Implementer A, Implementer B, Investigator, Orchestrator) unanimously recommend a hardening sprint before new features.
- Key concerns: ipc-handlers.js ~3800 lines, index.html ~4100 lines, 200+ console.logs with no logger, Electron 12 majors behind, 83 version-fix comments.
- Electron upgrade should be a separate sprint (Investigator recommendation).

### Backlog
- Focus-steal fix: save/restore activeElement unconditionally (low priority)
- Newline normalization in extracted Codex text (minor)
- Hardening sprint: file splits, structured logger, comment cleanup (pending user approval)

### This restart: verify
1. Trigger messages from Codex panes render without garbled characters (Fix Z)
2. Codex agents reply via trigger files, not terminal output (CLAUDE.md updates)
3. All 6 agents orient and communicate
4. Previous fixes still working (Codex display, line breaks, resume, badges)

### Session 13 Summary (previous)
- Fix X FAILED, Fix Y APPLIED â€” Codex exec JSONL format mismatch + windowsHide + thread.started
4. Claude panes unaffected
5. Second message to Codex pane uses resume (check npm console for "Captured thread id")

### Session 11 Summary
- **Fix V CONFIRMED** â€” Codex exec spawns without flag conflict (verified visually)
- **Fix W APPLIED** â€” JSONL parser overhaul (too aggressive â€” silenced responses)

### Session 10 Summary
- **Fix V APPLIED â€” Remove `--full-auto` from Codex exec args (conflicting flags)**

### Session 9 Summary
- **Fix U APPLIED â€” Codex exec `shell: true` (Windows ENOENT fix)**
  - Codex panes failed with `spawn codex ENOENT` â€” Node couldn't find `codex.cmd` without shell
  - Root cause: `child_process.spawn('codex', ...)` doesn't resolve `.cmd` wrappers on Windows without `shell: true`
  - Fix: Added `shell: true` to spawn options in `ui/modules/codex-exec.js` (line ~112)
  - **Lesson: On Windows, always use `shell: true` when spawning npm-installed CLIs (they're `.cmd` batch wrappers)**

### Session 8 Summary
- **Fix T APPLIED â€” Codex auto-start identity injection**
  - Codex panes (2, 4, 5) were showing "Codex exec mode ready" but never receiving their first prompt
  - Root cause: `spawnClaude()` returned early for Codex panes before the identity auto-send code
  - Fix: Added `setTimeout` (2s) in the Codex early-return block to auto-send identity via `sendToPane()`
  - File modified: `ui/modules/terminal.js` (line ~681)
  - This restart: Codex panes should auto-start with `# HIVEMIND SESSION: {Role}` prompt

### This restart: verify
1. Codex panes auto-start (not stuck on "Codex exec mode ready")
2. Identity prompt triggers codex exec pipeline
3. Codex agents orient and respond
4. Claude panes unaffected
5. Resume works on second message

### Session 7 Summary
- **Fix R FAILED** â€” `\n` did not fix Codex auto-submit (same as `\r`). Interactive ink TUI cannot be driven via PTY writes on Windows.
- **Fix S APPLIED â€” Codex exec pipeline (MAJOR CHANGE)**
  - Codex panes (2, 4, 5) now use `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox` instead of interactive Codex
  - New module: `ui/modules/codex-exec.js` â€” child_process.spawn, JSONL parsing, session management
  - First message: `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox --cd <instanceDir> -` (prompt via stdin)
  - Subsequent messages: `codex exec resume <sessionId> --json --full-auto --dangerously-bypass-approvals-and-sandbox -`
  - SessionId captured from JSONL `session_meta` event
  - Files modified: codex-exec.js (new), terminal-daemon.js, terminal.js, ipc-handlers.js, daemon-client.js, preload.js, renderer.js, config.js
  - Reviewer approved after 2 rounds (BUG-S1 sessionId fixed, BUG-S2 flag ordering fixed)
- **Investigator finding:** SDK mode hardcodes 4 panes â€” sdk-renderer.js hides panes 5/6 (low priority, PTY mode)
- **Minor gap:** Gemini CLI lacks permission suppression flag (low priority)

### This restart: verify
1. Codex panes receive messages and respond via codex exec pipeline (Fix S)
2. Resume works on second message (sessionId captured from first)
3. JSONL events render readable text in Codex panes (not raw JSON)
4. Claude/Gemini panes unaffected (PTY path unchanged)
5. All 6 agents orient autonomously

### Implementer B note (Jan 27, 2026)
- Codex spawn path is interactive PTY (ipc-handlers -> terminal.js -> daemon shell PTY).
- `codex exec --json` is non-interactive; best swap is a new child_process path (no PTY) with JSONL parsing + per-pane session id.
- Detailed recommendation sent to Architect via `lead.txt`.

### Implementer B update - Fix S (Jan 27, 2026)
- Codex exec mode implemented: Codex panes use daemon `codex-exec` (child_process.spawn) with JSONL parsing and stdout to xterm.
- New module: `ui/modules/codex-exec.js` handles exec spawn + JSONL parsing; daemon delegates to it.
- Renderer sends prompts via `codex-exec`; identity prefix injected on first prompt.
- Files updated: `ui/terminal-daemon.js`, `ui/modules/codex-exec.js`, `ui/modules/terminal.js`, `ui/modules/ipc-handlers.js`, `ui/daemon-client.js`, `ui/preload.js`, `ui/renderer.js`, `ui/config.js`.
- Needs review/testing: verify Codex pane output rendering and resume continuity.
- Handoff: Reviewer verify Codex exec output rendering + no PTY injection; Investigator confirm `codex exec resume <sessionId>` preserves full context. Gotcha: resume relies on session_id from JSONL `session_meta`, and parsing falls back to raw lines when no text extracted.

### Previous fixes (all confirmed working):
#### Fix N â€” Force autonomy flags
- `allowAllPermissions` default changed `false` â†’ `true` in main.js (line 50)
- Autonomy flags are now UNCONDITIONAL in ipc-handlers.js (lines 163-173) â€” removed `if (currentSettings.allowAllPermissions)` guard
- Claude always gets `--dangerously-skip-permissions`
- Codex always gets `--full-auto --ask-for-approval never`
- Files: `main.js`, `ipc-handlers.js`

### Fix O Ã¢â‚¬â€ Codex prompt suppression hardening (Jan 27, 2026)
- Codex spawn now also appends `--dangerously-bypass-approvals-and-sandbox` (alias: `--yolo`)
- Added daemon fallback: detects approval prompt text and auto-sends `2` ("Yes and don't ask again")
- Files: `ui/modules/ipc-handlers.js`, `ui/terminal-daemon.js`

### What to verify after restart:
1. No permission prompts on any Codex pane (Fix O â€” --yolo + auto-dismiss)
2. Codex panes start clean without PowerShell errors (Fix L) or config errors (Fix M)
3. All 6 agents orient and accept input
4. If any Codex pane still prompts, daemon should auto-answer "2" within seconds

### Previous Session Findings
After restart, Codex panes (2, 4, 5) showed:
1. **Identity injection broke PowerShell** â€” `[HIVEMIND SESSION: ...]` parsed as PowerShell attribute syntax, causing parse errors
2. **Codex config.toml invalid** â€” `approval_policy = "never"` is NOT a valid Codex config key (expects boolean). Codex refused to start with: `invalid type: string "never", expected a boolean`

### Fixes Applied (need restart to test)

**Fix L â€” Identity message format**
- Changed `[HIVEMIND SESSION: Role]` â†’ `# HIVEMIND SESSION: Role -`
- `#` is a comment in PowerShell, harmless to Claude
- Files: `terminal-daemon.js` (line 1365), `terminal.js` (line 636)

**Fix M â€” Remove invalid approval_policy from config.toml**
- Removed `approval_policy = "never"` from `~/.codex/config.toml`
- Removed `ensureCodexConfig()` code in `main.js` that re-added it
- Full autonomy is already handled by CLI flags: `--full-auto --ask-for-approval never` (in ipc-handlers.js)
- Files: `~/.codex/config.toml`, `main.js` (ensureCodexConfig function)

### What to verify after restart:
1. Codex panes should NOT show PowerShell parse errors (Fix L)
2. Codex CLI should start without config.toml errors (Fix M)
3. Codex panes should accept text input and submit
4. All 6 agents should orient themselves
5. Trigger messages should deliver to all panes

### Fix History
- Fix A âœ… â€” CLI swap: pane 3=claude, pane 5=codex
- Fix B âœ… â€” Daemon banner removed
- Fix C âŒ â€” Trusted Enter via sendInputEvent (Codex ignored it)
- Fix D âœ… â€” AGENTS.md created for Codex panes
- Fix E âŒ â€” Clipboard paste Ctrl+V (Codex interpreted as image paste)
- Fix F âŒ â€” --full-auto doesn't bypass sandbox prompt
- Fix G âœ… â€” Sandbox config.toml preset (WORKS)
- Fix H âœ… â€” PTY write + newline for Codex (WORKS)
- Fix I âœ… â€” `\n` â†’ `\r` for Codex auto-submit
- Fix J âŒ â€” `approval_policy = "never"` in config.toml (INVALID KEY â€” broke Codex startup)
- Fix K âœ… â€” `--ask-for-approval never` CLI flag on Codex spawn
- Fix L âœ… â€” Identity message `#` prefix instead of `[]` brackets (PowerShell compat)
- Fix M âœ… â€” Removed invalid approval_policy from config.toml + ensureCodexConfig()
- Fix N âœ… â€” Forced autonomy flags unconditionally (no setting dependency)
- Fix O âœ… â€” `--yolo` flag + daemon auto-dismiss for Codex permission prompts
- Fix P âœ… â€” triggers.js notifyAgents appends `\r` for Codex PTY write auto-submit
- Fix Q âœ… â€” Dynamic Codex detection via pane-cli-identity (replaces hardcoded CODEX_PANES)
- Fix R âŒ â€” Codex auto-submit `\r` â†’ `\n` (FAILED â€” neither `\r` nor `\n` submits ink TUI on Windows)
- Fix S âœ… â€” Codex exec pipeline: non-interactive `codex exec --json` replaces interactive Codex (Reviewer approved)
- Fix T âœ… â€” Codex auto-start identity injection (setTimeout 2s in spawnClaude early-return)
- Fix U âœ… â€” `shell: true` for Codex exec spawn on Windows (ENOENT fix)
- Fix V âœ… â€” Removed conflicting `--full-auto` flag (mutually exclusive with `--dangerously-bypass-approvals-and-sandbox`)

---

## ??? CLI IDENTITY BADGE (UNBLOCKED)

**Status:** Bug 2 line-break fix verified by Reviewer (Jan 28, 2026).
- IPC event: `pane-cli-identity {paneId, label, provider?, version?}`
- Implementer B: main.js now forwards `pane-cli-identity` and infers CLI identity on daemon spawn/reconnect.
- **Next:** Reviewer ? verify badges appear for Claude/Codex/Gemini panes on spawn + reconnect.
- Codex auto-submit Fix B: terminal.js now tracks Codex panes dynamically from pane-cli-identity (no hardcoded list).
- **Next:** Reviewer verify Codex auto-submit and non-Codex Enter path.

---
## ðŸ“‹ AGENT IDENTITY

| Pane | Role | Instance Dir | Trigger File | CLI |
|------|------|-------------|--------------|-----|
| 1 | Architect | instances/lead | lead.txt | Claude |
| 2 | Orchestrator | instances/orchestrator | orchestrator.txt | Codex |
| 3 | Implementer A | instances/worker-a | worker-a.txt | Claude |
| 4 | Implementer B | instances/worker-b | worker-b.txt | Codex |
| 5 | Investigator | instances/investigator | investigator.txt | Codex |
| 6 | Reviewer | instances/reviewer | reviewer.txt | Claude |

### Message Protocol
```
(YOUR-ROLE #N): message here
```
- Increment N each time. Duplicates silently dropped.
- Start from #1 each session.
- Write to `workspace/triggers/{trigger-file}` to message an agent.


## GLOBAL NOTE

- Prefix any user-directed questions with @James:
- Do NOT ask for permission to implement; proceed autonomously and report results.

### Gemini CLI Note
Gemini's file write tool is sandboxed. Use bash echo:
```
echo "(YOUR-ROLE #N): message" > "D:\projects\hivemind\workspace\triggers\lead.txt"
```

---

## ðŸ”§ PREVIOUS FIXES (Already working)

| Fix | File | What Changed |
|-----|------|-------------|
| BUG-1: Codex textarea retry | terminal.js | doSendToPane retries 5x100ms before PTY fallback |
| BUG-2: Nudge keyboard Enter | terminal.js | aggressiveNudge uses keyboard Enter |
| BUG-3: Trigger file re-read | watcher.js | handleTriggerFileWithRetry re-reads empty files |
| BUG-4: Focus steal fix | terminal.js + renderer.js | Restores focus after injection |
| 6-pane expansion | multiple files | All updated from 4-pane to 6-pane |
| ensureCodexConfig | main.js | Auto-creates sandbox config at startup |

## ðŸ“Š RESTART SURVIVAL LOG

| Restart | P1 | P2 | P3 | P4 | P5 | P6 | Pattern |
|---------|----|----|----|----|----|----|---------|
| Jan 27 #1 | âœ… Claude | âŒ Codex | âŒ Claude | âŒ Codex | âœ… Codex | âœ… Claude | Panes 1,5,6 survived |
| Jan 27 #2 | âœ… Claude | âŒ Codex | âŒ Claude | âŒ Codex | âœ… Codex | âœ… Claude | Same pattern |

---

## ðŸš¦ MODE GATE

**Source of truth:** `workspace/app-status.json` â€” check `sdkMode` field before any work.

---

## Previous Context

See `workspace/build/status.md` for full sprint history.

---

## Offline agent feedback (Jan 28)

### Investigator notes
- **Trigger messages visual distinction**: Implemented ANSI prefix in `ui/modules/triggers.js` for PTY injections: `\x1b[1;33m[TRIGGER]\x1b[0m ` applied to notifyAgents, auto-sync, handleTriggerFile, routeTask, auto-handoff, and direct messages. Broadcast path unchanged.
- **Status bar text**: Updated `ui/index.html` status bar to match current behavior: "Enter to send to Lead | /all to broadcast | /3 to target pane 3".
- **Broadcast bar behavior (PTY)**: In PTY mode, broadcast input routes to pane 1 only (terminal.broadcast in `ui/modules/terminal.js`), and `/all` targeting exists only in SDK path. This is why user input only reaches Architect.
- **Interrupt/ESC path exists but no UI entrypoint**: `(UNSTICK)` or `(AGGRESSIVE_NUDGE)` messages are intercepted in `ui/modules/daemon-handlers.js` and call `terminal.sendUnstick()` / `terminal.aggressiveNudge()` (ESC keyboard events), but there is no IPC/UI command for Architect to trigger this per-pane.
- **Stuck detection**: Auto-nudge exists in `ui/terminal-daemon.js` (`checkAndNudgeStuckAgents` using `lastInputTime`), but requires daemon restart after code updates (see errors.md V18.1).
- **xterm input() API**: Web research indicates `Terminal.input(data, wasUserInput?)` exists in xterm.js ≥5.4.0 and can inject data without focus (set `wasUserInput=false`). Installed version is **5.3.0** in `ui/node_modules`, so the API is likely missing until upgrade.

## Offline agent feedback (Jan 28)

- CSS Module 4 extraction approved (tabs.css + sdk-renderer.css linked, prefers-reduced-motion present).
- IPC handler regression review: 6/9 modules missing defensive ctx null checks (state-handlers, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Functional now but fragile if init order changes; recommend guards next pass.
- Sprint 2 routing completed: Implementer A on structured logger; Implementer B on IPC null checks; Investigator on version-fix audit; Reviewer monitoring both pipelines.
- Session 19 issues routed: Implementer A on broadcast input bar + trigger message styling + active/stuck UI; Implementer B on IPC interrupt/Esc + stuck detection hooks; Investigator on stuck detection/recovery analysis; Reviewer notified.
- Awaiting: Investigator auto-submit verification (prior), and current Sprint 2 deliverables from Implementer A/B/Investigator.


## Offline agent feedback (Jan 28)

- Implementer B: Added IPC `interrupt-pane` (Ctrl+C) in `ui/modules/ipc/pty-handlers.js` and auto Ctrl+C after 120s no output in `ui/main.js` stuck detection. Default stuckThreshold now 120000; clears lastInterruptAt on output.
- Implementer B: Version-fix scan counts (pattern `^//(V#|BUG|FIX)` in ui/): terminal-daemon.js 32, modules/terminal.js 25, modules/triggers.js 23, main.js 14, renderer.js 12, modules/watcher.js 9, modules/sdk-bridge.js 7, modules/sdk-renderer.js 3. Began cleanup by removing version/fix prefixes in `ui/modules/daemon-handlers.js`, `ui/daemon-client.js`, `ui/modules/settings.js`.
- Implementer B (coverage assumption): Implementer A to pick up console.* remnants in smart-routing/activity-log during logger rollout; Reviewer to verify auto-interrupt + IPC channel response.
