# Build Status

Last updated: 2026-02-07

**For older sessions (1-69):** See `status-archive.md`

---

## Session 91 - Bugfixes + Flow Control (Feb 8, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Watcher infinite loop fix (/logs/ ignore) | Analyst (impl) / Reviewer (review) | DONE |
| Pipeline title extraction cleanup | Analyst (impl) / Reviewer (review) | DONE |
| Role inference alignment (broadcast + direct) | Analyst (impl) / Reviewer (review) + Architect (extra fix) | DONE |
| arch/CLAUDE.md stale section removal | Analyst (cleanup) | DONE |
| xterm.js flow control (watermark-based) | Analyst (impl) / Reviewer (review) + Architect (syntax fix) | DONE |

**Commits:** `c291c12`, `3107eac`
**Test suite:** 93 suites / 2996 tests (unchanged)

**Key decisions:**
- Flow control uses XOFF/XON via node-pty `handleFlowControl: true` — transport-level, CLIs unaware
- Watermarks: HIGH=500KB (pause), LOW=50KB (resume) — generous thresholds with hysteresis to prevent oscillation
- Reviewer caught fatal syntax error in terminal-daemon.js before commit — Analyst had introduced duplicate `});`

---

## Session 85 - Reliability Sprint P1+P2 (Feb 7, 2026)

| Task | Owner | Status |
|------|-------|--------|
| PTY health monitoring (alive/idle/status cascade) | DevOps | DONE |
| Auto-restart on dead panes | DevOps | DONE |
| Integration tests (WS delivery + recovery manager) | DevOps | DONE |
| Port 0 falsy bug fix (websocket-server.js `\|\|` → `??`) | Architect | DONE |
| Gemini startup prompt injection on restart button | Architect | DONE |
| Ana --include-directories expanded to project root | Architect | DONE |
| README.md + MAP.md accuracy updates | Architect | DONE |

**Commits:** `72f8145`, `e1936ec`, `aacb212`, `2851b11`
**Test suite:** 87 suites/2797 tests → 89 suites/2803 tests

**Key decisions:**
- WS heartbeats rejected (agents don't maintain persistent connections). PTY-level monitoring via daemon instead.
- Health status cascade: dead > restarting > stuck > stale > healthy
- Gemini panes were missing context injection on restart button — `!state.isGemini` guard removed

---

## Session 82-84 - Hooks + Intent Board + Capabilities (Feb 6, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Shared Intent Board protocol (3 CLAUDE.md files) | Architect | ✅ DONE |
| Intent seed files (workspace/intent/*.json) | Architect | ✅ DONE |
| Gemini CLI hooks (ana-hooks.js) | Analyst | ✅ DONE |
| Claude Code hooks (arch-hooks.js) | Architect | ✅ DONE |
| Agent capabilities reference doc | All 3 agents | ✅ DONE |
| Plain English section added | Architect | ✅ DONE |
| README.md + MAP.md updates | Architect | ✅ DONE |
| UI fixes (expand button, tooltip) | Architect | ✅ DONE |
| Reviewer gate (hooks + intent board) | Reviewer | ✅ APPROVED |

**Initiative:** Discovered Gemini CLI and Claude Code have lifecycle hooks. Built auto-sync for intent board.
- Architect hooks inject team state as additionalContext on fresh sessions
- Analyst hooks auto-update status on session start/end and file edits
- Codex has no lifecycle hooks — needs alternative approach
- Agent capabilities reference catalogs all 3 CLIs with plain English guide
- Commits pushed: expand fix, tooltip fix, delegation rule, intent board, hooks, capabilities

---

## Session 81 - Rename Sprint + Instance Cleanup (Feb 6, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Audit instance directories for stale refs | Analyst | ✅ DONE |
| Update ana/AGENTS.md + ana/GEMINI.md to 3-pane | Architect | ✅ DONE |
| Update infra/GEMINI.md to DevOps identity + 3-pane | Architect | ✅ DONE |
| Delete stale back/ directory + front/AGENTS.md + nul artifacts | Architect | ✅ DONE |
| Remove Pane 4 from ui/settings.json | DevOps | ✅ DONE |
| spawnClaude → spawnAgent rename (50+ refs, 10 files) | Architect | ✅ DONE |
| spawnAllClaude → spawnAllAgents rename | Architect | ✅ DONE |
| infra/ → devops/ instance dir rename (config, scaffolder, tests) | Architect | ✅ DONE |
| Reviewer gate (Agent Teams pattern) | Reviewer | ✅ APPROVED |

**Initiative:** Analyst found stale 6-pane references. Completed all doc cleanup + two major renames from Session 80 backlog.
- Commits: `139ce85` (spawnAgent rename), `38818d5` (infra→devops rename)
- Remaining: delete stale `infra/` dir after restart (locked by running agent)

---

## Session 80 - Doc Cleanup Sprint (Feb 6, 2026)

| Task | Owner | Status |
|------|-------|--------|
| CLAUDE.md 3-pane updates | Architect | ✅ DONE |
| SPRINT.md overhaul | Architect | ✅ DONE |
| MAP.md audit | Frontend | ✅ DONE |
| blockers.md archival | Architect | ✅ DONE |
| status.md archival | Architect | ✅ DONE |
| Agent instruction file audit (15+ files) | Architect | ✅ DONE |
| Review all changes | Reviewer | ✅ DONE |
| Source JSDoc audit (4 files) | Architect | ✅ DONE |
| Test mock audit (14 files) | Architect | ✅ DONE |
| Push all commits | Architect | ✅ DONE |

**Initiative:** Full documentation + source cleanup after 3-pane merge (Session 79).
- Updated 20+ doc files to reflect 3-pane architecture (Panes 1, 2, 5)
- Archived sessions 53-69 from status.md → status-archive.md
- Archived resolved blockers → blockers-archive.md
- Fixed stale references in CLAUDE.md, SPRINT.md, MAP.md, AGENTS.md, GEMINI.md
- Updated all instance files (arch, infra→devops, ana) and docs/roles/
- Source JSDoc: sdk-renderer.js (12 occurrences), mcp-bridge.js, watcher.js, api-docs-handlers.js
- Test mocks: 14 test files aligned to 3-pane config (PANE_ROLES, PANE_IDS, ROLE_ID_MAP)
- Commits: a7ac5e6, 8b1ffc9, 5a4848a, bd64803, d143270 — all pushed

---

## Session 79 - Pane 4 Merge (Feb 6, 2026)

**Merged Pane 4 (Backend) into Pane 2 (DevOps).** 4-pane → 3-pane layout.
- 54 files changed, 87 test suites, 2796 tests passing
- Commit: `1f9b7b9`
- Config: PANE_IDS = ['1', '2', '5']

---

## Session 77 - Pane 3/6 Removal (Feb 5, 2026)

**Removed Panes 3 (Frontend) and 6 (Reviewer).** 6-pane → 4-pane layout.
- Frontend + Reviewer migrated to internal Agent Teams teammates of Architect (Pane 1)
- Commit: `9d475a7`

---

## Session 76 - Agent Teams POC (Feb 6, 2026)

**Agent Teams proof of concept:** CONFIRMED WORKING
- Full cycle: spawnTeam → TaskCreate → spawn teammate → SendMessage → report back → shutdown
- CLI version: 2.1.32, feature gate enabled server-side

---

## Session 73 - CLI Migration + Smart Watchdog (Feb 5, 2026)

| Highlight | Commit |
|-----------|--------|
| Pane Header UX Cleanup | `de9c3d2` |
| README/MAP.md updates | `525c073` |
| Smart Watchdog (churning stall detection) | `711b12b` |
| SDK Reliability (busy flag race fix) | implemented |
| Daemon Error Handling | implemented |
| CLI native migration (Claude 2.1.32, Codex 0.98.0) | complete |

---

## Session 72 - Full Audit Sprint (Feb 5, 2026)

| Highlight | Result |
|-----------|--------|
| Smoke tests for renderer.js + hivemind-app.js | 25 new tests |
| tabs.js split into 14 sub-modules | 8,109 → ~110 lines |
| tabs.css split into 21 sub-modules | 8,574 → 138 lines |
| Total tests | 2801 passing |

---

## Session 71 - War Room + Bug Fixes (Feb 4, 2026)

**War Room:** Shared message stream with smart agent awareness (60/40 flex layout).
**Bug Fixes:** PTY spawn fix (hasCliContent check), Organic UI message routing, SDK mode toggle.
- Commits: `02847bb`, `143b9ae`, `ffbe577`

---

## Session 70 - Organic UI + Folder Renames (Feb 4, 2026)

| Highlight | Commit |
|-----------|--------|
| Folder rename infrastructure | `16840e1` |
| Modular instruction files (docs/roles/, docs/models/) | `7f99958` |
| Organic UI v2 (rounded containers, breathing animations) | implemented |
| Reconnect auto-spawn fix | implemented |
| SDK Mode overhaul plan | drafted |

---

## Backlog

### Delete stale workspace/instances/infra/ directory
- **Priority:** LOW
- **Status:** Blocked — directory locked by running Pane 2 agent. Clean up after next restart.

### Runtime verification of 3-pane UI
- **Priority:** MEDIUM
- **Status:** Needs Electron boot to verify visually
