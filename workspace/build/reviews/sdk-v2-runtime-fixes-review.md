# SDK V2 Runtime Fixes Review

**Reviewer:** Claude (Reviewer Instance)
**Date:** 2026-01-26
**Status:** ✅ APPROVED FOR TESTING

---

## Files Reviewed

1. `hivemind-sdk-v2.py` - Role identity via setting_sources, JSON serialization fixes
2. `ui/renderer.js` - Default-to-Lead routing, /all broadcast prefix

---

## Fix #1: Role Identity via setting_sources

**File:** `hivemind-sdk-v2.py` lines 136-145

```python
options = ClaudeAgentOptions(
    ...
    cwd=str(role_specific_cwd),
    # CRITICAL: setting_sources=["project"] tells Claude to load CLAUDE.md from cwd
    setting_sources=["project"],
)
```

**Verification:**
- ✅ `setting_sources=["project"]` is present at line 142
- ✅ Role-specific cwd computed at lines 124-126: `workspace/instances/{role}/`
- ✅ Role name conversion correct: "Worker A" → "worker-a"
- ✅ Fallback to main workspace if role dir missing (lines 129-131)

**Cross-check with directory structure:**
```
workspace/instances/lead/CLAUDE.md       → Pane 1
workspace/instances/worker-a/CLAUDE.md   → Pane 2
workspace/instances/worker-b/CLAUDE.md   → Pane 3
workspace/instances/reviewer/CLAUDE.md   → Pane 4
```

**Verdict:** ✅ CORRECT - Agents will now read their role-specific CLAUDE.md

---

## Fix #2: JSON Serialization (ToolResultBlock)

**File:** `hivemind-sdk-v2.py` - Multiple locations

| Location | Code | Status |
|----------|------|--------|
| Line 287 | `_emit()`: `json.dumps(output, default=str)` | ✅ |
| Line 411 | `send_message()`: `json.dumps(response, default=str)` | ✅ |
| Line 454 | `_send_and_collect()`: `json.dumps(response, default=str)` | ✅ |
| Line 495 | Manager `_emit()`: `json.dumps({...}, default=str)` | ✅ |
| Lines 223-240 | ToolResultBlock content handling | ✅ |
| Lines 252-257 | SystemMessage data handling | ✅ |

**ToolResultBlock handling (lines 223-240):**
```python
tool_content = block.content
if not isinstance(tool_content, (str, int, float, bool, type(None))):
    if isinstance(tool_content, (list, dict)):
        try:
            json.dumps(tool_content)  # Test if serializable
        except (TypeError, ValueError):
            tool_content = str(tool_content)
    else:
        tool_content = str(tool_content)
```

**Verdict:** ✅ CORRECT - All JSON output paths use `default=str` fallback

---

## Fix #3: Default-to-Lead Routing

**File:** `ui/renderer.js` lines 297-301

```javascript
} else {
  // V2 FIX: Default to Lead only (pane 1), not broadcast to all
  // Use /all prefix to explicitly broadcast to all agents
  console.log('[SDK] Default send to Lead (pane 1)');
  ipcRenderer.invoke('sdk-send-message', '1', message);
}
```

**Verification:**
- ✅ Default path now sends to pane '1' (Lead) only
- ✅ Comment clearly explains the change
- ✅ Matches user expectation (talk to Lead, Lead delegates)

**Verdict:** ✅ CORRECT - User input goes to Lead by default

---

## Fix #4: /all Prefix for Broadcast

**File:** `ui/renderer.js` lines 282-296

```javascript
const paneMatch = message.match(/^\/([1-4]|all|lead|worker-?a|worker-?b|reviewer)\s+/i);
if (paneMatch) {
  const target = paneMatch[1].toLowerCase();
  const actualMessage = message.slice(paneMatch[0].length);
  if (target === 'all') {
    console.log('[SDK] Broadcast to ALL agents');
    ipcRenderer.invoke('sdk-broadcast', actualMessage);
  } else {
    const paneMap = { '1': '1', '2': '2', '3': '3', '4': '4', 'lead': '1', 'worker-a': '2', 'workera': '2', 'worker-b': '3', 'workerb': '3', 'reviewer': '4' };
    const paneId = paneMap[target] || '1';
    console.log(`[SDK] Targeted send to pane ${paneId}: ${actualMessage.substring(0, 30)}...`);
    ipcRenderer.invoke('sdk-send-message', paneId, actualMessage);
  }
}
```

**Verification:**
- ✅ Regex handles: /1, /2, /3, /4, /all, /lead, /worker-a, /worker-b, /reviewer
- ✅ Case-insensitive matching (`/i` flag)
- ✅ Handles both "worker-a" and "workera" variants
- ✅ Strips prefix from message before sending
- ✅ /all routes to `sdk-broadcast`, others to `sdk-send-message`

**Verdict:** ✅ CORRECT - Pane targeting syntax works as expected

---

## Integration Check

| Component | Sends | Receives | Status |
|-----------|-------|----------|--------|
| Python → JS | `json.dumps(..., default=str)` | `ipcRenderer.on('sdk-message')` | ✅ |
| JS → Python | `sdk-send-message(paneId, message)` | `command: "send"` handler | ✅ |
| JS → Python | `sdk-broadcast(message)` | `command: "broadcast"` handler | ✅ |

**Data Flow:**
1. User types "hello" → JS sends to Lead (pane 1) via sdk-send-message
2. User types "/all sync" → JS broadcasts "sync" to all via sdk-broadcast
3. User types "/3 check tests" → JS sends "check tests" to Worker B (pane 3)
4. Python returns responses with `default=str` → No serialization errors

---

## VERDICT: ✅ APPROVED FOR TESTING

All fixes are correctly implemented:

1. **Role identity** - Agents will read CLAUDE.md from `workspace/instances/{role}/`
2. **JSON serialization** - All output uses `default=str` to handle non-serializable objects
3. **Default routing** - User input goes to Lead only (not broadcast)
4. **Explicit broadcast** - Use `/all` prefix to broadcast to all agents

**Test sequence:**
1. Restart app with SDK mode enabled
2. Type a message (no prefix) - should go to Lead only
3. Type `/all sync` - should broadcast to all agents
4. Type `/3 hello` - should go to Worker B only
5. Watch for serialization errors in console (should be none)
6. Verify agents respond with role awareness ("I'm the Reviewer...")

---

**Signed:** Reviewer Instance
**Review completed:** 2026-01-26
