# V2 Roadmap

**Date:** January 24, 2026
**Status:** PLANNING
**Goal:** Production hardening - tests, modularization, debugging tools

---

## Priority 1: Test Suite (HIGH)

Zero tests currently. Need foundation before more features.

| Task | Owner | Description |
|------|-------|-------------|
| T1 | Worker A | Set up Jest test framework in ui/ |
| T2 | Worker A | Unit tests for daemon protocol (message parsing) |
| T3 | Worker B | Unit tests for config.js exports |
| T4 | Worker B | Integration test: daemon spawn/connect/disconnect |
| T5 | Lead | E2E test: trigger chain (automate what we tested manually) |

**Target:** 10+ tests covering critical paths

---

## Priority 2: Modularize Large Files (HIGH)

renderer.js = 1635 lines, main.js = 1401 lines. Too big.

### renderer.js → Split into:
| Module | Owner | Contents |
|--------|-------|----------|
| `terminal.js` | Worker A | initTerminal, reattachTerminal, terminal management |
| `tabs.js` | Worker A | Tab switching, panel logic, screenshots |
| `settings.js` | Worker A | Settings panel, load/save settings |
| `daemon-handlers.js` | Worker A | IPC handlers for daemon events |

### main.js → Split into:
| Module | Owner | Contents |
|--------|-------|----------|
| `ipc-handlers.js` | Worker B | All ipcMain.handle() registrations |
| `watcher.js` | Worker B | File watcher, state transitions |
| `triggers.js` | Worker B | Trigger handling, notify functions |

---

## Priority 3: Daemon Improvements (MEDIUM)

| Task | Owner | Description |
|------|-------|-------------|
| D1 | Worker B | Daemon logging to file (not just stdout) |
| D2 | Worker B | Health check endpoint: `action: "health"` |
| D3 | Worker B | Graceful shutdown notification to clients |

---

## Priority 4: UX Improvements (LOW)

| Task | Owner | Description |
|------|-------|-------------|
| U1 | Worker A | Terminal scrollback persistence on reconnect |
| U2 | Worker A | Visual flash when pane receives trigger |
| U3 | Lead | "Kill all terminals" button |
| U4 | Lead | "others.txt" trigger (excludes sender) |

---

## Sprint Plan

### Sprint 2.1: Tests (2-3 sessions)
- T1-T5: Get test suite running
- Reviewer verifies tests pass

### Sprint 2.2: Modularize (2-3 sessions)
- Split renderer.js and main.js
- Reviewer verifies app still works

### Sprint 2.3: Polish (1-2 sessions)
- Daemon improvements
- UX improvements
- Final review

---

## Success Criteria

1. `npm test` runs and passes 10+ tests
2. No file over 500 lines
3. Daemon logs to file for debugging
4. All features still work after refactor

---

**Lead Decision Needed:** Start with Sprint 2.1 (tests) or Sprint 2.2 (modularize)?

My recommendation: **Tests first** - they'll catch regressions during modularization.

---
