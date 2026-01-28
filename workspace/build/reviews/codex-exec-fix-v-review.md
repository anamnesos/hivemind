# Codex Exec Fix V Review — Reviewer (Jan 27, 2026)

## Scope

Verified: codex-exec.js, terminal.js, ipc-handlers.js, daemon-client.js, preload.js, renderer.js, terminal-daemon.js

---

## 1. Fix V — Flag Conflict: ✅ PASS

**codex-exec.js:107-109** — Both initial and resume arg arrays now use:
```
['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...]
```
`--full-auto` is completely removed. No conflict possible.

**ipc-handlers.js:180-185** — The `spawn-claude` handler still adds `--yolo` for interactive Codex spawns (PTY path), which is an alias for `--dangerously-bypass-approvals-and-sandbox`. This is fine — Codex exec panes don't go through `spawn-claude` (they early-return at terminal.js:681).

**Verdict:** Clean. No flag duplication or conflict in any code path.

---

## 2. Output Rendering (no raw JSON): ✅ PASS

**codex-exec.js:57-88** — `handleCodexExecLine()` does:
1. Parse JSON → extract text via `extractCodexText()`
2. If text found → broadcast readable text (no JSON wrapper)
3. If no text extracted → fall back to raw line + `\r\n`
4. Non-JSON lines → pass through as-is

**extractCodexText() (lines 28-55)** handles: string payloads, `.text`, `.delta.text`, `.text_delta`, `.content` (string and array forms). This covers known Codex JSONL event shapes.

**session_meta events (line 70-75)** are consumed silently (captured for resume) — never rendered. Good.

**Minor concern:** The fallback at line 82-87 broadcasts raw JSON lines when no text is extractable. This means unrecognized event types (e.g. `tool_call`, `progress`) will show as raw JSON. Not a bug — it's a reasonable fallback — but users may see occasional JSON noise for events not yet mapped.

---

## 3. Resume Continuity: ✅ PASS with caveat

**codex-exec.js:70-74** — `session_meta` event with `payload.id` is captured to `terminal.codexSessionId`.

**codex-exec.js:107-108** — Resume path:
```js
['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', 'resume', terminal.codexSessionId, '-']
```

Flags come BEFORE `resume` subcommand — correct (this was BUG-S2, previously fixed).

**Caveat:** `codexSessionId` persists only in daemon memory. If daemon restarts, session IDs are lost and next message falls back to fresh exec (line 109). This is acceptable — Codex exec sessions are inherently ephemeral per the `codex exec` design.

---

## 4. CLI Identity Badges: ✅ PASS

**renderer.js:883-901** — `pane-cli-identity` IPC listener:
- Sets badge text and CSS class (claude/codex/gemini)
- Calls `terminal.registerCodexPane()` or `unregisterCodexPane()` to update the dynamic identity map

**terminal.js:140-169** — `registerPaneCliIdentity()` stores provider/label/version; `isCodexPane()` checks identity map first, falls back to settings-based detection.

**Flow:** main.js infers CLI identity on daemon spawn → forwards `pane-cli-identity` IPC → renderer updates badge + terminal identity map. This works for both spawn and reconnect scenarios.

---

## 5. Codex Auto-Submit vs Non-Codex Enter: ✅ PASS

**terminal.js:483-496** — `doSendToPane()` for Codex panes:
```js
if (isCodex) {
    const prompt = buildCodexExecPrompt(id, text);
    window.hivemind.pty.codexExec(id, prompt);
    // ... timestamps
    return;  // Bypasses PTY/textarea entirely
}
```
Codex panes route to `codex-exec` IPC — no PTY write, no textarea focus, no keyboard Enter. Clean separation.

**terminal.js:540-557** — Non-Codex (Claude) panes:
```js
if (hasTrailingEnter && !isCodex) {
    // PTY write + trusted Enter via sendInputEvent
}
```
Claude panes use the two-step PTY write + keyboard Enter. The `!isCodex` guard is explicit.

**buildCodexExecPrompt() (lines 180-191)** — First message prepends `# HIVEMIND SESSION: {Role}` identity. Subsequent messages pass through unchanged (tracked via `codexIdentityInjected` Set).

**spawnClaude() (lines 681-691)** — Codex panes early-return with a 2s delayed identity message via `sendToPane()`, which routes to `codexExec` via the Codex path in `doSendToPane()`. The identity gets prepended by `buildCodexExecPrompt()`. No double identity injection — `codexIdentityInjected` Set prevents it.

---

## Summary

| Check | Result |
|-------|--------|
| Fix V: No flag conflict | ✅ PASS |
| Output renders as text (not raw JSON) | ✅ PASS (minor: unknown events fall back to raw) |
| Resume uses captured sessionId | ✅ PASS (ephemeral — lost on daemon restart) |
| CLI identity badges on spawn/reconnect | ✅ PASS |
| Codex auto-submit bypasses PTY/Enter | ✅ PASS |
| Claude Enter path unaffected | ✅ PASS |

**Verdict: ✅ APPROVED** — All 5 verification items pass. Fix V is clean. The Codex exec pipeline is correctly separated from the Claude PTY path with no cross-contamination.

No blockers found.
