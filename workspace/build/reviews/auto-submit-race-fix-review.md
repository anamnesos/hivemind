# Auto-Submit Race Condition Fix Review

**Reviewer:** Claude (Reviewer instance)
**Date:** Jan 28, 2026
**Priority:** MEDIUM
**Status:** APPROVED

---

## Bug Summary

**Problem:** Fixed 50ms delay was insufficient under load - Enter fired before text appeared in terminal. If textarea disappeared during delay, Enter went to wrong element.

**Symptoms:** User had to manually push messages through even though hybrid fix was working earlier in session.

---

## Fix Analysis

### 1. Adaptive Enter Delay (lines 78-84, 245-258)

**Constants:**
```javascript
const ENTER_DELAY_IDLE_MS = 50;       // No output > 500ms
const ENTER_DELAY_ACTIVE_MS = 150;    // Output in last 500ms
const ENTER_DELAY_BUSY_MS = 300;      // Output in last 100ms
```

**Function `getAdaptiveEnterDelay(paneId)`:**
- Uses `lastOutputTime[paneId]` (updated on every `pty.onData`)
- Returns delay based on time since last output
- Falls back to 0 if undefined → idle behavior

**Verdict:** CORRECT - More recent output → longer delay to let text appear

### 2. Focus Retry Mechanism (lines 268-285)

**Function `focusWithRetry(textarea, retries)`:**
```javascript
async function focusWithRetry(textarea, retries = 3) {
  if (!textarea) return false;
  textarea.focus();
  if (document.activeElement === textarea) return true;
  if (retries > 0) {
    await delay(20);
    return focusWithRetry(textarea, retries - 1);
  }
  return false;
}
```

**Verdict:** CORRECT
- Guards against null textarea
- Verifies focus succeeded via `document.activeElement`
- Recursive retry with 20ms delay (max 3 attempts = 60ms)
- Returns boolean for caller to handle

### 3. Textarea Null Guards (lines 654-664)

```javascript
setTimeout(async () => {
  // Re-query textarea in case DOM changed during delay
  const currentPane = document.querySelector(`.pane[data-pane-id="${id}"]`);
  textarea = currentPane ? currentPane.querySelector('.xterm-helper-textarea') : null;

  // Guard: Abort if textarea disappeared
  if (!textarea) {
    log.warn(...);
    finishWithClear();
    return;
  }
  ...
});
```

**Verdict:** CORRECT
- Re-queries DOM after delay (defensive)
- Aborts cleanly if textarea gone
- Still calls `finishWithClear()` to release injection lock

### 4. Graceful Degradation (lines 667-670)

```javascript
const focusOk = await focusWithRetry(textarea);
if (!focusOk) {
  log.warn(`doSendToPane ${id}`, 'focus failed after retries, sending Enter anyway');
}
window.hivemind.pty.sendTrustedEnter();
```

**Verdict:** CORRECT - Logs warning but still attempts Enter (better than aborting)

---

## Edge Cases Verified

| Scenario | Delay | Behavior |
|----------|-------|----------|
| Pane idle (no output > 500ms) | 50ms | Fast path |
| Pane active (output < 500ms) | 150ms | Medium delay |
| Pane busy (output < 100ms) | 300ms | Long delay |
| Textarea disappears | N/A | Abort with finishWithClear() |
| Focus fails × 3 | +60ms | Warn, send Enter anyway |

## Timing Analysis

**Worst case total delay:**
- 300ms (busy) + 60ms (3 retries) + 50ms (restore) = **410ms**

This is acceptable for reliability. The adaptive system means idle panes still get 50ms fast path.

---

## Code Quality

- Clear constant names with comments
- JSDoc on helper functions
- Good logging at each step
- Defensive null checks
- Graceful degradation over hard failures

---

## Verdict

**APPROVED FOR COMMIT**

The fix addresses the root cause with:
1. Activity-based adaptive delays
2. Defensive DOM re-querying
3. Focus retry mechanism
4. Proper null guards
5. Graceful degradation

No issues found.

---

*Reviewed by Reviewer - 2026-01-28*
