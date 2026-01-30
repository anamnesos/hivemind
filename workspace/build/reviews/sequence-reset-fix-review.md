# Sequence Reset Fix Review

**Date:** 2026-01-28 (Session 25)
**Reviewer:** Reviewer
**Owner:** Implementer B
**File:** `ui/modules/triggers.js` lines 636-643

## Summary

Fix for the "lead.txt duplicate drop" bug where agent messages were blocked as duplicates after agent restart because `lastSeen` retained high sequence numbers from previous session.

## Implementation

```javascript
if (parsed.seq === 1 && message.includes('# HIVEMIND SESSION:')) {
  if (!messageState.sequences[recipientRole]) {
    messageState.sequences[recipientRole] = { outbound: 0, lastSeen: {} };
  }
  messageState.sequences[recipientRole].lastSeen[parsed.sender] = 0;
  saveMessageState();
  log.info('Trigger', `Reset lastSeen for sender restart: ${parsed.sender} -> ${recipientRole}`);
}
```

## Verification Checklist

| Check | Result |
|-------|--------|
| Placement after `parseMessageSequence()` | ✅ PASS |
| Placement before `isDuplicateMessage()` | ✅ PASS |
| Triggers only on `seq === 1` | ✅ PASS |
| Banner substring match works | ✅ PASS |
| Reset to 0 allows seq=1 | ✅ PASS (1 <= 0 is false) |
| State persistence | ✅ PASS |
| Logging present | ✅ PASS |
| Creates recipient entry if missing | ✅ PASS |

## Dependency

The fix requires **the session banner to be in the same message** as the `(ROLE #1):` prefix. This is by design per blockers.md.

Agents should format their first restart message like:
```
(REVIEWER #1): # HIVEMIND SESSION: Reviewer
Reviewer online...
```

## Edge Cases

- **Broadcast `all.txt`**: Creates `all` entry in sequences if missing, but broadcasts bypass dedupe anyway.
- **Case sensitivity**: Banner is generated with exact format, `includes()` works correctly.
- **Missing banner**: If agent doesn't include banner in first message, reset won't trigger (known limitation).

## Verdict

**APPROVED** ✅

Implementation is correct. Ready for commit and restart verification.
