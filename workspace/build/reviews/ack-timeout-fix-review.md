# Ack-Timeout Fix Review

**Reviewer:** Reviewer
**Date:** January 30, 2026
**Priority:** LOW (cosmetic logging issue)
**Status:** ✅ APPROVED

---

## Summary

Fix for false "Delivery timeout" logs when Enter was sent but verification failed. Implements **Option 2** from my analysis: return `{success: true, verified: false}` when Enter was sent but output not yet detected.

---

## Code Review

### ✅ terminal.js (lines 1191-1195) - CORRECT

```javascript
const resultPayload = submitOk
  ? { success: true }
  // Enter was sent, but verification failed (no output/prompt yet) - treat as unverified success
  : { success: true, verified: false, reason: 'verification_failed' };
finishWithClear(resultPayload);
```

**Good:**
- When verification succeeds: returns `{ success: true }`
- When verification fails: returns `{ success: true, verified: false, reason: 'verification_failed' }`
- Comment accurately describes the behavior
- `markPotentiallyStuck(id)` still called at line 1187 for sweeper retry

### ✅ daemon-handlers.js (lines 531-543) - WORKS CORRECTLY

```javascript
onComplete: (result) => {
  if (result && result.success === false) {
    log.warn('Daemon', `Trigger delivery failed...`);
    showDeliveryFailed(paneId, result.reason || 'Delivery failed');
    return;  // NO ACK
  }
  // Success - show delivery indicator
  showDeliveryIndicator(paneId, 'delivered');
  if (deliveryId) {
    ipcRenderer.send('trigger-delivery-ack', { deliveryId, paneId });
  }
}
```

**Why it works:**
- Condition `result.success === false` is now FALSE for verification failures (success is true)
- Handler does NOT return early
- `trigger-delivery-ack` is sent even for unverified sends
- No timeout noise in logs

---

## Verification Matrix

| Scenario | success | verified | Ack Sent? | Correct? |
|----------|---------|----------|-----------|----------|
| Verification succeeded | true | (not set) | YES | ✅ |
| Verification failed | true | false | YES | ✅ |
| missing_textarea | false | - | NO | ✅ |
| textarea_disappeared | false | - | NO | ✅ |
| focus_failed | false | - | NO | ✅ |
| enter_failed | false | - | NO | ✅ |
| timeout | false | - | NO | ✅ |

---

## Other Call Sites Checked

All other `finishWithClear` calls return appropriate values:
- Line 1091: Codex path - `{ success: true }` ✅
- Line 1105: Missing textarea - `{ success: false, reason: 'missing_textarea' }` ✅
- Line 1150: Textarea disappeared - `{ success: false, reason: 'textarea_disappeared' }` ✅
- Line 1162: Focus failed - `{ success: false, reason: 'focus_failed' }` ✅
- Line 1176: Enter failed - `{ success: false, reason: 'enter_failed' }` ✅
- Line 1201: No Enter needed - `{ success: true }` ✅

---

## Minor Enhancement (Optional, Not Blocking)

The UI currently shows "delivered" for both verified and unverified sends. A future enhancement could distinguish:

```javascript
if (result && result.verified === false) {
  showDeliveryIndicator(paneId, 'pending');  // Or 'unverified'
} else {
  showDeliveryIndicator(paneId, 'delivered');
}
```

This is LOW priority - the core fix (no false timeouts) works correctly.

---

## Verdict

**✅ APPROVED** - Fix correctly implements the recommended approach.

- Enter was sent → `success: true` → ack sent → no timeout noise
- True send failures still return `success: false` → no ack → proper timeout
- Sweeper still tracks unverified sends via `markPotentiallyStuck`
- Sequence tracking works via ack → `recordMessageSeen`

**Ready for restart verification.**
