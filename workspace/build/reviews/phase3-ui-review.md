# Smart Parallelism Phase 3 UI Review

**Reviewer:** Reviewer
**Date:** Session 53
**Type:** INTEGRATION (cross-file feature)
**Status:** BLOCKED - 3 bugs must be fixed

---

## Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| ui/index.html | 287-409 | ✅ OK |
| ui/styles/layout.css | 465-518 | ✅ OK |
| ui/renderer.js | 318-365, 374-427, 1089-1139, 1715-1736 | ✅ OK |
| ui/modules/ipc/task-pool-handlers.js | 1-128 | ❌ 3 BUGS |
| ui/modules/ipc/handler-registry.js | 50, 102 | ✅ OK |

---

## Integration Verification

| Check | Status | Notes |
|-------|--------|-------|
| PANE_DOMAIN_MAP matches design | ✅ | Lines 322-329 match design doc lines 46-52 |
| IPC channels match | ✅ | `claim-task`, `get-task-list`, `task-list-updated` |
| Handler registration | ✅ | Import line 50, DEFAULT_HANDLERS line 102 |
| DOM elements exist | ✅ | `idle-{1-6}`, `.claim-btn[data-pane-id="N"]` |
| CSS visibility toggle | ✅ | `.visible` class shows elements |
| Idle threshold | ✅ | 30s (IDLE_CLAIM_THRESHOLD_MS, line 319) |
| First-write-wins | ✅ | JS single-threaded IPC handles this |

---

## BUGS FOUND (3)

### BUG 1: Null domain tasks claimable (CRITICAL)

**Design requirement (lines 63, 69):**
> "domain is null (requires Architect routing)"
> "Null domain = Architect must assign explicitly. No free-for-all."

**Code (task-pool-handlers.js:91-94):**
```javascript
if (task.metadata?.domain && task.metadata.domain !== domain) {
  return { success: false, error: 'Domain mismatch' };
}
```

**Problem:** Only checks when `task.metadata?.domain` EXISTS. Tasks with null/undefined domain pass through silently and can be claimed by anyone.

**Fix:**
```javascript
// Reject tasks with no domain (require Architect routing)
if (!task.metadata?.domain) {
  return { success: false, error: 'Task has no domain - requires Architect routing' };
}
// Then check domain match
if (task.metadata.domain !== domain) {
  return { success: false, error: 'Domain mismatch' };
}
```

---

### BUG 2: blockedBy not verified in IPC handler (MEDIUM)

**Design requirement (line 58):**
> "blockedBy is empty (all dependencies resolved)"

**Renderer check (line 346):** ✅ Correctly filters in `hasClaimableTasks()`
```javascript
(!task.blockedBy || task.blockedBy.length === 0)
```

**IPC handler check:** ❌ MISSING - claim-task handler doesn't verify blockedBy

**Problem:** A direct IPC call (malformed request, DevTools, or bypassing UI) could claim tasks that have unresolved blockers.

**Fix (task-pool-handlers.js, after line 94):**
```javascript
// Verify no blockers
if (task.blockedBy && task.blockedBy.length > 0) {
  return { success: false, error: 'Task has unresolved blockers' };
}
```

---

### BUG 3: Architect notification missing (MEDIUM)

**Design requirement (line 79):**
> "Notify on claim is REQUIRED: Agent must message Architect via trigger when claiming."

**Current flow:**
1. Button clicked → claim-task IPC
2. Backend updates task, saves, broadcasts
3. Returns success
4. Renderer sends terminal message to agent

**Missing:** No trigger file write to `workspace/triggers/architect.txt`

**Fix (task-pool-handlers.js, after line 105):**
```javascript
// Notify Architect of claim (REQUIRED per design)
const PANE_ROLES = { '1': 'ARCHITECT', '2': 'INFRA', '3': 'FRONTEND', '4': 'BACKEND', '5': 'ANALYST', '6': 'REVIEWER' };
const role = PANE_ROLES[paneId] || 'UNKNOWN';
const triggerPath = path.join(workspacePath, 'triggers', 'architect.txt');
try {
  fs.writeFileSync(triggerPath, `(${role}): Claimed task #${taskId}: ${task.subject}\n`);
} catch (err) {
  log.warn('TaskPool', 'Failed to notify Architect:', err.message);
}
```

---

## What's Correct

1. **HTML structure** - Clean, consistent across all 6 panes
2. **CSS** - Proper visibility toggles, nice animations
3. **Domain mapping** - Exact match to design doc
4. **Idle detection** - 30s threshold + claimable tasks = show indicator
5. **IPC flow** - Channels match, registration correct
6. **Race protection** - JS single-threaded nature provides atomicity

---

## Approval Status

### Initial Review (Session 53)
```
BLOCKED - 3 bugs must be fixed
```

### Re-Review (Session 53)
```
FULL APPROVAL

Known risks: None identified after fixes
Unverified: Runtime behavior (needs manual test)
Confidence: HIGH
Verified:
  - Null domain rejection (lines 91-94) ✅
  - blockedBy check (lines 101-104) ✅
  - Architect notification (lines 117-131) ✅
  - #AUTO sequence tag for automated claims
  - Error handling on notify (warn, don't fail claim)
```

**All 3 fixes verified. APPROVED for testing.**

---
