# Delivery Acknowledgment Enhancement Review

**Reviewer:** Claude (Reviewer instance)
**Date:** Jan 28, 2026
**Priority:** HIGH (completes message sequencing fix)
**Status:** APPROVED

---

## Summary

This enhancement completes the message sequencing fix by adding confirmed delivery tracking for PTY mode. Previously, PTY path recorded "seen" after IPC dispatch but before renderer confirmation. Now it waits for actual delivery ack.

---

## Files Changed

| File | Changes |
|------|---------|
| `ui/modules/triggers.js` | deliveryId tracking, pending map, timeout, handleDeliveryAck |
| `ui/modules/daemon-handlers.js` | deliveryId in queue, sends trigger-delivery-ack after sendToPane |
| `ui/modules/terminal.js` | sendToPane accepts onComplete callback, doSendToPane reports result |
| `ui/main.js` | IPC listener forwards trigger-delivery-ack to triggers module |

---

## Verification Checklist

### 1. recordMessageSeen only after ack ✅

**PTY path:**
- `startDeliveryTracking()` sets up pending delivery (line 710)
- `sendStaggered()` dispatches with deliveryId (line 712)
- NO inline `recordMessageSeen()` call
- `handleDeliveryAck()` waits for all targets, then calls `recordMessageSeen()` (line 200)

**SDK path:**
- Unchanged - still uses inline `recordMessageSeen()` with `allSuccess` check (lines 691-696)
- Also sends ack for consistency

### 2. No premature SKIPPED duplicate when injection fails ✅

**Flow on failure:**
1. `doSendToPane` calls `onComplete({ success: false, reason: '...' })`
2. daemon-handlers.js line 329-331: Does NOT send ack on failure
3. Without ack, `handleDeliveryAck` never called
4. `recordMessageSeen` never runs
5. Agent can retry with same sequence number

### 3. Timeout logs if ack never arrives ✅

**Timeout handling (line 178-181):**
```javascript
pending.timeoutId = setTimeout(() => {
  pendingDeliveries.delete(deliveryId);
  log.warn('Trigger', `Delivery timeout for ${sender} #${seq} -> ${recipient}...`);
}, DELIVERY_ACK_TIMEOUT_MS);  // 30 seconds
```

- Cleans up pendingDeliveries map
- Logs warning with partial delivery count
- Does NOT call recordMessageSeen (allows retry)

### 4. No regressions in SDK path ✅

**SDK path unchanged:**
- Lines 690-696: Still uses `allSuccess` check for immediate recording
- Line 310: Also sends `trigger-delivery-ack` for consistency
- No breaking changes

---

## Data Flow

```
PTY Trigger Flow:
================
triggers.js                 daemon-handlers.js          terminal.js
-----------                 ------------------          -----------
handleTriggerFile()
  ↓
createDeliveryId()
  ↓
startDeliveryTracking()
  ↓
sendStaggered(deliveryId)
  ↓
  ----------------IPC---------------→ inject-message
                            ↓
                            queueMessage(deliveryId)
                            ↓
                            processQueue()
                            ↓
                            sendToPane(onComplete) ----→ doSendToPane(onComplete)
                                                        ↓
                            ←--------------------------- onComplete({success:true})
                            ↓
                            trigger-delivery-ack
  ←--------------IPC----------------
  ↓
handleDeliveryAck()
  ↓
(all targets received?)
  ↓ yes
recordMessageSeen()
```

---

## Edge Cases

| Scenario | Behavior | Correct? |
|----------|----------|----------|
| All panes succeed | recordMessageSeen after all acks | ✅ |
| Some panes fail | No recordMessageSeen (timeout cleanup) | ✅ |
| All panes fail | No recordMessageSeen (no acks sent) | ✅ |
| Ack never arrives | 30s timeout, warning logged, cleanup | ✅ |
| No sequence in message | No tracking (deliveryId = null) | ✅ |
| SDK mode | Inline recording unchanged | ✅ |

---

## Code Quality

- Clean separation: tracking in triggers.js, ack sending in daemon-handlers.js
- Proper memory cleanup (delete on success or timeout)
- Safety timer in doSendToPane prevents hung callbacks
- Consistent deliveryId format with uniqueness guarantee

---

## Verdict

**APPROVED FOR COMMIT**

This enhancement properly completes the message sequencing fix by adding confirmed delivery tracking. All four verification points pass. No regressions in SDK path.

---

*Reviewed by Reviewer - 2026-01-28*
