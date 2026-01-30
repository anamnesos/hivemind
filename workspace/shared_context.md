# Hivemind Shared Context

**Last Updated:** Jan 30, 2026 (Session 48 - MEGA SPRINT COMPLETE)
**Status:** ✅ MEGA SPRINT COMPLETE - Ready for Restart

---

## 🚀 SESSION 48: MEGA SPRINT - FINAL STATUS (Jan 30, 2026)

**Goal:** Substantial feature build + competitive research - prove this isn't for toy apps
**Result:** EXCEPTIONAL - 35 tasks complete, 1 in progress

### Sprint Metrics (FINAL)
- **Tasks Complete:** 35
- **Tasks In Progress:** 1 (#10 Voice Control ~50%)
- **Code Output:** ~37,000+ lines
- **Tests:** 2,949 (from 1,181 - 2.5x increase this session)
- **Test Coverage:** 90.23% statements

### Final Task Summary (35 Complete, 1 In Progress)
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Competitive Research | Investigator | ✅ COMPLETE |
| 2 | Agent memory/context persistence | Implementer A | ✅ COMPLETE (4,859 lines) |
| 3 | Real-time task queue visualization | Implementer B | ✅ COMPLETE |
| 5 | Smart auto-routing with learning | Orchestrator | ✅ COMPLETE (355 lines) |
| 6 | Git integration for agents | Implementer B | ✅ COMPLETE |
| 7 | Test coverage push to 90%+ | Reviewer | ✅ COMPLETE (2,949 tests, 90.23%) |
| 8 | Conversation history viewer | Implementer A | ✅ COMPLETE |
| 9 | Plugin/Extension system | Implementer B | ✅ COMPLETE |
| 10 | Voice control for agents | Implementer B | 🔄 IN PROGRESS (~50%) |
| 11 | Real-time collaboration (multi-user) | Implementer A | ✅ COMPLETE |
| 12 | Project templates and scaffolding | Implementer A | ✅ COMPLETE |
| 13 | Performance profiling dashboard | Investigator | ✅ COMPLETE |
| 14 | Natural language task input | Orchestrator | ✅ COMPLETE (167 lines) |
| 15 | Automated deployment pipeline | Implementer A | ✅ COMPLETE |
| 16 | Agent skill marketplace | Implementer B | ✅ COMPLETE |
| 17 | Mobile companion app | Implementer A | ✅ COMPLETE (~1,830 lines) |
| 18 | AI-powered code review | Implementer A | ✅ COMPLETE |
| 19 | Visual workflow builder | Implementer A | ✅ COMPLETE |
| 20 | Knowledge base integration (RAG) | Investigator | ✅ COMPLETE (333 lines) |
| 21 | Agent debugging/replay | Implementer A | ✅ COMPLETE |
| 22 | Cross-project agent sharing | Implementer B | ✅ COMPLETE |
| 23 | Automated documentation generation | Implementer A | ✅ COMPLETE |
| 24 | Cost optimization engine | Implementer A | ✅ COMPLETE |
| 25 | Security hardening | Implementer A | ✅ COMPLETE |
| 26 | Backup & restore system | Implementer B | ✅ COMPLETE |
| 27 | External notifications | Investigator | ✅ COMPLETE |
| 28 | Scheduled task automation | Orchestrator | ✅ COMPLETE (391 lines) |
| 29 | Self-healing error recovery | Implementer A/B | ✅ COMPLETE |
| 30 | Multi-project dashboard | Implementer A | ✅ COMPLETE |
| 31 | Resource usage monitoring | Investigator | ✅ COMPLETE |
| 32 | Agent templates library | Implementer B | ✅ COMPLETE |
| 33 | Semantic search with embeddings | Investigator | ✅ COMPLETE (114 lines) |
| 34 | Memory timeline visualization | Investigator | ✅ COMPLETE |
| 35 | Auto-learning extraction | Investigator | ✅ COMPLETE |
| 36 | Cross-session knowledge graph | Implementer A | ✅ COMPLETE |
| 37 | Context window optimizer | Investigator | ✅ COMPLETE |

### Remaining Tasks
| # | Task | Status |
|---|------|--------|
| 4 | Electron upgrade v18→v30+ | Deferred (infrastructure) |
| 10 | Voice control for agents | ~50% complete (can continue next sprint) |

### Competitive Research Summary (Task #1 Complete)
**Key finding:** Competitors weak on production reliability and observability
- CrewAI: Slow, weak observability
- AutoGen: "Not production-ready" (Microsoft's words)
- LangGraph: interrupt() restarts nodes
- MetaGPT/ChatDev: Research demos, not ops-ready

**Our positioning:** "Frameworks are easy to demo; production reliability is the hard part. Hivemind ships the latter."

### Sprint Philosophy
- These are NOT small tasks - hours of work each
- Research should be DEEP - user reviews, claims vs reality
- Features should be COMPLETE systems, not scaffolding
- Continuous review gate on all implementations

### Implementer B Deliverables (Session 48)
**Task #3: Real-time task queue visualization** ✅
- New Queue tab with live message queue counts, conflict locks, active claims, and queue events
- Refresh + clear actions for delivered messages and conflict locks
- Real-time updates via queue/conflict/claims IPC events + 4s polling while active
- **Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/styles/tabs.css`

**Task #6: Git integration for agents** ✅
- New Git tab with branch/upstream, ahead/behind, last commit, staged/unstaged/untracked/conflicts
- Diff preview (staged/unstaged), stage/unstage all, commit, copy summary
- Git IPC handlers for status/diff/stage/unstage/commit/log
- **Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/styles/tabs.css`, `ui/modules/ipc/git-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/renderer.js`

**Task #9: Plugin/Extension system** ✅
- Plugin manager loads from `workspace/plugins`, persists state, and provides per-plugin storage
- Sync/async hook system (`message:*`, `trigger:received`, `agent:*`, `activity:log`, `daemon:data`)
- Plugin commands with timeout guard + IPC management endpoints
- Trigger/notify/broadcast/direct message flows now support `message:beforeSend`/`message:afterSend`
- Docs: `docs/plugins.md`
- **Files:** `ui/modules/plugins/plugin-manager.js`, `ui/modules/plugins/index.js`, `ui/modules/ipc/plugin-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/ipc-state.js`, `ui/modules/ipc/index.js`, `ui/modules/ipc/api-docs-handlers.js`, `ui/main.js`, `ui/modules/triggers.js`, `docs/plugins.md`
- **Next:** Implementer A can add a Plugins UI (tab/command palette) + Reviewer can validate hooks with a sample plugin

**Task #26: Backup & restore system** ✅
- Automated backups of workspace/config/state with retention + restore points
- Backup manager supports create/list/restore/delete/prune + interval scheduling
- IPC endpoints added for UI integration
- **Files:** `ui/modules/backup-manager.js`, `ui/modules/ipc/backup-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/ipc-state.js`, `ui/modules/ipc/index.js`, `ui/modules/ipc/api-docs-handlers.js`, `ui/main.js`, `ui/modules/watcher.js`
- **Next:** Add UI surface for backups (optional) + reviewer smoke test

**Task #32: Agent templates library** ✅
- Built-in agent templates for common team setups (hybrid, research, review, focus)
- Template handlers now merge built-ins + user templates with import/export endpoints
- Docs: `docs/agent-templates.md`
- **Files:** `ui/modules/agent-templates.js`, `ui/modules/ipc/template-handlers.js`, `ui/modules/ipc/api-docs-handlers.js`, `docs/agent-templates.md`

**Task #22: Cross-project agent sharing** ✅
- Agent config store per project with list/get/save/apply/export/import/share/delete endpoints
- Import/export supports JSON or file dialog, optional apply + merge
- **Files:** `ui/modules/ipc/agent-sharing-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/api-docs-handlers.js`
- **Next:** Optional UI controls for import/export/share in Templates/Dashboard tabs

**Task #16: Agent skill marketplace** ✅
- Built-in skill catalog plus marketplace store with publish/install/import/export flows
- Install + assignment tracking per agent with IPC events for UI updates
- **Files:** `ui/modules/agent-skills.js`, `ui/modules/ipc/skill-marketplace-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/api-docs-handlers.js`
- **Next:** Implementer A can wire UI browse/install/publish panels to these IPC endpoints

**Task #29: Self-healing error recovery (backend)** ✅
- Recovery manager: stuck detection → auto-restart w/ exponential backoff + circuit breaker
- Context preservation via daemon session save before restart
- Health/recovery IPC endpoints + expected-exit tracking
- **Files:** `ui/modules/recovery-manager.js`, `ui/modules/ipc/recovery-handlers.js`, `ui/main.js`, `ui/modules/ipc/auto-nudge-handlers.js`, `ui/modules/ipc/pty-handlers.js`, `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/ipc-state.js`, `ui/modules/ipc/index.js`, `ui/modules/ipc/api-docs-handlers.js`
- **Next:** Reviewer verify Health tab updates + auto-restart/backoff + circuit reset endpoints

---

## ✅ SESSION 47: UI POLISH SPRINT - COMPLETE (Jan 30, 2026)

**Result:** 25/25 tasks completed, all approved by Reviewer

**Goal:** Comprehensive UI polish overhaul - make the app look professional
**User Status:** Away overnight - autonomous work mode
**Result:** EXCEPTIONAL - 24 of 25 tasks completed

### Task Summary (All COMPLETE except #11 Review)
| # | Task | Status |
|---|------|--------|
| 1-6 | Core UI Polish (Header, Panes, Command Bar, Right Panel) | ✅ DONE |
| 7-8 | Code Quality Audits (CSS + JS) | ✅ DONE |
| 9-10 | Notifications + Command Palette | ✅ DONE |
| 12-13 | Research (Competitive Analysis + UI Patterns) | ✅ DONE |
| 14-21 | Premium Enhancements (Scrollbars, Skeletons, Animations) | ✅ DONE |
| 22-25 | Advanced Effects (Glass, Gradients, Particles) | ✅ DONE |
| 11 | Final Review & Verification | 🔄 IN PROGRESS |

### Implementer B Deliverables (Tasks 9/10)
**Task #9 (Notifications/Toasts)** ✅
- Handoff + conflict notifications now use design system tokens (colors/spacing/radius/shadows/transitions)
- Added glass effect + refined gradients; conflict urgency pulse + improved hierarchy
- **File:** `ui/styles/panes.css`

**Task #10 (Command Palette)** ✅
- Hover + selected state improved with glow, lift, and accent border
- Keyboard nav feedback via focus-visible outline
- Subtle item entrance animation + tokenized spacing/colors
- **File:** `ui/styles/layout.css`

### Additional Polish Tasks (Session 47 Expansion)
| # | Task | Owner | Status |
|---|------|-------|--------|
| 17 | Micro-animations for state changes | Implementer B | ✅ DONE |
| 19 | Keyboard shortcut tooltips | Implementer B | ✅ DONE |
| 21 | Activity pulse effects | Implementer B | ✅ DONE |

**Notes:**
- Micro-animations + activity pulses: `ui/styles/layout.css`, `ui/styles/state-bar.css`, `ui/styles/panes.css`
- Shortcut tooltips: `ui/styles/layout.css` + `ui/renderer.js` (title→data-tooltip conversion)

### Critical Path
Task #2 (CSS Design System) must complete first - all visual polish tasks depend on having CSS variables defined.

### CSS Variables to Create (Task #2)
```css
/* Colors */
--color-primary: #e94560;
--color-secondary: #4ecca3;
--color-accent: #ffc857;
--color-info: #4a9eff;
--color-bg-dark: #1a1a2e;
--color-bg-medium: #16213e;
--color-bg-light: #0f3460;
--color-text: #eee;
--color-text-muted: #888;

/* Typography */
--text-xs: 9px;
--text-sm: 11px;
--text-base: 12px;
--text-lg: 14px;
--text-xl: 18px;

/* Spacing */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;

/* Borders & Transitions */
--radius-sm: 3px;
--radius-md: 4px;
--radius-lg: 8px;
--transition-fast: 0.15s;
--transition-normal: 0.2s;
```

---

## 🎨 PREVIOUS: Toolbar Icon Polish (Implementer A)
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

Replaced all corrupted emoji in toolbar buttons with clean inline SVG icons:
- Project (folder), Spawn (play), Sync (refresh arrows), Actions (dots)
- Dropdown items: Nudge (lightning), Kill (x-circle), Fresh (sun), Shutdown (power)
- Cost Alert (triangle), Settings (gear), Panel (sidebar)
- Also fixed command palette nav hint: `??` → `↑↓`

**Files:** ui/index.html, ui/styles/layout.css

---

## 🔄 THIS RESTART SHOULD VERIFY (Session 48 - MEGA SPRINT COMPLETE)

### RESTART HANDOFF CHECKLIST ✅

**1. MEGA SPRINT Completion**
- **WHAT:** Verify 35 tasks completed, ~37,000 lines of code functional
- **HOW:** Run app, check all 6 panes spawn. Tabs should load without errors.
- **WHO:** Fresh Architect instance after restart
- **SUCCESS:** All tabs accessible (Queue, Git, Docs, Review, Cost, Security, Templates, Mobile, etc.)
- **FAILURE:** IPC errors in console, tabs don't load, 404s on handler channels

**2. Known Bug: Trigger Delivery to Panes 2 & 5**
- **WHAT:** Triggers to Orchestrator (pane 2) and Investigator (pane 5) were failing
- **HOW:** Send test message to pane 2 via `echo "(ARCH #1): test" > triggers/orchestrator.txt`
- **SUCCESS:** Message appears in pane 2 terminal
- **FAILURE:** Message doesn't appear - check diagnostic.log for queue-but-no-delivery
- **Note:** Panes 3, 4, 6 were working fine

**3. Known Bug: Copy/Paste Unreliable**
- **WHAT:** Right-click copy/paste in terminals inconsistent
- **STATUS:** Documented in errors.md, not fixed this sprint
- **WORKAROUND:** Use keyboard shortcuts Ctrl+C/Ctrl+V instead

**4. Task #10 (Voice Control) - ~50% Complete**
- **OWNER:** Implementer B
- **STATUS:** Was in progress when sprint ended
- **NEXT:** Can continue or defer to future sprint

### Previous Session 45/46 Items (Still Valid)
- ASCII Headers: ✅ VERIFIED
- Toolbar SVG Icons: ✅ VERIFIED
- Diagnostic File Logging: ✅ VERIFIED
- Codex Activity Indicator: ✅ VERIFIED

**6. Codex Activity Indicator** ✅ RUNTIME VERIFIED (Session 47)
- Glyph spinner: ◐◓◑◒ cycling - WORKING
- User confirmed spinning glyph appears during Codex execution

---

## ✅ Previously Verified (Session 45)
| Feature | Status |
|---------|--------|
| Activity Indicator | ✅ Working (spinning glyph + Thinking text) |
| Output Styling | ✅ Working (RTL fix + colored markers) |

---

## Pending
- **[TRIGGER] prefix** - Investigator reviewing whether to remove
- **Inline activity indicators** - Deferred UX enhancement

---

## ✅ IMPLEMENTER B UPDATE (Jan 30, 2026)
**Task 2 (Codex Pane Button Differentiation):** COMPLETE (visual differentiation only)  
- Added `cli-codex/cli-claude/cli-gemini` classes on panes from `pane-cli-identity`  
- Codex panes now tint header action buttons (refresh/lock/interrupt/unstick) in blue  
- Note: No new Codex-specific buttons added yet (only visual differentiation).  
- Files: `ui/renderer.js`, `ui/styles/panes.css`

**Task 4 (File-Based Diagnostic Logging):** COMPLETE  
- Added `ui/modules/diagnostic-log.js` writing to `workspace/logs/diagnostic.log`  
- Stagger/Inject/Queue events now append to file for easy access  
- Files: `ui/modules/diagnostic-log.js`, `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`

**Next:** Runtime verify button styling + log file output.  

---

## Team Status
- All 6 agents online and synced
- Output Styling verified working
- Activity Indicator clobber fix ✅ APPROVED (Implementer A)
- All Session 44/45/46 Codex features ready for runtime test after restart

---

## 🎯 SESSION 45: CODEX ACTIVITY INDICATOR (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Change:** Professional activity indicators for Codex panes (like Claude TUI).
**Files updated:** `ui/modules/codex-exec.js`, `ui/daemon-client.js`, `ui/main.js`, `ui/renderer.js`, `ui/styles/layout.css`
**Details:**
1. Glyph spinner (◐◓◑◒) cycling animation
2. 7 states: thinking/tool/command/file/streaming/done/ready
3. State-specific colors for visual scanning
4. Breathing opacity animation
5. prefers-reduced-motion guard
6. Memory leak prevention via spinnerTimers cleanup

**IPC Flow:** codex-exec.js emitActivity() → daemon-client → main.js → renderer.js pane-status

**Test:** Restart app, send Codex prompt, watch pane header for activity states.
**Review:** workspace/build/reviews/codex-activity-indicator-review.md

---

## 🎨 SESSION 45: CODEX EXEC OUTPUT STYLING FIX (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Change:** Fixed Codex exec output rendering issues (RTL text, no colors).
**Files updated:** `ui/modules/codex-exec.js`, `ui/styles/layout.css`
**Details:**
1. stripBidiControls() strips Unicode RTL control chars before xterm write
2. ANSI colors: [Working...]=cyan, [Done]=green/red, [TOOL]=magenta, [CMD]=yellow, [FILE]=blue
3. CSS direction:ltr + unicode-bidi:isolate on .pane-terminal .xterm

**Test:** Restart app, send Codex prompt, verify left-to-right rendering + colored markers.
**Assigned:** Reviewer — review codex-exec styling changes.
**Next:** Runtime verification after restart.

**Handoff details:**
- Built: RTL sanitization + ANSI color markers + CSS direction fix.
- Files: `ui/modules/codex-exec.js`, `ui/styles/layout.css`.
- Next step: Reviewer approval, then runtime test.

---

## 🔧 SESSION 45: DIAGNOSTIC LOGGING FOR MESSAGE DELIVERY (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED  

**Change:** Added logging at key injection points to trace message delivery.  
**Files updated:** `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`  
**Details:** Logs now emit when inject-message is sent (single pane), when inject-message is received, and when message is queued (with queue length).  

**Test:** Trigger a single-pane message and confirm logs:
- `Stagger` "Sending inject-message to pane X"  
- `Inject` "Received inject-message for pane X"  
- `Queue` "Queued for pane X, queue length: N"

**Handoff details:**  
- Built: Delivery trace logs for single-pane injection and queue path.  
- Files: `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`.  
- Next step: Verify logs appear during delivery debugging.

---

## 🔧 SESSION 44: CODEX EXEC UX IMPROVEMENTS (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED - Ready for runtime testing  

**Change:** Codex exec now surfaces key JSONL events, avoids double newlines, and emits a single completion line.  
**Files updated:** `ui/modules/codex-exec.js`  
**Details:** Tool/command/file events render as `[TOOL]`, `[CMD]`, `[FILE]`; non-delta text only adds newline when missing; completion is `Done (exit X)` (no redundant exit line).  

**Test:** Run Codex exec and confirm event tags appear, spacing is clean, and only one completion line is shown.  
**Assigned:** Reviewer — review codex-exec UX changes.  
**Next:** Architect to coordinate runtime verification if needed.

**Handoff details:**  
- Built: Codex exec output UX improvements (event tags, newline smoothing, unified completion).  
- Files: `ui/modules/codex-exec.js`.  
- Next step: Reviewer approval + runtime verification.  
- Gotcha: Tool/command completion events are suppressed (start events shown).

---

## 🔧 SESSION 43: CODEX SESSION ID PERSISTENCE (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ REVIEWER APPROVED - Pending runtime verification  

**Change:** Codex exec session IDs are now persisted and restored on restart.  
**Files updated:** `ui/terminal-daemon.js`  
**Details:** `codexSessionId` saved in session-state, restored on spawn; cached on kill so restart preserves resume.  

**Test:** Kill a Codex pane, restart it, verify Codex resumes the previous session (resume path used).  
**Assigned:** Reviewer — run runtime restart/resume verification (watch for “Restored session id” log).  
**Next:** Architect to close once verified.

**Handoff details:**  
- Built: Codex exec session ID persistence across pane restarts and app restarts.  
- Files: `ui/terminal-daemon.js`.  
- Next step: Runtime test kill→restart Codex pane; confirm resume used and log shows “Restored session id”.  
- Gotcha: Resume depends on `session-state.json` being saved; kill path caches session id immediately.

---

## 🎨 SESSION 42: UI ENHANCEMENTS - ALL 5 APPROVED ✅

**Owner:** Implementer A (implementation), Reviewer (verification)
**Status:** ✅ ALL 5 FEATURES READY FOR USER TESTING

### Features Approved:
| # | Feature | Keybind | Description |
|---|---------|---------|-------------|
| 1 | WebGL Addon | - | GPU-accelerated terminal rendering |
| 2 | Search | Ctrl+F | Find text in terminal with navigation |
| 3 | Focus Ring | - | Teal glow (#4ecca3) on active pane |
| 4 | Target Preview | - | Hover dropdown highlights target panes |
| 5 | Command Palette | Ctrl+K | 18 commands, fuzzy search, keyboard nav |
| 6 | Dim Inactive Panes | - | Non-focused panes at 85% brightness |

**Files changed:** terminal.js, renderer.js, layout.css, index.html, package.json
**Reviews:** All at `workspace/build/reviews/`

### This Restart Should Verify:
1. **Ctrl+K** - Command Palette opens with 18 commands, fuzzy search works
2. **Ctrl+F** - Search bar appears in terminal, Enter/Shift+Enter navigate
3. **Focus Ring** - Active pane has teal glow border
4. **Target Preview** - Hover dropdown options to see pane highlights
5. **WebGL** - Smooth terminal rendering (check npm console for "WebGL renderer activated")
6. **Dim Inactive** - Non-focused panes appear dimmer (85% brightness)

---

## ✅ SESSION 40: VERIFICATION COMPLETE

### Message Accumulation Fix - RUNTIME VERIFIED
**Verification:** All 5 agents checked in with messages arriving in SEPARATE conversation turns.
- Investigator: ✅ Separate turn
- Reviewer: ✅ Separate turn
- Implementer A: ✅ Separate turn
- Implementer B: ✅ Separate turn
- Orchestrator: ✅ Separate turn

**Stress Test (Multi-Trigger Load):** 3 rapid sequential messages (1-2s apart) all arrived separately. ✅ PASSED

**Conclusion:** Session 39 fixes (pre-flight idle check, verification retry, safetyTimer timing) are working correctly under normal and load conditions. No message concatenation observed.

### Verification Complete (Session 40)
- [x] Message accumulation fix - ✅ VERIFIED (stress test passed, all messages separate)
- [x] Pre-flight idle check - ✅ VERIFIED (logs show waiting for idle)
- [x] Input lock bypass - ✅ VERIFIED (Allowing programmatic Enter logs)
- [x] Ack-timeout fix - ✅ VERIFIED (returns verification_failed, no false failures)
- [x] Verification retry - ✅ CODE VERIFIED (lines 581-599)
- [ ] Focus-steal fix - CODE VERIFIED, needs user command bar test
- [ ] Input lock icons - CODE VERIFIED, needs UI visibility check
- [ ] Codex respawn - deferred (all panes healthy)
- [ ] Inspector/Reliability tabs - CODE VERIFIED, visual check deferred

---

## 🔧 SESSION 41: IPC Guard Hardening (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED  

**Change:** Added method-level dependency checks in IPC handlers to prevent crashes when ctx deps are partially unavailable.  
**Files updated:** `ui/modules/ipc/state-handlers.js`, `ui/modules/ipc/conflict-queue-handlers.js`  
**Notes:** State handlers now validate watcher/triggers methods; conflict queue validates watcher methods before use.  
**Next:** Architect to decide on ipc-handlers.js / terminal.js split plan (proposal sent via lead trigger).

---

## 🔧 SESSION 41: Terminal Injection Extraction (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED  

**Change:** Extracted the injection/verify/send/queue logic into a dedicated module to reduce risk in `terminal.js`.  
**Files updated:** `ui/modules/terminal/injection.js`, `ui/modules/terminal.js`  
**Notes:** `terminal.js` now delegates focus/enter/verify/send/queue logic to `terminal/injection.js` via a controller.  
**Next:** Reviewer sanity-check behavior; then proceed with remaining terminal.js split targets (xterm setup, recovery).

---

## 🔧 SESSION 41: Terminal Recovery Extraction (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED  

**Change:** Extracted recovery/unstick/sweeper logic into `terminal/recovery.js` to reduce risk in `terminal.js`.  
**Files updated:** `ui/modules/terminal/recovery.js`, `ui/modules/terminal.js`  
**Notes:** `terminal.js` now delegates unstick/restart/nudge/sweeper logic via a recovery controller.  
**Next:** Reviewer sanity-check runtime behavior; remaining split targets: xterm setup, input-lock.

---

## 🔧 SESSION 41: IPC Handler Registry Split (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED  

**Change:** Split `ipc-handlers.js` handler registration list + background process helpers into dedicated modules.  
**Files updated:** `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/background-processes.js`, `ui/modules/ipc-handlers.js`  
**Notes:** `ipc-handlers.js` now calls `registerAllHandlers(registry)` and delegates cleanup/list helpers.  
**Follow-up:** Removed duplicate `broadcastProcessList` from `process-handlers.js` and reused background-process helper.  
**Next:** Reviewer sanity-check; if OK, continue IPC split (context/builders optional).

---

## 🚨 SESSION 39: MESSAGE ACCUMULATION BUG FIXED

### Bug Observed This Session
**Symptom:** Multiple agent messages arriving concatenated in single conversation turn.
- Reviewer #3 + Orchestrator #5 arrived together
- Reviewer #5 + #7 + Implementer-A #4 arrived together
- Pattern: First Enter fails, text stays in textarea, next message appends

### Root Causes Identified (Reviewer analysis)

**1. safetyTimer fires too early**
- `clearTimeout(safetyTimer)` was at line 1198 (inside setTimeout callback)
- safetyTimer (1000ms) fires BEFORE callback reaches line 1198
- Causes false "Delivery failed" logs

**2. verifyAndRetryEnter false positive (PRIMARY CAUSE)**
- Line 581-583 returned `true` ("likely succeeded") without prompt confirmation
- If Claude was already outputting, verification saw output and assumed success
- But Enter was ignored (Claude busy), text stayed in textarea

### Fixes Applied (Implementer A, Reviewer APPROVED)

**Fix #1: safetyTimer timing (line ~1159)**
- Moved `clearTimeout(safetyTimer)` to first line inside setTimeout callback
- Timer cleared immediately when enterDelay completes

**Fix #2: Pre-flight idle check (lines 1189-1204)** ✅ APPROVED
- Before sending Enter, wait up to 5s for pane to be idle
- Prevents sending Enter while Claude is mid-output
- 100ms polling, bounded timeout, graceful fallback

**Fix #3: Verification retry (lines 581-599)** ✅ APPROVED
- Removed "likely succeeded" fallback that returned `true` without prompt
- Now retries Enter if retriesLeft > 0
- Returns `false` and marks stuck if retries exhausted
- Defense-in-depth if fix #2 doesn't catch it

**Files:** `ui/modules/terminal.js`
**Review:** `session39-verification-false-positive-fix-review.md`

---

## 🔄 THIS RESTART SHOULD VERIFY

### Message Accumulation Fix (Session 39)
**What was broken:** Agent messages arriving concatenated (multiple messages in one turn)

**The fixes:**
1. safetyTimer cleared earlier (prevents false timeout)
2. Pre-flight idle check (waits for Claude idle before Enter)
3. Verification retry (retries Enter instead of false positive)

**How to verify:**
- Watch agent check-ins: each message should arrive in its OWN conversation turn
- No concatenation like `(AGENT-A #1): ...(AGENT-B #1): ...`
- Check npm console for "waiting for idle before Enter" logs
- Check for "No prompt detected, retrying Enter" if retries needed

**Success:** Messages arrive separately in distinct turns
**Failure:** Multiple agent messages still arrive together in one turn

---

## 🚨 SESSION 38: FIXES COMMITTED

### Bug Discovered at Session Start
**Symptom:** All Claude panes (1, 3, 6) stuck at initial prompt. User had to manually unlock pane to push through.

**Root Cause (Investigator analysis confirmed by Architect):**
The bypass check in `attachCustomKeyEventHandler` is TOO NARROW:
```javascript
// Current (broken):
if (event.key === 'Enter' && !event.isTrusted) {
  if (terminal._hivemindBypass) { ... allow ... }
}
```

- Electron's `sendInputEvent` produces `event.key === 'Return'` (not 'Enter')
- OR it produces `event.isTrusted === true`
- Either way, the condition is FALSE, bypass check never runs
- Input lock then blocks the key because panes are locked by default

**Fix Applied by Implementer A:**
```javascript
// isEnterKey covers all variants
const isEnterKey = event.key === 'Enter' || event.key === 'Return' || event.keyCode === 13;

// Bypass check runs FIRST, before isTrusted check
if (isEnterKey && (event._hivemindBypass || terminal._hivemindBypass)) {
  log.info(`Terminal ${paneId}`, `Allowing programmatic Enter (hivemind bypass, key=${event.key}, isTrusted=${event.isTrusted})`);
  return true;
}
```

**Files:** `ui/modules/terminal.js` (2 locations: lines 806-821 and 929-944)
**Architect Verified:** ✅ Both blocks match, bypass runs before lock check
**Reviewer:** ✅ APPROVED (Session 38) - Review: `session38-input-lock-bypass-review.md`
**Status:** ✅ RUNTIME VERIFIED (Reviewer, Session 38)
**Verification (01:06 UTC):**
- All 3 Claude panes (1, 3, 6) auto-submitted identity messages without manual intervention
- Trigger delivery working: implementer-a #1 → lead delivered successfully
- No "Blocked synthetic Enter" logs - Enter is succeeding normally

### Agents Online This Session
- Architect: ✅ Online
- Orchestrator: ✅ Online
- Implementer A: ✅ Online
- Implementer B: ✅ Online
- Investigator: ✅ Online
- Reviewer: ✅ Online

### Minor Anomalies Found (Non-Blocking)
1. **False "Delivery Failed" Timeouts** - Cosmetic logging issue
   - `INJECTION_LOCK_TIMEOUT_MS` (1000ms) fires before `verifyAndRetryEnter` completes
   - Messages actually delivered successfully
   - Owner: Implementer B (low priority)

2. **Test Results UI Error** at startup (05:01:17)
   - `[TR1] Error loading test results TypeError: Cannot read properties of null (reading 'length')`
   - Owner: Implementer A (low priority)

3. **Trigger Delivery Ack Timeouts** - Likely false negatives in ack criteria
   - Logs show Enter sent for panes 1/3/6 but `Delivery timeout` fires in triggers
   - Root cause: `doSendToPane()` returned `success:false` when `verifyAndRetryEnter()` fails (no output yet), so daemon-handlers suppressed `trigger-delivery-ack`
   - Fix applied by Implementer B: when Enter sent but verification fails, return `{ success:true, verified:false, reason:'verification_failed' }` so ack is emitted
   - Files: `ui/modules/terminal.js`
   - Owner: Implementer B (DONE) → Reviewer verify

---

## 🔄 NEXT PRIORITIES

### Pending Runtime Verification
1. **Focus-Steal Fix** - Command bar responsiveness during injections
2. **Per-Pane Input Lock UI** - Lock icons visible, Ctrl+L toggle works
3. **Codex Respawn** (`3f93384`) - Kill a Codex pane, click Restart, verify recovery
4. **Inspector/Reliability Tabs** - Visual check in right panel

---

## 🚀 SESSION 37: VERIFICATION (Previous)

### User-Verified Session 37
- ✅ **Per-Pane Input Lock WORKING** - Typing blocked when locked, toggle works, command bar unaffected
- ✅ **Auto-Submit WORKING** - Messages submit without manual Enter (tested panes 1-5)
- ❌ **REGRESSION**: Session 38 revealed auto-submit broken for initial prompts (bypass check too narrow)

### ✅ Focus-Steal + Batching Fix - APPROVED (Session 37)
**Root Cause:** Terminal.input() is NO-OP for Claude ink TUI (same as Fix R with PTY \r).

**Fix (Implementer A):**
- Disabled Terminal.input for Claude panes
- Always uses sendTrustedEnter
- Fixed focus restore timing (immediate after Enter, before verification)

**Reviewer:** ✅ APPROVED (Session 37)
**Files Changed:** `ui/modules/terminal.js`

### Per-Pane Input Lock ✅ APPROVED (Session 36)
**Implementation (Implementer A):**
- `inputLocked` map in terminal.js, default true for all panes
- Key handler blocks input when locked (except ESC for unstick)
- Ctrl+V paste blocked when locked
- Right-click paste blocked when locked
- Lock icon in pane header (all 6 panes) - click to toggle
- Ctrl+L shortcut to toggle lock on focused pane
- PTY writes (sendToPane/triggers) unaffected

**Files Changed:** `ui/modules/terminal.js`, `ui/index.html`, `ui/styles/layout.css`, `ui/renderer.js`

---

## 🚀 SESSION 35: AUTO-SUBMIT FIX V3

### Previous Session
- ❌ **Auto-submit broken** - Messages stuck in textarea, required manual push

### Auto-Submit Fix V3 ✅ APPROVED (Ready for Restart)
**Root Cause Identified:**
- `sendTrustedEnter` uses Electron's `sendInputEvent` which produces `isTrusted=false` events
- `attachCustomKeyEventHandler` blocks Enter unless `_hivemindBypass` is set
- `sendTrustedEnter` never set `_hivemindBypass` → programmatic Enter was blocked by our own code

**Fix Applied (Implementer A) - V3 UPDATED:**
- **ROOT CAUSE FIX:** `_hivemindBypass` flag set before `sendTrustedEnter`, cleared after
- `sendEnterToPane()` sets `terminal._hivemindBypass = true` before Enter
- `aggressiveNudge()` uses same bypass pattern
- Stuck sweeper uses `sendEnterToPane()` helper
- All 3 call sites now have bypass flag
- Also includes: Terminal.input() path, stricter verification, prompt-ready detection
- Investigator feedback integrated: `?` added to prompt patterns, verify delay 100ms→200ms

**Reviewer:** ✅ APPROVED (Session 35) - Review: `workspace/build/reviews/auto-submit-fix-v3-review.md`

**Files Changed:** `ui/modules/terminal.js`

### Additional Cleanup (Reviewer Finding)
- Dead `.pane-grid` CSS in `layout.css:115-130` (15 lines) - assigned to Implementer A

---

## 🔄 THIS RESTART SHOULD VERIFY (Session 38)

### 1. Textarea Accumulation Fix (`a686d0c`)
**What was broken:** When Enter failed to submit, text stayed in textarea. Next injection APPENDED text, next Enter submitted BOTH as one corrupted blob. Agent messages arrived concatenated.
**The fix:** Send Ctrl+U (clear line, `\x15`) before each PTY text write to clear any stuck input.
**How to verify:**
- Watch agent check-ins: each message should arrive in its OWN conversation turn
- If two agents message you, you should see two separate turns, not one concatenated blob
**Success:** Messages arrive separately, no concatenation like `(AGENT-A #1): ...(AGENT-B #1): ...`
**Failure:** Multiple agent messages still arrive stuck together in one turn

### 2. Ack-Timeout Verification Fix (`a686d0c`)
**What was broken:** `doSendToPane()` returned `success:false` when Enter sent but verification timed out, causing false "Delivery failed" logs.
**The fix:** Return `{success:true, verified:false, reason:'verification_failed'}` when Enter sent but verification fails.
**How to verify:**
- Check npm console for delivery status after trigger sends
**Success:** No false "Delivery failed" logs when messages actually delivered
**Failure:** Still seeing "Delivery failed" for messages that arrived

### 3. Message Accumulation Bug Documentation (`a686d0c`)
**What was done:** Added "RECOGNIZE MESSAGE ACCUMULATION BUG" section to all CLAUDE.md files.
**How to verify:**
- Fresh Claude agents should recognize the bug pattern without user explanation
- If messages arrive concatenated, agents should log to errors.md (not celebrate "all agents checked in")
**Success:** Agents recognize the pattern and report it as a bug
**Failure:** Agents treat concatenated messages as normal batching

### 2. UI Overhaul (Re-verify)
- Main pane (left, 60%) with Architect
- Side column (right, 40%) with 5 panes
- Click side pane → swaps with main
- Command bar at bottom with target selector

### 3. Dead CSS Cleanup (If Completed)
- `.pane-grid` rules removed from `layout.css:115-130`

---

## 🚀 SESSION 34: UI OVERHAUL SPRINT (Previous)

**Goal:** Reorganize UI for command center workflow
- Main pane (left, large) - default Architect
- Side column (right, 5 smaller panes) - click to swap with main
- Command bar (bottom, full-width) - replaces Msgs tab + broadcast bar
- Single input method, clean layout, no collision bugs

### Tasks
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Main pane + side column layout | Implementer A | ✅ Done |
| 2 | Pane swap functionality | Implementer B | ✅ Done |
| 3 | Command bar input | Implementer A | ✅ Done |
| 4 | Cleanup dead code | Reviewer | 🔄 Ready |

### ✅ Task #1: Main Pane + Side Column Layout - DONE
- Main pane (Architect) on left, 60% width
- Side column with 5 stacked panes on right, 40% width
- Flex layout replaced CSS grid for better control
- Files changed: `ui/index.html`, `ui/styles/layout.css`

### ✅ Task #2: Pane Swap Functionality - DONE
- Click any side pane swaps it into main position
- Previous main pane moves into the clicked pane's slot
- Main pane ID tracked via DOM dataset (`body[data-main-pane-id]`)
- Xterm fit/resize runs after swap
- Files changed: `ui/renderer.js`

### ✅ Task #3: Command Bar Input - DONE
- Target selector dropdown defaults to Architect
- Supports all 6 agents + "All Agents" option
- Dynamic placeholder updates based on selected target
- Delivery status indicator (⏳ sending / ✓ delivered / ✕ failed)
- Works in both SDK and PTY modes
- Explicit `/N` prefix still supported, overrides dropdown
- Files changed: `ui/index.html`, `ui/styles/layout.css`, `ui/renderer.js`

### Session 34 Verification (Complete)
- ✅ Stuck message sweeper (`6e5d7f2`) - startup log confirmed
- ✅ Cost alert badge (`00934ce`) - HTML/CSS/handler verified
- ✅ IPC handler aliases (`645e83c`) - code verified, no errors in logs

---

## 🔄 THIS RESTART SHOULD VERIFY (Session 35)

### UI Overhaul - Command Center Layout
**What changed:** Complete UI reorganization

1. **Main Pane (left, 60%)**
   - Should show Architect (pane 1) by default
   - Large, prominent view
   - Success: Big pane on left with Architect terminal
   - Failure: Old 6-pane grid still showing

2. **Side Column (right, 40%)**
   - 5 smaller panes stacked vertically (panes 2-6)
   - Click any side pane → swaps with main pane
   - Success: Click Orchestrator → it becomes main pane, Architect moves to side
   - Failure: Click does nothing or breaks layout

3. **Command Bar (bottom)**
   - Full-width input at bottom of screen
   - Dropdown to select target (default: Architect)
   - Delivery status shows after sending
   - Success: Type message, see it go to selected agent
   - Failure: Old broadcast bar still there, or input doesn't work

4. **Cleanup (Task #4 - may still be in progress)**
   - Old Msgs tab should be removed or hidden
   - Old broadcast bar should be gone
   - If still visible, Task #4 not complete yet

---

## 🔄 SESSION 33 COMMITS

| Commit | Description |
|--------|-------------|
| `645e83c` | fix: add IPC handler aliases for frontend compatibility |
| `00934ce` | feat: add cost alert badge to toolbar |

---

## ✅ TASK #6: STUCK MESSAGE SWEEPER - COMMITTED

**Commit:** `6e5d7f2`

**Problem:** Messages get stuck in Claude pane textareas when Enter fails - verifyAndRetryEnter exhausts 5 retries but message remains unsubmitted indefinitely.

**Fix:** Safety net sweeper that periodically retries Enter on stuck Claude panes.
- Every 30 seconds, checks panes marked as "potentially stuck"
- If pane is idle (10s no output) and marked stuck, retries Enter
- Clears stuck status when pane gets any output
- Gives up after 5 minutes

**Files changed:** `ui/modules/terminal.js`

---

## ✅ SESSION 33 TASKS - UI AUDIT SPRINT

### Task #4: IPC Alias Normalization (Implementer B) ✅ COMMITTED
- **Problem:** IPC mismatches broke Performance tab, Templates tab, Rollback UI, and pane project selection
- **Fix:** Added backend IPC aliases + response normalization; no frontend changes
- **Commit:** `645e83c`
- **Review:** `workspace/build/reviews/task4-ipc-aliases-review.md`

### Task #5: costAlertBadge Missing Element (Implementer A) ✅ COMMITTED
- **Problem:** `costAlertBadge` referenced in JS but missing from HTML
- **Fix:** Added HTML element, CSS styling with pulse animation, click handler
- **Commit:** `00934ce`

---

## 🔄 THIS RESTART SHOULD VERIFY

### 1. Stuck Message Sweeper (`6e5d7f2`)
**What was broken:** Messages stuck in Claude pane textareas indefinitely after verifyAndRetryEnter exhausted 5 retries
**The fix:** Safety net sweeper that retries Enter every 30s on stuck panes
**How to verify:**
- Check npm console on startup for: `Stuck message sweeper started (interval: 30s)`
- If a message gets stuck, watch for: `StuckSweeper [pane]: Attempting recovery Enter`
**Success:** Log appears on startup, sweeper recovers stuck messages
**Failure:** No startup log, or sweeper doesn't fire on stuck messages

### 2. IPC Handler Aliases (`645e83c`)
**What was broken:** Performance tab, Templates tab, Rollback UI non-functional due to channel mismatches
**How to verify:** Open each tab in right panel, verify no console errors
**Success:** Tabs load data without errors
**Failure:** Console shows IPC handler not found errors

### 3. Cost Alert Badge (`00934ce`)
**What was broken:** `costAlertBadge` element referenced in JS but missing from HTML
**How to verify:** Badge should be visible in toolbar (may be hidden by default, shows on cost alerts)
**Success:** No console errors about costAlertBadge

---

## ✅ SESSION 33 VERIFICATION COMPLETE (Pre-Commits)

1. **Inspector Tab** (`a95de97`) - ✅ VERIFIED - Tab visible at position 4, labeled "Insp"
2. **Reliability Analytics** (`13f692e`) - ✅ VERIFIED - 28 events, 28 delivered, 100% success
3. **SDK Mode Sync** (`a95de97`) - ⏳ Deferred (low priority, code verified)
4. **Codex Respawn** (`3f93384`) - ✅ Code ready, defer testing (all 6 panes healthy)

---

## ✅ SESSION 32 COMMITS

| Commit | Description |
|--------|-------------|
| `a95de97` | fix: Inspector tab visibility + SDK mode state drift |

### Inspector Tab Bug ✅ COMMITTED
- **Problem:** User couldn't see Inspector tab in right panel (10th of 10 tabs, scrolled out)
- **Fix:** Moved Inspector to position 4, shortened all tab names
- **Owner:** Implementer A

### SDK Mode State Drift ✅ COMMITTED
- **Problem:** 4 separate SDK mode flags could drift out of sync
- **Fix:** Centralized `setSDKMode(enabled)` helper in `ui/renderer.js` to sync all flags + persist settings
- **Owner:** Implementer B

### Runtime Verification (Reviewer, from app.log)
1. ✅ **Message Sequence Reset** - All #1 messages ACCEPTED, none SKIPPED
2. ✅ **6-Pane Spawn** - All 6 panes reached running state
3. ✅ **Auto-Submit** - Adaptive delay + force-inject working
4. ✅ **Trigger Delivery** - All agent messages delivered
5. ⏳ **Codex Exec Respawn** - Requires user to kill pane and click Restart

### Agent Status
- Architect: ✅ Online, completed SDK mode fix
- Orchestrator: ✅ Online
- Implementer A: ✅ Online, completed Inspector tab fix
- Investigator: ✅ Online, found SDK drift issue
- Reviewer: ✅ Online, completed runtime verification from logs
- Implementer B: ✅ Online (SDK mode sync fix complete)

---

## 🔄 PREVIOUS VERIFICATION ITEMS (Session 31)

1. **Codex Exec Respawn** (`3f93384`)
   - Kill a Codex pane (2, 4, or 5), then click Restart
   - Success: PTY recreates, pane resumes working
   - Failure: "Terminal not found" error persists

2. **lead.txt Trigger Fix** (existing)
   - After agent restarts, first message with session banner should NOT be SKIPPED
   - Success: No "SKIPPED duplicate" for `#1` messages with session banner
   - Failure: Messages still dropped

3. **Message Inspector Panel** (`eb3ddff`)
   - Tab visibility fix in progress (Session 32)

4. **Reliability Analytics** (`13f692e`)
   - In Inspector panel - verify after visibility fix

5. **All 6 Panes Spawn**
   - Session 31: All 6 spawned successfully ✅
   - Session 32: 5/5 agents checked in ✅

---

## 🟢 P2 Debugging Sprint - COMPLETE (Jan 29, 2026)

### Commits (Session 30-31)
| Commit | Description |
|--------|-------------|
| `eb3ddff` | feat: add message inspector panel |
| `42d3641` | fix: jest.useFakeTimers for triggers tests |
| `5b6f111` | feat: add integration test harness |
| `13f692e` | feat: add reliability analytics |
| `d947758` | feat: add automated test gate |
| `3f93384` | fix: Codex exec pane respawn + jest timer cleanup (Session 31) |

### Tasks Completed
| Task | Owner | Commit |
|------|-------|--------|
| #3 Integration test harness | Implementer B | `5b6f111` |
| #5 Message inspector panel | Implementer A | `eb3ddff` |
| #8 Reliability analytics | Implementer A | `13f692e` |
| #10 Automated test gate | Implementer A | `d947758` |

### Features Delivered
- Inspector tab with trigger event logging
- Sequence tracking and delivery status visibility
- Reliability metrics (sent/delivered/failed/timeout/skipped)
- Per-pane, per-mode breakdowns with latency tracking
- Rolling windows (15m, 1h) for trend analysis
- Pre-commit Gate 5: Jest integration with Windows compatibility
- 433 tests across 12 suites

---

## 🟢 P1 Visibility - COMPLETE (Jan 29, 2026)

All 4 tasks completed and committed:
- **Commit 0691003:** Agent health dashboard + message delivery visibility (Implementer A)
- **Commit 526600b:** One-click unstick + sync indicator (Implementer B)

Features delivered:
1. Per-pane health indicators (last output time, stuck warnings)
2. Message delivery confirmation UI
3. Unstick escalation (nudge → interrupt → restart)
4. Sync indicator chips for shared files

---

## ⚠️ KNOWN ISSUES

### PTY Injection Delays During Streaming (Session 32)
- **Problem:** When agent streams output continuously for 30+ seconds without 500ms pause, messages queue
- **Evidence:** User had to manually push message; log showed `Message queued 30s+`
- **Root Cause:** PTY injection requires idle window; agent was streaming without breaks
- **Status:** DOCUMENTED in errors.md - known PTY limitation, not a bug
- **Mitigation:** 60s emergency force-inject exists; user can also manually push

### Codex Exec Respawn (Session 30) - FIXED
- **Problem:** Pane 4 (Codex exec) died mid-session, no way to respawn without full app restart
- **Fix:** Commit `3f93384` - restartPane() now calls pty.create() before spawnClaude() for Codex panes
- **Status:** ✅ FIXED (Session 31) - Pending runtime verification

### Message Sequence Tracking Friction
- **Problem:** Agents sending low sequence numbers get dropped as duplicates
- **Impact:** Messages to lead.txt sometimes not delivered
- **Workaround:** Agents use higher sequence numbers or all.txt broadcast
- **Note:** App restart resets message-state.json

---

## ✅ Session 30 - Complete

### Implementer B Progress
- Added Jest tests for `modules/watcher.js` and `modules/logger.js`
- Added Jest setup file with global logger mock
- Updated Jest config to expand coverage collection + thresholds
- Coverage (Jan 29): Statements **63.9%**, Branches **51.58%**, Functions **71.42%**, Lines **64.45%**
- Added IPC integration harness + smoke test for all `ui/modules/ipc/*.js`
- Added tests for `mcp-server.js` and `modules/codex-exec.js`
- IPC harness clears perf-audit interval to avoid lingering timers in tests

### Next Steps
- **Reviewer:** Spot-check new test coverage (`codex-exec`, `mcp-server`, IPC harness) and confirm no open-handle warnings for these suites
- **Architect/Orchestrator:** Assign #8 / #10 now that #3 is complete

### Implementer B Handoff (Jan 29, 2026)
- Built: IPC test harness + smoke registration test for all IPC handler modules
- Added: Targeted behavior tests for settings/shared-context/agent-claims handlers
- Added: Unit tests for `modules/codex-exec.js` and `mcp-server.js`
- Files changed: `ui/__tests__/helpers/ipc-harness.js`, `ui/__tests__/ipc-handlers.test.js`, `ui/__tests__/codex-exec.test.js`, `ui/__tests__/mcp-server.test.js`
- Tests run: `npx jest --runInBand __tests__/codex-exec.test.js __tests__/mcp-server.test.js __tests__/ipc-handlers.test.js`

---

## ✅ Session 28 - Complete

### Commit
`a36933b` - fix: comprehensive error handling across ui/ codebase
`b35e0b8` - docs: update status and review notes

### Summary
- **19 findings** identified by Investigator
- **37 handlers** added across **9 files**
- **475 insertions**, 79 deletions
- All pre-commit checks passed

### Work Completed
| Agent | Files | Handlers |
|-------|-------|----------|
| Implementer A | renderer.js, terminal.js, daemon-handlers.js | 26 |
| Implementer B | main.js, watcher.js, mcp-server.js, terminal-daemon.js, ipc handlers | 11 |

### Files Modified
- ui/renderer.js - SDK IPC calls, restart, sync
- ui/modules/terminal.js - PTY writes, clipboard, spawn
- ui/modules/daemon-handlers.js - SDK interrupt calls
- ui/main.js - did-finish-load initialization
- ui/modules/watcher.js - file reads, mkdirSync, chokidar error listeners
- ui/mcp-server.js - message queue, state, trigger operations
- ui/terminal-daemon.js - PID file write
- ui/modules/ipc/checkpoint-handlers.js - rollback directory
- ui/modules/ipc/test-execution-handlers.js - package.json parsing

---

## ✅ Session 27 - Complete

### Fixes Verified This Session
| Fix | Status | Verified By |
|-----|--------|-------------|
| Stricter idle check for force-inject | ✅ RUNTIME VERIFIED | Reviewer (via Orchestrator) |
| verifyAndRetryEnter rewrite | ✅ RUNTIME VERIFIED | Reviewer (via Orchestrator) |
| Delivery-ack sequencing | ✅ RUNTIME VERIFIED | Reviewer - no SKIPPED duplicates |
| Logger file output (app.log) | ✅ RUNTIME VERIFIED | Reviewer - appends at runtime |
| CLAUDE.md quoting guidance | ✅ COMPLETE | Implementer A |
| Version-fix comment cleanup | ✅ COMPLETE | Implementer B |

### Bug Found & Fixed (Session 27)
- **Problem:** Messages stuck in textarea despite "Enter succeeded" logs
- **Root Cause (Investigator):** verifyAndRetryEnter checked textarea.value which is always empty after PTY write (false positive)
- **Additional Root Cause:** Original force-inject used `|| waitedTooLong` - bypassed idle check after 10s
- **Fix (Implementer A):**
  1. Force-inject now requires 500ms idle (`&& isIdleForForceInject` instead of `|| waitedTooLong`)
  2. 60s emergency fallback (prevents infinite wait)
  3. verifyAndRetryEnter now checks output activity instead of textarea.value

### Verification Results (Jan 29, 2026)
- **Idle check + verifyAndRetryEnter**: No stuck messages, no manual push needed
- **Delivery-ack sequencing**: Messages record after Enter success, no SKIPPED duplicates
- **app.log**: Appends during runtime as expected
- **Agent communication**: 5/6 agents checked in via triggers, all delivered automatically

### Backlog (Low Priority)
1. SDK send failure UI state (enhancement)
2. Remaining version-fix markers in other files

---

## ✅ Session 25 - Complete (Previous)

### Session 24 Fixes Verified
| Fix | Status | Verified By |
|-----|--------|-------------|
| Delivery-ack tracking | ✅ APPROVED | Reviewer - code audit |
| Auto-submit adaptive delay | ✅ VERIFIED | Burst test - 10/10 msgs on Claude panes 3+6, ~265ms spacing, zero manual push |
| PTY serialization | ✅ VERIFIED | Burst test - proper queue handling, no collisions |
| Typing-guard | ✅ VERIFIED | Investigator - console logs show queueing + 10s force-inject |
| Codex exec throughput | ✅ VERIFIED | Investigator - 8 ticks @3s, no drops |
| Codex exec events | ✅ WORKING | No warning spam observed |

### Session 25 Commits
1. `fae3a0b` - fix: reset sequence tracking on agent session restart (Implementer B)

---

## ✅ Session 24 - Complete (Previous)

### Commits
1. `0414e0a` - fix: handle item.started/completed events in Codex exec parser (Implementer A)
2. `80140b8` - fix: move recordMessageSeen after delivery confirmation (Implementer A)
3. `14e4337` - fix: adaptive Enter delay and focus retry for auto-submit reliability (Implementer A)
4. `25d9d7b` - feat: delivery-ack tracking for PTY trigger sequencing (Implementer B)

---

## Session 23 Summary (Previous)

### Message Sequencing Bug Diagnosed

**Problem:** Agent messages blocked as "SKIPPED duplicate" even though they never reached the target.

**Root Cause:** `triggers.js` calls `recordMessageSeen()` BEFORE `sendStaggered()` completes. If injection fails (focus issue, terminal busy, etc.), the message is still marked as "seen" and retries are blocked.

**Workaround Applied:** Reset `workspace/message-state.json` to clear all lastSeen values.

**Proper Fix Needed:** Move `recordMessageSeen()` to AFTER confirmed delivery (logged in errors.md).

**Update (Implementer B, Jan 28, 2026):** Implemented delivery-ack tracking for PTY triggers. `handleTriggerFile()` now creates a deliveryId and records sequences only after renderer sends `trigger-delivery-ack` when `sendToPane` completes. Added pending delivery map + timeout, sendToPane onComplete, daemon-handlers ack, and main IPC forwarder. **Requires restart + Reviewer verification.**

---

## ✅ Earlier Session 23 Status

**HYBRID FIX VERIFIED AND COMMITTED** - Commit `f52a403`

User confirmed all agents started correctly without manual intervention. Claude panes (1, 3, 6) auto-submit working via hybrid PTY+sendTrustedEnter approach.

### What's in the commit:
- Hybrid injection: `pty.write(text)` + `sendTrustedEnter()` for Claude panes
- xterm.js upgrade 5.3.0 → 6.0.0 (@xterm/xterm scoped packages)
- Global injection mutex to prevent cross-pane races
- Version-fix comment cleanup in terminal.js
- Logger conversion (console.* → structured logger)

### Remaining Sprint 2 work to commit:
- IPC null checks (6 modules)
- Logger conversions (daemon-client, terminal-daemon, mcp-server)
- Version-fix cleanup (remaining files)

### Known open issues (LOW priority):
- Focus-restore bug: Cross-pane focus not restored if user was in different terminal (blockers.md)
- lead.txt duplicate drop: Sequence reset on agent restart without app restart (blockers.md)

---

## Sprint 2 Update (Jan 28, 2026)

- Implementer B: Added defensive null checks to 6 IPC modules (state-handlers, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Guards prevent crashes when watcher/triggers/log providers are unset.
- Implementer B: Runtime stress test (worker panes) **user-confirmed** auto-submit + spacing (Jan 28, 2026 19:23–19:26Z). Typing-guard + Codex exec throughput still pending.
- Implementer B: Added delivery-ack tracking for trigger sequencing (PTY). recordMessageSeen now occurs only after renderer `trigger-delivery-ack`; added deliveryId tracking + timeout, sendToPane onComplete, daemon-handlers ack, and main IPC forwarder. **Pending Reviewer verification + restart.**
- Next: Reviewer to spot-check return shapes and confirm no regressions.

### Implementer B Handoff (Jan 28, 2026)

- Built/verified: Worker-pane runtime stress test; user confirmed auto-submit + spacing.
- Built: Trigger delivery-ack fix for message sequencing (PTY path).
- Files updated: `workspace/build/status.md`, `workspace/shared_context.md`.
- Files updated (delivery-ack): `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`, `ui/modules/terminal.js`, `ui/main.js`.
- Next agent: **Architect** — close Priority 1 verification and proceed; **Reviewer/Investigator** — validate typing-guard + Codex exec throughput under load.
- Next agent (delivery-ack): **Reviewer** — verify trigger sequence recording only occurs after renderer ack; confirm no more "SKIPPED duplicate" when injection fails; restart required.
- Gotchas: No log-only proof of spacing; confirmation relied on user observation (Jan 28, 2026 19:23–19:26Z).
- Implementer B: Added `interrupt-pane` IPC (Ctrl+C) + auto Ctrl+C after 120s no output in main-process stuck detection.
- Implementer B (self-review): interrupt-pane return shape consistent; auto Ctrl+C uses daemonClient lastActivity (output). Known limitation: codex-exec terminals ignore PTY writes so Ctrl+C is a no-op there; stuck notice may repeat every 30s while idle.
- Implementer B: Converted `ui/daemon-client.js` console.* calls to structured logger (modules/logger) following renderer.js pattern.
- Implementer B: Converted remaining console.* in `ui/terminal-daemon.js` (stdout/stderr writes) and `ui/mcp-server.js` (modules/logger) for structured logging.
- Implementer B: Added GLOBAL PTY injection serialization in `ui/modules/terminal.js` (global mutex + queued sendToPane with completion callback) to avoid cross-pane focus/Enter races.
- Implementer B: Added trigger delivery ack flow to prevent premature sequence recording (files: `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`, `ui/modules/terminal.js`, `ui/main.js`).
- Next: Investigator to verify trigger injection ordering under rapid multi-message conditions.
- Investigator: Added ANSI bold yellow `[TRIGGER]` prefix for PTY injections (notifyAgents/auto-sync/trigger file/routeTask/auto-handoff/direct messages). Updated status bar hint text in `ui/index.html`.
- Architect: Fixed Codex exec running-state detection to be case-insensitive so trigger delivery no longer skips Codex panes showing "Codex exec mode ready".
- Reviewer: Approved auto-interrupt behavior + IPC channel response.
- Reviewer: Approved daemon-client logger conversion (no behavior change expected).
- Reviewer: Approved sendToPane xterm 6.0.0 terminal.input refactor (restart verification pending).
- Next: Architect to verify terminal.input fix on restart (arrival spacing, no batching).

---

## Historical Context (Sessions 18-19)

### Session 18-19 Summary (for reference):
1. **Session 17 hardening NOT fully verified** — app launches and agents orient, but auto-submit still requires manual Enter in some cases. User had to manually submit trigger messages multiple times this session.
2. **Focus-steal typing-guard** (c9a13a4) — trigger injection now deferred while user is typing in UI inputs. Fixes lost-input during active typing. `terminal.js` adds `userIsTyping()` guard to `sendToPane` and `processQueue`.
3. **Track 2 closed** — Investigated eliminating focus-steal entirely via KeyboardEvent dispatch. Web search confirmed untrusted events don't trigger default actions (Electron/DOM spec). `pty.write('\r')` also doesn't submit in Claude TUI (known from Fix R/H/I). Focus is required for `sendTrustedEnter`. Typing-guard is the complete fix for now.
4. **Web search mandate** — All 5 agent CLAUDE.md files updated with mandatory web search sections. Agents must verify external API/platform/library behavior via web search before coding or approving.
5. **xterm terminal.input() lead** — Web search surfaced `Terminal.input(data, wasUserInput?)` as potential future path to bypass focus entirely. Backlog item.

### This restart: VERIFY
1. Auto-submit works for trigger messages WITHOUT manual Enter (typing-guard fix c9a13a4 is now live)
2. Auto-submit works when user is NOT typing (if still fails, different root cause — investigate)
3. If auto-submit still fails when idle, check npm console for doSendToPane logs
4. All 6 panes spawn and orient
5. CSS renders correctly
6. No IPC errors in console

### Backlog
**DONE:**
- ✅ Structured logger (122 console.* → modules/logger) - Session 19, commit 6e438ce

**Not started:**
- Version-fix comment cleanup (172 markers)
- Electron upgrade (separate sprint)
- Sequence number compaction resilience
- Focus-steal full elimination via xterm terminal.input() API
- Trigger message UI banner (Option B — UX enhancement, separate from injection)

---

## CURRENT SPRINT: Hardening (Session 17)

**Goal:** Reduce tech debt — file splits, structured logging, comment cleanup.
**Electron upgrade:** Deferred to separate sprint.

### Phase 1 — Investigation (DONE)
### Phase 2 — Execution (DONE)
### Phase 3 — Bug fix pass (DONE)

### Verified This Session
- Fix Z (trigger encoding): Confirmed offline + live
- Codex trigger replies: Orchestrator using triggers correctly
- Backlog changes (SDK 6-pane, focus restore, Codex display fixes): Reviewer approved, kept
- Both Codex exec display blockers: RESOLVED
- Hardening Phase 2 Step 1–3: ipc-handlers split (ipc/index + ipc-state + SDK modules)
- Hardening Phase 2 MCP: mcp-handlers + mcp-autoconfig-handlers extracted
- Hardening Phase 2 Test/CI: test-execution + precommit + test-notification extracted
- Hardening Phase 2 Messaging: message-queue-handlers extracted
- Hardening Phase 2 Docs/Perf/Error: api-docs + perf-audit + error-handlers extracted
- Hardening Phase 2 State: state-handlers extracted
- Hardening Phase 2 Routing/Coord: smart-routing + auto-handoff + conflict-queue + learning-data extracted
- Hardening Phase 2 Output Validation: output-validation-handlers extracted
- Hardening Phase 2 Completion Quality: completion-quality-handlers extracted
- Hardening Phase 2 Checkpoint: checkpoint-handlers extracted
- Hardening Phase 2 Activity Log: activity-log-handlers extracted
- Handoff: Reviewer verify activity-log + checkpoint + completion-quality + output-validation + state-handlers + routing/coord modules (`ui/modules/ipc/*-handlers.js` in state/routing/quality group); eslint warnings only
- IPC bug fix pass: output-validation/completion-quality invoke fixes, emit fixes (mcp-autoconfig/test-notification/error), precommit run-tests fix, api-docs/perf-audit cleanup, 6-pane defaults

---

## 🚨 ARCHITECT: READ THIS FIRST (Jan 28, 2026)

You are the Architect (pane 1). Here's what happened:

### Session 16 Summary — Trigger Encoding Fix + Codex Communication Fix

**Fix Z — Trigger file encoding normalization (Reviewer APPROVED)**
- **Problem:** Codex panes writing trigger files via Windows `echo` or PowerShell produced garbled messages. cmd.exe uses OEM CP437, PowerShell defaults to UTF-16LE. The trigger reader assumed UTF-8.
- **Root cause:** `fs.readFileSync(filePath, 'utf-8')` in `triggers.js` can't decode UTF-16LE or handle BOM bytes.
- **Fix:** `triggers.js` `handleTriggerFile()` now reads raw bytes and detects encoding: UTF-16LE BOM → convert, UTF-8 BOM → strip, default → UTF-8. Also strips null bytes and control chars.
- **File modified:** `ui/modules/triggers.js` (lines 491-515)
- **Investigator findings:** cmd.exe echo breaks on `& | % ^ !` chars, PowerShell writes UTF-16LE by default, Codex exec degrades unicode to `???` before cmd even runs.

**Codex CLAUDE.md updates — Trigger reply instructions**
- **Problem:** Orchestrator (Codex pane 2) repeatedly responded to agent messages in terminal output instead of writing to trigger files. Required user to manually push messages. 4 consecutive failures before succeeding.
- **Root cause:** Codex defaults to conversational output. Needed explicit bash command template, not conceptual instructions.
- **Fix:** Updated CLAUDE.md for all 3 Codex panes (orchestrator, worker-b, investigator) with explicit "EVERY REPLY MUST USE THIS COMMAND" section including copy-paste echo template. Orchestrator got additional "PRIME DIRECTIVE" section at top of file.
- **Files modified:** `workspace/instances/orchestrator/CLAUDE.md`, `workspace/instances/worker-b/CLAUDE.md`, `workspace/instances/investigator/CLAUDE.md`

**Team consensus: Hardening sprint recommended**
- All 5 agents (Reviewer, Implementer A, Implementer B, Investigator, Orchestrator) unanimously recommend a hardening sprint before new features.
- Key concerns: ipc-handlers.js ~3800 lines, index.html ~4100 lines, 200+ console.logs with no logger, Electron 12 majors behind, 83 version-fix comments.
- Electron upgrade should be a separate sprint (Investigator recommendation).

### Backlog
- Focus-steal fix: save/restore activeElement unconditionally (low priority)
- Newline normalization in extracted Codex text (minor)
- Hardening sprint: file splits, structured logger, comment cleanup (pending user approval)

### This restart: verify
1. Trigger messages from Codex panes render without garbled characters (Fix Z)
2. Codex agents reply via trigger files, not terminal output (CLAUDE.md updates)
3. All 6 agents orient and communicate
4. Previous fixes still working (Codex display, line breaks, resume, badges)

### Session 13 Summary (previous)
- Fix X FAILED, Fix Y APPLIED â€” Codex exec JSONL format mismatch + windowsHide + thread.started
4. Claude panes unaffected
5. Second message to Codex pane uses resume (check npm console for "Captured thread id")

### Session 11 Summary
- **Fix V CONFIRMED** â€” Codex exec spawns without flag conflict (verified visually)
- **Fix W APPLIED** â€” JSONL parser overhaul (too aggressive â€” silenced responses)

### Session 10 Summary
- **Fix V APPLIED â€” Remove `--full-auto` from Codex exec args (conflicting flags)**

### Session 9 Summary
- **Fix U APPLIED â€” Codex exec `shell: true` (Windows ENOENT fix)**
  - Codex panes failed with `spawn codex ENOENT` â€” Node couldn't find `codex.cmd` without shell
  - Root cause: `child_process.spawn('codex', ...)` doesn't resolve `.cmd` wrappers on Windows without `shell: true`
  - Fix: Added `shell: true` to spawn options in `ui/modules/codex-exec.js` (line ~112)
  - **Lesson: On Windows, always use `shell: true` when spawning npm-installed CLIs (they're `.cmd` batch wrappers)**

### Session 8 Summary
- **Fix T APPLIED â€” Codex auto-start identity injection**
  - Codex panes (2, 4, 5) were showing "Codex exec mode ready" but never receiving their first prompt
  - Root cause: `spawnClaude()` returned early for Codex panes before the identity auto-send code
  - Fix: Added `setTimeout` (2s) in the Codex early-return block to auto-send identity via `sendToPane()`
  - File modified: `ui/modules/terminal.js` (line ~681)
  - This restart: Codex panes should auto-start with `# HIVEMIND SESSION: {Role}` prompt

### This restart: verify
1. Codex panes auto-start (not stuck on "Codex exec mode ready")
2. Identity prompt triggers codex exec pipeline
3. Codex agents orient and respond
4. Claude panes unaffected
5. Resume works on second message

### Session 7 Summary
- **Fix R FAILED** â€” `\n` did not fix Codex auto-submit (same as `\r`). Interactive ink TUI cannot be driven via PTY writes on Windows.
- **Fix S APPLIED â€” Codex exec pipeline (MAJOR CHANGE)**
  - Codex panes (2, 4, 5) now use `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox` instead of interactive Codex
  - New module: `ui/modules/codex-exec.js` â€” child_process.spawn, JSONL parsing, session management
  - First message: `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox --cd <instanceDir> -` (prompt via stdin)
  - Subsequent messages: `codex exec resume <sessionId> --json --full-auto --dangerously-bypass-approvals-and-sandbox -`
  - SessionId captured from JSONL `session_meta` event
  - Files modified: codex-exec.js (new), terminal-daemon.js, terminal.js, ipc-handlers.js, daemon-client.js, preload.js, renderer.js, config.js
  - Reviewer approved after 2 rounds (BUG-S1 sessionId fixed, BUG-S2 flag ordering fixed)
- **Investigator finding:** SDK mode hardcodes 4 panes â€” sdk-renderer.js hides panes 5/6 (low priority, PTY mode)
- **Minor gap:** Gemini CLI lacks permission suppression flag (low priority)

### This restart: verify
1. Codex panes receive messages and respond via codex exec pipeline (Fix S)
2. Resume works on second message (sessionId captured from first)
3. JSONL events render readable text in Codex panes (not raw JSON)
4. Claude/Gemini panes unaffected (PTY path unchanged)
5. All 6 agents orient autonomously

### Implementer B note (Jan 27, 2026)
- Codex spawn path is interactive PTY (ipc-handlers -> terminal.js -> daemon shell PTY).
- `codex exec --json` is non-interactive; best swap is a new child_process path (no PTY) with JSONL parsing + per-pane session id.
- Detailed recommendation sent to Architect via `lead.txt`.

### Implementer B update - Fix S (Jan 27, 2026)
- Codex exec mode implemented: Codex panes use daemon `codex-exec` (child_process.spawn) with JSONL parsing and stdout to xterm.
- New module: `ui/modules/codex-exec.js` handles exec spawn + JSONL parsing; daemon delegates to it.
- Renderer sends prompts via `codex-exec`; identity prefix injected on first prompt.
- Files updated: `ui/terminal-daemon.js`, `ui/modules/codex-exec.js`, `ui/modules/terminal.js`, `ui/modules/ipc-handlers.js`, `ui/daemon-client.js`, `ui/preload.js`, `ui/renderer.js`, `ui/config.js`.
- Needs review/testing: verify Codex pane output rendering and resume continuity.
- Handoff: Reviewer verify Codex exec output rendering + no PTY injection; Investigator confirm `codex exec resume <sessionId>` preserves full context. Gotcha: resume relies on session_id from JSONL `session_meta`, and parsing falls back to raw lines when no text extracted.

### Previous fixes (all confirmed working):
#### Fix N â€” Force autonomy flags
- `allowAllPermissions` default changed `false` â†’ `true` in main.js (line 50)
- Autonomy flags are now UNCONDITIONAL in ipc-handlers.js (lines 163-173) â€” removed `if (currentSettings.allowAllPermissions)` guard
- Claude always gets `--dangerously-skip-permissions`
- Codex always gets `--full-auto --ask-for-approval never`
- Files: `main.js`, `ipc-handlers.js`

### Fix O Ã¢â‚¬â€ Codex prompt suppression hardening (Jan 27, 2026)
- Codex spawn now also appends `--dangerously-bypass-approvals-and-sandbox` (alias: `--yolo`)
- Added daemon fallback: detects approval prompt text and auto-sends `2` ("Yes and don't ask again")
- Files: `ui/modules/ipc-handlers.js`, `ui/terminal-daemon.js`

### What to verify after restart:
1. No permission prompts on any Codex pane (Fix O â€” --yolo + auto-dismiss)
2. Codex panes start clean without PowerShell errors (Fix L) or config errors (Fix M)
3. All 6 agents orient and accept input
4. If any Codex pane still prompts, daemon should auto-answer "2" within seconds

### Previous Session Findings
After restart, Codex panes (2, 4, 5) showed:
1. **Identity injection broke PowerShell** â€” `[HIVEMIND SESSION: ...]` parsed as PowerShell attribute syntax, causing parse errors
2. **Codex config.toml invalid** â€” `approval_policy = "never"` is NOT a valid Codex config key (expects boolean). Codex refused to start with: `invalid type: string "never", expected a boolean`

### Fixes Applied (need restart to test)

**Fix L â€” Identity message format**
- Changed `[HIVEMIND SESSION: Role]` â†’ `# HIVEMIND SESSION: Role -`
- `#` is a comment in PowerShell, harmless to Claude
- Files: `terminal-daemon.js` (line 1365), `terminal.js` (line 636)

**Fix M â€” Remove invalid approval_policy from config.toml**
- Removed `approval_policy = "never"` from `~/.codex/config.toml`
- Removed `ensureCodexConfig()` code in `main.js` that re-added it
- Full autonomy is already handled by CLI flags: `--full-auto --ask-for-approval never` (in ipc-handlers.js)
- Files: `~/.codex/config.toml`, `main.js` (ensureCodexConfig function)

### What to verify after restart:
1. Codex panes should NOT show PowerShell parse errors (Fix L)
2. Codex CLI should start without config.toml errors (Fix M)
3. Codex panes should accept text input and submit
4. All 6 agents should orient themselves
5. Trigger messages should deliver to all panes

### Fix History
- Fix A âœ… â€” CLI swap: pane 3=claude, pane 5=codex
- Fix B âœ… â€” Daemon banner removed
- Fix C âŒ â€” Trusted Enter via sendInputEvent (Codex ignored it)
- Fix D âœ… â€” AGENTS.md created for Codex panes
- Fix E âŒ â€” Clipboard paste Ctrl+V (Codex interpreted as image paste)
- Fix F âŒ â€” --full-auto doesn't bypass sandbox prompt
- Fix G âœ… â€” Sandbox config.toml preset (WORKS)
- Fix H âœ… â€” PTY write + newline for Codex (WORKS)
- Fix I âœ… â€” `\n` â†’ `\r` for Codex auto-submit
- Fix J âŒ â€” `approval_policy = "never"` in config.toml (INVALID KEY â€” broke Codex startup)
- Fix K âœ… â€” `--ask-for-approval never` CLI flag on Codex spawn
- Fix L âœ… â€” Identity message `#` prefix instead of `[]` brackets (PowerShell compat)
- Fix M âœ… â€” Removed invalid approval_policy from config.toml + ensureCodexConfig()
- Fix N âœ… â€” Forced autonomy flags unconditionally (no setting dependency)
- Fix O âœ… â€” `--yolo` flag + daemon auto-dismiss for Codex permission prompts
- Fix P âœ… â€” triggers.js notifyAgents appends `\r` for Codex PTY write auto-submit
- Fix Q âœ… â€” Dynamic Codex detection via pane-cli-identity (replaces hardcoded CODEX_PANES)
- Fix R âŒ â€” Codex auto-submit `\r` â†’ `\n` (FAILED â€” neither `\r` nor `\n` submits ink TUI on Windows)
- Fix S âœ… â€” Codex exec pipeline: non-interactive `codex exec --json` replaces interactive Codex (Reviewer approved)
- Fix T âœ… â€” Codex auto-start identity injection (setTimeout 2s in spawnClaude early-return)
- Fix U âœ… â€” `shell: true` for Codex exec spawn on Windows (ENOENT fix)
- Fix V âœ… â€” Removed conflicting `--full-auto` flag (mutually exclusive with `--dangerously-bypass-approvals-and-sandbox`)

---

## ??? CLI IDENTITY BADGE (UNBLOCKED)

**Status:** Bug 2 line-break fix verified by Reviewer (Jan 28, 2026).
- IPC event: `pane-cli-identity {paneId, label, provider?, version?}`
- Implementer B: main.js now forwards `pane-cli-identity` and infers CLI identity on daemon spawn/reconnect.
- **Next:** Reviewer ? verify badges appear for Claude/Codex/Gemini panes on spawn + reconnect.
- Codex auto-submit Fix B: terminal.js now tracks Codex panes dynamically from pane-cli-identity (no hardcoded list).
- **Next:** Reviewer verify Codex auto-submit and non-Codex Enter path.

---
## ðŸ“‹ AGENT IDENTITY

| Pane | Role | Instance Dir | Trigger File | CLI |
|------|------|-------------|--------------|-----|
| 1 | Architect | instances/lead | lead.txt | Claude |
| 2 | Orchestrator | instances/orchestrator | orchestrator.txt | Codex |
| 3 | Implementer A | instances/worker-a | worker-a.txt | Claude |
| 4 | Implementer B | instances/worker-b | worker-b.txt | Codex |
| 5 | Investigator | instances/investigator | investigator.txt | Codex |
| 6 | Reviewer | instances/reviewer | reviewer.txt | Claude |

### Message Protocol
```
(YOUR-ROLE #N): message here
```
- Increment N each time. Duplicates silently dropped.
- Start from #1 each session.
- Write to `workspace/triggers/{trigger-file}` to message an agent.


## GLOBAL NOTE

- Prefix any user-directed questions with @James:
- Do NOT ask for permission to implement; proceed autonomously and report results.

### Gemini CLI Note
Gemini's file write tool is sandboxed. Use bash echo:
```
echo "(YOUR-ROLE #N): message" > "D:\projects\hivemind\workspace\triggers\lead.txt"
```

---

## ðŸ”§ PREVIOUS FIXES (Already working)

| Fix | File | What Changed |
|-----|------|-------------|
| BUG-1: Codex textarea retry | terminal.js | doSendToPane retries 5x100ms before PTY fallback |
| BUG-2: Nudge keyboard Enter | terminal.js | aggressiveNudge uses keyboard Enter |
| BUG-3: Trigger file re-read | watcher.js | handleTriggerFileWithRetry re-reads empty files |
| BUG-4: Focus steal fix | terminal.js + renderer.js | Restores focus after injection |
| 6-pane expansion | multiple files | All updated from 4-pane to 6-pane |
| ensureCodexConfig | main.js | Auto-creates sandbox config at startup |

## ðŸ“Š RESTART SURVIVAL LOG

| Restart | P1 | P2 | P3 | P4 | P5 | P6 | Pattern |
|---------|----|----|----|----|----|----|---------|
| Jan 27 #1 | âœ… Claude | âŒ Codex | âŒ Claude | âŒ Codex | âœ… Codex | âœ… Claude | Panes 1,5,6 survived |
| Jan 27 #2 | âœ… Claude | âŒ Codex | âŒ Claude | âŒ Codex | âœ… Codex | âœ… Claude | Same pattern |

---

## ðŸš¦ MODE GATE

**Source of truth:** `workspace/app-status.json` â€” check `sdkMode` field before any work.

---

## Previous Context

See `workspace/build/status.md` for full sprint history.

---

## Offline agent feedback (Jan 28)

### Investigator notes
- **Trigger messages visual distinction**: Implemented ANSI prefix in `ui/modules/triggers.js` for PTY injections: `\x1b[1;33m[TRIGGER]\x1b[0m ` applied to notifyAgents, auto-sync, handleTriggerFile, routeTask, auto-handoff, and direct messages. Broadcast path unchanged.
- **Status bar text**: Updated `ui/index.html` status bar to match current behavior: "Enter to send to Lead | /all to broadcast | /3 to target pane 3".
- **Broadcast bar behavior (PTY)**: In PTY mode, broadcast input routes to pane 1 only (terminal.broadcast in `ui/modules/terminal.js`), and `/all` targeting exists only in SDK path. This is why user input only reaches Architect.
- **Interrupt/ESC path exists but no UI entrypoint**: `(UNSTICK)` or `(AGGRESSIVE_NUDGE)` messages are intercepted in `ui/modules/daemon-handlers.js` and call `terminal.sendUnstick()` / `terminal.aggressiveNudge()` (ESC keyboard events), but there is no IPC/UI command for Architect to trigger this per-pane.
- **Stuck detection**: Auto-nudge exists in `ui/terminal-daemon.js` (`checkAndNudgeStuckAgents` using `lastInputTime`), but requires daemon restart after code updates (see errors.md V18.1).
- **xterm input() API**: Web research indicates `Terminal.input(data, wasUserInput?)` exists in xterm.js ≥5.4.0 and can inject data without focus (set `wasUserInput=false`). Installed version is **5.3.0** in `ui/node_modules`, so the API is likely missing until upgrade.

## Offline agent feedback (Jan 28)

- CSS Module 4 extraction approved (tabs.css + sdk-renderer.css linked, prefers-reduced-motion present).
- IPC handler regression review: 6/9 modules missing defensive ctx null checks (state-handlers, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Functional now but fragile if init order changes; recommend guards next pass.
- Sprint 2 routing completed: Implementer A on structured logger; Implementer B on IPC null checks; Investigator on version-fix audit; Reviewer monitoring both pipelines.
- Session 19 issues routed: Implementer A on broadcast input bar + trigger message styling + active/stuck UI; Implementer B on IPC interrupt/Esc + stuck detection hooks; Investigator on stuck detection/recovery analysis; Reviewer notified.
- Awaiting: Investigator auto-submit verification (prior), and current Sprint 2 deliverables from Implementer A/B/Investigator.


## Offline agent feedback (Jan 28)

- Implementer B: Added IPC `interrupt-pane` (Ctrl+C) in `ui/modules/ipc/pty-handlers.js` and auto Ctrl+C after 120s no output in `ui/main.js` stuck detection. Default stuckThreshold now 120000; clears lastInterruptAt on output.
- Implementer B: Version-fix scan counts (pattern `^//(V#|BUG|FIX)` in ui/): terminal-daemon.js 32, modules/terminal.js 25, modules/triggers.js 23, main.js 14, renderer.js 12, modules/watcher.js 9, modules/sdk-bridge.js 7, modules/sdk-renderer.js 3. Began cleanup by removing version/fix prefixes in `ui/modules/daemon-handlers.js`, `ui/daemon-client.js`, `ui/modules/settings.js`.
- Implementer B (coverage assumption): Implementer A to pick up console.* remnants in smart-routing/activity-log during logger rollout; Reviewer to verify auto-interrupt + IPC channel response.

**Update (Jan 28, 2026):** Reviewer approved delivery-ack enhancement (see `workspace/build/reviews/delivery-ack-enhancement-review.md`). Fix ready for restart verification only.

---

## Session 40 - Maintenance Update (Jan 30, 2026)

### Commit `cc3bc29` (Jan 30, 2026)
**Contents:**
- safetyTimer now returns {success:true, verified:false} on timeout (prevents false "delivery failed" logs)
- Pre-flight idle check improvements
- Verification retry improvements
- Removed version-fix comment prefixes across terminal.js, watcher.js, sdk-bridge.js, terminal-daemon.js

**All pre-commit checks passed:** 433 tests, ESLint, mypy

### Task Completion
- Implementer B verified `.pane-grid` CSS already removed from `ui/styles/layout.css`; no changes required.
- Implementer B cleaned version/fix comment markers in `ui/main.js` (none found), `ui/modules/watcher.js`, `ui/modules/sdk-bridge.js` (removed V# prefixes, preserved meaning).
- Investigator cleaned terminal.js and terminal-daemon.js comment markers.
- Implementer A fixed safetyTimer timeout return value.

### ⚠️ Pending Review: renderer.js (253 lines)
- Contains new pane-swap feature code + command bar changes
- Only the FIX3 tag removal was part of Session 40 tasks
- New features NOT included in commit - need full review before committing

### 🔍 Investigation: Reviewer Communication Issue
**Symptom:** Reviewer's messages weren't reaching Architect despite correct instructions in CLAUDE.md

**Findings:**
- message-state.json shows lead lastSeen reviewer: 14 (messages were tracked)
- Reviewer's CLAUDE.md has correct trigger file paths (lead.txt)
- Possible causes:
  1. Reviewer outputting to terminal instead of writing to trigger file
  2. Message accumulation bug on Architect pane (Enter failed, messages accumulated)
  3. Reviewer using wrong quoting/format in bash command

**Resolution:** After explicit instructions on using `echo "(REVIEWER #N): message" > lead.txt`, Reviewer responded correctly.

**Action Item:** Monitor Reviewer communication in future sessions. If pattern repeats, add more explicit examples to Reviewer's CLAUDE.md.
