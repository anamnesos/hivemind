# SDK Renderer Audit

**Reviewer:** Claude (Reviewer Instance)
**Date:** 2026-01-26
**Status:** ✅ FIXED - All 5 message types now handled

---

## Audit Method

Cross-referenced all `_emit()` calls in `hivemind-sdk-v2.py` against handlers in `sdk-renderer.js formatMessage()`.

---

## Message Type Coverage

| Python emits | sdk-renderer.js | Status |
|--------------|-----------------|--------|
| `status` | Line 249-258 | ✅ OK |
| `error` | Line 227-232 | ✅ OK |
| `result` | Line 276-285 | ✅ OK |
| `assistant` | Line 150-183 | ✅ OK |
| `system` | Line 266-273 | ✅ OK |
| `user` | Line 237-246 | ✅ OK |
| `unknown` | Line 261-263 | ✅ OK |
| `all_stopped` | sdk-bridge.js (my fix) | ✅ OK |
| `message_received` | sdk-bridge.js (my fix) | ✅ OK |
| **`warning`** | Falls to default | ❌ RAW JSON |
| **`agent_started`** | Falls to default | ❌ RAW JSON |
| **`interrupted`** | Falls to default | ❌ RAW JSON |
| **`ready`** | Falls to default | ❌ RAW JSON |
| **`sessions`** | Falls to default | ❌ RAW JSON |

---

## Issue 1: `warning` type (medium severity)

**Source:** Python lines 134, 386, 476
```python
self._emit("warning", {"message": "Role directory not found..."})
```

**Impact:** User sees raw JSON when:
- Role-specific directory missing
- Agent already running for pane
- Session file load fails

**Fix:** Add handler in sdk-renderer.js:
```javascript
if (message.type === 'warning') {
  return `<div class="sdk-warning">⚠️ ${escapeHtml(message.message)}</div>`;
}
```

---

## Issue 2: `agent_started` type (low severity)

**Source:** Python line 364
```python
self._emit("agent_started", {"pane_id": pane_id, "role": role, ...})
```

**Impact:** User sees raw JSON when agent connects.

**Fix:** Add handler:
```javascript
if (message.type === 'agent_started') {
  return `<div class="sdk-system">🚀 ${escapeHtml(message.role || 'Agent')} connected</div>`;
}
```

---

## Issue 3: `interrupted` type (medium severity)

**Source:** Python line 431
```python
self._emit("interrupted", {"pane_id": pane_id, "role": agent.config.role})
```

**Impact:** User sees raw JSON when sending Ctrl+C interrupt.

**Fix:** Add handler:
```javascript
if (message.type === 'interrupted') {
  return `<div class="sdk-status">⏹️ ${escapeHtml(message.role || 'Agent')} interrupted</div>`;
}
```

---

## Issue 4: `ready` type (low severity)

**Source:** Python line 543
```python
manager._emit("ready", {"agents": list(manager.agents.keys())})
```

**Impact:** User sees raw JSON on startup.

**Recommendation:** Handle in sdk-bridge.js (internal event), not renderer.

---

## Issue 5: `sessions` type (low severity)

**Source:** Python line 596
```python
manager._emit("sessions", {"sessions": sessions})
```

**Impact:** User sees raw JSON when requesting session list.

**Recommendation:** Handle in sdk-bridge.js (response to command), not renderer.

---

## Other Observations

1. **Content array handling is correct** (line 154-178) - handles text, thinking, tool_use, tool_result
2. **XSS protection present** - escapeHtml() used consistently
3. **Fallback for unknown blocks** (line 177) shows JSON but this is acceptable for truly unknown types

---

## Recommendation

**Quick fix (Issues 1-3):** Add 3 handlers to sdk-renderer.js formatMessage(), ~15 lines of code.

**Alternative:** Handle `ready` and `sessions` in sdk-bridge.js since they're internal events, not user-facing messages. Similar to my `message_received` and `all_stopped` fixes.

---

## Verdict

**The renderer handles the main message flow correctly**, but 5 edge cases will show raw JSON.

Priority: Fix `warning` and `interrupted` - users will see these during normal operation.

Low priority: `agent_started`, `ready`, `sessions` - startup/debug events.

---

## Fixes Applied (2026-01-26)

**sdk-renderer.js** (lines 287-299):
- Added `warning` handler - shows yellow warning icon
- Added `interrupted` handler - shows stop icon with role
- Added `agent_started` handler - shows rocket icon with role

**sdk-bridge.js** (lines 576-587):
- Added `ready` handler - logs and emits 'python-ready' event
- Added `sessions` handler - logs and emits 'sessions-list' event

All 5 unhandled types now properly handled. No raw JSON will leak to users.

---

**Signed:** Reviewer Instance
**Date:** 2026-01-26
