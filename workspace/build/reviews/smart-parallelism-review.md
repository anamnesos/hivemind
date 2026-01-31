# Smart Parallelism Design Review

**Reviewer:** Reviewer
**Date:** Session 53
**Status:** CONDITIONAL APPROVAL

---

## Summary

Solid design direction. The phased approach is smart - process-first, code-later reduces risk. However, I found **3 gaps that need addressing** before implementation.

---

## Question 1: Self-Claim Rules - Complete?

**Verdict:** INCOMPLETE - needs 3 additions

### Current Rules (lines 55-65)
```
CAN claim if: domain matches OR null, blockedBy empty, status open, owner null
CANNOT claim if: files outside domain, unresolved blockers, already claimed
```

### Gap 1.1: Race Condition
**Problem:** Two agents read TaskList simultaneously, both see task open, both try to claim.

**Fix:** First-write-wins with verification. Agent claims by writing to task, then re-reads to confirm they're owner. If not, back off.

```
Agent reads: status=open, owner=null
Agent writes: owner=Frontend
Agent re-reads: owner=Frontend? → proceed. owner=Backend? → back off.
```

### Gap 1.2: Null Domain Too Permissive
**Problem:** "domain is null" means ANY agent can claim. This defeats the purpose of domain ownership.

**Fix:** Null domain = REQUIRES Architect routing, not free-for-all. Change rule to:
```
CAN claim if: domain MATCHES their role (not null, not mismatched)
```
Architect assigns null/cross-domain tasks explicitly.

### Gap 1.3: Stale Claims
**Problem:** Agent claims task, then crashes/stalls. Task is blocked forever.

**Fix:** Add timeout. If task in `claimed` or `in_progress` for >30 mins with no update, Architect can reassign.

---

## Question 2: Parallel Review - File-Disjoint Sufficient?

**Verdict:** NECESSARY BUT NOT SUFFICIENT

### What's Right
File-disjoint is a good **speed heuristic**. If files don't overlap, reviews can happen in parallel for faster throughput.

### What's Missing

**Gap 2.1: Semantic Conflicts**
File-disjoint misses integration dependencies:
- Task A: Add `logoutUser()` call in renderer.js
- Task B: Add `logoutUser()` IPC handler in main.js
- **Different files, but MUST be reviewed together** - they're two halves of one feature

**Gap 2.2: Shared State**
Two tasks could touch different files but both modify:
- Same IPC channel
- Same state object
- Same configuration key

### Fix
Add review types:
1. **PARALLEL** - File-disjoint AND no declared dependencies → batch review for speed
2. **INTEGRATION** - Cross-file feature → single review session, trace end-to-end
3. **SEQUENTIAL** - File overlap or explicit blocker → one at a time

Architect marks task type at creation. Default = SEQUENTIAL (safe).

---

## Question 3: Phase 1 vs Phase 3 Split - Right?

**Verdict:** YES - Minimal start is correct

### Why Phase 1 First Works
- Process change only, no code risk
- We test self-claim concept with humans in the loop
- Easy rollback: just stop doing it
- Learn what breaks before investing in automation

### Minor Clarification Needed
Line 101 says "Add `domain` field to TaskCreate" - is this using our existing TaskCreate tool's metadata field, or proposing a schema change?

**Recommendation:** Use existing `metadata` field: `{"domain": "frontend"}`. No tool changes needed.

---

## Open Questions - My Answers

| Question | Design Says | My Verdict |
|----------|-------------|------------|
| Notify Architect on self-claim? | Recommended | **REQUIRED** - visibility is non-negotiable |
| Max parallel tasks per agent? | 1 to start | Correct |
| Wrong task claimed? | Architect reassign | Correct |

---

## Chaos Risk Assessment

**Will this reduce coordination overhead without chaos?**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race conditions | Medium | First-write-wins check |
| Wrong domain claims | Low | Strict domain matching (no null free-for-all) |
| Semantic conflicts in review | Medium | Add INTEGRATION review type |
| Lost visibility | High if no fix | REQUIRE notify on claim |
| Stale claims | Low | Timeout + reassign |

**Verdict:** With the 3 gaps fixed, this WILL reduce overhead without chaos.

---

## Required Changes Before Approval

1. **Add race condition handling** (first-write-wins)
2. **Change null domain rule** (Architect routes, not free-for-all)
3. **Add INTEGRATION review type** (for cross-file features)
4. **Make notify-on-claim REQUIRED** (not just recommended)
5. **Add stale claim timeout** (30 min → Architect can reassign)

---

## Approval Status

### Initial Review (Session 53)
```
CONDITIONAL APPROVAL - 5 fixes required
```

### Final Review (Session 53)
```
FULL APPROVAL

Known risks: None identified after fixes
Unverified: Runtime behavior (will validate during Phase 1)
Confidence: HIGH
Verified:
  - Race condition handling (first-write-wins, lines 71-77)
  - Null domain routing (Architect assigns, lines 57/63/69)
  - Review types (PARALLEL/INTEGRATION/SEQUENTIAL, lines 87-107)
  - Notify on claim (REQUIRED, lines 79/176)
  - Stale claim timeout (30 min, lines 81-85/180)
  - Metadata field usage (no tool changes, line 124)
```

**Phase 1 APPROVED to proceed.**

---
