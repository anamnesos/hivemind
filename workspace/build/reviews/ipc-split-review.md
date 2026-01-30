# Review: IPC Split (handler-registry + background-processes)

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** ipc/handler-registry.js (NEW), ipc/background-processes.js (NEW), ipc-handlers.js
**Status:** APPROVED (with note)

---

## Summary

Extracted handler registration manifest and background process controller from ipc-handlers.js.

## handler-registry.js

### Structure
```javascript
// 36 handler imports
const { registerSdkHandlers } = require('./sdk-handlers');
// ... 35 more

const DEFAULT_HANDLERS = [
  registerSdkHandlers,
  // ... all 36 handlers
];

function registerAllHandlers(registry, handlers = DEFAULT_HANDLERS) {
  // Validates registry has register() method
  // Iterates and registers each handler
}
```

### Analysis
- Clean manifest pattern - one place to see all handlers
- Validation: throws if registry missing `register()`
- Extensible: accepts custom handlers array
- Adding new handlers = add import + add to array

## background-processes.js

### Structure
```javascript
function createBackgroundProcessController(ctx) {
  return {
    broadcastProcessList,   // Send process list to renderer
    getBackgroundProcesses, // Return processes Map
    cleanupProcesses,       // Kill all on shutdown
  };
}
```

### Analysis
- Factory pattern with context injection
- Platform-aware cleanup (taskkill on Windows, SIGTERM on Unix)
- Properly handles destroyed window check

## Integration (ipc-handlers.js)

```javascript
// Lines 11-12: Imports
const { registerAllHandlers } = require('./ipc/handler-registry');
const { createBackgroundProcessController } = require('./ipc/background-processes');

// Line 31: Register all handlers
registerAllHandlers(registry);

// Lines 54-57: Create controller and destructure
const backgroundController = createBackgroundProcessController(ctx);
const broadcastProcessList = backgroundController.broadcastProcessList;
const getBackgroundProcesses = backgroundController.getBackgroundProcesses;
const cleanupProcesses = backgroundController.cleanupProcesses;
```

## Issue Found: Duplicate broadcastProcessList

**Location:** `process-handlers.js:12-26` has its own `broadcastProcessList()` identical to `background-processes.js:6-20`

**Impact:** Low - both versions work, but it's code duplication

**Recommendation:** Either:
1. Remove duplicate from `process-handlers.js` and inject from `backgroundController`, OR
2. Remove from `background-processes.js` if process-handlers.js is the intended owner

This is a cleanup follow-up, not a blocker.

## Verification Checklist

- [x] handler-registry.js imports all 36 handlers
- [x] DEFAULT_HANDLERS array complete
- [x] registerAllHandlers validates registry
- [x] background-processes.js factory pattern
- [x] Platform-aware cleanup (Windows/Unix)
- [x] Integration in ipc-handlers.js correct
- [ ] Duplicate broadcastProcessList needs cleanup (follow-up)

## Verdict

**APPROVED** - Clean extraction, proper integration. Minor duplicate to clean up as follow-up.
