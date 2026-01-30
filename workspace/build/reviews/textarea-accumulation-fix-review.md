# Textarea Accumulation Fix Review

**Reviewer:** Reviewer
**Date:** January 30, 2026
**Priority:** MEDIUM (prevents blob submissions)
**Status:** ✅ APPROVED

---

## Problem Statement

When Enter failed (verification timeout), text remained stuck in the input line. The next injection appended new text to the stuck text, causing blob submissions with concatenated messages.

Example: Message 1 stuck → Message 2 arrives → User sees "Message 1Message 2" submitted as one blob.

---

## Fix Applied

**File:** `ui/modules/terminal.js` (lines 1129-1148)

### Change 1: Send Ctrl+U before text write

```javascript
// Step 2: Clear any stuck input BEFORE writing new text
// Ctrl+U (0x15) clears the current input line - prevents accumulation if previous Enter failed
// This is harmless if line is already empty
try {
  await window.hivemind.pty.write(id, '\x15');
  log.info(`doSendToPane ${id}`, 'Claude pane: cleared input line (Ctrl+U)');
} catch (err) {
  log.warn(`doSendToPane ${id}`, 'PTY clear-line failed:', err);
  // Continue anyway - text write may still work
}
```

### Change 2: Made doSendToPane async

```javascript
async function doSendToPane(paneId, message, onComplete) {
```

---

## Technical Verification

### Ctrl+U (0x15) Behavior

- **What it does:** Readline "kill line" - clears from cursor to beginning of line
- **If cursor at end:** Clears entire input line (standard behavior after typing)
- **If line empty:** No-op (harmless)
- **Standard:** Supported by bash, zsh, GNU readline, and terminal emulators

Source: [GNU Readline](https://tiswww.case.edu/php/chet/readline/readline.html), [Wikipedia - Control character](https://en.wikipedia.org/wiki/Control_character)

### Async Conversion Safety

The caller at line 683:
```javascript
doSendToPane(paneId, queuedMessage, (result) => { ... });
```

- Doesn't await the return value
- Uses callback pattern (`onComplete`)
- Callback still works with async function
- No breaking changes

---

## Code Flow After Fix

1. **Step 1:** Focus textarea (if Enter needed)
2. **Step 2:** Send Ctrl+U to clear any stuck input ← NEW
3. **Step 3:** Write text to PTY
4. **Step 4:** Send Enter via sendTrustedEnter (after adaptive delay)
5. **Step 5:** Verify and retry if needed

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Ctrl+U write fails | Logs warning, continues with text write |
| Text write fails | Returns `{ success: false, reason: 'pty_write_failed' }` |
| Enter fails | Returns `{ success: false, reason: 'enter_failed' }` |

The fix is defensive - Ctrl+U failure doesn't abort the injection.

---

## Potential Edge Cases Considered

1. **Multiple rapid messages:** Each gets Ctrl+U before write - safe
2. **Claude mid-output:** Ctrl+U goes to input line, not output - safe
3. **Non-readline terminal:** Ctrl+U may be ignored - falls back to old behavior
4. **Codex panes:** Skip this path entirely (use codex-exec) - unaffected

---

## Verdict

**✅ APPROVED**

The fix is correct and safe:
- Ctrl+U is the standard terminal "clear line" command
- Harmless if line already empty
- Proper await ordering ensures Ctrl+U completes before text write
- Defensive error handling doesn't break on failure
- No breaking changes to callback-based caller

**Ready for restart verification.**
