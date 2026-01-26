# SDK V2 Phase 2 Verification

**Reviewer:** Claude-Reviewer
**Date:** 2026-01-25
**Task:** Task #8 - Verify Phase 2 Implementation
**Verdict:** ⚠️ CONDITIONAL PASS - Protocol mismatches need fixing

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `ui/main.js` | ✅ | SDK bridge init, settings handler, app close cleanup |
| `ui/modules/ipc-handlers.js` | ✅ | V2 IPC handlers complete |
| `ui/modules/triggers.js` | ✅ | SDK routing when sdkMode enabled |
| `ui/modules/sdk-bridge.js` | ⚠️ | Protocol mismatch with Python |
| `hivemind-sdk-v2.py` | ⚠️ | Protocol mismatch with bridge |

---

## Checklist Verification

### 1. SDK mode toggle in settings enables/disables SDK routing
**✅ PASS**

```javascript
// main.js:182-186
if (sdkModeChanged) {
  triggers.setSDKMode(currentSettings.sdkMode);
  console.log(`[Settings] SDK mode ${currentSettings.sdkMode ? 'ENABLED' : 'DISABLED'}`);
}
```

### 2. Broadcast input uses SDK when sdkMode=true
**✅ PASS**

```javascript
// triggers.js:342-355
if (isSDKModeEnabled()) {
  console.log(`[BROADCAST SDK] Broadcasting to all 4 panes`);
  sdkBridge.broadcast(broadcastMessage);
  // ...
  return { success: true, notified: ['1', '2', '3', '4'], mode: 'sdk' };
}
```

### 3. Trigger files route through SDK when sdkMode=true
**✅ PASS**

```javascript
// triggers.js:286-316
if (isSDKModeEnabled()) {
  console.log(`[Trigger SDK] Using SDK mode for ${targets.length} target(s)`);
  for (const paneId of targets) {
    const sent = sdkBridge.sendMessage(paneId, message);
    // ...
  }
}
```

### 4. Session IDs saved on app close
**✅ PASS**

```javascript
// main.js:534-541
const sdkBridge = getSDKBridge();
if (sdkBridge.isActive()) {
  console.log('[Cleanup] Stopping SDK sessions and saving state');
  sdkBridge.stopSessions().catch(err => {
    console.error('[Cleanup] SDK stop error:', err);
  });
}
```

### 5. Session IDs loaded on app start
**✅ PASS**

```javascript
// sdk-bridge.js:105-121
loadSessionState() {
  if (fs.existsSync(SESSION_STATE_FILE)) {
    const data = JSON.parse(fs.readFileSync(SESSION_STATE_FILE, 'utf8'));
    for (const [paneId, sessionId] of Object.entries(data)) {
      if (this.sessions[paneId]) {
        this.sessions[paneId].id = sessionId;
      }
    }
  }
}
```

### 6. Resume works across app restarts
**⚠️ NEEDS TESTING** - Code is in place, but protocol must match first.

---

## ISSUES FOUND

### Issue 1: IPC Protocol Mismatch (CRITICAL)

**sdk-bridge.js sends:**
```javascript
// Line 243-250
const command = {
  action: 'send',           // ← "action"
  paneId: normalizedPaneId, // ← camelCase
  message: message,
  sessionId: ...
};
```

**hivemind-sdk-v2.py expects:**
```python
# Line 434-440
command = cmd.get("command")  # ← "command", not "action"
if command == "send":
    pane_id = cmd.get("pane_id")  # ← snake_case
```

**Fix required:**
Either change sdk-bridge.js to use `command` and `pane_id`, OR change Python to use `action` and `paneId`.

**Recommendation:** Align to Python convention (more common in SDK code):
```javascript
// sdk-bridge.js
const command = {
  command: 'send',  // Change from 'action'
  pane_id: normalizedPaneId,  // Change from 'paneId'
  message: message,
  session_id: this.sessions[normalizedPaneId].id,
};
```

---

### Issue 2: Session File Path Inconsistency (MEDIUM)

**sdk-bridge.js:**
```javascript
const SESSION_STATE_FILE = path.join(__dirname, '..', '..', 'session-state.json');
// = D:\projects\hivemind\session-state.json (project root)
```

**hivemind-sdk-v2.py:**
```python
self.session_file = workspace / "ui" / "session-state.json"
# = D:\projects\hivemind\ui\session-state.json (ui folder)
```

**Fix required:** Align to same path. Recommend project root:
```python
# hivemind-sdk-v2.py
self.session_file = workspace / "session-state.json"
```

---

### Issue 3: Missing --ipc Flag (MEDIUM)

**sdk-bridge.js:156-168:**
```javascript
const sdkPath = path.join(__dirname, '..', '..', 'hivemind-sdk-v2.py');
const args = [sdkPath];

if (options.workspace) {
  args.push('--workspace', options.workspace);
}
// Missing: args.push('--ipc');
```

**Python behavior without --ipc:**
```python
if ipc_mode:
    await run_ipc_server(manager)  # JSON protocol
else:
    # Interactive CLI mode - WRONG for Electron integration
    print("\nHivemind SDK V2 - 4 Independent Sessions")
```

**Fix required:** Add `--ipc` to args:
```javascript
const args = [sdkPath, '--ipc'];
```

---

### Issue 4: Init-sessions Command Not Implemented (MEDIUM)

**sdk-bridge.js:310-324 sends:**
```javascript
const command = {
  action: 'init-sessions',
  workspace: options.workspace,
  sessions: { ... },
};
```

**But hivemind-sdk-v2.py only handles:**
- `send`
- `broadcast`
- `get_sessions`
- `stop`

**Fix required:** Add `init-sessions` handler to Python or remove from JS.

---

## Architecture Verification

### ClaudeSDKClient Usage - ✅ CORRECT
```python
# hivemind-sdk-v2.py:117-128
options = ClaudeAgentOptions(
    allowed_tools=self.config.allowed_tools,
    permission_mode=self.config.permission_mode,
    cwd=str(self.workspace),
    setting_sources=["project"],  # ✅ Loads CLAUDE.md
    resume=resume_session_id,     # ✅ Session resume
)
self.client = ClaudeSDKClient(options)
await self.client.connect()
```

### 4 Independent Sessions - ✅ CORRECT
```python
# hivemind-sdk-v2.py:265-274
configs = [
    AgentConfig.lead(),
    AgentConfig.worker_a(),
    AgentConfig.worker_b(),
    AgentConfig.reviewer(),
]
for config in configs:
    agent = HivemindAgent(config, self.workspace)
    self.agents[config.pane_id] = agent
```

### Session Persistence - ✅ CORRECT
```python
# hivemind-sdk-v2.py:160-167
if isinstance(msg, ResultMessage):
    self.session_id = msg.session_id  # ✅ Capture
    yield {
        "type": "result",
        "session_id": msg.session_id,
        ...
    }
```

---

## Summary

**What works:**
- SDK mode toggle propagates correctly
- Triggers route through SDK when enabled
- Broadcast uses SDK when enabled
- Session persistence code structure is correct
- ClaudeSDKClient usage matches architecture

**What needs fixing before testing:**
1. Protocol alignment (`action` vs `command`, `paneId` vs `pane_id`)
2. Session file path alignment
3. Add `--ipc` flag to Python spawn
4. Add `init-sessions` handler OR remove from JS

---

## Verdict

**⚠️ CONDITIONAL PASS**

The structure is sound and matches the V2 architecture. However, the IPC protocol mismatches will cause runtime failures. These are straightforward fixes:

**Required fixes (pick one approach):**

**Option A: Align JS to Python (recommended)**
- sdk-bridge.js: Change `action` → `command`, `paneId` → `pane_id`
- sdk-bridge.js: Add `--ipc` to spawn args
- hivemind-sdk-v2.py: Change session file path to project root

**Option B: Align Python to JS**
- hivemind-sdk-v2.py: Change `command` → `action`, `pane_id` → `paneId`
- Add `init-sessions` handler to Python
- Already has `--ipc` in Python, just need to pass it

Once protocol is aligned, this should be functional.

---

## Reply to Lead

Sending via trigger...
