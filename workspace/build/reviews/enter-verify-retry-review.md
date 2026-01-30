# Review: Enter Verification + Retry Fix

**Reviewer:** Reviewer
**Date:** Jan 28, 2026
**Owner:** Implementer A
**File:** `ui/modules/terminal.js`

---

## Summary

Fix adds post-Enter verification to detect when `sendTrustedEnter()` is ignored during active output, with automatic retry after waiting for idle.

---

## Changes

### New Constants (lines 85-87)

```javascript
const ENTER_VERIFY_DELAY_MS = 100;    // Wait before checking if Enter succeeded
const MAX_ENTER_RETRIES = 5;          // Max retry attempts
const ENTER_RETRY_INTERVAL_MS = 200;  // Idle polling interval
```

### New Function: verifyAndRetryEnter() (lines 290-361)

**Purpose:** Verify Enter succeeded (textarea empty) and retry if text remains

**Flow:**
1. Wait 100ms for Enter to process
2. Re-query textarea (DOM safety)
3. Check if textarea is empty → success
4. If text remains + retries exhausted → return false
5. If text remains + retries left:
   - Wait for pane idle (max 10s, poll every 200ms)
   - Re-query textarea
   - Check if cleared during wait
   - Focus with retry
   - Send Enter again
   - Recurse with decremented count

### Integration in doSendToPane() (line 770)

```javascript
const submitOk = await verifyAndRetryEnter(id, textarea);
if (!submitOk) {
  log.warn(`doSendToPane ${id}`, 'Claude pane: Enter verification failed after retries');
}
finishWithClear({ success: submitOk });
```

---

## Verification Checklist

| Check | Result |
|-------|--------|
| DOM re-query before each operation | ✅ PASS |
| Bounded retries | ✅ PASS (5 max) |
| Bounded timeout | ✅ PASS (10s per retry) |
| Focus retry before Enter | ✅ PASS |
| Integrates with delivery-ack | ✅ PASS (false = no ack) |
| Consistent with existing patterns | ✅ PASS |
| Logging present | ✅ PASS |

---

## Timing Analysis

| Scenario | Time |
|----------|------|
| Best case (Enter succeeds) | ~100ms |
| Per retry (full idle wait) | Up to ~10.3s |
| Worst case (5 full retries) | ~51.5s |

---

## Delivery-Ack Integration

If `submitOk` is false:
- `finishWithClear({ success: false })` is called
- `daemon-handlers.js:329-333` checks result
- Ack NOT sent on failure → sequence not recorded → message can retry

---

## Edge Cases

| Case | Handling |
|------|----------|
| Textarea disappears | Returns false with warning |
| Pane never idle | 10s timeout per retry |
| Text clears during wait | Returns success early |
| Focus fails on retry | Logs warning, tries Enter anyway |

---

## Verdict

**APPROVED** ✅

Implementation is correct and robust. Properly handles DOM changes, has bounded retries and timeouts, integrates correctly with delivery-ack system.

Pending restart verification.
