# Task #6 Stuck Message Sweeper Review

**Reviewer:** Reviewer
**Date:** Session 33
**Status:** APPROVED WITH CAVEATS

## Summary

Safety net mechanism that periodically retries Enter on Claude panes where `verifyAndRetryEnter` exhausted its retries but message may still be stuck in the textarea.

## Files Reviewed

- `ui/modules/terminal.js` (lines 57-65, 264-367, 578, 693-698, 790-795, 950-956)

## Implementation Details

### State Tracking (lines 59-65)
```javascript
const potentiallyStuckPanes = new Map(); // paneId -> { timestamp, retryCount }
const SWEEPER_INTERVAL_MS = 30000;       // 30 seconds
const SWEEPER_MAX_AGE_MS = 300000;       // 5 minutes
const SWEEPER_IDLE_THRESHOLD_MS = 10000; // 10 seconds
```

### Entry Points
- **Mark as stuck:** Called at line 955 when `verifyAndRetryEnter` returns false
- **Clear stuck status:** Called in `onData` callbacks at lines 698 and 795 (any output clears status)
- **Sweeper start:** Called at line 578 in `initTerminals()`

### Sweeper Logic (lines 297-347)
1. Guards: Skip if `injectionInFlight` or `userIsTyping()`
2. For each stuck pane:
   - Give up if age > 5 minutes
   - Skip if pane not idle for 10+ seconds
   - Focus textarea with retry
   - Send `sendTrustedEnter()` for recovery
3. Clean up expired entries

## Strengths

1. **Conservative design:** 30s interval prevents spam, 10s idle check avoids interrupting active output
2. **Non-intrusive:** Respects injection mutex and user typing
3. **Self-limiting:** 5 minute max prevents infinite retries
4. **Claude-only:** `markPotentiallyStuck` skips Codex panes (line 271)

## Caveats

1. **False positive clearing:** `clearStuckStatus` is called on ANY output. If pane produces unrelated continuation output, stuck status clears but message remains stuck.

2. **No verification after recovery:** After `sendTrustedEnter()`, code assumes success if output eventually occurs. Same false-positive risk as main `verifyAndRetryEnter`.

3. **Focus failure handling:** If `focusWithRetry` fails, logs warning but doesn't try alternative approach.

These caveats are inherent to the fundamental "cannot reliably detect Enter success" problem identified in the CRITICAL blocker. The sweeper mitigates symptoms without addressing root cause.

## Verdict

**APPROVED** - This is a reasonable safety net that reduces the impact of stuck messages while the root cause (Enter detection reliability) is investigated. The conservative timing and guards prevent aggressive behavior.

## Recommendations for Future

1. Consider adding prompt-ready detection to confirm actual submission success
2. Add metric tracking for sweeper effectiveness (recovery attempts vs. successes)
3. Document in user-facing logs that recovery Enter was attempted
