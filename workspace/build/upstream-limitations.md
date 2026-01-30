# Upstream Limitations

**Created:** Jan 28, 2026
**Purpose:** Document known issues in Claude Code (and other CLIs) that are NOT Hivemind bugs. Prevents wasted debugging time chasing upstream issues.

---

## Claude Code Concurrent Instance Bug

**GitHub Issues:** [#13224](https://github.com/anthropics/claude-code/issues/13224), [#13188](https://github.com/anthropics/claude-code/issues/13188)

**Symptom:** When running multiple Claude Code instances simultaneously, some instances may:
- Stop responding mid-conversation
- Fail to submit input despite text appearing in terminal
- Enter a stuck state requiring manual restart

**Root Cause:** Known race condition in Claude Code when multiple instances share resources (API connections, session state). This is an upstream bug in Claude Code itself, not Hivemind.

**Impact on Hivemind:**
- Agents may appear "stuck" even though Hivemind delivered the message correctly
- User may need to restart individual panes
- Not all 6 agents will always be responsive simultaneously

**Workarounds:**
1. Restart the stuck pane (Ctrl+C, then respawn)
2. Reduce concurrent active conversations
3. Wait for upstream fix

**Status:** Open upstream issue. Hivemind cannot fix this.

---

## Codex Exec PTY Limitations

**Symptom:** Ctrl+C and other PTY control characters have no effect on Codex exec panes.

**Root Cause:** `codex exec --json` runs as a non-interactive child process with JSONL stdout. PTY writes (including Ctrl+C / 0x03) go to stdin but are ignored because the process is not attached to a PTY.

**Impact on Hivemind:**
- Auto-interrupt (Ctrl+C after 120s) is a no-op for Codex panes
- Stuck Codex panes require process kill, not interrupt
- "Stuck" detection may repeat every 30s for idle Codex panes

**Workarounds:**
1. Kill and respawn Codex pane if truly stuck
2. Accept that Codex panes show "no output" warnings when idle

**Status:** By design. Codex exec is non-interactive.

---

## Interactive TUI Input on Windows

**Symptom:** Neither `\r` nor `\n` PTY writes submit input in interactive ink-based TUIs (Codex interactive mode).

**Root Cause:** Interactive CLIs using ink (React for terminals) handle input through their own event loop, not raw PTY newlines. Keyboard events from a focused terminal textarea work; programmatic PTY writes do not.

**Impact on Hivemind:**
- Cannot automate interactive Codex (why we switched to `codex exec`)
- Similar limitations may apply to other ink-based CLIs

**Workarounds:**
1. Use non-interactive modes (`codex exec --json`)
2. Require user keyboard input for interactive CLIs

**Status:** Platform/library limitation. Cannot be fixed without upstream changes to ink.

---

## Focus Requirement for Trusted Events

**Symptom:** Auto-submit requires focusing the terminal textarea before sending Enter.

**Root Cause:** Browsers and Electron enforce that only "trusted" (user-initiated) keyboard events trigger default actions. Programmatically dispatched events are "untrusted" and ignored. The only workaround is to focus the element before dispatching.

**Impact on Hivemind:**
- Trigger injection must focus panes, causing focus-steal UX issues
- Typing-guard mitigates but doesn't eliminate focus interruptions

**Workarounds:**
1. Typing-guard defers injection while user is typing (implemented)
2. xterm 5.4.0+ `terminal.input()` API may bypass focus requirement (pending upgrade)

**Status:** Web platform limitation. xterm upgrade is the path forward.

---

## Summary

| Issue | Whose Bug? | Hivemind Can Fix? |
|-------|-----------|-------------------|
| Claude Code concurrent instances stuck | Upstream (Claude Code) | No |
| Codex exec ignores Ctrl+C | By design (non-interactive) | No |
| Ink TUI ignores PTY newlines | Platform (ink library) | No |
| Focus required for trusted events | Platform (DOM spec) | Partial (xterm upgrade) |

**User guidance:** If an agent is stuck and restarting the pane doesn't help, it's likely the Claude Code concurrent instance bug. Wait and retry, or reduce the number of active conversations.
