# Codex Exec Display Bugs - Input Echo + Output Formatting

**Reviewer**: Reviewer
**Date**: Jan 28, 2026
**Severity**: HIGH — Codex panes are unusable without these fixes
**Owner**: Implementer B (backend/daemon) for Bug 2, Implementer A (UI/terminal) for Bug 1

---

## BUG 1: User input not visible in Codex panes

**File**: `ui/modules/terminal.js` lines 490-495
**Symptom**: When you send a message to a Codex pane, nothing appears showing what you sent. The response (if visible at all) has no context.

**Root cause**: `doSendToPane()` detects Codex and calls `codexExec()` then returns immediately. Unlike Claude panes where `pty.write()` echoes text back through the PTY to xterm, Codex exec mode pipes to a headless child process stdin — there's no echo path.

```javascript
// terminal.js:490-495 — current code
if (isCodex) {
    const prompt = buildCodexExecPrompt(id, text);
    window.hivemind.pty.codexExec(id, prompt);
    lastTypedTime[paneId] = Date.now();
    lastOutputTime[paneId] = Date.now();
    return;  // ← no echo to xterm
}
```

**Fix**: Write the user's prompt to the xterm terminal before calling codexExec:

```javascript
if (isCodex) {
    const prompt = buildCodexExecPrompt(id, text);
    // Echo user input to xterm so it's visible
    const terminal = terminals.get(id);
    if (terminal) {
        terminal.write(`\r\n\x1b[36m> ${text}\x1b[0m\r\n`);
    }
    window.hivemind.pty.codexExec(id, prompt);
    lastTypedTime[paneId] = Date.now();
    lastOutputTime[paneId] = Date.now();
    return;
}
```

---

## BUG 2: Output mashed together in Codex panes

**File**: `ui/modules/codex-exec.js` line 118
**Symptom**: Response text from different JSONL events runs together without line breaks. Multiple exec runs concatenate into one unreadable blob.

**Root cause**: `handleCodexExecLine()` broadcasts extracted text without appending `\r\n`:

```javascript
// codex-exec.js:117-118 — current code
if (text) {
    broadcast({ event: 'data', paneId, data: text });  // ← no \r\n
```

Compare with error/exit messages which correctly include `\r\n` (lines 137, 172, 192).

**Fix**: Append `\r\n` to non-delta text broadcasts. For streaming deltas (`delta.text`), don't add newlines (they're partial chunks). For completed messages (`item.completed`, `content`, `output`, `result`), add `\r\n`:

```javascript
if (text) {
    // Streaming deltas are partial — no newline. Everything else gets \r\n.
    const isDelta = (event.type === 'content_block_delta' ||
                     event.type === 'response.output_text.delta');
    const formatted = isDelta ? text : text + '\r\n';
    broadcast({ event: 'data', paneId, data: formatted });
    terminal.lastActivity = Date.now();
    appendScrollback(terminal, formatted);
}
```

---

## Impact

Without these fixes, Codex panes are effectively blind — users can't see what they sent or read the responses clearly. This defeats the purpose of multi-agent visibility.
