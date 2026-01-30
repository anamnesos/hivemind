# Delivery-Ack Timeout Analysis Review

**Reviewer:** Reviewer
**Date:** January 30, 2026
**Priority:** LOW (cosmetic logging issue)
**Status:** ANALYSIS COMPLETE - RECOMMENDATION PROVIDED

---

## Problem Statement

False "Delivery timeout" logs appear even when messages are actually delivered. The ack is suppressed when `verifyAndRetryEnter` fails, even though Enter WAS sent.

---

## Root Cause Analysis

### The Flow

```
handleTriggerFile()
  → startDeliveryTracking(deliveryId) [30s timeout]
  → sendStaggered() → inject-message IPC → renderer
    → daemon-handlers.js processQueue()
      → terminal.sendToPane()
        → doSendToPane()
          → PTY write (text appears in Claude)
          → sendTrustedEnter() (Enter key sent)
          → verifyAndRetryEnter() checks for output
            → If output: return true → success=true → ACK SENT ✓
            → If no output after retries: return false → success=false → NO ACK ✗
```

### The Problem (terminal.js:1184-1191)

```javascript
const submitOk = await verifyAndRetryEnter(id, textarea);
if (!submitOk) {
  log.warn(`doSendToPane ${id}`, 'Claude pane: Enter verification failed after retries');
  markPotentiallyStuck(id);
}
finishWithClear({ success: submitOk });  // <-- success=false, NO reason provided
```

When verification fails:
- Enter WAS sent (logged at line 1179)
- PTY write WAS done (logged at line 1133)
- But no output activity detected within verify window
- Returns `{success: false}` with NO reason

### The Handler (daemon-handlers.js:531-542)

```javascript
onComplete: (result) => {
  if (result && result.success === false) {
    log.warn('Daemon', `Trigger delivery failed...`);
    return;  // <-- NO ACK SENT
  }
  // ... send ack
}
```

Treats ALL `success=false` as true failures, but verification failure is NOT the same as send failure.

---

## Failure Reasons Analysis

| Reason | Enter Sent? | Should Ack? |
|--------|-------------|-------------|
| `missing_textarea` | NO | NO |
| `textarea_disappeared` | NO | NO |
| `focus_failed` | NO | NO |
| `enter_failed` | NO | NO |
| `timeout` | NO | NO |
| (no reason - verification failed) | **YES** | **YES** |

---

## Recommended Fix

**Option 2 is safest:** Distinguish between "send failed" and "sent but unverified"

### Step 1: terminal.js - Add reason for verification failure

```javascript
// Line 1191 - change:
finishWithClear({ success: submitOk });

// To:
finishWithClear({
  success: true,  // Enter WAS sent
  verified: submitOk,
  reason: submitOk ? null : 'verification_failed'
});
```

### Step 2: daemon-handlers.js - Send ack for unverified sends

```javascript
onComplete: (result) => {
  // True send failures - don't ack
  if (result && result.success === false) {
    log.warn('Daemon', `Trigger delivery failed for pane ${paneId}: ${result.reason || 'unknown'}`);
    showDeliveryFailed(paneId, result.reason || 'Delivery failed');
    return;
  }

  // Sent but unverified - still ack (Enter was sent, message may be delivered)
  if (result && result.verified === false) {
    log.info('Daemon', `Trigger delivered (unverified) for pane ${paneId}`);
    showDeliveryIndicator(paneId, 'pending');  // Or 'unverified' state
  } else {
    showDeliveryIndicator(paneId, 'delivered');
  }

  // Send ack in both cases (Enter was sent)
  if (deliveryId) {
    ipcRenderer.send('trigger-delivery-ack', { deliveryId, paneId });
  }
}
```

---

## Why This Approach

1. **Accurate semantics:** `success=true` means Enter was sent, `verified=true` means output detected
2. **No false timeout logs:** Ack is sent when Enter was sent, even if unverified
3. **Sweeper still works:** `markPotentiallyStuck` is called for unverified sends
4. **Sequence tracking works:** Ack triggers `recordMessageSeen` for proper deduplication
5. **Distinguishes true failures:** `missing_textarea`, `focus_failed` etc. still don't ack

---

## Alternative Options Considered

### Option 1: Always return success=true for verification failure
- **Pros:** Simpler
- **Cons:** Loses information about verification state, can't show "pending" in UI

### Option 3: Extend verify window
- **Pros:** Reduces false failures
- **Cons:** Doesn't fix root cause, just delays the issue; longer blocking time

---

## Verdict

**RECOMMEND Option 2** - Add `verified` field to result, send ack when `success=true` regardless of `verified`.

This is the safest path because:
- Enter was sent → message likely delivered → should ack
- True send failures still don't ack
- UI can distinguish delivered vs pending states
- No timeout noise in logs

**Owner:** Implementer A (terminal.js) + Implementer B (daemon-handlers.js)
**Priority:** LOW - cosmetic logging, not blocking
