# PTY Bypass Fix Review - CRITICAL ANALYSIS

**Reviewer:** Claude (Reviewer Instance)
**Date:** 2026-01-26
**Status:** ⚠️ APPROVED WITH NOTES

---

## Files Reviewed

1. `ui/modules/settings.js` - checkAutoSpawn guard, spawnAllBtn hide
2. `ui/modules/terminal.js` - sdkModeActive flag, setSDKMode(), guards on spawnClaude, initTerminals, freshStartAll
3. `ui/renderer.js` - terminal.setSDKMode(true) call in markSettingsLoaded
4. `ui/modules/ipc-handlers.js` - spawn-claude, pty-create handlers (for completeness)

---

## VERIFICATION CHECKLIST

### 1. All PTY operations now blocked in SDK mode?

| Function | Guard Added | Notes |
|----------|-------------|-------|
| `initTerminals()` | ✅ line 142-146 | `if (sdkModeActive) return` |
| `initTerminal()` | ⚠️ NO | But protected at caller level |
| `reattachTerminal()` | ⚠️ NO | But protected at caller level (daemon-handlers) |
| `spawnClaude()` | ✅ line 567-571 | `if (sdkModeActive) return` |
| `spawnAllClaude()` | ✅ (via spawnClaude) | Each call goes through guarded function |
| `freshStartAll()` | ✅ line 722-727 | `if (sdkModeActive)` with alert |
| `checkAutoSpawn()` | ✅ line 153-158 | `if (currentSettings.sdkMode) return` |

### 2. Remaining bypass paths?

**POTENTIAL RACE CONDITION:**

If user clicks "Spawn All" button before settings load completes:
1. Button still visible (applySettingsToUI hasn't hidden it)
2. `sdkModeActive` is still false (markSettingsLoaded not called yet)
3. spawnClaude() would pass the SDK check

**HOWEVER:** This is protected by accident because:
- In SDK mode, daemon-handlers uses `sdkMode` from event (main.js sync loaded)
- PTY terminals are never created
- `terminals.get(paneId)` returns undefined
- spawnClaude's `if (terminal)` check fails at line 573
- Nothing happens

**RECOMMENDATION:** Add explicit early check in spawnClaude:
```js
// At start of spawnClaude():
if (!terminals.has(paneId)) {
  console.log(`[spawnClaude] No terminal for pane ${paneId}, skipping`);
  return;
}
```

### 3. Export/import chain correct?

✅ **VERIFIED:**
- `terminal.js` exports `setSDKMode` at line 853
- `renderer.js` imports terminal module and calls `terminal.setSDKMode(true)` at line 45

### 4. Race conditions between settings load and SDK flag set?

**Timing Analysis:**

```
MAIN PROCESS (synchronous):
├─ loadSettings()           [SYNC - reads file immediately]
├─ createWindow()
└─ initDaemonClient()
   └─ on('connected') → sends 'daemon-connected' with sdkMode from main

RENDERER PROCESS (async):
├─ DOMContentLoaded
├─ settings.setupSettings() → loadSettings() [ASYNC IPC]
├─ daemonHandlers.setupDaemonListeners()
│
├─ [EVENT: daemon-connected with sdkMode from main] ← Uses this!
│   └─ if (sdkMode || sdkModeEnabled) → skip PTY
│
└─ [LATER: settings.loadSettings() completes]
    └─ markSettingsLoaded() → terminal.setSDKMode(true)
```

**VERDICT:** Race condition handled correctly because:
1. Main process loads settings SYNC before daemon connects
2. daemon-connected event carries authoritative `sdkMode` flag
3. Renderer uses event flag, doesn't wait for async settings load
4. `terminal.setSDKMode(true)` provides secondary protection for later operations

---

## MISSING GUARDS (Lower Priority)

### IPC Handler Level (defense in depth)

`ipc-handlers.js:spawn-claude` (line 108) does NOT check SDK mode.

**Risk:** Low - only called via `terminal.js:spawnClaude()` which has guard

**Recommendation:** Add guard for defense in depth:
```js
ipcMain.handle('spawn-claude', (event, paneId, workingDir) => {
  if (currentSettings.sdkMode) {
    console.log('[spawn-claude] SDK mode - blocking CLI spawn');
    return { success: false, error: 'SDK mode active' };
  }
  // ... rest of handler
});
```

### pty-create and pty-write

Neither has SDK mode check, but:
- `pty-create` only called from guarded paths
- `pty-write` fails silently if PTY doesn't exist

---

## UI CHANGES VERIFIED

### settings.js

✅ **checkAutoSpawn guard (lines 153-158):**
```js
if (currentSettings.sdkMode) {
  console.log('[AutoSpawn] SDK mode enabled, skipping CLI auto-spawn');
  return;
}
```

✅ **Spawn All button hidden (lines 76-80):**
```js
const spawnAllBtn = document.getElementById('spawnAllBtn');
if (spawnAllBtn) {
  spawnAllBtn.style.display = currentSettings.sdkMode ? 'none' : 'inline-block';
}
```

---

## VERDICT

### ✅ APPROVED FOR TESTING

The fixes correctly block PTY operations when SDK mode is enabled:

1. **Primary defense:** daemon-connected event carries sdkMode from main.js (sync loaded)
2. **Secondary defense:** `sdkModeActive` flag blocks later spawn operations
3. **UI defense:** Spawn All button hidden when SDK mode on
4. **Auto-spawn defense:** checkAutoSpawn() returns early if SDK mode

### Remaining Work (Non-Blocking)

1. Add explicit check in spawnClaude for missing terminal
2. Add SDK mode guard to spawn-claude IPC handler (defense in depth)

---

## TEST SEQUENCE

1. Enable SDK mode in settings
2. Restart app
3. Verify console shows:
   - `[Daemon] SDK mode enabled - skipping PTY terminal creation`
   - `[Init] SDK mode enabled in settings - notifying modules`
   - `[Terminal] SDK mode enabled - PTY spawn operations blocked`
4. Verify "Spawn All" button is hidden
5. Open dev tools, try `window.hivemind.claude.spawn('1')` - should fail (no terminal)
6. Verify NO "Claude running" badges appear

---

**Signed:** Reviewer Instance
**Review completed:** 2026-01-26
