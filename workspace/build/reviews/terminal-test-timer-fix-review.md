# Review: terminal.test.js Open Handle Fix

**Date:** 2026-01-28
**Reviewer:** Reviewer
**Author:** Implementer A
**File:** ui/__tests__/terminal.test.js

## Status: APPROVED (Partial Fix)

## Changes Reviewed

Implementer A refactored 2 tests to stay on fake timers using `jest.setSystemTime()`:

### Test 1: Line 307-318 (sendToPane describe block)
```javascript
test('should queue message when pane is busy', () => {
  // Stay on fake timers - set lastOutputTime to "now" to simulate busy pane
  const now = Date.now();
  jest.setSystemTime(now);
  terminal.lastOutputTime['1'] = now; // Recent output = busy

  terminal.sendToPane('1', 'test message');

  expect(terminal.messageQueue['1']).toHaveLength(1);
  expect(terminal.messageQueue['1'][0].message).toBe('test message');
  // Clear any pending processQueue timers
  jest.runAllTimers();
});
```

### Test 2: Line 957-968 (sendToPane edge cases)
```javascript
test('should queue message when pane is busy', () => {
  // Stay on fake timers - set lastOutputTime to "now" to simulate busy pane
  const now = Date.now();
  jest.setSystemTime(now);
  terminal.lastOutputTime['1'] = now; // Keep pane busy

  terminal.sendToPane('1', 'Test message');

  expect(terminal.messageQueue['1']).toBeDefined();
  expect(terminal.messageQueue['1'].length).toBeGreaterThan(0);
  // Clear any pending processQueue timers
  jest.runAllTimers();
});
```

## Verdict

**CORRECT** - Both tests now:
1. Stay on fake timers (no `jest.useRealTimers()`)
2. Use `jest.setSystemTime()` to control Date.now()
3. Call `jest.runAllTimers()` to flush pending setTimeout from processQueue()

This eliminates the open handle from processQueue() setTimeout for these 2 tests.

## Limitation: Partial Fix

The open handle warning will **still appear intermittently** because ~15 other tests in this file use the same problematic pattern:

| Line | Test | Pattern |
|------|------|---------|
| 322 | should include timestamp in queued message | useRealTimers → useFakeTimers |
| 337 | should include onComplete callback if provided | useRealTimers → useFakeTimers |
| 349 | should create queue if not exists | useRealTimers → useFakeTimers |
| 363 | broadcast - should send message to pane 1 | useRealTimers → useFakeTimers |
| 608+ | multiple tests | same pattern |
| 1020 | killAllTerminals - should handle empty | useRealTimers → useFakeTimers |

These tests switch to real timers, call sendToPane() or similar async functions, then switch back without clearing pending real timers.

## Recommendation

1. **Accept this fix** - it addresses the 2 tests I identified as root cause
2. **Create low-priority task** for comprehensive timer cleanup across all ~15 remaining tests
3. **Jest timing quirks** - even with fixes, Jest sometimes reports warnings for timers that were cleared; the fix is correct even if warning appears intermittently

## Approval

**APPROVED** for commit. The specific tests are correctly fixed. Additional cleanup is separate work.
