# Review: Terminal Recovery Extraction

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** terminal.js, terminal/recovery.js (NEW)
**Status:** APPROVED

---

## Summary

Extracted ~300 lines of recovery logic (unstick, restart, nudge, sweeper) into dedicated module using factory pattern with getter-based circular dependency resolution.

## Architecture

### New Module: `terminal/recovery.js`

```javascript
function createRecoveryController(options = {}) {
  const { terminals, getInjectionHelpers, ... } = options;
  // Recovery functions defined here
  return { nudgePane, restartPane, sweepStuckMessages, ... };
}
```

### Circular Dependency Resolution

The injection and recovery modules have mutual dependencies:
- `injectionController` needs `markPotentiallyStuck` from recovery
- `recoveryController` needs `focusWithRetry`, `sendEnterToPane` from injection

**Solution: Getter pattern**

```javascript
// Line 304: Declare first
let injectionController = null;

// Lines 305-318: Create recovery with getter
const recoveryController = createRecoveryController({
  getInjectionHelpers: () => injectionController,  // Deferred resolution
  ...
});

// Lines 320-352: Create injection with direct reference
injectionController = createInjectionController({
  markPotentiallyStuck: recoveryController.markPotentiallyStuck,  // Already exists
  ...
});
```

At runtime, when `sweepStuckMessages()` calls `getInjectionHelpers()`, both controllers are initialized.

## Functions Extracted (14 total)

| Category | Functions |
|----------|-----------|
| Stuck tracking | `markPotentiallyStuck`, `clearStuckStatus` |
| Sweeper | `sweepStuckMessages`, `startStuckMessageSweeper`, `stopStuckMessageSweeper` |
| Escalation state | `getUnstickState`, `resetUnstickState` |
| Recovery actions | `interruptPane`, `restartPane` |
| Escalation | `unstickEscalation` |
| Nudge | `nudgePane`, `nudgeAllPanes` |
| Aggressive | `sendUnstick`, `aggressiveNudge`, `aggressiveNudgeAll` |

## Dependencies Passed (12 total)

| Dependency | Type | Purpose |
|------------|------|---------|
| `PANE_IDS` | Array | Pane iteration |
| `terminals` | Map | Terminal instances |
| `lastOutputTime` | Object | Activity tracking |
| `lastTypedTime` | Object | Typing tracking |
| `isCodexPane` | Function | Codex detection |
| `updatePaneStatus` | Function | Status updates |
| `updateConnectionStatus` | Function | Connection status |
| `getSdkModeActive` | Getter | SDK mode check |
| `getInjectionInFlight` | Getter | Lock check |
| `userIsTyping` | Function | Typing check |
| `getInjectionHelpers` | Getter | Circular dep resolution |
| `spawnClaude` | Function | Respawn |

## Internal State

```javascript
const unstickState = new Map();           // Escalation tracking
const potentiallyStuckPanes = new Map();  // Stuck pane tracking
let sweeperIntervalId = null;             // Interval ID
```

Properly encapsulated within the controller.

## Verification Checklist

- [x] Factory pattern with dependency injection
- [x] Circular dependency resolved via getter pattern
- [x] All 14 functions extracted correctly
- [x] Internal state encapsulated (Maps, interval ID)
- [x] Destructuring in terminal.js (lines 354-368)
- [x] Exports unchanged in module.exports
- [x] No duplicate function definitions
- [x] SDK mode guards preserved (interruptPane, restartPane)
- [x] Codex vs Claude handling preserved (aggressiveNudge)

## Verdict

**APPROVED** - Clean extraction with smart circular dependency resolution via getter pattern. No behavior change, same API surface.
