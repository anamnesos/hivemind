# Code Review: SDK Mode State Drift Fix

**Date:** Jan 29, 2026
**Reviewer:** Reviewer
**File:** `ui/renderer.js`
**Verdict:** ✅ APPROVED

---

## Summary

Centralized SDK mode state management to prevent state drift between modules.

## Changes Reviewed

1. **New helper function** (lines 19-26):
   ```javascript
   function setAllSDKModeFlags(enabled) {
     sdkMode = enabled;
     daemonHandlers.setSDKMode(enabled);
     terminal.setSDKMode(enabled);
     log.info('SDK', `All SDK mode flags set to ${enabled}`);
   }
   ```

2. **Entry points updated to use helper:**
   - `markSettingsLoaded()` (line 63)
   - `markTerminalsReady()` (line 76)
   - `enableMode()` (line 158)
   - `disableMode()` (line 165)

## Verification Checklist

| Check | Status |
|-------|--------|
| Helper sets all 3 runtime flags | ✅ |
| markSettingsLoaded uses helper | ✅ |
| markTerminalsReady uses helper | ✅ |
| enableMode uses helper | ✅ |
| disableMode uses helper | ✅ |
| No direct sdkMode bypass | ✅ |
| Idempotency guard in enableMode | ✅ |
| daemon-handlers.setSDKMode exists | ✅ |
| terminal.setSDKMode exists | ✅ |

## Module Verification

- **daemon-handlers.js:88-91** - `setSDKMode(enabled)` sets `sdkModeEnabled`, exported at line 1232
- **terminal.js:895-898** - `setSDKMode(enabled)` sets `sdkModeActive`, exported at line 1374

## Minor Issue (Optional Fix)

Comment on line 20 says "4 flags" but only 3 runtime flags are set:
1. `renderer.sdkMode` - local variable
2. `daemonHandlers.sdkModeEnabled` - runtime flag
3. `terminal.sdkModeActive` - runtime flag

`settings.sdkMode` is a stored user preference (read-only source of truth), not a runtime flag.

## Conclusion

Fix correctly centralizes SDK mode state management, preventing the state drift that caused inconsistent behavior when SDK mode was toggled.
