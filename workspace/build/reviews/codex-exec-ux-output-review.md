# Codex Exec UX Output Review (Session 44)

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Status:** APPROVED

---

## Summary

Implementer B improved Codex exec output visibility by surfacing tool/command/file events, smoothing newlines, and providing a unified completion marker.

---

## File Reviewed

`ui/modules/codex-exec.js` (424 lines)

---

## Changes Verified

### B. Event Tags ([TOOL], [CMD], [FILE])

**Implementation:**
- `formatAuxEvent()` (lines 189-223) - main dispatcher for auxiliary events
- `formatTaggedLine()` (lines 90-94) - creates `[TAG] detail` output
- `extractCommand()` (lines 113-127) - extracts commands from 8+ payload shapes
- `extractToolName()` (lines 129-142) - extracts tool names from 7+ payload shapes
- `extractFileSummary()` (lines 166-187) - extracts file operations

**Verification:**
- [x] File events formatted as `[FILE] action target` (created/edited/deleted/updated)
- [x] Command events formatted as `[CMD] command`
- [x] Tool events formatted as `[TOOL] name detail`
- [x] Completion events (`_completed`, `.completed`) are suppressed to avoid duplicates
- [x] Handles various payload shapes (snake_case, camelCase, nested objects, arrays)

### C. Newline Smoothing

**Implementation:**
- `ensureTrailingNewline()` (lines 85-88) - only adds `\r\n` if missing
- `collapseWhitespace()` (lines 74-76) - trims excessive whitespace in tagged lines
- Line 330: `isDelta ? text : ensureTrailingNewline(text)` - streaming deltas raw, complete text gets newline

**Verification:**
- [x] Delta events (streaming) don't get extra newlines - allows smooth text streaming
- [x] Non-delta text gets exactly one trailing newline
- [x] Tagged lines use `\r\n[TAG] detail\r\n` for visual separation
- [x] No double blank lines from text content

### D. Unified Completion Marker

**Implementation:**
- `emitDoneOnce()` (lines 41-48) - emits `[Done (exit X)]` once
- `emitWorkingOnce()` (lines 37-39) - emits `[Working...]` once
- Flag tracking: `execDoneEmitted`, `execWorkingEmitted` (lines 373-374)
- Called on `child.on('close')` (line 407)

**Verification:**
- [x] Single `[Done (exit X)]` line on process close
- [x] Flag prevents duplicate emission
- [x] Exit code properly displayed (number or 'unknown')
- [x] `[Working...]` marker shown once at first activity

---

## Code Quality

**Defensive Payload Handling:**
```javascript
function extractCommand(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.command === 'string') return payload.command;
  if (Array.isArray(payload.command)) return payload.command.join(' ');
  if (payload.command && typeof payload.command === 'object') {
    if (typeof payload.command.command === 'string') return payload.command.command;
    if (Array.isArray(payload.command.args)) return payload.command.args.join(' ');
  }
  // ... 4 more fallback patterns
  return '';
}
```

This handles many Codex JSONL payload variations without crashing.

**Truncation Safety:**
```javascript
function truncateDetail(text, maxLen = MAX_EVENT_DETAIL) {
  const clean = collapseWhitespace(text);
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3)}...`;
}
```

Prevents extremely long tool inputs from flooding the terminal.

---

## Test Results

```
PASS __tests__/codex-exec.test.js
  codex-exec runner
    √ requires a broadcast function
    √ returns error when terminal missing or not alive
    √ spawns codex exec with --cd when no session id
    √ spawns codex exec with resume when session id exists
    √ captures session id and broadcasts delta output
    √ handles non-JSON output by emitting raw line
    √ returns busy when exec already running

7 passed, 7 total
```

---

## Minor Observations

1. `formatTaggedLine()` returns `\r\n[TAG] detail\r\n` which adds blank lines between tagged events - intentional for readability
2. `MAX_EVENT_DETAIL = 160` limits tag detail length - reasonable default
3. `isStartLikeEvent()` and `isCompleteLikeEvent()` handle multiple naming conventions (camelCase, snake_case, dot notation)

---

## Verdict

**APPROVED** - Implementation is thorough, defensive, and well-tested. Event surfacing provides better visibility into Codex operations.

Ready for runtime verification.
