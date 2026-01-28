# Codex Exec Path Review - Resume, Identity Badges, Auto-Submit

**Reviewer**: Reviewer
**Date**: Jan 28, 2026
**Scope**: codex-exec.js, terminal.js, terminal-daemon.js, ipc-handlers.js, daemon-client.js, main.js, renderer.js
**Requested by**: Orchestrator (#3)

---

## 1. Resume Continuity on 2nd Message

**VERDICT: WORKS CORRECTLY**

**Flow traced**:
1. First `runCodexExec()` call: `codexSessionId` is null → spawns `codex exec --json --dangerously-bypass-approvals-and-sandbox --cd <workDir> -` (codex-exec.js:146)
2. JSONL response includes `thread.started` with `thread_id` → captured at codex-exec.js:104-108, stored as `terminal.codexSessionId`
3. Also handles `session_meta` with `payload.id` at codex-exec.js:96-101 (alternate format)
4. Second `runCodexExec()` call: `codexSessionId` is set → spawns `codex exec --json --dangerously-bypass-approvals-and-sandbox resume <sessionId> -` (codex-exec.js:145)
5. Prompt is piped to stdin, stdin.end() closes the pipe (codex-exec.js:198-202)
6. On process exit, `execProcess` is set to null (codex-exec.js:190), allowing the next call

**Potential issue**: `codexSessionId` persists on the `terminal` object in the daemon. If the daemon survives an app restart (which it does — daemon-client reconnects), the session ID is preserved. **This is correct behavior.**

**No bugs found.**

---

## 2. CLI Identity Badges on Spawn/Reconnect

**VERDICT: WORKS CORRECTLY**

**Spawn path**:
1. `ipc-handlers.js:88-90`: `spawn` determines mode from `paneCommands` config (`codex` → `codex-exec`)
2. `terminal-daemon.js` `spawned` event fires → `main.js:508-512`: `daemonClient.on('spawned')` calls `inferAndEmitCliIdentity(paneId, command)` using the pane's configured command
3. `detectCliIdentity()` at main.js:395-412 maps command to provider/label
4. `emitPaneCliIdentity()` at main.js:421-446 sends `pane-cli-identity` IPC to renderer (with dedup check)
5. `renderer.js:883-901`: listener updates `cli-badge-${paneId}` DOM element, adds class `claude`/`codex`/`gemini`, and calls `terminal.registerCodexPane()` or `unregisterCodexPane()`

**Reconnect path**:
1. `main.js:514-526`: `daemonClient.on('connected')` iterates alive terminals, calls `inferAndEmitCliIdentity()` for each
2. Same flow as spawn — badge emitted per pane

**Edge case**: Identity comes from `paneCommands` setting, NOT from actual CLI detection. If user manually runs a different CLI in a pane, the badge won't update. This is **by design** — the setting is the source of truth for PTY mode.

**No bugs found.**

---

## 3. Codex Auto-Submit Behavior (Codex vs Non-Codex)

**VERDICT: WORKS CORRECTLY — two distinct paths properly separated**

### Codex panes (`isCodexPane(id) === true`):

**Path A — Codex-exec mode** (codex-exec.js):
- `doSendToPane()` at terminal.js:490-495: detects Codex, calls `window.hivemind.pty.codexExec(id, prompt)` instead of PTY write
- This invokes `runCodexExec()` which spawns a fresh `codex exec` child process per message
- Text is piped to stdin → stdin.end() → child runs to completion
- No Enter/\r needed — stdin pipe handles submission
- `buildCodexExecPrompt()` prepends identity header on first message only (terminal.js:180-191)

**Path B — PTY interactive Codex** (dead code path — `isCodexPane` triggers Path A):
- terminal.js:521-534: If somehow reached (isCodex && hasTrailingEnter), does `pty.write(text + '\n')` — single write with newline, no keyboard Enter
- This path is unreachable because line 490-495 returns early for all Codex panes

**Path C — Spawn-time identity injection for Codex panes**:
- `spawnClaude()` at terminal.js:681-691: detects Codex pane, sends identity message via `sendToPane()` with `\r` suffix after 2s delay
- `sendToPane()` → `doSendToPane()` → Path A (codex-exec) — the `\r` gets stripped (line 485), prompt goes through `codexExec()`
- Wait: **BUG FOUND** — see below

### Non-Codex panes (Claude):
- `doSendToPane()` at terminal.js:536-557: writes text via `pty.write()`, then after 50ms sends `\r` + `sendTrustedEnter()` (native keyboard event)
- Trusted Enter is critical for Claude CLI (synthetic Enter is blocked at terminal.js:313-321)

---

## BUG FOUND

### BUG: `spawnClaude()` identity injection for Codex-exec panes sends redundant/wasteful exec

**File**: terminal.js:681-691
**Severity**: LOW (cosmetic waste, not a crash)

When `spawnClaude()` is called for a Codex pane:
1. Line 688: `sendToPane(paneId, identityMsg + '\r')`
2. This goes through `doSendToPane()` → detects Codex → calls `codexExec()`
3. `buildCodexExecPrompt()` prepends the SAME identity header (terminal.js:186-190)
4. Result: the identity message is sent as a **standalone Codex exec prompt** — spawning a whole `codex exec` process just to send an identity string

This is wasteful but harmless. The `codexIdentityInjected` set prevents double-prepending on subsequent messages. The standalone identity exec will produce a Codex response to the identity prompt, which may be confusing output.

**Recommended fix**: Skip the `spawnClaude()` identity injection for codex-exec panes, since `buildCodexExecPrompt()` already handles it on the first real message.

---

## SUMMARY

| Check | Status |
|-------|--------|
| Resume continuity (2nd message) | ✅ PASS — thread_id captured and used |
| CLI identity badges on spawn | ✅ PASS — emitted from settings |
| CLI identity badges on reconnect | ✅ PASS — emitted for alive terminals |
| Codex auto-submit | ✅ PASS — stdin pipe, no Enter needed |
| Claude auto-submit | ✅ PASS — trusted keyboard Enter |
| Codex vs Claude path separation | ✅ PASS — `isCodexPane()` gates correctly |
| Spawn identity injection for Codex | ⚠️ MINOR — wasteful double identity exec |

**APPROVED** — No blocking issues. One minor optimization opportunity noted.
