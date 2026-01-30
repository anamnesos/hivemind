# Codex Activity Indicator Review

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** `codex-exec.js`, `daemon-client.js`, `main.js`, `renderer.js`, `layout.css`
**Status:** APPROVED

---

## Summary

Implements Claude TUI-style activity indicator for Codex panes with:
- Glyph spinner (◐◓◑◒) with 150ms cycle
- State-specific colors (thinking=cyan, tool=purple, command=yellow, file=blue, streaming=cyan, done=green)
- Breathing opacity animation (2s, 1→0.5→1)
- Reduced motion support

---

## IPC Flow Traced

```
codex-exec.js (emitActivity)
    → broadcast({ event: 'codex-activity', paneId, state, detail })
        → daemon-client.js (case 'codex-activity')
            → this.emit('codex-activity', paneId, state, detail)
                → main.js (daemonClient.on('codex-activity'))
                    → webContents.send('codex-activity', { paneId, state, detail })
                        → renderer.js (ipcRenderer.on('codex-activity'))
                            → UI update
```

**Verdict:** Complete end-to-end flow. No gaps.

---

## File-by-File Review

### codex-exec.js

**emitActivity() function (lines 74-76):**
```javascript
function emitActivity(paneId, state, detail = '') {
  broadcast({ event: 'codex-activity', paneId, state, detail });
}
```

**Call sites:**
| Line | State | Trigger |
|------|-------|---------|
| 68 | 'done' | Completion (exit code in detail) |
| 69 | 'ready' | 2s after done |
| 324 | 'thinking' | Start events |
| 353 | 'file' | [FILE] tag parsed |
| 356 | 'command' | [CMD] tag parsed |
| 359 | 'tool' | [TOOL] tag parsed |
| 379 | 'streaming' | Text deltas |

**Verdict:** All activity states covered. Detail extraction uses regex on aux lines.

### daemon-client.js (lines 230-231)

```javascript
case 'codex-activity':
  this.emit('codex-activity', msg.paneId, msg.state, msg.detail);
  break;
```

**Verdict:** Correct forwarding.

### main.js (lines 585-589)

```javascript
daemonClient.on('codex-activity', (paneId, state, detail) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('codex-activity', { paneId, state, detail });
  }
});
```

**Verdict:** Correct. Guards against destroyed window.

### renderer.js (lines 1351-1434)

**Key elements:**
- `CODEX_ACTIVITY_LABELS` mapping for display text
- `SPINNER_GLYPHS = ['◐', '◓', '◑', '◒']` - 4 glyphs, 150ms cycle
- `startSpinnerCycle/stopSpinnerCycle` with proper cleanup
- `spinnerTimers` Map for interval tracking
- Reduced motion check (line 1372): shows static '●' dot
- Detail truncation to 30 chars, full detail in tooltip (line 1414)

**Class management (line 1422):**
- Removes all previous states before adding new one
- 'ready' → adds 'idle', stops spinner
- 'done' → adds 'activity-done', stops spinner
- Others → adds 'working' + `activity-${state}`, starts spinner

**Verdict:** Clean implementation. Memory leak prevention via spinnerTimers.delete().

### layout.css (lines 322-359)

**Activity colors:**
| State | Color | Hex |
|-------|-------|-----|
| thinking | Cyan | #4ecca3 |
| tool | Purple | #bb86fc |
| command | Yellow | #ffc857 |
| file | Blue | #64b5f6 |
| streaming | Cyan | #4ecca3 |
| done | Green | #81c784 |

**Spinner styling:**
- `.pane-spinner` hidden by default, shown for working/activity states
- `animation: breathe 2s ease-in-out infinite`
- `@keyframes breathe` - opacity 1→0.5→1

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .pane-spinner {
    animation: none;
    opacity: 1;
  }
}
```

**Verdict:** Colors distinct. Breathing animation subtle. Reduced motion properly disables animation.

---

## Edge Cases Checked

1. **Missing statusEl?** Handled: `if (!statusEl) return;` (line 1398)
2. **Multiple rapid state changes?** Handled: clearInterval before starting new (line 1368-1370)
3. **Window destroyed?** Handled: `!mainWindow.isDestroyed()` guard (line 586)
4. **Long detail text?** Handled: truncated to 30 chars, full in tooltip (lines 1410-1414)

---

## Minor Observations (Non-Blocking)

1. **150ms spinner cycle** - Fast but matches Claude TUI feel. OK.
2. **2s delay before 'ready'** - Gives time to see 'done' state. Good UX.
3. **Streaming state same color as thinking** - Intentional (both are "working"). OK.

---

## Approval

**APPROVED** - Ready for runtime testing.

**Test checklist:**
1. Restart app
2. Send prompt to Codex exec pane (2, 4, or 5)
3. Verify glyph spinner cycles (◐◓◑◒)
4. Verify states: Thinking → Tool/Command/File → Streaming → Done → Ready
5. Verify colors match state
6. Verify breathing animation on spinner
7. Test with prefers-reduced-motion (should show static ● dot)

---

## Addendum: Clobbering Fix Review (Session 46)

**Requested by:** Implementer A
**File:** `ui/modules/daemon-handlers.js` lines 982-1006
**Date:** 2026-01-30

### The Problem

`claude-state-changed` events could clobber the Codex activity indicator by overwriting the status element with generic "Agent running" text.

### The Fix

```javascript
// Lines 982-1006 in updateAgentStatus()
const hasActiveActivity = Array.from(statusEl.classList).some(c => c.startsWith('activity-'));
const spinnerEl = statusEl.querySelector('.pane-spinner');

if (hasActiveActivity && spinnerEl) {
  // Only update badge, skip status text/class changes
} else {
  // ... normal status update
}
```

### Analysis

1. **Detection logic (line 983):** Checks for `activity-*` classes set by codex-activity handler. This correctly identifies when Codex activity is showing.

2. **Double guard (line 987):** Requires BOTH `hasActiveActivity` AND `spinnerEl`. This is correct - both conditions indicate active Codex activity indicator.

3. **Skip block (lines 987-988):** Empty block intentionally falls through to badge update only. This preserves the activity indicator while still updating the badge (lines 1009-1020).

4. **Spinner preservation (lines 996-1000):** Even outside the guard, if a spinner exists, it's preserved via appendChild. This is a secondary safeguard.

5. **Class removal scope (line 1004):** Only removes `idle`, `starting`, `running` - does NOT remove `activity-*` classes. Correct.

### Edge Case: First claude-state-changed Before codex-activity

If `claude-state-changed` fires before the first `codex-activity`:
- `hasActiveActivity` = false (no activity-* class yet)
- Guard doesn't trigger
- Status shows "Agent running"
- When codex-activity fires later, it overwrites with activity state

**Verdict:** Acceptable behavior. The activity indicator will take over once Codex activity starts.

### Verdict

**APPROVED** - Clobbering fix correctly implemented.

Needs runtime verification to confirm indicator remains visible during Codex exec runs.

---

*Review by Reviewer, Session 45 + Session 46 addendum*
