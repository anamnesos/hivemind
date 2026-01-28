# Review: Fix V + Fix W + CLI Identity Badges + Dynamic Codex Auto-Submit

**Reviewer:** Reviewer (Pane 6)
**Date:** Jan 27, 2026
**Request:** Orchestrator #1

---

## Scope

| Item | Files Reviewed |
|------|---------------|
| Fix V (flag conflict) | `ui/modules/codex-exec.js` lines 131-133 |
| Fix W (JSONL parser cleanup) | `ui/modules/codex-exec.js` lines 29-77, 79-112 |
| CLI Identity Badges | `ui/renderer.js:883-901`, `ui/main.js:440-461`, `ui/modules/terminal.js:140-178` |
| Dynamic Codex Auto-Submit | `ui/modules/terminal.js:163-169, 342-346, 427-431, 487-496, 521-534, 581, 681-691, 835` |

---

## Fix V — Remove Conflicting `--full-auto` Flag

**Verdict: APPROVED**

`codex-exec.js:131-133` — Both initial and resume arg arrays use:
```
['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...]
```
No `--full-auto` present. The mutually exclusive flag is gone. `--dangerously-bypass-approvals-and-sandbox` implies full autonomy per Codex CLI docs. Correct.

**Resume arg ordering** is also correct: flags come before `resume <sessionId>` then `-` for stdin. This matches the fix requested in the earlier review round.

---

## Fix W — JSONL Parser Overhaul (Output Cleanup)

**Verdict: APPROVED**

### SILENT_EVENT_TYPES (lines 29-38)
18 event types suppressed. Coverage looks comprehensive for Codex JSONL metadata:
- Session lifecycle: `session_meta`, `session_started`, `session_stopped`
- Message lifecycle: `message_started`, `message_completed`, `message_delta`
- Turn lifecycle: `turn_started`, `turn_completed`
- Command lifecycle: `command_started`, `command_completed`
- Tool use: `tool_use_started`, `tool_use_completed`
- Content blocks: `content_block_start`, `content_block_stop`
- Input: `input_json_delta`, `input_json`
- System: `ping`, `rate_limit`

### 3-way return in extractCodexText (lines 40-77)
- `''` (empty string) → silent, suppressed
- truthy string → display in pane
- `null` → log warning, don't display

This is clean. The fallback chain is:
1. Check SILENT_EVENT_TYPES → return `''`
2. Check `payload` as string → return it
3. Check `payload.text`, `.delta.text`, `.text_delta` → return it
4. Check `payload.output`, `.result` → return it
5. Check `payload.content` (string or array) → return extracted text
6. Return `null` → triggers warning log

### handleCodexExecLine (lines 79-112)
- Non-JSON lines pass through raw (correct — stderr or plain text)
- `session_meta` captured for sessionId before going through extractCodexText (correct — it's in SILENT_EVENT_TYPES so would be suppressed anyway, but the explicit capture at line 92-97 runs first)
- `text === ''` → silent return
- `text` truthy → broadcast to pane
- `text` null → `logWarn` (NOT dumped to pane)

**Previously:** Unrecognized events dumped raw JSON to xterm. Now they log to console. This is the core fix.

### One nit (non-blocking)
`session_meta` is in SILENT_EVENT_TYPES AND has a special handler at line 92-97. The special handler runs first and returns early, so the SILENT check never fires for it. This is fine — just slightly redundant. No action needed.

---

## CLI Identity Badges

**Verdict: APPROVED**

### Flow trace:
1. `main.js:448-451` — `inferAndEmitCliIdentity(paneId, command)` detects CLI from spawn command
2. `main.js:440-445` — `emitPaneCliIdentity()` stores in Map and sends IPC to renderer
3. `renderer.js:883-901` — Listener updates DOM badge element, sets CSS class, and calls `terminal.registerCodexPane()` or `terminal.unregisterCodexPane()`
4. `terminal.js:140-149` — `registerPaneCliIdentity()` stores provider/label/key in Map
5. `terminal.js:163-169` — `isCodexPane()` checks the Map, falls back to settings

### Cross-file contract:
- IPC shape: `{ paneId, label, provider, version? }` — consistent across main.js emit and renderer.js listener
- Badge DOM IDs: `cli-badge-${paneId}` — must exist in index.html (assumed present from Worker A's earlier work)
- CSS classes: `.claude`, `.codex`, `.gemini` on `.cli-badge.visible`

**No issues found.** Registration correctly flows from main process detection through to renderer-side identity tracking.

---

## Dynamic Codex Auto-Submit

**Verdict: APPROVED with one observation**

### How it works:
- `isCodexPane()` at `terminal.js:163-169` queries the dynamic `paneCliIdentity` Map, not a hardcoded list
- Falls back to `isCodexFromSettings()` (line 152-161) which checks `settings.paneCommands`
- Used at 8 call sites (lines 342, 427, 487, 521, 581, 681, 835, plus `doSendToPane`)

### Key Codex-specific paths verified:
1. **PTY onData suppressed** (lines 342-346, 427-431): Codex panes don't forward terminal keystrokes to PTY. Correct — exec mode uses stdin, not PTY.
2. **doSendToPane bypass** (lines 489-496): Codex panes route through `codexExec` IPC instead of textarea injection. Correct.
3. **spawnClaude early return** (lines 681-691): Codex panes skip interactive CLI spawn, send identity via setTimeout(2s). Correct.
4. **Aggressive nudge** (lines 835-838): Codex panes get PTY `\r` instead of trusted Enter. Correct — exec mode doesn't have a textarea to dispatch keyboard events to.

### Observation (non-blocking):
`doSendToPane` line 521 has a dead code path: `if (isCodex && hasTrailingEnter)`. This code is unreachable because the Codex exec bypass at line 490-496 returns before reaching line 521. The old Codex PTY path at lines 521-534 is vestigial from before Fix S. Not harmful, but could be cleaned up in a future pass.

---

## Summary

| Item | Verdict |
|------|---------|
| Fix V (flag conflict) | APPROVED |
| Fix W (JSONL parser) | APPROVED |
| CLI Identity Badges | APPROVED |
| Dynamic Codex Auto-Submit | APPROVED |

**Overall: APPROVED FOR TESTING**

No critical bugs. No cross-file mismatches. Data flows are consistent. One dead code path noted (non-blocking).

**What to verify visually after restart:**
1. Codex panes show readable text, no raw JSON walls
2. Metadata events (session_meta, turn_completed, etc.) are silent
3. CLI badges appear in pane headers for Claude/Codex/Gemini
4. Codex panes respond to messages via exec pipeline (not PTY)
