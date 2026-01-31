# PTY Enter Timing Fix Review

**Reviewer:** Reviewer
**Date:** Session 53
**Type:** PARALLEL (file-disjoint from Frontend work)
**Status:** APPROVED

---

## Files Reviewed

| File | Changes | Status |
|------|---------|--------|
| ui/modules/terminal/injection.js | BYPASS_CLEAR_DELAY_MS=75, rAF focus restore | ✅ OK |
| ui/modules/terminal/recovery.js | BYPASS_CLEAR_DELAY_MS=75 in aggressiveNudge | ✅ OK |
| ui/__tests__/injection.test.js | Updated constant | ✅ OK |

---

## Root Cause Analysis

**Race 1: Focus restoration too fast**
- `sendInputEvent` is async
- Focus was restored before Enter event processed
- Enter went to wrong element or was ignored

**Race 2: Bypass cleared too early**
- `setTimeout(0)` clears bypass flag on next tick
- `sendTrustedEnter` async might not complete by then
- Key handler sees `_hivemindBypass=false` and blocks "untrusted" Enter

---

## Fix Verification

### Fix 1: Bypass window extended (0ms → 75ms)

**injection.js (line 43, 128-131):**
```javascript
BYPASS_CLEAR_DELAY_MS = 75,
...
setTimeout(() => {
  terminal._hivemindBypass = false;
}, BYPASS_CLEAR_DELAY_MS);
```

**recovery.js (line 8, 372):**
```javascript
const BYPASS_CLEAR_DELAY_MS = 75;
...
setTimeout(() => { terminal._hivemindBypass = false; }, BYPASS_CLEAR_DELAY_MS);
```

✅ Correct - 75ms gives ample time for Enter event to be processed before bypass flag cleared.

### Fix 2: Focus restoration via requestAnimationFrame

**injection.js (lines 438-444):**
```javascript
const scheduleFocusRestore = () => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => restoreSavedFocus());
  } else {
    setTimeout(() => restoreSavedFocus(), 0);
  }
};
```

✅ Correct - Defers focus restore until after current rendering cycle, preventing race with async Enter.

### Tests Updated

**injection.test.js (line 36):**
```javascript
BYPASS_CLEAR_DELAY_MS: 75,
```

✅ Tests use matching constant value.

---

## Minor Issue (Non-blocking)

**Constant duplication:**
- `BYPASS_CLEAR_DELAY_MS = 75` defined in both injection.js and recovery.js
- If one changes without the other, behavior could diverge
- Suggest: Extract to shared constants file in future cleanup

This is technical debt, not a bug. Does not block approval.

---

## Test Results

- **2764 tests passed**
- **0 tests failed**

---

## Approval Status

```
APPROVED

Known risks: None - fix is targeted and low-risk
Unverified: Runtime behavior (needs manual PTY test)
Confidence: HIGH
Verified:
  - Bypass delay extended to 75ms in both files
  - Focus restore uses requestAnimationFrame
  - Tests updated with matching constant
  - No regression (2764 tests pass)
```

**Ready for commit after runtime verification.**

---
