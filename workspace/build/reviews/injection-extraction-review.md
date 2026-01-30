# Review: Terminal Injection Extraction

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** terminal.js, terminal/injection.js (NEW)
**Status:** APPROVED

---

## Summary

Extracted ~400 lines of fragile injection logic into dedicated module using factory pattern with dependency injection.

## Architecture

### New Module: `terminal/injection.js`

```javascript
function createInjectionController(options = {}) {
  const { terminals, lastOutputTime, ... } = options;
  const { ENTER_DELAY_IDLE_MS, ... } = constants;

  // All injection functions defined here
  return { sendToPane, doSendToPane, verifyAndRetryEnter, ... };
}
```

**Benefits:**
- No hidden globals - all dependencies passed explicitly
- Testable - can mock dependencies for unit tests
- Clear module boundary - single export
- Isolated complexity - fragile logic contained

### Integration in `terminal.js`

```javascript
// Line 13: Import
const { createInjectionController } = require('./terminal/injection');

// Lines 420-452: Initialize with dependencies
const injectionController = createInjectionController({
  terminals, lastOutputTime, lastTypedTime, messageQueue,
  isCodexPane, buildCodexExecPrompt, isIdle, isIdleForForceInject,
  userIsTyping, updatePaneStatus, markPotentiallyStuck,
  getInjectionInFlight, setInjectionInFlight,
  constants: { ENTER_DELAY_IDLE_MS, ... }
});

// Lines 454-480: Wrapper functions maintain API
function sendToPane(...args) {
  return injectionController.sendToPane(...args);
}
```

**API unchanged** - all callers continue working without modification.

## Code Verification

### Functions Extracted (7 total)
| Function | Lines | Purpose |
|----------|-------|---------|
| `getAdaptiveEnterDelay` | 51-64 | Calculate Enter delay based on activity |
| `focusWithRetry` | 73-90 | Focus textarea with retries |
| `sendEnterToPane` | 98-133 | Send Enter via sendTrustedEnter |
| `isPromptReady` | 141-165 | Check terminal buffer for prompt |
| `verifyAndRetryEnter` | 180-280 | Verify Enter succeeded, retry if not |
| `processQueue` | 283-346 | Process message queue for pane |
| `doSendToPane` | 351-540 | Core injection logic |
| `sendToPane` | 543-563 | Public API, queues messages |

### Constants Passed (14 total)
All timing constants defined in terminal.js (lines 96-115) are passed to injection controller:
- `ENTER_DELAY_*` (3)
- `PANE_*_THRESHOLD_MS` (2)
- `FOCUS_RETRY_*` (2)
- `ENTER_VERIFY_*` / `MAX_ENTER_*` (3)
- `PROMPT_READY_*` / `MAX_QUEUE_*` (2)
- `EXTREME_*` / `ABSOLUTE_*` (2)

### Dependencies Passed (13 total)
All required state and helpers passed via options object:
- Data: `terminals`, `lastOutputTime`, `lastTypedTime`, `messageQueue`
- Checks: `isCodexPane`, `isIdle`, `isIdleForForceInject`, `userIsTyping`
- Helpers: `buildCodexExecPrompt`, `updatePaneStatus`, `markPotentiallyStuck`
- Lock: `getInjectionInFlight`, `setInjectionInFlight`

### Key Behaviors Preserved
- [x] Codex vs Claude path separation (line 380)
- [x] PTY write + DOM Enter hybrid (line 397-449)
- [x] Ctrl+U clear before injection (line 433)
- [x] Adaptive Enter delay (line 454)
- [x] Pre-flight idle check (line 477)
- [x] Focus verification before Enter (line 492)
- [x] Focus restore after Enter (line 508)
- [x] Safety timer with timeout handling (line 364)
- [x] verifyAndRetryEnter with output detection (line 186-230)

## File Size Impact

| File | Before | After |
|------|--------|-------|
| terminal.js | ~1990 lines | ~1530 lines |
| injection.js | N/A | 578 lines |

Net: Better organization, same total code.

## Regression Risk

**LOW** - This is a pure refactor:
- No logic changes
- Same API surface
- Wrapper functions delegate directly
- All timing constants unchanged

## Checklist

- [x] Factory pattern with dependency injection
- [x] All dependencies explicit (no hidden globals)
- [x] All constants passed correctly
- [x] Wrapper functions maintain API compatibility
- [x] Module exports correct (`createInjectionController`)
- [x] terminal.js exports unchanged (`sendToPane` still exported)
- [x] No duplicate function definitions
- [x] No circular dependencies

## Verdict

**APPROVED** - Clean extraction, good architecture, no behavior change.

Recommend runtime test to confirm injection still works (message delivery, Enter verification, queue processing).
