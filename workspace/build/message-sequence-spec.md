# Message Sequence Protocol Spec

**Author:** Reviewer
**Date:** Jan 26, 2026
**Status:** APPROVED - Open questions resolved

---

## Problem

Trigger file messaging has latency. Messages cross in transit, causing:
- Duplicate responses to already-answered questions
- Confirmation loops ("I know you know I know")
- Stale messages processed after newer ones

## Solution

Add sequence numbers to messages. Receivers track "last seen" per sender and skip stale messages.

---

## Message Format

### Current Format
```
(ROLE): message content here
```

### New Format
```
(ROLE #SEQ): message content here
```

**Examples:**
```
(LEAD #1): Hey team, starting comms check
(WORKER-A #1): Lead, I'm online
(REVIEWER #1): Confirmed, ready to review
(LEAD #2): Great, let's discuss the new feature
(WORKER-A #2): I have a question about that
```

---

## Sequence Rules

### Sending
1. Each agent maintains their OWN sequence counter (starts at 1)
2. Increment counter BEFORE sending each message
3. Format: `(ROLE #N):` where N is current counter
4. Counter persists across the session (don't reset mid-conversation)

### Receiving
1. Track `lastSeenSeq[sender]` for each sender
2. On receiving message from SENDER with seq N:
   - If `N <= lastSeenSeq[sender]`: **SKIP** (stale message)
   - If `N > lastSeenSeq[sender]`: **PROCESS** and update `lastSeenSeq[sender] = N`
3. Unknown sender = initialize `lastSeenSeq[sender] = 0`

### Edge Cases
- **Gap in sequence** (received #5, then #7): Process #7, skip #5 if it arrives later
- **Reset/new session**: Receiver should accept seq=1 if significantly newer timestamp (TBD)
- **Missing seq number**: Treat as seq=0 (always process for backwards compat)

---

## State Storage

**File:** `workspace/message-state.json`

```json
{
  "counters": {
    "LEAD": 5,
    "WORKER-A": 3,
    "WORKER-B": 2,
    "REVIEWER": 4
  },
  "lastSeen": {
    "LEAD": { "WORKER-A": 3, "WORKER-B": 2, "REVIEWER": 4 },
    "WORKER-A": { "LEAD": 5, "WORKER-B": 2, "REVIEWER": 4 },
    "WORKER-B": { "LEAD": 5, "WORKER-A": 3, "REVIEWER": 4 },
    "REVIEWER": { "LEAD": 5, "WORKER-A": 3, "WORKER-B": 2 }
  }
}
```

---

## Implementation Assignments

| Component | Owner | Description |
|-----------|-------|-------------|
| Message format parsing | Worker A | Parse `(ROLE #N):` in renderer.js |
| Sequence tracking | Worker B | Read/write message-state.json, skip stale |
| Spec document | Reviewer | This document (DONE) |
| Integration | Lead | Coordinate, verify pieces fit |

---

## Validation Checklist (Reviewer will verify)

- [ ] Messages include sequence number in correct format
- [ ] Sender increments counter before each send
- [ ] Receiver correctly skips stale messages
- [ ] State persists in message-state.json
- [ ] Backwards compatible (no seq = seq 0)

---

## Resolved Questions

1. **Session reset handling:** ✅ **Option C - Manual clear on restart**
   - App clears `workspace/message-state.json` on fresh start
   - Simple and predictable behavior
   - Decided by: Worker B proposal, Reviewer approved

2. **Broadcast messages:** ✅ **Same sequence counter**
   - One sender = one counter, regardless of routing target
   - Broadcast to `all.txt` or `workers.txt` uses sender's single counter
   - Decided by: Worker B proposal, Reviewer approved

---

**Spec finalized. Implementation in progress.**
