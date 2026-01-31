# Smart Parallelism Design

**Author:** Architect
**Date:** Session 53
**Status:** REVISED (addressing Reviewer feedback)

---

## Problem

Current coordination is sequential and Architect-bottlenecked:
1. Agents wait idle until Architect assigns work
2. All tasks funnel through Architect even when independence is obvious
3. Reviewer reviews sequentially even when changes don't overlap
4. Manual dependency tracking is error-prone

## Goals

- Agents self-claim work matching their domain
- Parallel execution when tasks are independent
- Batch reviews for non-conflicting changes
- Architect focuses on cross-domain coordination, not routing

---

## Design

### 1. Task Pool Model

Tasks exist in a shared pool with metadata:

```json
{
  "id": "T-001",
  "subject": "Add logout button",
  "domain": "frontend",        // Claimable by Frontend agent
  "files": ["renderer.js"],    // Files this will touch
  "blockedBy": [],             // Task dependencies
  "status": "open",            // open → claimed → in_progress → review → done
  "owner": null                // Claimed by agent
}
```

### 2. Domain Ownership

| Domain | Agent | Files |
|--------|-------|-------|
| `frontend` | Frontend | renderer.js, index.html, CSS |
| `backend` | Backend | main.js, daemon, processes |
| `infra` | Infra | CI/CD, scripts, config |
| `architecture` | Architect | Cross-domain, coordination |
| `analysis` | Analyst | Investigations, debugging |

### 3. Self-Claim Rules

An agent CAN claim a task if:
- `domain` **matches their role exactly** (no null matching)
- `blockedBy` is empty (all dependencies resolved)
- `status` is "open"
- `owner` is null

An agent CANNOT claim if:
- `domain` is null (requires Architect routing)
- `domain` doesn't match their role
- Task touches files outside their domain
- Task has unresolved blockers
- Task is already claimed

**Null domain = Architect must assign explicitly.** No free-for-all.

### 4. Claim Flow (with race protection)

```
Agent idle → Check TaskList → Find claimable task → Write claim → Re-read to verify → Work → Notify Architect → Submit for review
```

**First-write-wins:** After claiming, agent re-reads task. If `owner` shows different agent, back off. This handles simultaneous claims.

**Notify on claim is REQUIRED:** Agent must message Architect via trigger when claiming. Format: `(ROLE #N): Claimed task #X: [subject]`

### 5. Stale Claim Timeout

If a task is `in_progress` for **>30 minutes** with no status update, Architect can reassign.

This prevents tasks from being blocked forever if an agent crashes or stalls.

### 6. Review Types

Architect marks review type at task creation. Default = SEQUENTIAL (safe).

| Type | Criteria | Use When |
|------|----------|----------|
| **PARALLEL** | File-disjoint AND no declared dependencies | Independent tasks, speed optimization |
| **INTEGRATION** | Cross-file feature, semantic coupling | IPC pairs, API+handler, shared state |
| **SEQUENTIAL** | File overlap OR explicit blocker | Conflicting changes, one at a time |

**PARALLEL example:**
- Frontend: "Add logout button" → `renderer.js`
- Backend: "Add logging to daemon" → `main.js`
- No coupling → batch review for speed

**INTEGRATION example:**
- Frontend: "Add logout button calling logoutUser()" → `renderer.js`
- Backend: "Add logoutUser IPC handler" → `main.js`
- These are two halves of one feature → single review session, trace end-to-end

**File-disjoint is necessary but not sufficient.** Semantic dependencies can cross file boundaries.

### 7. Conflict Detection

Tasks conflict if:
- Same file in `files` array
- Explicit `blockedBy` relationship
- Architect marks them as conflicting

Conflicting tasks MUST be sequential.

---

## Implementation

### Phase 1: Self-Claim (Minimal)

1. Use existing `metadata` field for domain: `{"domain": "frontend"}` (no tool changes)
2. Agents check TaskList when idle
3. Agents claim matching open tasks, verify claim, notify Architect
4. Architect creates tasks, routes null/cross-domain, monitors for stale claims

**Effort:** Low - process change only, no code changes

### Phase 2: Batch Review

1. Reviewer batches non-conflicting reviews
2. Single review message covers multiple tasks
3. Each task gets individual APPROVED/BLOCKED status

**Effort:** Low - process change only

### Phase 3: Auto-Assignment (Future)

1. File watcher detects agent idle state
2. Auto-triggers task claim flow
3. Notifications when tasks become unblocked

**Effort:** Medium - needs UI/backend work

---

## Changes Required

### Process (No Code)
- [ ] Agents read TaskList when idle instead of waiting
- [ ] Architect adds `domain` to task metadata
- [ ] Reviewer batches file-disjoint reviews

### Code (Phase 3 only)
- [ ] UI: Idle detection indicator
- [ ] Backend: Task pool file watcher
- [ ] UI: "Claim available task" button

---

## Success Criteria

1. Agents spend less time waiting for assignment
2. Parallel work happens without Architect routing each task
3. Review throughput increases with batching
4. Architect focuses on architecture, not task routing

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| Notify Architect on self-claim? | **REQUIRED** - via trigger on every claim |
| Max parallel tasks per agent? | 1 to start |
| Wrong task claimed? | Architect can reassign |
| Null domain tasks? | Architect routes explicitly |
| Stale claims? | 30 min timeout, then Architect reassigns |

---

## Next Steps

1. Architect reviews this design
2. Route to Reviewer for feedback
3. If approved, start Phase 1 (process change)
4. Frontend implements Phase 3 UI when ready
