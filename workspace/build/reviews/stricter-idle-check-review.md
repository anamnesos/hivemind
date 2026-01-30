# Review: Stricter Idle Check for Force-Inject

**Date:** Jan 28, 2026 (Session 27)
**Reviewer:** Reviewer
**Author:** Implementer A
**File:** `ui/modules/terminal.js`
**Status:** APPROVED

---

## Summary of Changes

1. **Line 75:** Added `ABSOLUTE_MAX_WAIT_MS = 60000` - 60s emergency fallback constant
2. **Lines 245-251:** `isIdleForForceInject()` - 500ms idle check function
3. **Lines 391-422:** Updated `processQueue()` with emergency inject path at 60s
4. **Lines 301-375:** Rewrote `verifyAndRetryEnter()` to check output activity instead of textarea.value

---

## Problem Being Solved

The previous `verifyAndRetryEnter()` checked if `textarea.value` was empty after Enter. However, since text is injected via PTY write (not DOM), `textarea.value` is always empty = false positive every time. The verification was useless.

---

## Solution Analysis

### verifyAndRetryEnter Rewrite (Lines 301-375)

**Before:** Check `textarea.value.trim().length === 0` (always true = false positive)

**After:** Check if `lastOutputTime[paneId]` changed after Enter

**Assessment:** CORRECT FIX
- Output activity is a reasonable proxy for "Claude processed input"
- `lastOutputTime` is per-pane so no cross-pane interference
- 100ms delay before check (`ENTER_VERIFY_DELAY_MS`) gives time for response to start
- Retry logic with idle wait is preserved

### 60s Emergency Fallback (Lines 404-406, 418-419)

```javascript
const mustForceInject = hitAbsoluteMax && !userIsTyping();
```

**Assessment:** GOOD ADDITION
- Addresses "pane never becomes idle" edge case
- Clear warning log when triggered
- Still respects user typing guard
- 60s is long enough this should be rare

---

## Concerns Addressed

| Concern | Status |
|---------|--------|
| How idle is determined | ✅ Clear: lastOutputTime + threshold constants |
| What if pane not idle | ✅ Queue → force at 10s → emergency at 60s |
| What if never idle | ✅ 60s emergency with warning |
| New race conditions | ⚠️ Minor edge case (see below) |

---

## Remaining Edge Case (LOW severity)

**Scenario:**
1. Force-inject at 10s after 500ms idle
2. Claude was paused mid-output, we inject
3. Claude resumes previous output (not processing our new input)
4. verifyAndRetryEnter sees output = false positive "success"

**Mitigation:** The comment at lines 309-310 correctly acknowledges this is "secondary" defense. The primary defense (stricter idle check in processQueue) should prevent most cases.

**Verdict:** Acceptable - significantly better than previous always-false-positive.

---

## Clarification (Resolved)

**Original code (the bug):**
```javascript
if ((isIdle && !userIsTyping) || waitedTooLong)
//                            ^^-- || = standalone bypass after 10s
```

**Fixed code:**
```javascript
const canForceInject = waitedTooLong && isIdleForForceInject(paneId) && !userIsTyping();
//                                   ^^-- && = now requires 500ms idle
```

The `||` to `&&` change is the critical fix. After 10s, force-inject no longer bypasses idle check entirely - it now requires at least 500ms of silence.

Reviewer initially misread because the reviewed code already had the fix applied.

---

## Decision

**APPROVED** - Ready for restart testing.

The fix correctly addresses the root cause (standalone 10s bypass) while the 60s emergency fallback handles the "never idle" edge case.
