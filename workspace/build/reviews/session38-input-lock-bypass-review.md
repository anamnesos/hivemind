# Session 38 Review: Input Lock Bypass Fix

**Reviewer:** Reviewer
**Date:** January 30, 2026
**Priority:** CRITICAL
**Status:** APPROVED

---

## Summary

Reviewed fix for critical bug where per-pane input lock was blocking programmatic Enter events from `sendTrustedEnter()`. The fix is correct and ready for restart verification.

---

## Fix Review

### Code Changes (terminal.js)

**Both `initTerminal()` (line 806-821) and `reattachTerminal()` (line 929-944) updated with:**

```javascript
// Check if this is an Enter key (browsers use 'Enter', some use 'Return', keyCode 13)
const isEnterKey = event.key === 'Enter' || event.key === 'Return' || event.keyCode === 13;

// CRITICAL: Hivemind bypass check MUST come FIRST, before lock check
// This allows programmatic Enter from sendTrustedEnter to bypass input lock
// Note: sendInputEvent may produce isTrusted=true OR isTrusted=false depending on Electron version
if (isEnterKey && (event._hivemindBypass || terminal._hivemindBypass)) {
  log.info(`Terminal ${paneId}`, `Allowing programmatic Enter (hivemind bypass, key=${event.key}, isTrusted=${event.isTrusted})`);
  return true;
}

// Block non-trusted synthetic Enter that doesn't have bypass flag
if (isEnterKey && !event.isTrusted) {
  log.info(`Terminal ${paneId}`, `Blocked synthetic Enter (isTrusted=false, no bypass, key=${event.key})`);
  return false;
}
```

### Verification Checklist

- [x] Both `attachCustomKeyEventHandler` blocks have identical fix
- [x] `isEnterKey` helper catches all Enter variants:
  - `event.key === 'Enter'` (standard)
  - `event.key === 'Return'` (Electron/Mac)
  - `event.keyCode === 13` (fallback)
- [x] Bypass check runs BEFORE `!event.isTrusted` gate
- [x] Bypass check runs BEFORE `inputLocked` check
- [x] Enhanced logging includes `key=` and `isTrusted=` for debugging
- [x] Comments explain why order matters

### Why This Fix is Correct

**OLD flow (broken):**
1. Check `event.key === 'Enter' && !event.isTrusted` → FALSE (because trusted)
2. Check `inputLocked[paneId]` → TRUE (panes locked by default)
3. Return FALSE → **Enter blocked!**

**NEW flow (fixed):**
1. Check `isEnterKey && _hivemindBypass` → TRUE (bypass flag is set)
2. Return TRUE → **Enter allowed!**
3. (Lock check never reached for programmatic Enter)

---

## Runtime Verification Required

After restart, verify:

1. **Auto-submit works:**
   - Send message via command bar to Claude pane
   - Should see log: `Allowing programmatic Enter (hivemind bypass, key=..., isTrusted=...)`
   - Message should auto-submit

2. **Input lock still works for manual input:**
   - Try typing directly in a locked pane
   - Should be blocked (no characters appear)
   - Ctrl+L should toggle lock

3. **Focus restore works:**
   - Send message while cursor is in command bar
   - Focus should return to command bar after Enter
   - No blocking during verification loop

---

## Approval

**APPROVED for testing.** Fix is logically correct and matches both handler locations.

@James: Please restart app to verify auto-submit works.
