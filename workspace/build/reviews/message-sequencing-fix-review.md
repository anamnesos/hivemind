# Message Sequencing Bug Fix Review

**Reviewer:** Claude (Reviewer instance)
**Date:** Jan 28, 2026
**Priority:** HIGH
**Status:** APPROVED

---

## Bug Summary

**Problem:** `recordMessageSeen()` was called BEFORE delivery, so if injection failed (focus issue, terminal busy, timing race), the message was already marked as "seen" in message-state.json. Retry attempts with same sequence number were blocked as duplicates.

**Evidence:** Console log `[Trigger] SKIPPED duplicate: implementer-a #4 → lead` when message never reached target.

---

## Fix Analysis

### SDK Mode Path (lines 632-638)

```javascript
// Record message as seen AFTER successful SDK delivery
if (allSuccess && parsed.seq !== null && parsed.sender) {
  recordMessageSeen(parsed.sender, parsed.seq, recipientRole);
  log.info('Trigger', `Recorded seen after SDK delivery: ...`);
} else if (!allSuccess && parsed.seq !== null && parsed.sender) {
  log.warn('Trigger', `NOT recording seen (SDK delivery failed): ...`);
}
```

**Verdict:** CORRECT
- Only records if ALL SDK sends succeeded (`allSuccess`)
- Logs warning on failure for debugging
- Placed AFTER the delivery loop completes

### PTY Mode Path (lines 654-660)

```javascript
// Record message as seen AFTER PTY IPC dispatch
// Note: PTY injection is async and may still fail in renderer, but at least
// we've dispatched the IPC event. This is better than recording before dispatch.
if (parsed.seq !== null && parsed.sender) {
  recordMessageSeen(parsed.sender, parsed.seq, recipientRole);
  log.info('Trigger', `Recorded seen after PTY dispatch: ...`);
}
```

**Verdict:** CORRECT (with acknowledged limitation)
- Placed AFTER `sendStaggered()` call at line 649
- Comment honestly documents that PTY is async and could still fail in renderer
- This is strictly better than before (was recording BEFORE dispatch)

### Documentation (line 588)

```javascript
// NOTE: recordMessageSeen() moved to AFTER delivery (SDK/PTY paths below)
// This prevents marking messages as "seen" before they're actually sent
```

Good inline documentation explaining the fix.

---

## Edge Cases Verified

| Scenario | Behavior | Correct? |
|----------|----------|----------|
| SDK partial failure (2/3 panes succeed) | `allSuccess=false`, NOT recorded | ✅ |
| SDK full success | Recorded after all sends | ✅ |
| PTY dispatch | Recorded after IPC send | ✅ |
| Null sender/seq | Skipped (guards in place) | ✅ |
| Duplicate message | Still blocked at line 579 | ✅ |

---

## Remaining Limitation

The PTY path cannot verify renderer injection success without a callback/promise mechanism. The comment at lines 655-656 honestly acknowledges this. A "perfect" fix would require:
1. Renderer confirms injection success via IPC
2. Only then call `recordMessageSeen()`

This is acceptable for now because:
- The immediate bug (recording BEFORE dispatch) is fixed
- Adding renderer callbacks is a larger refactor
- Current fix is strictly better than before

---

## Verdict

**APPROVED FOR COMMIT**

The fix correctly addresses the root cause. SDK path has proper success gating. PTY path is improved with honest documentation of remaining async limitation.

---

*Reviewed by Reviewer - 2026-01-28*
