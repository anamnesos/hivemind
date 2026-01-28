# Codex Status Indicator Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-28
**Files Reviewed:**
- `ui/modules/codex-exec.js` — markers, once-flag emission, event classification
- `ui/modules/terminal.js` — status updates on invoke, data-stream marker parsing

## Verdict: APPROVED

## Changes Verified

### codex-exec.js
- **WORKING_MARKER** (`[Working...]`) and **COMPLETE_MARKER** (`[Task complete]`) at lines 28-29
- `emitMarker` with once-flag pattern (`terminal[flagKey]`) prevents duplicate markers per exec cycle (lines 31-36)
- Flags reset per invocation at lines 199-200 (`execWorkingEmitted`, `execCompleteEmitted`)
- Working emitted on `isStartEvent || isDelta` (line 127-128): covers `thread.started`, first content delta
- Complete emitted on `isCompleteEvent` (line 130-131): covers `message_completed`, `turn_completed`, `response.completed`
- Complete also emitted on process `close` (line 232): fallback for unclean exits
- Double-call safety: once-flag prevents duplicate `[Task complete]` if both complete event and close fire

### terminal.js
- Line 514: `updatePaneStatus(id, 'Working')` — immediate on codexExec invocation
- Lines 352-357, 445-449: Data stream parsing for `[Working...]` → `'Working'` and `[Task complete]`/`[Codex exec exited` → `'Codex exec ready'`
- Partial match `[Codex exec exited` (no closing bracket) is correct — exit code varies (`[Codex exec exited 0]`, `[Codex exec exited 1]`)
- Both PTY-create and reconnect paths have identical marker parsing — consistent

## Status Flow
```
codexExec invoked → "Working" (terminal.js:514)
  ↓
[Working...] marker emitted → "Working" (terminal.js:352/445, confirms)
  ↓
[Task complete] or [Codex exec exited N] → "Codex exec ready" (terminal.js:355/448)
```

## No Issues Found
Clean implementation. Once-flags prevent duplicates. Status transitions are idempotent.
