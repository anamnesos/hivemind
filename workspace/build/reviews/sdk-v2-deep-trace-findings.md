# SDK V2 Deep Trace - Issues Found

**Reviewer:** Claude (Reviewer Instance)
**Date:** 2026-01-26
**Status:** ⚠️ ISSUES FOUND - Not blocking but should be fixed

---

## This Is What "Actually Reviewing" Looks Like

I traced the complete data flow: user input → renderer.js → IPC → sdk-bridge.js → Python → stdout → sdk-bridge.js → renderer → sdk-renderer.js

Found issues that my earlier "APPROVED" review missed.

---

## Issue 1: Duplicate Code in sdk-bridge.js (Lines 256-259)

**File:** `ui/modules/sdk-bridge.js`

```javascript
this.process.on('error', (err) => {
  console.error('[SDK Bridge] Process error:', err);
  this.active = false;
this.ready = false;      // BAD INDENTATION
  this.ready = false;    // DUPLICATE LINE
```

**Impact:** Harmless (just sets ready=false twice), but indicates sloppy merge/copy-paste. If this slipped through, what else did?

**Fix:** Remove duplicate line, fix indentation.

---

## Issue 2: Unhandled "message_received" Event

**Trace:**
1. User sends message to pane 1
2. Python's `send_message()` emits: `{"type": "message_received", "pane_id": "1"}`
3. sdk-bridge.js `routeMessage()` has no case for "message_received"
4. Falls through to default: `this.sendToRenderer('sdk-message', { paneId, message: msg })`
5. sdk-renderer.js tries to format it, falls through to raw JSON stringify

**Impact:** User sees raw JSON `{"type":"message_received","pane_id":"1"}` instead of meaningful feedback.

**Fix:** Add case in sdk-bridge.js:
```javascript
case 'message_received':
  // Don't send to renderer - this is just an ack
  console.log(`[SDK Bridge] Message received by pane ${paneId}`);
  break;
```

Or handle it properly in sdk-renderer.js.

---

## Issue 3: No Handler for "all_stopped" Event

**Trace:** When Python stops, it emits `{"type": "all_stopped", "sessions_saved": N}`

**In sdk-bridge.js routeMessage:** No case for "all_stopped", falls through to default.

**Impact:** User sees raw JSON in UI.

**Fix:** Add handler or suppress.

---

## Issue 4: Race Condition in Legacy start() Method

**File:** `ui/modules/sdk-bridge.js` lines 693-704

```javascript
start(prompt, options = {}) {
  if (!this.active) {
    this.startProcess(options);
  }

  // Send to Lead by default
  setTimeout(() => {
    this.sendMessage('1', prompt);
  }, 500); // Wait for process to be ready  <-- MAGIC NUMBER
}
```

**Impact:** If Python takes >500ms to initialize (which it can on cold start), the message is queued. Actually this is fine because `sendMessage` → `sendToProcess` queues if not ready.

**But:** This is still a code smell. The 500ms is arbitrary and the comment "wait for process to be ready" is wrong (it's not actually waiting for ready).

**Recommendation:** Remove the setTimeout, just call sendMessage directly (it queues properly).

---

## Issue 5: Session File Path Duplication

**File:** `ui/modules/sdk-bridge.js` line 55
```javascript
const SESSION_STATE_FILE = path.join(__dirname, '..', '..', 'session-state.json');
```

**File:** `hivemind-sdk-v2.py` line 336
```python
self.session_file = workspace / "session-state.json"
```

**Issue:** Both files define the session file path independently. If one changes, the other won't know.

**Impact:** Potential for path mismatch if someone updates one but not the other.

**Recommendation:** Define in one place (e.g., config file) or at minimum add comment in both files pointing to the other.

---

## Issue 6: Missing Integration Test for This Exact Flow

None of these issues would have been caught by just reading the code in isolation. They only appear when you trace the full flow.

**This is exactly what the proposal-automated-quality-gates.md addresses.**

---

## Verdict

The SDK code will *probably* work, but it has:
- Code quality issues (duplicate lines, magic numbers)
- Unhandled message types that will show raw JSON to users
- Configuration duplication that invites bugs

**Recommendation:**
1. Fix the duplicate line in sdk-bridge.js (5 seconds)
2. Add handlers for message_received and all_stopped (10 minutes)
3. Remove the setTimeout in legacy start() (2 minutes)
4. Add comment cross-referencing session file paths (1 minute)

---

## Lesson Learned

My earlier review said "APPROVED FOR TESTING" after checking that:
- setting_sources was present ✅
- json.dumps had default=str ✅
- routing logic looked correct ✅

I didn't trace what happens when Python emits "message_received". I trusted the happy path.

**New standard:** Trace at least one complete message through the system before approving.

---

**Signed:** Reviewer Instance
**Date:** 2026-01-26
