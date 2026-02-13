# Build Status

Last updated: 2026-02-12

**For older sessions (1-69):** See `status-archive.md`

## Triage Snapshot
- Last Updated: 2026-02-13 (local)
- Active Priorities: 2
- Focus: PRI-002 (Team Memory Runtime)

---

## Current Priorities (Max 5)

- **PRI-002: Team Memory Runtime** — Spec v0.3-final signed off by DevOps. Phase 0 delegated. Implementation in progress.
- **PRI-001: Transition Objects** — Spec formalized. Implementation review pending.
- **SDK future rebuild** — Separate project folder, clean-slate. No timeline.

---

## Session History

### Session 123 - SDK Mode Purge (Feb 13, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Peer assessment: SDK vs PTY mode | All 3 agents | DONE — unanimous PTY superior |
| Ana audit: all SDK code in codebase | Analyst | DONE |
| Phase 1: Clean SDK branches from shared source files | DevOps + Frontend | DONE |
| Phase 2: Delete SDK-only files (15 files) | Architect | DONE |
| Phase 3: Clean SDK refs from test files | Architect | DONE |
| Phase 4: Full test suite verification | Architect | DONE (125 suites, 3158 tests) |
| Phase 5: Git commit | Architect | DONE (ad447de) |
| Phase 6: Full re-audit for remnants | Architect | DONE — zero SDK refs remain |
| CLAUDE.md SDK references removed | Architect | DONE |

**Commit:** `ad447de refactor: purge SDK mode — PTY is the only mode`
**Test suite:** 125 suites / 3158 tests (all passing)
**Scope:** 51 files changed, 54 insertions, 13,100 deletions

**Key decisions:**
- All 3 agents independently concluded PTY is superior today; SDK needs clean-slate rebuild
- SDK code completely removed — no conditionals, no shims, no dead imports
- Future SDK rebuild will be in a separate project folder, reintegrated when mature
- CLAUDE.md updated: "PTY is the only mode" replaces "SDK mode is primary path"

---

### Session 122 - Transition Ledger Formalization (Feb 13, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Formalize Transition Ledger spec | Analyst | DONE (docs/transition-ledger-spec.md) |
| Verify ERR-011 and ERR-005 resolution | Analyst | DONE |
| Update MAP.md with spec reference | Analyst | DONE |

**Commits:** n/a (doc updates only)
**Test suite:** 127 suites / 3412 tests (all passing)

**Key decisions:**
- Transition Ledger spec (v0.1) formalized to include schema, lifecycle enum, and evidence classes.
- Triage documents (errors.md, status.md) updated to reflect resolved status of ERR-011 and ERR-005.

---

### Session 121 - UI Cleanup + Evidence Ledger Integration (Feb 12-13, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Feed tab removal (HTML + tabs.js wiring) | Architect | DONE |
| Git tab removal | Architect | DONE (prior context) |
| Tab stretch + SVG icons | Architect | DONE (prior context) |
| Pane buttons rewired (Interrupt→ESC, Unstick→Enter) | Architect | DONE |
| Colors-follow-model (header border only) | Architect | REVERTED — incomplete |
| Startup injection fix (process-alive + pane 1 reattach) | DevOps | DONE |
| Evidence Ledger → Architect hooks integration | Architect | DONE |
| arch/CLAUDE.md startup + handoff protocol updated | Architect | DONE |

**Commits:** `b084215`, `6b1fadd`, `9570b73`, `e0c4cc5`, `5a0d790`, `61fb0f6`, `5678880`, `535ee28` (revert)
**Test suite:** 127 suites / 3412 tests (all passing)

**Key decisions:**
- Evidence Ledger wired into arch-hooks.js: SessionStart reads context from ledger (Priority 1), falls back to Electron snapshot (P2), then intents (P3). SessionEnd + PreCompact auto-snapshot session-handoff.json to ledger.
- No manual restart handoff prep needed — hook handles it automatically.
- Colors-follow-model needs comprehensive implementation (all color elements, not just header border) — deferred to Frontend teammate.
- Startup injection regression traced to `fa868e7` (S120 memory leak fix) — fixed with `isProcessRunning(pid)` + reattach arming for pane 1.

---

### Session 120 - Backlog Cleanup Sprint (Feb 12, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Process isolation Phase 2 (evidence ledger → fork worker) | DevOps | DONE |
| Process isolation Phase 3 (comms service → fork worker) | DevOps | DONE |
| ERR-005 cosmetic fix (agent color bleed) | Reviewer | DONE |
| ERR-005 memory leak validation (peak 267MB, stable 207MB) | Ana | DONE — CLOSED |
| Promotion Engine Phase 2 (IPC/CLI signoffs) | DevOps | IN PROGRESS |
| Path table added to all 6 instruction files | Architect | DONE |
| PowerShell 7.5.4 installed | Architect | DONE |

**Commits:** `2f706d3`, `299d1b2`, `6d9bb3e`
**Test suite:** 124 suites / 3399 tests (all passing)

**Key decisions:**
- Process isolation complete: file watcher (Phase 1), evidence ledger (Phase 2), comms service (Phase 3) all in fork workers
- Memory leak (ERR-005) officially CLOSED — ba529e6 was primary root cause (duplicate decoration creation)
- Agent instruction files now have REPO LAYOUT path tables in all 6 files (CLAUDE.md, AGENTS.md, GEMINI.md × 2 instances)

---

### Session 119 (continued) - Memory Optimization (Feb 12, 2026)

| Task | Owner | Status |
|------|-------|--------|
| ERR-005 DOM fix validation (fresh baseline) | Ana | DONE — DOM fixes verified correct |
| Memory growth investigation (~400MB/min) | Ana + Architect | DONE — traced to WebGL textures |
| Disable WebGL renderer by default | Architect | DONE — opt-in via terminalWebGL setting |
| Reduce scrollback 5000→2000 | Architect | DONE |
| Code review | Reviewer (Opus) | APPROVED |

**Commit:** `cf200ba`
**Test suite:** 121 suites / 3384 tests (all passing)

**Findings:**
- DOM listener leak fixes (19b4e3e + 754cc14) confirmed correct at code level
- Renderer memory still grew ~400MB/min even with 2 of 3 agents idle
- xterm.js WebGL addon (texture atlas per terminal) identified as primary suspect
- All internal buffers verified bounded: write queue 2MB/pane, scrollback 5000 lines, event bus 1000 events
- Fix: WebGL disabled by default (canvas renderer), scrollback halved to 2000 lines
- Can re-enable WebGL via `settings.json: { "terminalWebGL": true }` if needed

---

### Session 117 - Memory Leak + ERR-008 Fixes (Feb 12, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Validate S116 memory leak fix | Ana | FAILED — renderer grew to 2.35GB |
| Validate S116 ERR-008 fix | Ana + User | FAILED — long message stuck, user pushed Enter |
| IPC audit (exhaustive, 26+ channels) | Frontend | DONE |
| Memory leak fix: 3 missing IPC channels | Frontend | DONE |
| ERR-008 fix: scaled Enter delay + defer timeout | DevOps | DONE |
| Code review (both fixes) | Reviewer | APPROVED |

**Commit:** `319393f`
**Test suite:** 119 suites / 3375 tests (all passing)

**Findings:**
- S116 atomic PTY writes (ddba696) insufficient for ERR-008 — Enter timing was the real issue
- S116 IPC scoped registry (fa868e7) missed 3 submodule channels — listeners accumulated
- Also found: 2 duplicate registrations (feature-capabilities-updated, task-list-updated) — follow-up item
- pty-data-{N} channels confirmed safe (disposer pattern, no accumulation)

---

### Session 115 - Process Isolation Quick Wins + WS Fix (Feb 12, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Process isolation assessment (bottleneck analysis) | Ana + DevOps | DONE |
| Quick Win A: async IPC handlers (4 files, execSync → exec) | DevOps | DONE |
| Quick Win B: resource:get-usage caching (7s TTL + dedup) | DevOps | DONE |
| WebSocket health gate fix (stale no longer blocks delivery) | DevOps | DONE |
| Code review (A+B) | Reviewer | DONE |
| Full test suite validation | Architect | DONE |

**Commits:** `6c209cc`, `da4a407`
**Test suite:** 117/3347 → **119/3358** (+2 suites, +11 tests)

**Key decisions:**
- execSync eliminated from all IPC handlers (git, test, precommit, completion-quality)
- Resource usage cached with 7s TTL, in-flight promise dedup, failures not cached
- WS health gate: stale/no_heartbeat no longer blocks — only invalid_target blocks delivery
- Quick Wins C+D (watcher async I/O, daemon batching) deferred pending user performance assessment
- Larger refactors (worker processes for watcher, evidence ledger, comms) backlogged

---

### Session 113-114 - Evidence Ledger Slice 2 + Agent Modularity (Feb 11, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Evidence Ledger Slice 2 spec | Architect | DONE |
| Slice 2 Phase A: schema + investigator module (16 CRUD methods) | DevOps | DONE |
| Slice 2 Phase B: stale detection + binding validation | DevOps | DONE |
| Slice 2 Phase C: IPC handlers + CLI script + integration test | DevOps | DONE |
| Agent modularity: shared-agent-rules.md (universal rules) | Architect | DONE |
| GEMINI.md overhaul (startup, comms, error reporting) | Architect | DONE |
| AGENTS.md updated (devops + ana aligned with shared rules) | Architect | DONE |
| Model-switch rebind fix (xterm input bridge + settings cache) | DevOps | DONE |
| Capability-driven injection routing (replaces hardcoded model triage) | DevOps | DONE |

**Commits:** `3443af1`, `9285999`, `d27e396`, `a9cd2a2`, `3f03d59`, `dc5f0e6`
**Test suite:** 113/3327 → **115/3338** (+2 suites, +11 tests)

**Key decisions:**
- Evidence Ledger Slice 2 complete: incidents, assertions, verdicts, evidence bindings — all programmatic
- 3-layer agent modularity: shared rules (universal) → model files (quirks) → role files (per-pane)
- Models are runtime config, not identity — any pane can run any CLI
- IPC handlers + CLI script (`hm-investigate.js`) for agent/manual investigation workflows

---

### Session 112 - Evidence Ledger Slice 1 + Cleanup (Feb 11, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Runtime validation S111 fixes (focus-deferral + PTY race) | Ana + DevOps | DONE |
| Dead module cleanup (~2,700 lines, 5 files) | Ana (audit) / Architect (delete) | DONE |
| Evidence Ledger Slice 1 spec (infra + query) | DevOps + Ana | DONE |
| Evidence Ledger Phase A (store + ingestion) | DevOps | DONE |
| Evidence Ledger Phase B (traceId propagation, 7 files) | DevOps | DONE |
| Evidence Ledger Phase C (config flag + guardrails) | DevOps | DONE |
| Query contract tests (12 tests) | Ana | DONE |
| Integration test (e2e traceId continuity) | Ana | DONE |
| README + MAP.md update | Architect | DONE |

**Commits:** `5d40084`, `665aaa5`, `d282717`, `6e49bc0`, `178b6b4`, `214b593`, `feee53a`
**Test suite:** 108/3300 → **113/3327** (+5 suites, +27 tests)

**Key decisions:**
- Evidence Ledger uses SQLite WAL, single writer, canonical envelope with legacy alias support
- 3-slice roadmap: Slice 1 (pipeline ledger) → Slice 2 (investigator workspace) → Slice 3 (replaces handoff JSON)
- Config flag `evidenceLedgerEnabled` gates the feature with graceful degradation
- ERR-006 and ERR-007 CLOSED after runtime validation

---

### Session 91 - Bugfixes + Flow Control (Feb 8, 2026)

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
