# SDK Mode Initialization Fix - BRUTAL REVIEW

**Reviewer:** Claude (Reviewer Instance)
**Date:** 2026-01-26
**Status:** ⚠️ APPROVED WITH CONCERNS

---

## Files Reviewed

1. `ui/main.js` (line ~344-348) - daemon-connected event with sdkMode
2. `ui/modules/daemon-handlers.js` (line ~113-130) - Skip PTY when SDK mode
3. `ui/renderer.js` (line ~36-77) - markSettingsLoaded, markTerminalsReady
4. `ui/modules/sdk-renderer.js` - initSDKPane, initAllSDKPanes
5. `ui/modules/sdk-bridge.js` - startSessions, routeMessage, message protocol
6. `ui/modules/ipc-handlers.js` (line ~3666-3678) - sdk-start-sessions handler

---

## TIMING ANALYSIS - The Critical Question

**Question:** Does sdkMode reach daemon-handlers BEFORE daemon-connected fires?

### Execution Timeline (Verified)

```
MAIN PROCESS:
1. app.whenReady()
2. loadSettings()         ← SYNC - settings loaded immediately
3. createWindow()         ← Window + modules init
4. triggers.setSDKMode(currentSettings.sdkMode)  ← main.js knows SDK mode
5. [window loads HTML]
6. did-finish-load fires
7. initDaemonClient() called
8. daemonClient.on('connected') set up with callback
9. daemonClient.connect()
10. [daemon connects]
11. Event callback fires:
    mainWindow.webContents.send('daemon-connected', {
      terminals,
      sdkMode: currentSettings.sdkMode  ← LINE 347 - CARRIES FLAG
    })

RENDERER PROCESS:
1. DOMContentLoaded
2. daemonHandlers.setupDaemonListeners(...) ← Listener ready
3. settings.setupSettings() ← Async load starts
4. [receives daemon-connected]
5. Handler checks: if (sdkMode || sdkModeEnabled)  ← LINE 121
6. sdkMode is true (from main.js) → Skip PTY creation
7. Call markTerminalsReady(true)
8. sdkRenderer.initAllSDKPanes()
9. ipcRenderer.invoke('sdk-start-sessions')
```

**VERDICT:** ✅ **Timing is correct.** The sdkMode flag travels FROM main.js IN the daemon-connected event, bypassing any renderer settings race condition.

---

## VERIFICATION CHECKLIST

### 1. Timing - Does sdkMode reach daemon-handlers BEFORE daemon-connected fires?
✅ **YES** - sdkMode is included IN the daemon-connected event payload (main.js:347)

### 2. Race conditions - Settings load async, daemon-connected can fire anytime
✅ **FIXED** - The fix passes sdkMode from main process (which loads settings SYNC) rather than relying on renderer's async settings load

### 3. SDK session start - Is sdk-start-sessions being called correctly?
✅ **YES** - markTerminalsReady(true) at renderer.js:58-73 calls `ipcRenderer.invoke('sdk-start-sessions')` with workspace path

### 4. Pane initialization - Does initAllSDKPanes() work when xterm hasn't been created?
✅ **YES** - sdk-renderer.js:29-67 has robust fallback logic:
- First tries `document.getElementById(`terminal-${paneId}`)`
- Falls back to `.pane-terminal` within pane
- Falls back to finding xterm container parent
- Falls back to creating new container after pane-header

### 5. Error handling - What happens if SDK sessions fail to start?
✅ **ACCEPTABLE** - renderer.js:70-73 catches errors and shows "SDK Mode - start failed"

### 6. CSS overflow - Are panes properly constrained?
✅ **YES** - index.html has:
```css
.sdk-pane { height: 100%; overflow: hidden; }
.sdk-messages { height: 100%; overflow-y: auto; }
```

---

## BUGS FOUND

### Minor Bug #1: Duplicate Line in sdk-bridge.js
**Location:** sdk-bridge.js:258-259
```js
this.active = false;
this.ready = false;
this.ready = false;  // ← DUPLICATE LINE
```
**Severity:** Low - Cosmetic, no functional impact

### Minor Bug #2: Redundant setMainWindow Call
**Locations:**
- main.js:450: `sdkBridge.setMainWindow(mainWindow)`
- ipc-handlers.js:3580: `sdkBridge.setMainWindow(mainWindow)`

**Severity:** Low - Both set same reference, harmless

---

## POTENTIAL ISSUES (Not Blocking)

### 1. No Timeout on SDK Initialization
If Python process hangs during `manager.start_all()`, user gets no timeout feedback. The "agents starting..." status would persist indefinitely.

**Recommendation:** Add 30-second timeout with fallback message.

### 2. Python Spawn Failure Path
If Python isn't installed or SDK package missing, error is logged but recovery path is unclear.

**Recommendation:** Consider fallback to PTY mode with user notification.

---

## DATA FLOW VERIFICATION

### Message Flow: User → SDK → Python → Pane

```
1. User types in broadcast input
2. sendBroadcast() checks sdkMode → ipcRenderer.invoke('sdk-broadcast')
3. ipc-handlers.js sdk-broadcast handler → sdkBridge.broadcast()
4. sdkBridge.sendToProcess() → Python stdin
5. Python routes to agent, emits response
6. Node stdout handler → handlePythonMessage() → routeMessage()
7. routeMessage() → sendToRenderer('sdk-message', { paneId, message })
8. renderer.js sdk-message handler → sdkRenderer.appendMessage()
9. Message appears in SDK pane container
```

✅ **Flow verified - no gaps found**

### Protocol Compatibility Check
- sdk-bridge.js uses `pane_id` (snake_case) for Python commands ✅
- routeMessage() checks BOTH `pane_id` and `paneId` ✅
- routeMessage() checks BOTH `session_id` and `sessionId` ✅

---

## VERDICT

### ✅ APPROVED FOR TESTING

The SDK mode initialization fix correctly addresses the race condition by:

1. **Including sdkMode in daemon-connected event** - Main process sends authoritative flag
2. **Checking event flag first** - `if (sdkMode || sdkModeEnabled)` catches the flag even if renderer settings not loaded
3. **Proper SDK pane initialization** - Falls back gracefully when xterm not created
4. **Correct session startup** - IPC handlers exist and are wired correctly

### Remaining Risk

**MEDIUM RISK:** If user's previous session had SDK mode OFF, and they enable it in settings, then restart - this SHOULD work because:
1. Settings file now has `sdkMode: true`
2. Main process loads it SYNC
3. daemon-connected carries `sdkMode: true`
4. Renderer skips PTY creation

But if settings file is corrupted or missing, defaults to `sdkMode: false` (DEFAULT_SETTINGS line 60).

---

## RECOMMENDED TEST SEQUENCE

1. Enable SDK mode in settings
2. Restart app
3. Verify: No xterm terminals visible
4. Verify: SDK pane containers visible with SDK status indicators
5. Verify: Console shows `[Daemon] SDK mode enabled - skipping PTY terminal creation`
6. Verify: Console shows `[Init] SDK sessions started` (after Python starts)
7. Send broadcast message - verify routing to panes
8. Check for any raw JSON output (should NOT appear)

---

**Signed:** Reviewer Instance
**Review completed:** 2026-01-26
