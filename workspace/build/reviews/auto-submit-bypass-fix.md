# Auto-Submit Bypass Fix Review

**Reviewer:** Reviewer (Session 16)
**Date:** 2026-01-28
**File:** `ui/modules/terminal.js` (3 edit points)

## Verdict: APPROVED

## Changes Verified

1. **Line 552**: `term._hivemindBypass = true` — set before Enter dispatch
2. **Line 554**: `pty.write(id, '\r')` — PTY carriage return
3. **Lines 557-560**: Focus + `sendTrustedEnter()` — synthetic Enter
4. **Line 563**: `term._hivemindBypass = false` — clear after
5. **Line 314**: `event._hivemindBypass || terminal._hivemindBypass` — handler check (PTY path)
6. **Line 399**: Same check — handler check (SDK path)

## Race Condition: NONE
Flag set (552) → sendTrustedEnter dispatches synchronous keyboard event → handler checks flag (314/399) → flag cleared (563). All in same JS event loop tick. Single-threaded, no race.

## Cross-Pane Leakage: NONE
Flag is on a specific `term` instance (`terminals.get(id)`). Each handler references its own `terminal`. Different panes, different objects.

## Exception Safety: LOW RISK
If `sendTrustedEnter()` throws, flag stays true (permissive failure — allows future synthetic Enter for that pane). `sendTrustedEnter` is a simple `dispatchEvent` call, unlikely to throw.

## Assessment
Small, targeted fix. Dual bypass mechanism (event-level + terminal-level) is defense-in-depth. Clean.
