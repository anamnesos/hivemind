# Blockers

**For resolved items:** See `blockers-archive.md`

---

## Active Blockers

None.

---

## Backlogged (Low Priority)

### Focus steal during trigger injection
**Priority:** LOW
**Status:** Partial fix - focus restored faster but not eliminated
**Details:** Command bar briefly unresponsive (~1s) during message injection to Claude panes. Terminal.input() disabled for Claude panes, so focus-based Enter required.
**Workaround:** None needed - minor annoyance only

### Empty trigger file log noise
**Priority:** LOW (cosmetic)
**Status:** Backlogged - not a bug
**Details:** "Empty trigger file after 3 retries" logs appear after successful delivery because watcher sees the cleared file.
**Resolution:** Not a bug - working as designed

### UI button debounce
**Priority:** LOW
**Status:** Future sprint
**Details:** Some buttons (spawn, kill, nudge, freshStart) lack debounce on rapid clicks.
**Protected:** Broadcast input (500ms debounce), Full Restart (confirm dialog)
