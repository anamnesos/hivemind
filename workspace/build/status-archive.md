# Build Status

Last updated: 2026-01-31 - **SESSION 52 SIMPLIFICATION SPRINT**

---

## 🎯 Session 52 Simplification Sprint (Jan 31, 2026)

### Activity Indicator Fix (Frontend) - ✅ COMPLETE
**Goal:** Make pane status indicators clearer and more visible

**Problem:** Claude panes (1,3,6) didn't show spinner when running - CSS bug missed `running` class

**Changes:**
- `layout.css`: Added `.pane-status.running` to spinner display + animation lists
- `daemon-handlers.js`: Labels updated: 'Idle' → 'Ready', 'Agent running' → 'Working'
- `terminal.js`: Status strings updated to match
- `terminal.test.js`: Test expectations updated

**Result:** Claude panes now show animated spinner like Codex panes. Clearer labels.

**Tests:** 2766 passing

---

## ✅ Session 51 Backend Cleanup (Jan 30, 2026)

**Changes:**
- Consolidated stuck detection to daemon events (main auto-unstick loop removed)
- Conflict queue removed from `ui/modules/watcher.js` (tests updated)
- Conflict-queue IPC handlers/docs/tests deleted
- `message-state.json` roles updated to new names in `ui/modules/triggers.js`

---

## 📋 Session 50 Autonomous Review Sprint - COMPLETE (`6016d14`)

**Goal:** Comprehensive codebase review while user rests
**Result:** ✅ ALL 6 TASKS COMPLETE - 24 files fixed, 2951 tests passing

### Tasks Completed:
1. ✅ Core app logic review (main.js, terminal.js) - Reviewer
2. ✅ Renderer/UI review (renderer.js, tabs.js) - Frontend
3. ✅ IPC handlers audit - Architect + Backend
4. ✅ Trigger system review - Analyst
5. ✅ Codex architectural opinion - Backend
6. ✅ Fix all identified issues - All agents

### Key Fixes in `6016d14`:
- **triggers.js:** AGENT_ROLES, HANDOFF_CHAIN, WORKER_PANES (exclude Analyst), ReferenceError fix
- **UI files:** renderer.js, tabs.js, index.html - all role labels updated
- **SDK/MCP:** sdk-bridge.js, sdk-renderer.js, mcp-bridge.js, mcp-server.js
- **Core:** daemon-handlers.js, terminal.js, injection.js (variable scope bugs)
- **Analysis:** cost-optimizer.js, knowledge-graph.js, debug-replay.js
- **IPC:** process-handlers.js, pty-handlers.js (error handling guards)
- **Tests:** All 4 test files updated for new role names

---

## 🎨 Session 50: Role Name Consistency Audit (Frontend)
**Owner:** Frontend
**Status:** ✅ COMPLETE (included in `6016d14`)

**Scope:** Full codebase audit for Session 50 role rename consistency

**Issues Found:** 20+ role name inconsistencies across 15 source files

**Fixes Applied:**
- `ui/renderer.js` - SDK labels, dropdown, command palette
- `ui/index.html` - Pane headers, all dropdowns, health/perf/inspector/debug tabs, MCP tooltips
- `ui/modules/tabs.js` - AGENT_NAMES, ACTIVITY_AGENT_NAMES
- `ui/modules/daemon-handlers.js` - PANE_ROLES
- `ui/modules/sdk-bridge.js` - PANE_ROLES, ROLE_TO_PANE, sessions
- `ui/modules/sdk-renderer.js` - PANE_ROLES, SDK_PANE_ROLES, roleConfig
- `ui/modules/mcp-bridge.js` - roles (3 locations), tool description
- `ui/modules/mcp-server.js` - PANE_ROLES
- `ui/modules/triggers.js` - HANDOFF_CHAIN comments
- `ui/modules/watcher.js` - Comment, regex patterns
- `ui/modules/analysis/cost-optimizer.js` - agentNames
- `ui/modules/memory/knowledge-graph.js` - agentNames
- `ui/modules/memory/debug-replay.js` - roles array
- `ui/modules/ipc/mobile-api-handlers.js` - roles
- `ui/modules/scaffolding/project-scaffolder.js` - Template content

**Backward Compatibility:** Legacy role names preserved in ROLE_TO_PANE mappings

**Review:** `workspace/build/reviews/session50-renderer-ui-review.md`

---

## 🧩 Session 50: IPC Handler Guard Fixes (Backend)
**Owner:** Backend
**Status:** ✅ IMPLEMENTED (included in `6016d14`)

**Fixes Applied:**
1. Added `ctx/ipcMain` guard + `deps = {}` default in `ui/modules/ipc/pty-handlers.js`
2. Initialized `ctx.backgroundProcesses` and `ctx.processIdCounter` in `ui/modules/ipc/process-handlers.js`

**Review:** `workspace/build/reviews/ipc-handlers-review-backend-session50.md`

## 🔄 Session 49: Codex Resume Context Fix (Blocker)
**Owner:** Implementer A
**Status:** ✅ FIXED - Pending restart verification

**Problem:** Codex pane restart loses session context. `codexIdentityInjected` Set not reset on restart, causing identity header to be skipped for new sessions.

**Fix Applied:**
1. Added `resetCodexIdentity(paneId)` function to `terminal.js` - clears identity tracking for pane
2. Passed `resetCodexIdentity` to `createRecoveryController` options
3. Called `resetCodexIdentity(id)` in `restartPane()` before PTY recreation

**Files Modified:**
- `ui/modules/terminal.js` - Added resetCodexIdentity function + passed to recovery controller
- `ui/modules/terminal/recovery.js` - Accept and call resetCodexIdentity in restartPane

**Analysis Note:** Backend session ID persistence was already working (killTerminal caches, saveSessionState persists, getCachedCodexSession retrieves). The blocker analysis was partially outdated.

**Tests:** All terminal.test.js (69 tests) and recovery.test.js (53 tests) pass

---

## 🔌 Session 48: Plugin/Extension System (Task #9)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Backend + IPC + docs

**Highlights**
- Plugin manager loads plugins from `workspace/plugins`, persists state, and provides per-plugin storage
- Manifest support: `plugin.json` or `package.json` with `hivemind` field
- Hook system with sync `message:beforeSend` and async events (`message:afterSend`, `trigger:received`, `activity:log`, `agent:*`, `daemon:data`)
- Command runner with timeout guard
- Trigger pipeline now supports plugin interception for notify/broadcast/direct/trigger flows
- IPC endpoints to list/enable/disable/reload/run plugin commands
- Documentation: `docs/plugins.md`

**Files Created:**
- `ui/modules/plugins/plugin-manager.js`
- `ui/modules/plugins/index.js`
- `ui/modules/ipc/plugin-handlers.js`
- `docs/plugins.md`

**Files Modified:**
- `ui/main.js` (plugin manager wiring + core event hooks)
- `ui/modules/triggers.js` (before/after send hooks, trigger receive event)
- `ui/modules/ipc/handler-registry.js`
- `ui/modules/ipc/ipc-state.js`
- `ui/modules/ipc/index.js`
- `ui/modules/ipc/api-docs-handlers.js`

**Testing Required:**
1. Create `workspace/plugins/sample/plugin.json` + `index.js`
2. Restart app; run IPC `list-plugins` and confirm plugin loads
3. Confirm `message:beforeSend` can modify outbound messages
4. Run `run-plugin-command` and verify return payload

---

## 🎙️ Session 48: Voice Control (Task #10)
**Owner:** Implementer B  
**Status:** ✅ REVIEW APPROVED - sanity pass pending

**Highlights**
- Command bar voice controls (Mic toggle + status)
- SpeechRecognition wiring with optional auto-send and language setting
- Listening state UI (pulse, accent focus) and settings-driven enablement

**Files Modified:**
- `ui/index.html` (voice settings + command bar controls)
- `ui/styles/layout.css` (voice button/status styling + pulse)
- `ui/modules/settings.js` (settings-updated event)
- `ui/renderer.js` (SpeechRecognition handlers + UI state)

**Next Steps:**
1. Sanity pass in app (toggle voice input, start/stop, auto-send)
2. Runtime verification after restart

---

## 💾 Session 48: Backup & Restore System (Task #26)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Automated backups + IPC

**Highlights**
- Backup manager snapshots workspace/config/state into `workspace/backups`
- Retention policy: max count + max age; optional restore point before restore
- Interval-based automation with configurable cadence
- IPC endpoints for list/create/restore/delete/prune/config
- Workspace watcher ignores backups to avoid auto-sync storms

**Files Created:**
- `ui/modules/backup-manager.js`
- `ui/modules/ipc/backup-handlers.js`

**Files Modified:**
- `ui/main.js` (backup manager wiring)
- `ui/modules/ipc/handler-registry.js`
- `ui/modules/ipc/ipc-state.js`
- `ui/modules/ipc/index.js`
- `ui/modules/ipc/api-docs-handlers.js`
- `ui/modules/watcher.js` (ignore backups)

**Testing Required:**
1. Invoke `backup-create` IPC, verify `workspace/backups/<id>/backup.json`
2. Invoke `backup-list` and see entry
3. Restore via `backup-restore` and confirm files restored

---

## 🧩 Session 48: Agent Templates Library (Task #32)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Built-in templates + import/export

**Highlights**
- Built-in agent templates for common setups (hybrid, all-claude, all-codex, research sprint, review battle, focus mode)
- Template handlers now merge built-ins and user templates
- Import/export endpoints added for sharing configurations
- Documentation: `docs/agent-templates.md`

**Files Created:**
- `ui/modules/agent-templates.js`
- `docs/agent-templates.md`

**Files Modified:**
- `ui/modules/ipc/template-handlers.js`
- `ui/modules/ipc/api-docs-handlers.js`

**Testing Required:**
1. `list-templates` includes built-ins (source=builtin)
2. `export-templates` returns JSON
3. `import-template` adds a user template

## 📄 Session 48: Automated Documentation Generation (Task #23)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Full documentation generation from code

**Highlights**
- **Core doc generator module** `ui/modules/analysis/doc-generator.js` (~750 lines):
  - JSDoc block extraction and parsing
  - Function/class/method/property detection
  - Export detection (CommonJS and ES modules)
  - Constant extraction
  - Multiple output formats: Markdown, HTML, JSON
  - Directory scanning with recursive support
  - Pattern-based file filtering
  - Documentation coverage statistics

- **IPC handlers** `ui/modules/ipc/doc-generator-handlers.js` (~350 lines):
  - `docs-generate-file` - Generate docs for single file
  - `docs-generate-directory` - Generate docs for directory
  - `docs-generate-project` - Generate docs for entire project
  - `docs-preview` - Preview without saving
  - `docs-export` - Export to files
  - `docs-get/set-config` - Configuration management
  - `docs-get-coverage` - Documentation coverage stats
  - `docs-get-undocumented` - List undocumented items
  - `docs-generate-ipc` - Generate IPC handler docs
  - `docs-get-cached` - Access cached docs
  - `docs-clear-cache` - Clear documentation cache

- **Visual Docs tab UI** in `ui/index.html` (~90 lines):
  - Mode selector (File/Directory/Project)
  - Path input with browse button
  - Format selector (Markdown/HTML/JSON)
  - Generate/Preview/Coverage buttons
  - Coverage bar with percentage
  - Preview panel with copy/export
  - Undocumented items list with file:line

- **Docs tab styling** in `ui/styles/tabs.css` (~350 lines):
  - Coverage bar with color coding (red<40%, yellow<70%, green)
  - Preview container with monospace font
  - Undocumented items list with warnings
  - Settings modal for configuration
  - Loading spinner overlay

- **Docs tab JS** in `ui/modules/tabs.js` (~450 lines):
  - setupDocsTab, generateDocumentation
  - previewDocumentation, checkDocsCoverage
  - loadUndocumentedItems, exportDocumentation
  - showDocsSettings modal
  - Coverage display updates
  - Clipboard copy support

**Files Created:**
- NEW: `ui/modules/analysis/doc-generator.js` - Core doc generator (~750 lines)
- NEW: `ui/modules/ipc/doc-generator-handlers.js` - Doc IPC handlers (~350 lines)

**Files Modified:**
- `ui/modules/ipc/handler-registry.js` - Register doc-generator handlers
- `ui/index.html` - Docs tab button + pane (~90 lines)
- `ui/styles/tabs.css` - Docs tab CSS (~350 lines)
- `ui/modules/tabs.js` - Docs tab JS (~450 lines)
- `ui/renderer.js` - setupDocsTab() call

**Testing Required:**
1. Click "Docs" tab and verify it opens
2. Select "File" mode, browse to a .js file
3. Click "Generate Docs" and verify preview shows
4. Test "Preview" button for quick preview
5. Test "Coverage" button to see stats
6. Verify coverage bar color changes with percentage
7. Check undocumented items list
8. Test format selector (Markdown/HTML/JSON)
9. Test "Copy" to clipboard
10. Test Settings modal - project name, version, options
11. Test "Directory" mode with ui/modules folder
12. Test "Project" mode for full project

---

## 🔍 Session 48: AI-Powered Code Review (Task #18)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Full AI code review with local pattern detection

**Highlights**
- **Git handlers** `ui/modules/ipc/git-handlers.js` (~340 lines):
  - `git-status` - Get repository status with staged/unstaged/untracked
  - `git-diff` - Get diff content with structured parsing
  - `git-log` - Get commit history
  - `git-stage/unstage` - Stage/unstage files
  - `git-commit` - Create commits
  - `git-branch` - Get current branch
  - `git-files-changed` - Get changed files with line stats
  - `git-show` - Get file at specific revision
  - `git-is-repo` - Check if directory is a git repo

- **Core code review module** `ui/modules/analysis/code-review.js` (~500 lines):
  - Multi-backend support: Anthropic API + local pattern detection
  - Security patterns: eval, innerHTML, SQL injection, command injection
  - Performance patterns: JSON clone, regex in loops, DOM queries
  - Bug patterns: empty catch, console statements, TODO markers
  - Style patterns: var usage, mixed tabs/spaces
  - Error handling patterns: missing catch, string throws
  - Severity levels: critical, high, medium, low, info
  - Diff parsing into structured format
  - Issue deduplication and sorting
  - Statistics calculation
  - Summary generation

- **IPC handlers** `ui/modules/ipc/code-review-handlers.js` (~270 lines):
  - `review-diff` - Review current git diff (all/staged/unstaged)
  - `review-files` - Review specific files
  - `review-commit` - Review a specific commit
  - `review-get/set-settings` - Review configuration
  - `review-get-history` - Get past reviews
  - `review-get-detail` - Load specific review
  - `review-quick` - Quick inline review
  - `review-ai-status` - Check AI availability
  - `review-clear` - Clear review history

- **Visual Review tab UI** in `ui/index.html` (~90 lines):
  - Mode selector (All/Staged/Unstaged changes)
  - Run review button with loading state
  - AI status indicator (available/unavailable)
  - Summary with severity counts
  - Severity filter buttons with badges
  - Scrollable issues list
  - Issue details panel with suggestions
  - History and settings modals

- **Review tab styling** in `ui/styles/tabs.css` (~400 lines):
  - Severity color coding (critical=red, high=pink, medium=yellow, low=gray)
  - Issue cards with left border indicators
  - Details panel with suggestion highlighting
  - Modal dialogs for history and settings
  - Loading spinner overlay

- **Review tab JS** in `ui/modules/tabs.js` (~400 lines):
  - setupReviewTab, runCodeReview
  - Issue filtering by severity
  - Issue selection and details display
  - History modal with past reviews
  - Settings modal with category toggles
  - AI status checking

**Files Created:**
- NEW: `ui/modules/ipc/git-handlers.js` - Git IPC handlers (~340 lines)
- NEW: `ui/modules/analysis/code-review.js` - Core review module (~500 lines)
- NEW: `ui/modules/ipc/code-review-handlers.js` - Review IPC handlers (~270 lines)

**Files Modified:**
- `ui/modules/ipc/handler-registry.js` - Register git + review handlers
- `ui/index.html` - Review tab button + pane (~90 lines)
- `ui/styles/tabs.css` - Review tab CSS (~400 lines)
- `ui/modules/tabs.js` - Review tab JS (~400 lines)
- `ui/renderer.js` - setupReviewTab() call

**Testing Required:**
1. Click "Review" tab and verify it opens
2. Check AI status indicator shows availability
3. Click "Review Changes" with local changes
4. Verify issues appear with severity badges
5. Click issue to see details panel
6. Test severity filter buttons
7. Test mode selector (All/Staged/Unstaged)
8. Click Settings, toggle options, save
9. Click History, view past reviews
10. Set ANTHROPIC_API_KEY env var, verify AI issues appear

---

## 🐛 Session 48: Agent Debugging/Replay (Task #21)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Full debug replay system with step-through UI

**Highlights**
- **Core debug replay module** `ui/modules/memory/debug-replay.js` (~650 lines):
  - Session loading from transcript files
  - Step controls: stepForward, stepBackward, jumpTo, jumpToTime
  - Auto-play with configurable speed
  - Filtering by action type (message, tool_call, error, etc.)
  - Index-based and type-based breakpoints
  - Action search with content matching
  - Context retrieval (before/after surrounding actions)
  - Related actions discovery
  - Export to JSON/CSV formats
  - Session statistics calculation

- **IPC handlers** `ui/modules/ipc/debug-replay-handlers.js` (~300 lines):
  - `debug-load-session` - Load agent transcript for replay
  - `debug-load-timerange` - Load cross-agent time range
  - `debug-step-forward/backward` - Step controls
  - `debug-jump-to/jump-to-time` - Position controls
  - `debug-play/pause/reset` - Playback controls
  - `debug-set-filter` - Type filtering
  - `debug-search` - Action search
  - `debug-get-state/get-actions` - State queries
  - `debug-get-context` - Surrounding context
  - `debug-add/remove/clear-breakpoint` - Breakpoint management
  - `debug-export` - Session export
  - `debug-get-stats` - Session statistics

- **Visual Debug tab UI** in `ui/index.html` (~90 lines):
  - Session selector dropdown (all 6 agent roles)
  - Transport controls (step back/forward, play/pause, reset)
  - Progress bar with seek-by-click
  - Speed selector (0.5x to 4x)
  - Filter by action type
  - Search input with results highlighting
  - Timeline with color-coded action items
  - Details panel with action content/metadata
  - Breakpoint toggle, context view, export buttons

- **Debug tab styling** in `ui/styles/tabs.css` (~350 lines):
  - Action type colors (Dracula theme)
  - Timeline with breakpoint indicators
  - Current action highlighting
  - Search match highlighting
  - Progress bar styling
  - Context modal overlay

- **Debug tab JS** in `ui/modules/tabs.js` (~450 lines):
  - setupDebugTab, loadDebugSession
  - Step/seek/play controls
  - Timeline rendering with scroll-to-current
  - Details panel with formatted output
  - Search highlighting
  - Breakpoint visualization
  - Context modal display
  - Export to file download

**Files Changed:**
- NEW: `ui/modules/memory/debug-replay.js` - Core replay module (~650 lines)
- NEW: `ui/modules/ipc/debug-replay-handlers.js` - IPC handlers (~300 lines)
- MODIFIED: `ui/modules/ipc/handler-registry.js` - Register debug handlers
- MODIFIED: `ui/index.html` - Debug tab button + pane (~90 lines)
- MODIFIED: `ui/styles/tabs.css` - Debug tab CSS (~350 lines)
- MODIFIED: `ui/modules/tabs.js` - Debug tab JS (~450 lines)
- MODIFIED: `ui/renderer.js` - setupDebugTab() call

**Testing Required:**
1. Click "Debug" tab and verify it opens
2. Select an agent from dropdown, click Load
3. Verify timeline shows actions (if transcript exists)
4. Test step forward/back buttons
5. Test play/pause auto-playback
6. Test progress bar click-to-seek
7. Change speed and verify playback adjusts
8. Test filter dropdown to show only specific types
9. Search for text and verify results highlight
10. Click action in timeline, verify details show
11. Click breakpoint button, verify indicator appears
12. Click export, verify JSON file downloads

---

## 🔗 Session 48: Cross-Session Knowledge Graph (Task #36)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Full knowledge graph system with visual UI

**Highlights**
- **Core knowledge graph module** `ui/modules/memory/knowledge-graph.js` (~750 lines):
  - Node types: FILE, AGENT, DECISION, ERROR, CONCEPT, TASK, SESSION, MESSAGE
  - Edge types: TOUCHES, MODIFIES, INVOLVES, CAUSES, RESOLVES, RELATES_TO, MENTIONS, ASSIGNED_TO, DEPENDS_ON, PART_OF, OCCURRED_IN
  - Graph persistence to workspace/memory/_graph/ (nodes.json, edges.json)
  - Natural language query API ("Show everything related to trigger delivery")
  - Concept extraction from queries
  - BFS traversal for relationship discovery
  - Force-directed layout calculation for visualization
  - Auto-initializes agent nodes on startup
  - Helper functions: getAgentNodeId, getRelated, getStats, exportForVisualization

- **Memory system integration** in `ui/modules/memory/index.js`:
  - Auto-records file access, decisions, errors to graph
  - Task assignments create graph nodes with agent edges
  - Trigger messages create MESSAGE nodes with INVOLVES edges
  - recordConcept API for manual concept tracking
  - Convenience APIs: queryGraph, getGraphVisualization, getRelatedNodes, getGraphStats

- **IPC handlers** `ui/modules/ipc/knowledge-graph-handlers.js` (~130 lines):
  - `graph-query` - Natural language search
  - `graph-visualize` - Get visualization data
  - `graph-stats` - Get graph statistics
  - `graph-related` - Get related nodes from starting point
  - `graph-record-concept` - Record concept from UI
  - `graph-save` - Force save to disk
  - `graph-nodes-by-type` - Filter nodes by type

- **Visual Graph tab UI** in `ui/index.html` (~75 lines):
  - Search input with natural language support
  - Filter buttons by node type (All/Files/Agents/Decisions/Errors/Tasks/Concepts)
  - Stats overview cards (Nodes/Edges/Files/Decisions)
  - Interactive canvas with pan/zoom/select
  - Color-coded legend by node type
  - Selected node details panel with related nodes list
  - Refresh/Save/Reset View actions

- **Graph tab styling** in `ui/styles/tabs.css` (~280 lines):
  - Node colors by type (Dracula theme compatible)
  - Force-directed layout visualization
  - Details panel with type-colored badges
  - Related nodes clickable list
  - Legend with toggle support

- **Graph tab JS** in `ui/modules/tabs.js` (~450 lines):
  - setupGraphTab, refreshGraphData, searchGraph
  - Canvas interactions (pan, zoom, node selection)
  - Force-directed layout calculation
  - Node position caching
  - Real-time stats updates
  - Related nodes navigation

**Files Changed:**
- NEW: `ui/modules/memory/knowledge-graph.js` - Core graph module (~750 lines)
- MODIFIED: `ui/modules/memory/index.js` - Graph integration + APIs
- NEW: `ui/modules/ipc/knowledge-graph-handlers.js` - IPC handlers
- MODIFIED: `ui/modules/ipc/handler-registry.js` - Register graph handlers
- MODIFIED: `ui/index.html` - Graph tab button + pane (~75 lines)
- MODIFIED: `ui/styles/tabs.css` - Graph tab CSS (~280 lines)
- MODIFIED: `ui/modules/tabs.js` - Graph tab JS (~450 lines)
- MODIFIED: `ui/renderer.js` - setupGraphTab() call

**Testing Required:**
1. Click "Graph" tab and verify it opens
2. Check stats cards show 0 values initially
3. Wait for agents to work, verify nodes appear
4. Test search: "Show everything related to trigger"
5. Click a node, verify details panel shows info
6. Click related node, verify navigation works
7. Test pan (drag canvas) and zoom (scroll wheel)
8. Test filter buttons hide/show node types
9. Click legend items to toggle type visibility

---

## 🏥 Session 48: Self-Healing Error Recovery (Task #29)
**Owner:** Implementer A (UI) + Implementer B (Backend)
**Status:** ✅ UI + Backend IMPLEMENTED - Pending runtime verification

**UI Highlights**
- New "Health" tab in right panel for agent health monitoring
- Health overview summary cards (Healthy/Warning/Error/Recovering counts)
- Per-agent health status with metrics:
  - Last output timestamp (relative time)
  - Stuck count tracking
  - Recovery step indicator (None/Nudge/Interrupt/Restart)
- Recovery action buttons per agent (Nudge/Interrupt/Restart)
- Active Recovery Playbook visualization (3-step escalation)
- Playbook action log with timestamped entries
- Bulk actions (Nudge All Stuck, Restart All)
- Toast notifications for recovery events
- Auto-refresh every 5 seconds when Health tab is visible

**Files Changed:**
- MODIFIED: `ui/index.html` - Health tab button + ~150 lines tab pane HTML
- MODIFIED: `ui/styles/tabs.css` - ~350 lines new Health tab CSS
- MODIFIED: `ui/modules/tabs.js` - ~350 lines JS (setupHealthTab, health state, recovery actions)
- MODIFIED: `ui/modules/ipc/auto-nudge-handlers.js` - Health IPC handlers + recovery metadata
- MODIFIED: `ui/modules/daemon-handlers.js` - Renderer-side listeners for health actions
- MODIFIED: `ui/renderer.js` - setupHealthTab() call
- NEW: `ui/modules/recovery-manager.js` - Self-healing manager (stuck detection, backoff, circuit breaker)
- NEW: `ui/modules/ipc/recovery-handlers.js` - Recovery IPC endpoints
- MODIFIED: `ui/main.js` - Recovery manager wiring + auto-restart hooks
- MODIFIED: `ui/modules/ipc/pty-handlers.js` - Expected-exit tracking on manual kill
- MODIFIED: `ui/modules/ipc/handler-registry.js` - Register recovery handlers
- MODIFIED: `ui/modules/ipc/ipc-state.js` - Recovery manager state
- MODIFIED: `ui/modules/ipc/index.js` - Recovery manager state keys
- MODIFIED: `ui/modules/ipc/api-docs-handlers.js` - Recovery IPC docs

**IPC Contracts:**
- `get-agent-health` → Returns `{ success, agents: { paneId: { alive, lastActivity, stuckCount, recoveryStep, recovering } } }`
- `nudge-pane` → Sends to renderer to call terminal.nudgePane()
- `restart-pane` → Sends to renderer to call terminal.restartPane()
- `restart-all-panes` → Sends to renderer to call terminal.freshStartAll()
- `get-recovery-status` → Returns recovery manager state per pane
- `get-health-snapshot` → Returns recovery snapshot + playbooks
- `get-recovery-playbooks` → Returns playbook definitions
- `trigger-recovery` → Schedule auto-restart with backoff
- `reset-recovery-circuit` → Reset circuit breaker per pane

**Backend Highlights**
- Auto-stuck detection escalates to restart with exponential backoff
- Circuit breaker after repeated failures (cooldown before retries)
- Context preservation via daemon session save before restart
- Expected-exit tracking prevents false failure loops

**Testing Required:**
1. Click "Health" tab and verify it opens
2. Check health summary card counts update
3. Test per-agent Nudge/Interrupt/Restart buttons
4. Verify playbook step visualization
5. Check recovery toast notifications appear
6. Test "Nudge All" and "Restart All" bulk actions

---

## 🧠 Session 48: Agent Memory System (Task #2)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Core system complete, integration done

**Highlights**
- **6 new modules** in `ui/modules/memory/`:
  - `memory-store.js` (~400 lines) - Core persistence layer (JSONL transcripts, JSON context)
  - `transcript-logger.js` (~350 lines) - Buffered event logging (input/output/tool/decision/error)
  - `context-manager.js` (~500 lines) - Per-agent persistent context (sessions, tasks, learnings, file expertise)
  - `memory-search.js` (~500 lines) - Keyword search with relevance scoring, cross-agent search
  - `memory-summarizer.js` (~450 lines) - Extractive summarization, context injection generation
  - `index.js` (~300 lines) - Unified API entry point
- **IPC integration**: `ipc-handlers.js` + `preload-bridge.js` for renderer access
- **Main process hooks**: Initialize on load, shutdown on quit, trigger message logging

**Architecture:**
- Storage: `workspace/memory/` with per-agent transcripts, context, indices, summaries
- Cross-agent: Shared learnings + decisions in `_shared/memory.json`
- API: 25+ functions for logging, context, session, query, team, analytics

**Files Changed:**
- NEW: `ui/modules/memory/*.js` (6 modules)
- NEW: `ui/modules/memory/ipc-handlers.js`
- NEW: `ui/modules/memory/preload-bridge.js`
- MODIFIED: `ui/main.js` (memory imports, lifecycle hooks)
- MODIFIED: `ui/preload.js` (memory API exposure)
- MODIFIED: `ui/modules/triggers.js` (trigger message logging)

**Testing Required:**
1. Start app and verify `[Memory] Agent memory system initialized` in console
2. Check `workspace/memory/` directories are created
3. Trigger an inter-agent message and verify it appears in transcript logs
4. Test `window.hivemind.memory.*` API from renderer console

---

## 🧠 Session 48: Conversation History Viewer (Task #8)
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Pending review/verification

**Highlights**
- New "Mem" tab in right panel for viewing agent conversation history
- Agent selector dropdown (All Agents + individual panes 1-6)
- Search functionality with real-time filtering
- Four view modes:
  - **Transcript**: Chronological log with color-coded entry types (input/output/tool/decision/error/trigger)
  - **Context**: Session info, current task, file expertise, statistics
  - **Learnings**: Knowledge items with topic/content/confidence/timestamp
  - **Team**: Cross-agent summary with shared learnings and decisions
- Refresh and Clear buttons for navigation
- Entry count statistics

**Files Changed:**
- MODIFIED: `ui/index.html` (tab button + ~50 lines for memory pane HTML)
- MODIFIED: `ui/styles/tabs.css` (~350 lines new CSS for memory tab)
- MODIFIED: `ui/modules/tabs.js` (~400 lines JS: setup, data loading, search, view switching)
- MODIFIED: `ui/renderer.js` (setupMemoryTab() call)

**Dependencies:**
- Requires Task #2 (Agent Memory System) backend

**Testing Required:**
1. Click "Mem" tab and verify it opens
2. Select different agents from dropdown, verify transcript loads
3. Switch between Transcript/Context/Learnings/Team views
4. Test search functionality
5. Verify entry type color coding (green=input, blue=output, purple=tool, yellow=decision, red=error, cyan=trigger)

---

## 🚀 Session 48: Task Queue Visualization (Task #3)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Pending review/verification  

**Highlights**
- New Queue tab with real-time message queue counts, conflict locks, and active claims
- Queue events feed (queued/delivered/conflict/claims)
- Controls: refresh, clear delivered messages, clear conflict locks
- Event-driven updates + 4s polling while tab active

**Files Changed:**
- `ui/index.html`
- `ui/modules/tabs.js`
- `ui/styles/tabs.css`
- `ui/renderer.js`

**Testing Required:**
1. Open Queue tab and verify counts update when messages are queued/delivered
2. Trigger a conflict queue; confirm locks + queue entries render
3. Click Clear Delivered and Clear Locks; verify counts reset

---

## 🚀 Session 48: Git Integration (Task #6)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Pending review/verification  

**Highlights**
- New Git tab with branch/upstream, ahead/behind, last commit, clean/dirty state
- Staged/unstaged/untracked/conflict lists + diff preview
- Actions: refresh, stage all, unstage all, commit, copy summary
- New Git IPC handlers for status/diff/stage/unstage/commit/log

**Files Changed:**
- `ui/index.html`
- `ui/modules/tabs.js`
- `ui/styles/tabs.css`
- `ui/modules/ipc/git-handlers.js`
- `ui/modules/ipc/handler-registry.js`
- `ui/renderer.js`

**Testing Required:**
1. Open Git tab in a git repo and verify branch + file lists
2. Toggle diff view (staged/unstaged) and check output
3. Stage/unstage all and confirm status refresh
4. Commit with staged changes and verify status updates

---

## 🔄 Session 48: Codex Auto-Restart Feature
**Owner:** Implementer A
**Status:** ✅ IMPLEMENTED - Pending review/verification

**Highlights**
- Auto-restart Codex panes when they exit gracefully (exit code 0)
- Codex CLI exits after completing tasks; this prevents panes from staying dead
- Immediate restart without backoff (graceful completion is not a failure)
- Non-zero exits still treated as failures with normal backoff

**Files Changed:**
- `ui/modules/recovery-manager.js` - Added `isCodexPane` option, Codex completion detection
- `ui/main.js` - Pass `isCodexPane` to recovery manager

**Testing Required:**
1. Let Codex complete a task in pane 2, 4, or 5
2. Verify it auto-restarts immediately (check npm console for "Codex pane X completed")
3. Verify Claude panes (1, 3, 6) don't auto-restart on exit 0

---

## 🎨 Session 47: UI Polish - Notifications + Command Palette (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Pending review/verification  

**Task #9: Notifications/Toasts polish**
- Handoff + conflict notifications now use design system tokens (colors/spacing/radius/shadows/transitions)
- Added glass effect overlays and refined gradients for clarity and hierarchy
- Conflict notification gains subtle urgency pulse and improved emphasis
- **File:** `ui/styles/panes.css`

**Task #10: Command Palette polish**
- Improved hover and selected states (lift + glow + accent border)
- Keyboard navigation feedback via focus-visible outline
- Subtle item entrance animation + tokenized spacing/colors
- **File:** `ui/styles/layout.css`

**Testing Required:**
1. Open Command Palette (Ctrl+K) and check hover/selected glow + keyboard nav feedback
2. Trigger a handoff/conflict notification and verify glass effect + urgency feel

---

## 🎨 Session 47: Micro-animations + Shortcut Tooltips + Activity Pulse (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Pending review/verification  

**Task #17: Micro-animations for state changes**
- State bar badges now transition smoothly and pulse during executing/checkpoint
- Agent activity badges animate softly when active
- **File:** `ui/styles/state-bar.css`

**Task #19: Keyboard shortcut tooltips**
- Added custom tooltip system for elements with keyboard shortcuts
- Renderer converts title → data-tooltip/data-shortcut for shortcut hints
- **Files:** `ui/styles/layout.css`, `ui/renderer.js`

**Task #21: Activity pulse effects**
- Pane activity statuses now pulse subtly (thinking/tool/command/file/streaming)
- SDK status indicators pulse while thinking/responding
- **Files:** `ui/styles/layout.css`, `ui/styles/panes.css`

**Testing Required:**
1. Hover interrupt/unstick buttons (Ctrl+C / Esc) and verify tooltip shows label + shortcut
2. Observe pane status during activity; confirm subtle pulse/glow
3. Check state-bar agent badge pulse when active

---

## ✅ Session 47: Runtime Verification (Jan 30, 2026)
**Status:** 5/6 features verified working

| Feature | Status | Notes |
|---------|--------|-------|
| Toolbar SVG Icons | ✅ VERIFIED | All 11 icons clean, no corruption |
| Message Accumulation Fix | ✅ VERIFIED | 6 agents, all separate turns |
| Diagnostic File Logging | ✅ VERIFIED | 18KB log, Stagger/Inject/Queue events |
| Codex Activity Indicator | ✅ VERIFIED | Spinning glyph (◐◓◑◒) working |
| Spinner Preservation | ✅ VERIFIED | Indicator persists during state changes |
| Codex Blue Button Tint | ❌ NOT WORKING | cli-codex class not applied |

**Bug Found:** Codex blue button tint - the `cli-codex` class is not being added to pane elements when `pane-cli-identity` fires. All panes show same button colors. Assigned to Implementer B for investigation.

---

## 🎨 Session 46: Toolbar Icon Polish (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Problem:** Toolbar buttons displayed corrupted emoji characters (`??`) due to encoding issues. Icons looked unprofessional.

**Solution:** Replace all toolbar button icons with clean inline SVG icons using Lucide/Feather styling:
- Stroke-based design (2px stroke width)
- 24x24 viewBox, sized to 14px in UI
- currentColor for proper theme support

**Icons Replaced:**
| Button | Old | New Icon |
|--------|-----|----------|
| Project | `??` | Folder SVG |
| Spawn | `??` | Play triangle SVG |
| Sync | `??` | Refresh arrows SVG |
| Actions | `??` | More dots SVG |
| Nudge | `??` | Lightning bolt SVG |
| Kill | `??` | X-circle SVG |
| Fresh Start | `??` | Sun SVG |
| Shutdown | `??` | Power SVG |
| Cost Alert | `??` | Alert triangle SVG |
| Settings | `??` | Gear SVG |
| Panel | `??` | Sidebar SVG |

**Also Fixed:**
- Command palette navigation hint: `??` → `↑↓`
- Added CSS for `.btn-icon` and `.dropdown-arrow` SVG sizing

**Files Changed:**
- `ui/index.html` - lines 25, 53-68 (toolbar buttons)
- `ui/styles/layout.css` - lines 56-72 (SVG icon CSS)

**Testing Required:**
1. Restart app
2. Verify all toolbar buttons display clean icons (no `??` or corrupted text)
3. Verify Actions dropdown menu items have icons
4. Verify command palette shows `↑↓` for navigation hint

---

## 🔧 Session 46: Codex Activity Indicator State Preservation Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Problem:** Codex activity indicator (glyph spinner + activity state) not visible during runtime. Investigator found `updateAgentStatus()` was clobbering the activity classes.

**Root Cause:** When `claude-state-changed` fires, `updateAgentStatus()` removes all classes and replaces with `idle`/`starting`/`running`. This overwrites the `working` and `activity-*` classes set by the codex-activity handler.

**Fix Applied:**
- Check if statusEl has any `activity-*` class AND has a spinner element
- If so, skip the text/class update (activity indicator takes precedence)
- Badge update still runs normally

**Files updated:**
- `ui/modules/daemon-handlers.js` - updateAgentStatus() lines 982-1006

**Testing Required:**
1. Restart app
2. Send prompt to Codex pane (2, 4, or 5)
3. Verify glyph spinner appears and persists during `claude-state-changed` events
4. Verify activity states cycle: Thinking → Tool/Command/File → Done → Ready

---

## 🔧 Session 46: Codex Button Accents + Diagnostic Log File (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE - Pending runtime verification  

**Problem:** Codex panes looked identical to Claude panes; diagnostic delivery logs were console-only.  

**Fix Applied:**
1. **Codex button accents** - pane-cli-identity now adds `cli-codex/cli-claude/cli-gemini` classes on panes; Codex pane buttons (refresh/lock/interrupt/unstick) render with blue accents for quick scanning.
2. **Diagnostic log file** - Added `ui/modules/diagnostic-log.js` that writes to `workspace/logs/diagnostic.log`. Stagger/Inject/Queue delivery traces now append to file.

**Files updated:**
- `ui/renderer.js`
- `ui/styles/panes.css`
- `ui/modules/diagnostic-log.js`
- `ui/modules/triggers.js`
- `ui/modules/daemon-handlers.js`

**Testing Required:**
1. Spawn Codex pane: verify header buttons show blue accent.
2. Send trigger: verify `workspace/logs/diagnostic.log` contains Stagger/Inject/Queue lines.

---

## 🎨 Session 45: Codex Activity Indicator (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Problem:** Codex panes had basic ring spinner with no activity context (what is the agent doing?).

**Solution:** Implement Claude TUI-style activity indicator with:
- Glyph spinner (◐◓◑◒) instead of ring spinner
- Activity states: Thinking → Tool/Command/File → Streaming → Done → Ready
- State-specific colors (thinking=cyan, tool=purple, command=yellow, file=blue, streaming=cyan, done=green)
- Breathing opacity animation
- prefers-reduced-motion respect

**Implementation:**
1. **codex-exec.js** - Added `emitActivity()` to broadcast activity state via IPC
   - 'thinking' on start events
   - 'tool'/'command'/'file' on aux events with detail
   - 'streaming' on text deltas
   - 'done' then 'ready' on completion
2. **daemon-client.js** - Added 'codex-activity' event handler
3. **main.js** - Forward codex-activity IPC to renderer
4. **renderer.js** - Listen for codex-activity, update pane-status with glyph cycling
5. **layout.css** - Activity state colors, breathing animation, reduced motion guard

**Files Changed:**
- `ui/modules/codex-exec.js`
- `ui/daemon-client.js`
- `ui/main.js`
- `ui/renderer.js`
- `ui/styles/layout.css`

**Testing Required:**
1. Restart app
2. Send prompt to Codex exec pane (2, 4, or 5)
3. Verify glyph spinner appears (◐◓◑◒ cycling)
4. Verify activity states display: Thinking → Tool: <name> / Command: <cmd> / File: <action> → Streaming → Done → Ready
5. Verify colors match state (purple for tool, yellow for command, etc.)
6. Verify spinner has breathing opacity effect
7. Test with prefers-reduced-motion enabled (should show static ● dot)

---

## 🎨 Session 45: Codex Exec Output Styling Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for runtime test

**Problem:** Codex exec output visually odd - lines starting at right edge, hard to scan, no color separators.

**Root Cause:** Unicode bidirectional control characters (RTL overrides) in Codex output + plain text markers without visual distinction.

**Fix Applied (3 parts):**
1. **stripBidiControls()** - Strips U+200E-200F, U+202A-202E, U+2066-2069 before xterm write
2. **ANSI colors** - [Working...]=cyan, [Done]=green/red, [TOOL]=magenta, [CMD]=yellow, [FILE]=blue
3. **CSS direction** - Added `direction: ltr; unicode-bidi: isolate;` to `.pane-terminal .xterm`

**Files updated:** `ui/modules/codex-exec.js`, `ui/styles/layout.css`

**Testing Required:**
1. Restart app
2. Send prompt to Codex pane (2, 4, or 5)
3. Verify output renders left-to-right (no RTL issues)
4. Verify colored markers: cyan [Working...], green/red [Done], magenta [TOOL], yellow [CMD], blue [FILE]

---

## 🔧 Session 45: Diagnostic Logging for Message Delivery (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE  

**Problem:** Hard to trace where messages are lost between accepted and delivery.  
**Fix Applied:** Added log statements at single-pane inject send, inject-message receive, and queueing.  
**Files updated:** `ui/modules/triggers.js`, `ui/modules/daemon-handlers.js`  

**Testing Required:**
1. Send a single-pane trigger
2. Confirm logs in sequence:
   - `Stagger` Sending inject-message to pane X
   - `Inject` Received inject-message for pane X
   - `Queue` Queued for pane X, queue length: N

---

## 🔧 Session 44: Codex Exec UX Improvements (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED - Pending review  

**Problem:** Codex exec output was too quiet; extra blank lines; redundant completion markers.  
**Fix Applied:** Surface tool/command/file JSONL events, smooth newline handling, and emit a single “Done (exit X)” line.  
**Files updated:** `ui/modules/codex-exec.js`  

**Testing Required:**
1. Run Codex exec prompt
2. Confirm `[TOOL]`, `[CMD]`, `[FILE]` markers appear when appropriate
3. Verify no double blank lines in output
4. Ensure completion shows a single `Done (exit X)` line

---

## 🔧 Session 43: Codex Session ID Persistence (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ REVIEWER APPROVED - Pending runtime verification  

**Problem:** Codex exec restarts lost resume context because `codexSessionId` was not persisted.  
**Fix Applied:** Persist `codexSessionId` in session-state, restore on spawn, and cache on kill for restart.  
**Files updated:** `ui/terminal-daemon.js`  

**Testing Required:**
1. Kill a Codex pane
2. Restart the pane
3. Verify Codex resumes the previous session (resume path used, “Restored session id” log)

---

## 🎨 Session 42: Terminal UI Enhancements (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ ALL 6 FEATURES APPROVED - Ready for User Testing

**Features Implemented:**

### 1. WebGL Addon (GPU Rendering) ✅ APPROVED
- Installed @xterm/addon-webgl v0.19.0
- GPU-accelerated terminal rendering for all 6 panes
- Graceful fallback on WebGL context loss

### 2. Terminal Search (Ctrl+F) ✅ APPROVED
- Installed @xterm/addon-search v0.16.0
- Ctrl+F opens search bar, Enter/Shift+Enter navigate

### 3. Focus Ring Enhancement ✅ APPROVED
- Teal glow (#4ecca3) with box-shadow
- More visible focused pane indicator

### 4. Target Preview Dropdown ✅ APPROVED
- Custom dropdown with pane highlight on hover
- "All Agents" highlights all 6 panes simultaneously

### 5. Command Palette (Ctrl+K) ✅ APPROVED
- VS Code-style command palette
- 18 commands: Spawn/Kill/Nudge, Focus pane 1-6, Toggle panels
- Fuzzy search filter, keyboard navigation
- Categories: Agents, Navigate, Panels, Project, System
- Review: workspace/build/reviews/command-palette-review.md

### 6. Dim Inactive Panes ✅ APPROVED
- Non-focused panes dimmed to 85% brightness
- Hover brightens to 95% for visual feedback
- Smooth 0.2s transition
- Complements focus ring enhancement

**Files updated:**
- `ui/modules/terminal.js` - addon imports, loading, search UI
- `ui/renderer.js` - initCustomTargetDropdown, initCommandPalette (+270 lines)
- `ui/styles/layout.css` - all new UI CSS
- `ui/index.html` - command palette HTML structure
- `ui/package.json` - new dependencies

**Testing Required:**
1. Restart app to load changes
2. Press Ctrl+K - command palette opens
3. Type to filter, arrow keys to navigate, Enter to execute
4. Press Ctrl+F in terminal - search bar appears
5. Click target dropdown - hover options to see pane highlights

---

## 🔧 Session 41: IPC Guard Hardening (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE  

**Problem:** IPC handlers could throw when ctx dependencies were partially unset (e.g., watcher/triggers missing methods).  
**Fix Applied:** Added method-level guards and clear missingDependency responses.  
**Files updated:** `ui/modules/ipc/state-handlers.js`, `ui/modules/ipc/conflict-queue-handlers.js`

---

## 🔧 Session 41: Terminal Injection Extraction (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE  

**Problem:** `terminal.js` injection/verify/queue logic too large and fragile (hard to reason about).  
**Fix Applied:** Extracted injection logic into `ui/modules/terminal/injection.js` and wired controller wrappers in `terminal.js`.  
**Files updated:** `ui/modules/terminal/injection.js`, `ui/modules/terminal.js`

---

## 🔧 Session 41: Terminal Recovery Extraction (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE  

**Problem:** `terminal.js` recovery/unstick/sweeper logic too large and tightly coupled.  
**Fix Applied:** Extracted recovery logic into `ui/modules/terminal/recovery.js` and wired controller wrappers in `terminal.js`.  
**Files updated:** `ui/modules/terminal/recovery.js`, `ui/modules/terminal.js`

---

## 🔧 Session 41: IPC Handler Registry Split (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE (ready for review)  

**Problem:** `ipc-handlers.js` had a long, fragile list of handler registrations + background process helpers.  
**Fix Applied:** Moved handler registration list to `ui/modules/ipc/handler-registry.js` and background helpers to `ui/modules/ipc/background-processes.js`.  
**Files updated:** `ui/modules/ipc/handler-registry.js`, `ui/modules/ipc/background-processes.js`, `ui/modules/ipc-handlers.js`  
**Follow-up:** Deduped `broadcastProcessList` in `ui/modules/ipc/process-handlers.js` to reuse background helper.

---

## 🔧 Session 39: Message Accumulation Root Cause Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED - Ready for restart verification

**Problem:** Messages still accumulating despite Ctrl+U fix. Multiple agent messages arriving concatenated in single conversation turn.

**Root Causes Found:**
1. safetyTimer (1000ms) fires before clearTimeout can run (inside setTimeout callback)
2. verifyAndRetryEnter false positive - sees ongoing output and assumes success even if Enter was ignored

**Fixes Applied:**

### Fix #1: safetyTimer timing (line ~1159)
- Moved `clearTimeout(safetyTimer)` to first line inside setTimeout callback
- Clears timer immediately when enterDelay completes, before focus/Enter

### Fix #2: Pre-flight idle check (lines 1189-1204) ✅ APPROVED
- Before sending Enter, wait up to 5s for pane to be idle
- 100ms polling, bounded timeout
- Prevents Enter being sent while Claude is mid-response

### Fix #3: Verification retry (lines 581-599) ✅ APPROVED
- Removed "likely succeeded" fallback that returned true without prompt confirmation
- Now retries Enter when output occurred but no prompt detected
- Returns false and marks stuck if retries exhausted

**Files updated:**
- `ui/modules/terminal.js`

**Review:** `session39-verification-false-positive-fix-review.md`

---

## ✅ Session 38 Commit: `a686d0c` (Jan 30, 2026)
**Contents:**
- Textarea accumulation fix (Ctrl+U clear before PTY writes)
- Ack-timeout verification_failed handling
- Message accumulation bug documentation in all CLAUDE.md files

**All pre-commit checks passed:** 433 tests, ESLint, mypy

---

## 🔧 Textarea Accumulation Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ COMMITTED (`a686d0c`) - Ready for restart verification

**Problem:** Messages accumulating in textarea when first Enter fails. Pattern:
1. First message injected, Enter fails
2. Text stays stuck in textarea
3. Second message APPENDS to stuck text
4. Second Enter submits both as one blob

**Fix Applied:**
- Send Ctrl+U (`\x15`) before each PTY text write to clear input line
- Made `doSendToPane()` async for proper await ordering
- Added try-catch with proper error handling

**Files updated:**
- `ui/modules/terminal.js` - doSendToPane() lines 1129-1140

**Why Ctrl+U:**
- Standard Unix/readline command to clear current input line
- Harmless if line is already empty
- Prevents accumulation regardless of why previous Enter failed

---

## 🔧 TR1 Test Results Null Guard Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED

**Problem:** `TypeError: Cannot read properties of null (reading length)` when IPC returns null results.

**Fix Applied:**
- `setTestResults()` now uses `testResults.length` (already defaulted) instead of `results.length`
- `loadTestResults()` and `runTests()` add `Array.isArray()` defensive checks
- `test-complete` event handler has same defensive pattern

**Files updated:**
- `ui/modules/tabs.js` - lines 445-542

---

## 🔧 Input Lock Bypass Fix for Auto-Submit (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ RUNTIME VERIFIED (Reviewer, Jan 30, 2026)

**Problem:** Auto-submit stuck for Claude panes - sendTrustedEnter fires but Enter blocked by input lock.

**Root Causes (Investigator finding):**
1. Key handler checked `event.key === 'Enter' && !event.isTrusted` - but Electron's sendInputEvent may produce `isTrusted=true`
2. Key handler only checked `key === 'Enter'` but some events have `key === 'Return'`
3. Bypass check was gated behind `!event.isTrusted` - if trusted event, bypass never checked, fell through to lock

**Fix Applied:**
1. **isEnterKey** - Check `key === 'Enter'` OR `key === 'Return'` OR `keyCode === 13`
2. **Bypass check FIRST** - `_hivemindBypass` now allows Enter regardless of `isTrusted` value
3. **Better logging** - Logs key and isTrusted values for debugging

**Files updated:**
- `ui/modules/terminal.js` - Both `initTerminal` and `reattachTerminal` key handlers

**Verification (Jan 30, 2026 01:06 UTC):**
- ✅ Pane 1 (Architect): sendTrustedEnter → Enter succeeded (01:06:51)
- ✅ Pane 3 (Implementer A): sendTrustedEnter → Enter succeeded (01:06:53)
- ✅ Pane 6 (Reviewer): sendTrustedEnter → Enter succeeded (01:06:53)
- ✅ Trigger delivery: implementer-a #1 → lead delivered (01:07:33)
- ✅ No "Blocked synthetic Enter" messages in logs
- ✅ All 6 panes spawned and running

---

## ⚠️ Trigger Delivery Ack Timeouts (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ IMPLEMENTED (pending verification)

**Symptom:** `Delivery timeout` warnings from `triggers.js` after restart even though logs show Enter sent for panes 1/3/6.

**Root cause:** `daemon-handlers` only emits `trigger-delivery-ack` when `sendToPane` returns `success:true`.  
`doSendToPane()` returned `success:false` if `verifyAndRetryEnter()` failed (no output/prompt within window) even when Enter was dispatched.  
Result: ack suppressed → pending delivery times out.

**Fix Applied:**
- When Enter is sent but verification fails, return `{ success:true, verified:false, reason:'verification_failed' }` so ack is emitted.
- True failures (missing_textarea/focus_failed/enter_failed) still return `success:false`.

**Files updated:**
- `ui/modules/terminal.js`

**Next:** Reviewer verify timeouts stop while preserving real failures.

---

## 🔧 Safety Timer Timeout Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ COMPLETE - Ready for restart verification

**Problem:** "Trigger delivery failed for pane X: timeout" appears in logs despite messages being delivered successfully. May also cause actual injection aborts.

**Root Cause (Architect finding):** `safetyTimer` fires at `INJECTION_LOCK_TIMEOUT_MS` (1000ms) which can occur DURING the `enterDelay` wait (50-300ms), BEFORE the callback even executes.

**Fix Applied:**
- Clear `safetyTimer` as FIRST line inside setTimeout callback (line 1159)
- Clears immediately when enterDelay completes, before focus/Enter/verification
- Preserves proper failure handling via `finishWithClear` for actual failures

**Files updated:**
- `ui/modules/terminal.js` - line 1159 (first line inside setTimeout callback)

---

## 🔧 Message Accumulation Root Cause Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ COMPLETE - Ready for restart verification

**Problem:** Messages accumulating in textarea - Enter sent mid-output gets ignored, but verification saw false positive.

**Root Cause Analysis:**
1. **(Reviewer finding):** verifyAndRetryEnter assumed success when "output+idle" without prompt
2. **(Architect finding):** `lastOutputTime` comparison doesn't work if Claude was ALREADY outputting

**Two-Part Fix:**

**Part A - Pre-Flight Idle Check (lines 1189-1204):**
- Before sending Enter, wait for pane to be idle (up to 5s)
- Prevents sending Enter mid-output where it gets ignored
- Addresses upstream cause: don't inject while Claude is outputting

**Part B - verifyAndRetryEnter Fix (lines 581-599):**
- DON'T assume success when output+idle but no prompt detected
- Retry Enter with proper focus if retries available
- Mark as stuck and return false if retries exhausted
- Addresses downstream detection: don't report false positive

**Files updated:**
- `ui/modules/terminal.js` - doSendToPane() + verifyAndRetryEnter()

**Priority:** HIGH - root cause of message accumulation bug

---

## 🚨 Terminal.input Disabled + Focus Steal Fix (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED (Jan 30, 2026)

**Problem 1 (CRITICAL):** Messages batching - appearing to submit only when next message arrives.
**Root Cause:** Terminal.input('\r') was being used but is a NO-OP for Claude's ink TUI. It routes through onData → pty.write, same path as PTY '\r' which was proven broken in Fix R. Terminal.input succeeds (doesn't throw) but Claude ignores it.

**Problem 2:** Command bar input blocked ~1s during trigger injections due to focus steal.

**Fix Applied:**
1. **DISABLED Terminal.input for Claude panes** - Always use sendTrustedEnter which sends native Electron keyboard events
2. **Immediate focus restore** - Restore focus right after Enter is sent, before verification loop
3. **Fixed logic order** - Check focus success BEFORE sending Enter, not after
4. **restoreSavedFocus helper** - Encapsulates focus restore logic with DOM existence check

**Key changes:**
- `sendEnterToPane()` (L468-503): Removed Terminal.input path, always uses sendTrustedEnter with _hivemindBypass
- `doSendToPane()` (L1110-1114): Always focus textarea for sendTrustedEnter
- `doSendToPane()` (L1141-1157): Check focus BEFORE sending Enter, restore focus immediately after
- Verification loop runs with focus already restored to user

**Files updated:**
- `ui/modules/terminal.js`

**Requires:** App restart + Reviewer approval

**This should fix the message batching issue observed by user.**

---

## 🔒 Per-Pane Input Lock (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED (Jan 30, 2026)

**Feature:** Terminal panes locked by default (view-only), toggle to unlock for direct typing.

**Implementation:**
1. **inputLocked map** - Tracks lock state per pane, defaults to true (locked)
2. **Key handler blocking** - Blocks all keyboard input when locked, EXCEPT:
   - ESC bypasses lock (for unstick scenarios)
   - Ctrl+L toggles lock state
3. **Paste blocking** - Both right-click paste and Ctrl+V blocked when locked
4. **Lock icon in header** - Click to toggle lock, visual indicator (🔒/🔓)
5. **Programmatic sends unaffected** - sendToPane/triggers use PTY write path, not keyboard

**Reviewer Conditions (all met):**
- ✅ ESC bypasses lock (for unstick scenarios)
- ✅ Paste blocking implemented (both Ctrl+V and right-click)
- ✅ Clicking locked pane doesn't auto-unlock (click lock icon to toggle)
- ✅ sendToPane/triggers still work (PTY write path unaffected by key handler)

**Files updated:**
- `ui/modules/terminal.js`
  - Added `inputLocked` map with default true for all panes
  - Added `isInputLocked()`, `toggleInputLock()`, `setInputLocked()` functions
  - Updated key handlers in both `initTerminal` and `reattachTerminal`
  - Updated `setupCopyPaste` to block paste when locked
  - Added exports for new functions
- `ui/index.html`
  - Added lock icon (`<span class="lock-icon">`) to all 6 pane headers
- `ui/styles/layout.css`
  - Added `.lock-icon` styling with hover states
- `ui/renderer.js`
  - Added click handler for lock icons

**Requires:** App restart to test

---

## 🔧 Auto-Submit Fix V3 (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED (Jan 30, 2026)

**Problem:** Auto-submit intermittently fails - Enter ignored or false success detection.

**Root Causes Addressed:**
1. `verifyAndRetryEnter` used "any output = success" (false positives from continuation)
2. `doSendToPane` sent Enter even when `focusWithRetry` failed (wrong element)
3. No focus-free Enter path existed

**Fix Applied:**
1. **ROOT CAUSE FIX: _hivemindBypass flag** - sendInputEvent produces isTrusted=false
   - `sendEnterToPane()` sets `terminal._hivemindBypass=true` before sendTrustedEnter
   - Clears flag after Enter processed (setTimeout(0))
   - Key handler (attachCustomKeyEventHandler) allows Enter when bypass set
2. **Terminal.input() path** - Feature-detected focus-free Enter via xterm 6.0.0 API
   - `sendEnterToPane()` helper prefers `terminal.input('\r')` if available
   - Falls back to `sendTrustedEnter` with bypass flag when needed
3. **Stricter success criteria** - `verifyAndRetryEnter` now requires:
   - Output activity started AND (prompt-ready OR output ongoing)
   - Not just "any output after Enter"
4. **Focus gate** - `doSendToPane` aborts if focus fails AND no Terminal.input
   - No more "sending Enter anyway" to wrong element
5. **Prompt-ready detection** - New `isPromptReady()` checks terminal buffer for prompt patterns

**Call sites updated (bypass flag):**
- `sendEnterToPane()` - central helper with bypass flag
- `aggressiveNudge()` - now sets bypass before sendTrustedEnter
- Stuck sweeper - now uses `sendEnterToPane()` helper

**Files updated:**
- `ui/modules/terminal.js`
  - Added `sendEnterToPane()` (L424-462) - with bypass flag
  - Added `isPromptReady()` (L468-491)
  - Rewrote `verifyAndRetryEnter()` (L506-588)
  - Updated `doSendToPane()` Enter path
  - Updated `aggressiveNudge()` with bypass flag
  - Updated stuck sweeper to use `sendEnterToPane()`
  - Added `PROMPT_READY_TIMEOUT_MS` constant (L104)

**Requires:** App restart to test

**Investigator feedback addressed:**
- Added '?' to prompt patterns (for "Continue?" style prompts)
- Increased ENTER_VERIFY_DELAY_MS: 100ms -> 200ms (reduce double-submit risk)
- Note: Runtime testing needed for edge cases

---

## 🧹 Dead CSS Cleanup (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ COMPLETE

Removed legacy `.pane-grid` CSS (16 lines) from layout.css:115-130.
Old grid layout replaced by flex in Task #1.

**Files updated:**
- `ui/styles/layout.css`

---

## 🚀 UI Overhaul Sprint - Task #3: Command Bar Input (Jan 30, 2026)
**Owner:** Implementer A
**Status:** ✅ REVIEWER APPROVED (Jan 30, 2026)

**Summary:**
- Target selector dropdown defaults to Architect, supports all 6 agents + "All Agents"
- Dynamic placeholder updates based on selected target
- Delivery status indicator (⏳ sending / ✓ delivered / ✕ failed)
- Works in both SDK mode and PTY mode
- Explicit `/N` prefix still supported, overrides dropdown selection

**Files updated:**
- `ui/index.html` - Added #commandTarget dropdown and #commandDeliveryStatus span
- `ui/styles/layout.css` - Added styling for command-target and command-delivery-status
- `ui/renderer.js` - Added updateCommandPlaceholder(), showDeliveryStatus(), target support in sendBroadcast()

---

## 🚀 UI Overhaul Sprint - Task #2: Pane Swap (Jan 30, 2026)
**Owner:** Implementer B
**Status:** ✅ REVIEWER APPROVED (Jan 30, 2026)

**Summary:**
- Click side pane swaps into main position; previous main returns to clicked slot
- Main pane tracked via DOM dataset (`body[data-main-pane-id]` + `data-main` per pane)
- Triggers xterm fit + PTY resize after swap to adjust sizes

**Files updated:**
- `ui/renderer.js`

## 🔍 UI Audit Sprint - IN PROGRESS (Session 33)

### Task #4: IPC Alias Normalization (Jan 29, 2026)
**Owner:** Implementer B
**Status:** ✅ APPROVED - Reviewer verified all channel mappings (Session 33)

**Problem:** Multiple renderer IPC calls had no matching handlers or mismatched response shapes (Performance tab, Templates tab, Rollback UI, pane project selection).

**Fix Applied (Backend-only):**
- Added IPC aliases: `apply-rollback`, `get-performance-stats`, `reset-performance-stats`, `get-templates`, `select-pane-project`
- Normalized responses for legacy UI expectations (performance stats shape + `successes`, rollback `filesRestored`, template load `name`)
- `save-template` now accepts string name and snapshots current settings

**Files updated:**
- `ui/modules/ipc/checkpoint-handlers.js`
- `ui/modules/ipc/performance-tracking-handlers.js`
- `ui/modules/ipc/template-handlers.js`
- `ui/modules/ipc/project-handlers.js`

### Task #5: costAlertBadge Missing Element (Jan 29, 2026)
**Owner:** Implementer A
**Status:** ✅ APPROVED - Reviewer verified HTML/CSS/handler implementation (Session 33)

**Problem:** `costAlertBadge` referenced in daemon-handlers.js:1032 but missing from HTML. Badge never displayed when cost threshold exceeded.

**Fix Applied:**
- Added `<span class="cost-alert-badge" id="costAlertBadge">` to toolbar (index.html:47)
- Added CSS styling with pulse animation (layout.css:55-74)
- Added click handler to open Progress tab (daemon-handlers.js:1053-1070)

**Files updated:**
- `ui/index.html`
- `ui/styles/layout.css`
- `ui/modules/daemon-handlers.js`

---

## 🎉 P2 Debugging Sprint - COMPLETE (Session 30)

**All tasks committed and pushed to main:**

| Commit | Task | Description |
|--------|------|-------------|
| `eb3ddff` | #5 | Message inspector panel |
| `42d3641` | - | jest.useFakeTimers fix |
| `5b6f111` | #3 | Integration test harness |
| `13f692e` | #8 | Reliability analytics |
| `d947758` | #10 | Automated test gate |

**Stats:** 5 commits, 433 tests, 12 suites, all 5 pre-commit gates passing

---

## SDK Mode State Sync Fix (Jan 29, 2026)

**Owner:** Implementer B  
**Summary:** Centralized SDK mode setter in `renderer.js` to keep renderer/daemon-handlers/terminal/settings in sync.

**Changes:**
- Added `setSDKMode(enabled)` helper to update local flag, notify daemon/terminal modules, and persist settings via IPC when needed
- `markSettingsLoaded()` now calls `setSDKMode(..., { persist: false })`
- `enableMode()` / `disableMode()` use `setSDKMode(...)` to avoid drift
- `markTerminalsReady()` uses `setSDKMode(true, { persist: false })` for SDK init path

**Files updated:**
- `ui/renderer.js`

**Status:** ✅ COMPLETE - Ready for Reviewer verification (SDK toggle + PTY guard behavior)

---

## Session 32 Runtime Verification (Jan 29, 2026)

**Verified by:** Reviewer (from app.log analysis)

### Confirmed WORKING from Logs:

1. **Message Sequence Reset on App Startup** ✅
   - Log entry: `[MessageSeq] Resetting message state for fresh session`
   - All `#1` messages from agents were **ACCEPTED**, none SKIPPED as duplicates

2. **6-Pane Spawn** ✅
   - All 6 panes reached "running" state
   - Panes 1, 3, 6 (Claude): PTY spawned with PIDs
   - Panes 2, 4, 5 (Codex): exec mode (PID 0, expected)
   - Identity injection successful for all 6 roles

3. **Auto-Submit Working** ✅
   - Adaptive Enter delay (50ms idle) functioning
   - `verifyAndRetryEnter` confirming "Enter succeeded (output activity detected)"
   - Force-inject after queue timeout (10s) working with 500ms idle check

4. **Trigger Delivery Working** ✅
   - implementer-a #1 → lead: ACCEPTED, DELIVERED
   - implementer-b #1 → lead: ACCEPTED, DELIVERED (after queue)
   - architect #1 → worker-a: ACCEPTED, DELIVERED
   - investigator #1 → lead: ACCEPTED

### Pending User Verification:

1. **Codex Exec Respawn** - Requires killing a Codex pane and clicking Restart
2. **Inspector Panel** - Tab visibility fix applied, needs visual confirm
3. **Reliability Analytics Display** - Needs Inspector panel open to verify stats

---

## Inspector Tab Visibility Fix (Session 32, Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Inspector tab was scrolled out of view (10th of 11 tabs in 350px panel).

**Fix Applied:**
- Moved Inspector tab from position 11 to position 4 (after Activity)
- Shortened all tab names to fit more in view:
  - Screenshots → Shots, History → Hist, Projects → Proj
  - Templates → Tmpl, Progress → Prog, Processes → Proc
  - Messages → Msgs, Inspector → Insp

**Files updated:**
- `ui/index.html` - panel-tabs section (lines 312-323)

**Status:** ✅ COMMITTED `a95de97` - Pending restart verification

---

## SDK Mode State Drift Fix (Session 32, Jan 29, 2026)

**Owner:** Architect

**Summary:** Fixed SDK mode state drift where 4 separate flags could get out of sync.

**Problem (Investigator finding):**
- 4 separate SDK mode flags existed:
  - `renderer.js` local `sdkMode`
  - `daemon-handlers.js` `sdkModeEnabled`
  - `terminal.js` `sdkModeActive`
  - `settings.js` `currentSettings.sdkMode`
- `markSettingsLoaded()` set daemon/terminal flags but NOT local sdkMode
- `enableMode()` set local sdkMode but NOT daemon/terminal flags
- This caused inconsistent behavior depending on entry point

**Fix Applied:**
- Created centralized `setSDKMode(enabled, options)` helper function
- Helper atomically sets all flags + persists to settings
- Options: `persist` (default true), `source` (for logging)
- Updated all call sites to use the helper:
  - `markSettingsLoaded()` (line 63)
  - `markTerminalsReady()` (line 76)
  - `enableMode()` (line 158)
  - `disableMode()` (line 165)

**Files updated:**
- `ui/renderer.js` - Added helper function + updated 4 call sites

**Status:** ✅ COMMITTED `a95de97` - Review: `workspace/build/reviews/sdk-mode-state-drift-review.md`

---

## Codex Exec Respawn Fix (Session 31, Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Fixed bug where restartPane() killed Codex terminals but never recreated them.

**Root Cause:**
- `restartPane()` called `pty.kill(id)` then `spawnClaude(id)`
- For Codex panes, `spawnClaude()` only sends identity message - doesn't create PTY
- Result: Terminal killed but never recreated

**Fix Applied:**
- Added `pty.create(id)` call before `spawnClaude(id)` for Codex panes
- IPC handler uses `INSTANCE_DIRS[paneId]` to set correct cwd automatically

**Files updated:**
- `ui/modules/terminal.js` - restartPane() lines 1057-1090

**Status:** ✅ COMMITTED `3f93384` (Jan 29, 2026) - Runtime verification pending after restart. Review: `workspace/build/reviews/codex-respawn-fix-review.md`

---

## Task #10: Automated Test Gate (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Integrated Jest test suite into pre-commit hooks and wired up CI status indicator.

**Files updated:**
- `.git/hooks/pre-commit` - Added Gate 5 for Jest unit tests (runs `npm test --silent`)
- `ui/modules/tabs.js` - Wired `runTests()` to update CI indicator + added `ci-check-complete` listener

**Changes:**
1. Pre-commit hook now runs 433 Jest tests before allowing commits
2. `runTests()` updates CI status indicator (running → passing/failing)
3. Added listener for `ci-check-complete` event from precommit-handlers.js
4. CI indicator auto-hides after 10s on success

**Verification:**
- All 433 tests pass
- Pre-commit hook runs all 5 gates successfully
- CI indicator displays correctly during test runs

**Status:** ✅ APPROVED (Reviewer, Session 29) - See `workspace/build/reviews/task10-automated-test-gate-review.md`

---

## Task #8: Reliability Analytics (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Added comprehensive reliability metrics collection and display for message delivery tracking.

**Files updated:**
- `ui/modules/triggers.js` - Added metrics collection infrastructure (~200 lines):
  - `reliabilityStats` object tracking aggregate, per-pane, per-mode, per-type stats
  - `metricsEventLog` for time-windowed analysis (15m, 1h rolling windows)
  - `recordSent()`, `recordDelivered()`, `recordFailed()`, `recordTimeout()`, `recordSkipped()` functions
  - `getReliabilityStats()` function returning comprehensive stats
  - Updated `handleTriggerFile`, `broadcastToAllAgents`, `sendDirectMessage` to record metrics
  - Updated `startDeliveryTracking` and `handleDeliveryAck` to track latency
- `ui/modules/ipc/state-handlers.js` - Added `get-reliability-stats` IPC handler
- `ui/modules/tabs.js` - Added `loadReliabilityStats()` function and UI wiring
- `ui/index.html` - Added Reliability Analytics section to Inspector panel
- `ui/styles/tabs.css` - Added reliability section styling

**Features:**
- Success rate percentage (delivered/sent)
- Uptime tracking (since app start)
- Average delivery latency with min/max
- Per-mode breakdown (SDK vs PTY)
- Per-type breakdown (trigger, broadcast, direct)
- Skipped/duplicate count
- Timeout tracking
- Rolling windows (last 15 minutes, last 1 hour)
- Manual refresh button

**Status:** ✅ APPROVED (Reviewer, Session 29) - See `workspace/build/reviews/task8-reliability-analytics-review.md`

---

## P2-5: Message Inspector Panel (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Added a dedicated Inspector tab in the right panel for debugging message flow, delivery status, and sequence tracking.

**Files updated:**
- `ui/index.html` - Added Inspector tab button and tab-pane structure
- `ui/styles/tabs.css` - Added Inspector tab styling (stats, event log, filters, sequence grid)
- `ui/modules/tabs.js` - Added Inspector logic (event capture, filtering, stats, sequence state display)
- `ui/renderer.js` - Added setupInspectorTab() call
- `ui/modules/ipc/state-handlers.js` - Added get-message-state IPC handler

**Features:**
- Real-time event log capturing: triggers, broadcasts, SDK messages, PTY injections, blocked messages
- Stats summary: total events, delivered, pending, skipped
- Filter by event type: All, Triggers, Broadcast, SDK, Blocked
- Auto-scroll toggle and pause functionality
- Sequence state grid showing lastSeen values per agent
- Export log to file

**IPC Events captured:**
- `inject-message`, `sdk-message`, `sync-triggered`, `trigger-blocked`
- `trigger-sent-sdk`, `broadcast-sent`, `direct-message-sent`
- `task-routed`, `auto-handoff`

**Status:** ✅ APPROVED (Reviewer, Session 29) - See `workspace/build/reviews/task5-message-inspector-review.md`

---

## jest.useFakeTimers() Fix (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Added proper timer handling to test describe blocks that call functions with setTimeout (delivery-ack timeouts).

**Files updated:**
- `ui/__tests__/triggers.test.js` - Added jest.useFakeTimers()/jest.useRealTimers() to 5 describe blocks:
  - handleTriggerFile
  - notifyAgents
  - broadcastToAllAgents
  - sendDirectMessage
  - notifyAllAgentsSync

**Result:** All 433 tests pass. Timer cleanup prevents orphaned setTimeout handles.

**Status:** ✅ APPROVED (Reviewer, Session 29) - Verified pattern: useFakeTimers in beforeEach, runOnlyPendingTimers + useRealTimers in afterEach. Tests pass, no open handles.

---

## P1 Visibility - Unstick Escalation + Sync Indicator (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Added per-pane unstick escalation (nudge -> interrupt -> restart) and sync indicator for shared_context/blockers/errors.

**Files updated:**
- `ui/modules/terminal.js` - unstick escalation, interrupt/restart helpers, syncSharedContext returns success
- `ui/modules/daemon-handlers.js` - sync indicator UI + IPC listeners
- `ui/modules/watcher.js` - sync-file-changed event + auto-sync for blockers/errors
- `ui/renderer.js` - unstick button wiring + manual sync marker + sync indicator setup
- `ui/styles/layout.css` - status bar sync indicator styling

**Notes:** Sync indicator uses runtime DOM injection; auto-sync for blockers/errors respects autoSync setting.

**Status:** ✅ APPROVED - Committed as 526600b (see p1-unstick-sync-review.md)

---

## Renderer Unit Tests Sprint (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Added comprehensive unit tests for renderer-side modules.

**Test Files Created/Updated:**
- `ui/__tests__/triggers.test.js` - 115 tests (message sequencing, SDK mode, routing)
- `ui/__tests__/terminal.test.js` - 104 tests (PTY, idle detection, queuing)
- `ui/__tests__/daemon-handlers.test.js` - 78 tests (IPC handlers, state display)
- `ui/__tests__/sdk-renderer.test.js` - 34 tests (streaming, delivery tracking)

**Coverage Results:**
- Statements: **60.99%**
- Branches: **45.75%** (target 50% not met)
- Functions: **59.63%**
- Lines: **61.84%**
- Total Tests: **418 passing** (9 test suites)

**Coverage Gap Analysis:**
The 4.25% branch gap is primarily due to IPC event handler callbacks and complex state machine transitions that require integration testing rather than unit tests.

**Status:** COMPLETE - Ready for Reviewer verification

---

## Unit Tests - Main Process Modules (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Added Jest coverage for `modules/watcher.js` and `modules/logger.js`, plus test scaffolding.

**Files updated:**
- `ui/__tests__/watcher.test.js` - state transitions, conflict queue, message queue, auto-sync, trigger routing
- `ui/__tests__/logger.test.js` - log levels, formatting, scope, file output
- `ui/__tests__/setup.js` - global logger mock for non-logger tests
- `ui/jest.config.js` - expanded coverage collection + thresholds

**Coverage (npm run test:coverage):**
- Statements: **63.9%**
- Branches: **51.58%**
- Functions: **71.42%**
- Lines: **64.45%**

**Notes:** Jest warns about open handles after tests; all suites pass.

**Status:** COMPLETE (watcher/logger). Remaining targets: `mcp-server.js`, `codex-exec.js`, `modules/ipc/*.js`.

---

## Test Coverage Spot-Check - Session 30 (Jan 29, 2026)

**Owner:** Reviewer

**Summary:** Verified remaining test coverage targets (codex-exec, mcp-server, IPC harness).

**Files reviewed:**
- `ui/__tests__/codex-exec.test.js` - 7 tests covering spawn, resume, session capture, delta output, busy state
- `ui/__tests__/mcp-server.test.js` - 4 tests covering MCP tools (send_message, get_messages, trigger_agent)
- `ui/__tests__/helpers/ipc-harness.js` - test utility for IPC handler testing
- `ui/__tests__/ipc-handlers.test.js` - 4 tests covering handler registration + behavior samples

**Findings:**
- 433/433 tests pass
- 15/15 tests in reviewed files pass
- Mocking is clean and isolated
- Coverage is thorough for new modules

**Minor issue:**
- Jest open handle warning persists (perf-audit interval timing race)
- Fix applied: Added jest.useFakeTimers() to `ui/__tests__/ipc-handlers.test.js`
- Status: ✅ Reviewer APPROVED (test passes in isolation). Note: terminal.test.js open handle tracked separately.

**Status:** ✅ APPROVED - Full review: `workspace/build/reviews/session30-test-coverage-review.md`

---

## Error Handling Fixes - Batch A (Jan 29, 2026)

**Owner:** Implementer A

**Summary:** Added try/catch and .catch() handlers to 21 unhandled async operations.

**Files updated:**
- `ui/renderer.js` - 5 fixes (SDK broadcast/send, full-restart, sync, ESC handler)
- `ui/modules/terminal.js` - 14 fixes (clipboard, pty.write, sendTrustedEnter, codexExec, claude.spawn)
- `ui/modules/daemon-handlers.js` - 2 fixes (sdk-interrupt)

**Status:** APPROVED (Reviewer)

---

## Error Handling Fixes - Batch B (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Guarded watcher init and file reads, MCP file IO, daemon PID write, checkpoint rollback dir, and test framework detection.

**Files updated:**
- `ui/main.js` - wrapped did-finish-load init with retry + activity log on failure
- `ui/modules/watcher.js` - try/catch for checkpoint-approved read + initMessageQueue + mkdirs; added watcher error handlers
- `ui/mcp-server.js` - guarded message queue dir, atomic writes, state/status/trigger writes
- `ui/terminal-daemon.js` - guarded PID file write
- `ui/modules/ipc/checkpoint-handlers.js` - rollback dir guard + handler-level checks
- `ui/modules/ipc/test-execution-handlers.js` - safe package.json parse in detect()

**Status:** APPROVED (Reviewer)

**Review:** See `workspace/build/reviews/batch-b-error-handling-review.md` - 50+ error handlers verified across all 6 files.

**Docs commit:** `b35e0b8` - status + review notes recorded.

**Process note:** All Sprint 2 items reviewed and APPROVED. HYBRID fix verified and committed (f52a403).

---

## Logger File Output (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Logger now mirrors console output to `workspace/logs/app.log` and creates `workspace/logs/` if missing. No rotation.

**Files updated:**
- `ui/modules/logger.js`

**Status:** COMPLETE

---

## Version-fix Comment Cleanup Follow-up (Jan 29, 2026)

**Owner:** Implementer B

**Summary:** Removed remaining version/fix prefixes while preserving comment meaning. No behavior changes.

**Files updated:**
- `ui/terminal-daemon.js`
- `ui/modules/terminal.js`
- `ui/modules/triggers.js`

**Status:** COMPLETE

---

## Enter Verification + Retry During Active Output (Session 26, Jan 28, 2026)

**Owner:** Implementer A

**Problem:** Force-inject after `MAX_QUEUE_TIME_MS` (10s) fired `sendTrustedEnter()` during active Claude output. Enter was ignored because Claude was still processing, leaving text stuck in textarea.

**Root Cause (Investigator):** The adaptive delay fix handles race conditions at injection time, but doesn't address the case where Enter fires successfully but is ignored by Claude during active output.

**Fix Applied (Implementer A, Jan 28, 2026):**

1. **New `verifyAndRetryEnter()` helper function**:
   - Waits 100ms after Enter for processing
   - Checks if textarea is empty (submit succeeded)
   - If text remains, waits for pane idle (`isIdle()`)
   - Retries `sendTrustedEnter()` up to 5 times

2. **New constants**:
```javascript
const ENTER_VERIFY_DELAY_MS = 100;    // Delay before checking if Enter succeeded
const MAX_ENTER_RETRIES = 5;          // Max Enter retry attempts if text remains
const ENTER_RETRY_INTERVAL_MS = 200;  // Interval between idle checks for retry
```

3. **Integration**: `doSendToPane()` now calls `verifyAndRetryEnter()` after `sendTrustedEnter()` and returns success/failure accordingly

**Files updated:**
- `ui/modules/terminal.js` - verifyAndRetryEnter() + doSendToPane() changes

**Status:** ✅ RUNTIME VERIFIED (Session 27) - 10/10 messages delivered via delivery-ack, no stuck messages

---

## Sequence Reset on Sender Restart (Jan 28, 2026)

**Owner:** Implementer B

**Problem:** Burst tests pushed `lastSeen` high (e.g., 520). When an agent restarts and sends `#1`, subsequent messages are dropped as duplicates (e.g., seq 6 < 520).

**Fix Applied (Implementer B, Jan 28, 2026):**
- In `handleTriggerFile()` after `parseMessageSequence()` and before `isDuplicateMessage()`:
  - If `seq === 1` **and** message contains `# HIVEMIND SESSION:`, reset `lastSeen[sender]` for that recipient to `0`
  - Persist to `message-state.json` and log reset

**Files updated:**
- `ui/modules/triggers.js`

**Status:** COMPLETE - restart to pick up change

---

## Auto-Submit Race Condition Fixed (Jan 28, 2026)

**Owner:** Implementer A

**Problem:** Fixed 50ms delay between PTY text write and `sendTrustedEnter()` was insufficient under load. Enter could fire before text appeared in terminal, leaving messages unsent until manual intervention.

**Root Cause (Investigator analysis):** `doSendToPane()` used hardcoded 50ms delay. Under heavy output or input backlog, terminal needs more time. Also, if textarea disappears during delay, Enter goes to wrong element.

**Fix Applied (Implementer A, Jan 28, 2026):**

1. **Adaptive Enter delay** based on pane activity:
   - Idle pane (no output > 500ms): 50ms delay (fast)
   - Active pane (output in last 500ms): 150ms delay (medium)
   - Busy pane (output in last 100ms): 300ms delay (safe)

2. **Focus retry mechanism**: Up to 3 retry attempts with 20ms delay if initial focus fails

3. **Textarea null guards**:
   - Skip injection if textarea not found (prevents Enter to wrong element)
   - Re-query textarea after delay (handles DOM changes)
   - Abort with warning if textarea disappears before Enter

**New constants added:**
```javascript
const ENTER_DELAY_IDLE_MS = 50;
const ENTER_DELAY_ACTIVE_MS = 150;
const ENTER_DELAY_BUSY_MS = 300;
const PANE_ACTIVE_THRESHOLD_MS = 500;
const PANE_BUSY_THRESHOLD_MS = 100;
const FOCUS_RETRY_DELAY_MS = 20;
const MAX_FOCUS_RETRIES = 3;
```

**New helper functions:**
- `getAdaptiveEnterDelay(paneId)` - Returns delay based on `lastOutputTime`
- `focusWithRetry(textarea, retries)` - Async focus with retry loop

**Files updated:**
- `ui/modules/terminal.js` - doSendToPane() refactored

**Status:** COMPLETE - Ready for review

---

## Message Sequencing Bug Fixed (Jan 28, 2026)

**Owner:** Architect (diagnosis) / Implementer A (fix)

**Problem:** Agent-to-agent messages blocked as "SKIPPED duplicate" even though they never reached the target agent. User had to manually copy-paste messages between panes.

**Root Cause:** In `triggers.js` `handleTriggerFile()`, `recordMessageSeen()` was called BEFORE `sendStaggered()`. If injection failed, the message was already marked as "seen" and retries got blocked.

**Fix Applied (Implementer A, Jan 28, 2026):**
- Moved `recordMessageSeen()` from line 589 (before sending) to AFTER delivery:
  - **SDK path (lines 632-638):** Only records if `allSuccess === true`
  - **PTY path (lines 654-660):** Records after `sendStaggered()` IPC dispatch
- Added logging to track when messages are recorded vs skipped

**Files updated:**
- `ui/modules/triggers.js` - recordMessageSeen timing fix

**Follow-up Fix (Implementer B, Jan 28, 2026):**
- Added deliveryId tracking with pending delivery map + timeout
- Renderer sends `trigger-delivery-ack` after `sendToPane` completion; main forwards ack to triggers
- PTY path now records sequence only after all target panes ack delivery

**Files updated (follow-up):**
- `ui/modules/triggers.js` - delivery tracking + ack handling
- `ui/modules/daemon-handlers.js` - pass deliveryId and send acks
- `ui/modules/terminal.js` - onComplete callbacks for sendToPane
- `ui/main.js` - IPC forwarder for delivery acks

**Status:** ✅ COMPLETE - Reviewer APPROVED (see delivery-ack-enhancement-review.md)

---

## Codex Exec Event Handling Fix (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Fixed warning spam from unhandled `item.started` and `item.completed` events in Codex exec JSONL parser. These are lifecycle events from the OpenAI Responses API that were not being recognized.

**Changes:**
- Added `item.started` to `isStartEvent` check for proper [Working...] marker emission
- Added `item.completed` to `isCompleteEvent` check for proper [Task complete] marker emission
- Added fallback in `extractCodexText()` to return `''` (silent) for `item.started` and `item.completed` events without extractable text

**Logic flow:**
1. If `item.completed` has `item.text`, text is extracted (line 76)
2. If no text, event returns `''` (silent lifecycle) instead of `null` (warning)
3. `item.started` is always silent (pure lifecycle event)

**Files updated:**
- `ui/modules/codex-exec.js` - Event type handling

**Status:** APPROVED (Reviewer, Jan 28, 2026)

---

## Activity Log Integration for Triggers (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Added trigger event logging to the Activity Log. The existing "Trigger" filter button in the Activity tab now shows all trigger events with timestamps, target panes, message previews, and context.

**Changes:**
- Added `logActivityFn` module variable to store activity log function
- Updated `init()` to accept `logActivity` parameter
- Added `logTriggerActivity()` helper function (action, panes, message preview, extras)
- Added 8 logging calls at all trigger send points:
  - `notifyAgents` (SDK + PTY paths)
  - `handleTriggerFile` (SDK + PTY paths)
  - `routeTask`
  - `triggerAutoHandoff`
  - `sendDirectMessage` (SDK + PTY paths)

**Files updated:**
- `ui/modules/triggers.js` - Activity logging implementation
- `ui/main.js` - Pass `logActivity` to `triggers.init()`

**Log entry format:**
- Type: `trigger`
- Pane: Target pane ID(s)
- Message: `{action}: {preview}...`
- Details: `{ panes, preview, sender?, mode?, file?, taskType?, from?, to? }`

**Status:** APPROVED (Reviewer, Jan 28, 2026) - Note: 12 logging calls, not 8

---

## Focus-Restore Bug Fix (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Fixed cross-pane focus not restoring after trigger injection. The `!wasXtermTextarea` condition in `doSendToPane()` prevented focus restore when user was in ANY xterm textarea (including a different pane).

**Changes:**
- Removed `!wasXtermTextarea` check from lines 603 and 616
- Removed unused `wasXtermTextarea` variable declaration

**Files updated:**
- `ui/modules/terminal.js`

**Status:** APPROVED (Reviewer, Jan 28, 2026)

---

## Priority 1 — Runtime Stress Test (Jan 28, 2026)

**Owner:** Implementer B (executor) + Reviewer (observer)

**Purpose:** Verify PTY serialization + typing-guard work together after restart.

**Status:** 🟡 **PARTIAL** — Auto-submit + arrival spacing **confirmed by user**; typing-guard + Codex exec throughput still pending.

### Initial Test (Reviewer)

**Test 1: Burst Trigger Delivery**
- Sent 4 rapid burst messages + 47/60 ticks (10s intervals)
- **FALSE POSITIVE**: Messages appeared to arrive but were stuck in textareas
- Subsequent ticks "pushed" stuck messages through in batches
- User observed Implementer A stuck, needed manual intervention

**Root Cause Analysis (Reviewer):**
1. **PTY `\r` write is redundant** (`terminal.js:629`): Writes `\r` before trusted Enter, but PTY newlines don't submit in Claude Code's ink TUI (proven in Fix R/H/I)
2. **Injection lock released too early** (`terminal.js:644-648`): `finishWithClear()` releases global mutex after only 10ms, before Enter is fully processed
3. **Focus not verified** (`terminal.js:633`): `textarea.focus()` called but success not confirmed

### Re-test (Implementer B, 2026-01-28 18:49–18:59Z)

- Sent 4 rapid burst messages + 60 ticks (10s intervals) via `workspace/triggers/all.txt`
- `console.log`: global injection queue active (in-flight/queue/force-inject), **no mutex/lock errors** observed
- `session-state.json`: pane 6 shows ticks 1–60 in order + burst 1–4; panes 1/3 only last ticks (likely scrollback churn)
- **Note:** Tick timestamps are embedded in the message payload (written at trigger time), not actual arrival time. They do **not** prove spaced vs batched arrival. Need manual observation or instrumentation.
- `daemon.log`: codex-exec invoked 10× each for panes 2/4/5 in window (not per-tick); indicates possible throttling/backlog for Codex exec path
- Typing-guard not directly validated (no UI input automation available)
- Warnings observed: `CodexExec` “Unhandled event type=item.started/completed” for pane 4 during run

### User Confirmation (Implementer B, 2026-01-28 19:23–19:26Z)

- Sent 4 burst messages + 20 ticks (10s intervals) via `workspace/triggers/workers.txt`
- **User-confirmed**: messages arrived **without manual Enter** and were **spaced ~10s apart** (no batching)

**Next Steps:**
- [x] ~~Investigate if xterm 6.0.0 `terminal.input()` API bypasses these issues~~ - APPLIED (Priority 2b sendToPane refactor)
- [x] ~~Consider removing redundant PTY `\r` write~~ - Removed (terminal.input() replaces entire approach)
- [x] ~~Increase delay before releasing injection lock, or await Enter confirmation~~ - N/A (terminal.input() is synchronous)
- [x] **VERIFY FIX ON RESTART** - User confirmed auto-submit + spacing on Jan 28, 2026 (19:23–19:26Z)
- [x] Validate typing-guard while user is actively typing in another pane — console.log shows “user typing, queueing message” followed by delayed/forced injection (Jan 28 18:43–18:46Z).
- [x] Validate Codex exec throughput under sustained tick load — Investigator ran 8-tick load @3s to orchestrator/worker-b/investigator; daemon.log shows codex-exec received for panes 2/4/5 throughout (Jan 28 22:55:55–22:56:20Z).

**See:** `errors.md` for full error documentation

---

## Priority 2 — xterm.js Upgrade to 6.0.0 (Jan 28, 2026)

**Owner:** Implementer A

**Goal:** Enable `terminal.input(data, wasUserInput?)` API for focus-free injection.

**Summary:** Upgraded xterm.js from 5.3.0 to 6.0.0 (scoped package migration).

**Changes:**
- `xterm@5.3.0` → `@xterm/xterm@6.0.0`
- `xterm-addon-fit@0.8.0` → `@xterm/addon-fit@0.11.0`
- `xterm-addon-web-links@0.9.0` → `@xterm/addon-web-links@0.12.0`

**Files updated:**
- `ui/package.json` - dependency versions
- `ui/modules/terminal.js` - import paths (lines 6-8)
- `ui/index.html` - CSS path (line 7)

**Breaking change review:**
- `windowsMode` option removed - not used in our code
- `fastScrollModifier` option removed - not used in our code
- Canvas addon removed - not used (we use default renderer)
- Scroll bar redesign - should be transparent

**New API available:**
```typescript
terminal.input(data: string, wasUserInput?: boolean): void
```
Setting `wasUserInput=false` allows injection without focus-related side effects.

**Status:** COMPLETE

---

## Priority 2b — sendToPane() Refactor (Jan 28, 2026)

**Owner:** Implementer A

**Goal:** Fix stuck messages bug - auto-submit for Claude panes.

**Status:** ⚠️ **HYBRID FIX APPLIED (Session 22)** - Previous approaches failed, new fix pending restart verification.
**Review:** CONDITIONALLY APPROVED (Reviewer, Jan 28, 2026) — Strategy correct (PTY text + sendTrustedEnter). Minor bug: cross-pane focus not restored if user was in different terminal (lines 604/617 `!wasXtermTextarea` condition). Low impact (UX only). Restart verification pending.

### Fix Attempt History

**Attempt 1: terminal.input() (FAILED)**
```javascript
terminal.input(text + '\r', false);  // ~5 lines
```
- Reviewer APPROVED this approach
- **FAILED IN PRACTICE**: `wasUserInput=false` may prevent onData from firing reliably
- Messages didn't reach PTY

**Attempt 2: Direct PTY write (FAILED)**
```javascript
window.hivemind.pty.write(id, text + '\r');
```
- **FAILED**: Claude Code's ink TUI does NOT accept PTY `\r` as Enter (proven in Fix R)
- Text appeared but didn't submit

**Attempt 3: HYBRID FIX (Session 22, CURRENT)**
```javascript
// 1. Focus terminal textarea
textarea.focus();
// 2. Write text to PTY (no \r)
window.hivemind.pty.write(id, text);
// 3. Wait 50ms, then sendTrustedEnter()
window.hivemind.pty.sendTrustedEnter();
// 4. Restore focus
```
- **Why this works**: sendTrustedEnter() uses Electron's native `webContents.sendInputEvent()` which sends real keyboard events
- Claude Code's ink TUI requires actual keyboard events, not PTY stdin
- Focus is needed so sendTrustedEnter() targets the correct pane

**Files updated:**
- `ui/modules/terminal.js` - `doSendToPane()` function

**Key insight:** Only `sendTrustedEnter()` works for Claude Enter submission because it uses native Electron keyboard events, not PTY writes.

**Expected outcome:**
- Auto-submit works for Claude panes
- Minimal focus steal (brief focus, then restore)
- Codex panes unaffected (use separate exec path)

**Review: CONDITIONALLY APPROVED (Reviewer, Jan 28, 2026)**
- Correct strategy: PTY for text + sendTrustedEnter for Enter (proven in Fix H)
- Focus save/restore logic present with try/catch
- **BUG (minor):** Cross-pane focus not restored if user was in different terminal (lines 604, 617). `!wasXtermTextarea` condition prevents restore when user was in any xterm textarea.
- Impact: User inconvenience only, not functional breakage
- **REQUIRES RESTART to verify auto-submit works**

---

## Sprint 2 — Version-fix Comment Cleanup (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Removed 134 version-fix comment markers (`//V#`, `//BUG`, `//FIX` prefixes) across all ui/ source files while preserving meaningful comment content. Comments now describe what the code does without referencing legacy version numbers.

**Files updated:**
- `ui/renderer.js` (12 markers)
- `ui/modules/terminal.js` (16 markers)
- `ui/terminal-daemon.js` (40 markers)
- `ui/modules/watcher.js` (13 markers)
- `ui/modules/triggers.js` (24 markers)
- `ui/main.js` (17 markers)
- `ui/modules/sdk-bridge.js` (8 markers)
- `ui/modules/sdk-renderer.js` (3 markers)
- `ui/daemon-client.js` (1 marker)

**Status:** COMPLETE - Ready for review

---

## Sprint 2 — Logger Conversion: renderer.js (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Converted all 30 console.* calls in renderer.js to use the structured logger module. Subsystems: Init, SDK, Broadcast, Watchdog, Heartbeat, StuckDetection. No errors (warnings only from pre-existing unused vars).

**Files updated:**
- `ui/renderer.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - 32 log calls verified across 6 subsystems. Zero console.* remaining. Levels appropriate, format consistent.

---

## Sprint 2 — Codex Running-State Detection (Jan 28, 2026)

**Owner:** Architect

**Summary:** Made running-state detection case-insensitive so Codex exec panes marked "Codex exec mode ready" are treated as running. This prevents trigger delivery from being skipped due to `claudeRunning` staying idle.

**Files updated:**
- `ui/main.js`

---

## Sprint 2 — Ctrl+C Auto-Interrupt (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added `interrupt-pane` IPC channel to send Ctrl+C (0x03) to a pane's PTY. Updated main-process stuck detection to auto-send Ctrl+C after 120s of no output, with UI notification.

**Files updated:**
- `ui/modules/ipc/pty-handlers.js`
- `ui/main.js`

**Self-review (Implementer B, Jan 28, 2026):**
- interrupt-pane returns `{ success: boolean, error?: string }` and checks daemon connection/paneId.
- auto Ctrl+C uses daemonClient lastActivity (output) with throttle via lastInterruptAt.
- Known limitation: codex-exec terminals ignore PTY writes, so Ctrl+C is a no-op there; stuck notice may repeat every 30s while idle.

**Review: APPROVED (Reviewer, Jan 28, 2026)** - interrupt-pane IPC + auto Ctrl+C behavior verified.

**Review: APPROVED (Reviewer, Jan 28, 2026)**
- interrupt-pane IPC: Correct null checks for daemon connection, paneId validation, `\x03` for Ctrl+C, consistent return shape
- Auto Ctrl+C: 30s check interval, 120s threshold, throttling via lastInterruptAt, clears on output (line 480), UI notification via `agent-stuck-detected` IPC

---

## Sprint 2 — Daemon Client Logger Conversion (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Replaced 16 `console.*` calls in `daemon-client.js` with structured logger (`modules/logger`) to match renderer.js logging pattern. No behavior change.

**Files updated:**
- `ui/daemon-client.js`

**Review: APPROVED (Reviewer, Jan 28, 2026)** - All 17 console.* calls converted to structured logger. Consistent subsystem 'DaemonClient'. Appropriate log levels. Zero console.* remnants.

---

## Sprint 2 — Terminal Daemon + MCP Logger Cleanup (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Removed remaining `console.*` in `terminal-daemon.js` (use stdout/stderr writes in daemon logger) and `mcp-server.js` (modules/logger with stderr-safe warn/error to avoid MCP stdio interference). No behavior change.

**Files updated:**
- `ui/terminal-daemon.js`
- `ui/mcp-server.js`

**Next:** Reviewer optional spot-check that MCP logs still stay on stderr.

---

## Sprint 2 — PTY Injection Serialization (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added GLOBAL injection mutex and completion callback in `terminal.js` so PTY message injections serialize across panes (prevents focus/Enter races). `sendToPane` now always queues; `processQueue` respects in-flight injection with a safety timeout.

**Status:** DONE

**Files updated:**
- `ui/modules/terminal.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - Traced all code paths. Safety timer (1000ms) prevents lock. completed flag prevents double-callback. All paths call finishWithClear(). MAX_QUEUE_TIME_MS (10s) prevents deadlock. No race conditions. Minor: lines 259-262 dead code, global lock serializes all panes.

---

## Sprint 2 — Trigger Prefix + Status Bar Hint (Jan 28, 2026)

**Owner:** Investigator

**Summary:** Added ANSI bold yellow `[TRIGGER]` prefix for PTY-injected messages (notifyAgents, auto-sync, trigger file handling, routing, auto-handoff, direct messages). Updated status bar hint text for quick targeting commands.

**Files updated:**
- `ui/modules/triggers.js`
- `ui/index.html`

---

## Sprint 2 — IPC Null-Check Guards (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Added defensive null checks for ctx dependencies in 6 IPC modules (state, completion-quality, conflict-queue, smart-routing, auto-handoff, activity-log). Guards prevent crashes when watcher/triggers/log providers are unset and return safe defaults or errors.

**Files updated:**
- `ui/modules/ipc/state-handlers.js`
- `ui/modules/ipc/completion-quality-handlers.js`
- `ui/modules/ipc/conflict-queue-handlers.js`
- `ui/modules/ipc/smart-routing-handlers.js`
- `ui/modules/ipc/auto-handoff-handlers.js`
- `ui/modules/ipc/activity-log-handlers.js`

**Review:** APPROVED (Reviewer, Jan 28, 2026) - All guards consistent, proper fallbacks, 6-pane support confirmed. See `workspace/build/reviews/sprint2-ipc-null-checks-review.md`.

---

## IPC Bug Fix Pass — Consolidated (Jan 28, 2026)

**Owner:** Implementer B

**Fixes applied**
- output-validation: `validate-file` now uses local `runValidation` helper (no `ipcMain.handle` invocation)
- completion-quality: `validate-state-transition` now calls local `runQualityCheck` helper (no `ipcMain.handle` invocation)
- mcp-autoconfig: `mcp-reconnect-agent` uses local `configureAgent` helper (no `ipcMain.emit`)
- test-notification: `test-run-complete` uses local `notifyTestFailure` helper (no `ipcMain.emit`)
- error-handlers: `handle-error` now calls local `showErrorToast` helper (no `ipcMain.emit`)
- precommit: uses `ctx.runTests` (from test-execution-handlers) instead of `ipcMain.handle('run-tests')`
- api-docs: `get-api-docs` uses local `generateApiDocs` helper (no `ipcMain._events` access)
- perf-audit: `benchmark-handler` uses `ctx.benchmarkHandlers` map (no `ipcMain._events`), interval stored in `ctx.perfAuditInterval`
- defaults: expanded 4-pane defaults to 6 panes in performance-tracking, smart-routing, learning-data

**Smoke test:**
- `npx eslint modules/ipc/output-validation-handlers.js modules/ipc/completion-quality-handlers.js modules/ipc/mcp-autoconfig-handlers.js modules/ipc/test-notification-handlers.js modules/ipc/error-handlers.js modules/ipc/precommit-handlers.js modules/ipc/test-execution-handlers.js modules/ipc/api-docs-handlers.js modules/ipc/perf-audit-handlers.js modules/ipc/performance-tracking-handlers.js modules/ipc/smart-routing-handlers.js modules/ipc/learning-data-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

---

## Hardening Phase 2 — CSS Extraction COMPLETE (Jan 28, 2026)

**Owner:** Implementer A

**Summary:** Extracted ALL inline CSS from `ui/index.html` into 8 external files. File reduced from 4164 to 564 lines (zero inline CSS remaining).

| Module | Files Created | Status |
|--------|---------------|--------|
| Module 1 | `styles/base.css`, `styles/layout.css` | DONE |
| Module 2 | `styles/panes.css`, `styles/state-bar.css` | DONE |
| Module 3 | `styles/settings-panel.css`, `styles/friction-panel.css` | DONE |
| Module 4 | `styles/tabs.css`, `styles/sdk-renderer.css` | DONE |

**Files:** All 8 `<link>` tags in `<head>`, no remaining `<style>` block.

**Review:** APPROVED (Reviewer, Jan 28, 2026) - All 8 CSS files linked in index.html, Module 4 (tabs.css + sdk-renderer.css) verified.

---

## Hardening Phase 2 — ipc-handlers Split (Step 1–3) (Jan 28, 2026)

**Owner:** Implementer B

**Step 1: ipc registry + ctx**
- Added `ui/modules/ipc/index.js` with `createIpcContext` (state getters) + `createIpcRegistry`

**Step 2: shared state module**
- Added `ui/modules/ipc/ipc-state.js` for shared IPC state
- `ui/modules/ipc-handlers.js` now uses `ctx` getters instead of module globals

**Step 3: SDK handlers extracted**
- Added `ui/modules/ipc/sdk-handlers.js` and `ui/modules/ipc/sdk-v2-handlers.js`
- `ui/modules/ipc-handlers.js` registers SDK modules via registry
- Removed SDK sections from `ipc-handlers.js`
- Stripped version-fix comments from extracted SDK code

**Smoke tests:**
- `npx eslint modules/ipc/index.js modules/ipc/ipc-state.js modules/ipc/sdk-handlers.js modules/ipc/sdk-v2-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (sdk-handlers, sdk-v2-handlers)
- Implementer B: proceed to MCP split after review

---

## Hardening Phase 2 — ipc-handlers Split (MCP) (Jan 28, 2026)

**Owner:** Implementer B

**MCP bridge handlers**
- Added `ui/modules/ipc/mcp-handlers.js` (MCP bridge IPC)
- Registered via ipc registry; removed MCP bridge block from `ui/modules/ipc-handlers.js`
- Stripped version-fix comments from extracted MCP code

**MCP auto-configuration**
- Added `ui/modules/ipc/mcp-autoconfig-handlers.js` (configure/reconnect/remove)
- Registered via ipc registry; removed auto-config block from `ui/modules/ipc-handlers.js`
- Adjusted MCP server path for new module location

**Smoke tests:**
- `npx eslint modules/ipc/mcp-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/mcp-autoconfig-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (mcp-handlers, mcp-autoconfig-handlers)
- Implementer B: proceed to test/CI handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Test/CI) (Jan 28, 2026)

**Owner:** Implementer B

**Test execution**
- Added `ui/modules/ipc/test-execution-handlers.js` (detect/run tests, results/status)
- Registered via ipc registry; removed test execution block from `ui/modules/ipc-handlers.js`

**Pre-commit validation**
- Added `ui/modules/ipc/precommit-handlers.js` (pre-commit checks, CI status/enable/block)
- Registered via ipc registry; removed pre-commit block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.calculateConfidence` + `ctx.INCOMPLETE_PATTERNS` for shared validation helpers

**Test failure notifications**
- Added `ui/modules/ipc/test-notification-handlers.js` (notify/settings/block-on-failure)
- Registered via ipc registry; removed notification block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/test-execution-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/precommit-handlers.js modules/ipc-handlers.js`
- `npx eslint modules/ipc/test-notification-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (test-execution, precommit, test-notification)
- Implementer B: proceed to messaging handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Messaging) (Jan 28, 2026)

**Owner:** Implementer B

**Message queue handlers**
- Added `ui/modules/ipc/message-queue-handlers.js` (init/send/get/clear queue + watcher start)
- Registered via ipc registry; removed MQ4 block from `ui/modules/ipc-handlers.js`
- Stripped version-fix comments from extracted messaging code

**Smoke tests:**
- `npx eslint modules/ipc/message-queue-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (message-queue-handlers)
- Implementer B: proceed to docs/perf/error handlers after review

---

## Hardening Phase 2 — ipc-handlers Split (Docs/Perf/Error) (Jan 28, 2026)

**Owner:** Implementer B

**API docs**
- Added `ui/modules/ipc/api-docs-handlers.js`
- Registered via ipc registry; removed API docs block from `ui/modules/ipc-handlers.js`

**Performance audit**
- Added `ui/modules/ipc/perf-audit-handlers.js`
- Registered via ipc registry; removed perf audit block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.recordHandlerPerf` for future instrumentation

**Error handling**
- Added `ui/modules/ipc/error-handlers.js`
- Registered via ipc registry; removed error message block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/api-docs-handlers.js modules/ipc/perf-audit-handlers.js modules/ipc/error-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (api-docs, perf-audit, error-handlers)
- Implementer B: proceed to remaining modules after review

---

## Hardening Phase 2 — ipc-handlers Split (State) (Jan 28, 2026)

**Owner:** Implementer B

**State handlers**
- Added `ui/modules/ipc/state-handlers.js` (get-state, set-state, trigger-sync, broadcast-message, start-planning)
- Registered via ipc registry; removed state handlers block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/state-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (state-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Smart Routing) (Jan 28, 2026)

**Owner:** Implementer B

**Smart routing handlers**
- Added `ui/modules/ipc/smart-routing-handlers.js` (route-task, get-best-agent, get-agent-roles)
- Registered via ipc registry; removed smart routing block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/smart-routing-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (smart-routing-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Auto-Handoff) (Jan 28, 2026)

**Owner:** Implementer B

**Auto-handoff handlers**
- Added `ui/modules/ipc/auto-handoff-handlers.js` (trigger-handoff, get-handoff-chain)
- Registered via ipc registry; removed auto-handoff block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/auto-handoff-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (auto-handoff-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Conflict Queue) (Jan 28, 2026)

**Owner:** Implementer B

**Conflict queue handlers**
- Added `ui/modules/ipc/conflict-queue-handlers.js` (request-file-access, release-file-access, get-conflict-queue-status, clear-all-locks)
- Registered via ipc registry; removed conflict queue block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/conflict-queue-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (conflict-queue-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Learning Data) (Jan 28, 2026)

**Owner:** Implementer B

**Learning data handlers**
- Added `ui/modules/ipc/learning-data-handlers.js` (record-task-outcome, get-learning-data, get-best-agent-for-task, reset-learning, get-routing-weights)
- Registered via ipc registry; removed learning data block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/learning-data-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (learning-data-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Output Validation) (Jan 28, 2026)

**Owner:** Implementer B

**Output validation handlers**
- Added `ui/modules/ipc/output-validation-handlers.js` (validate-output, validate-file, get-validation-patterns)
- Registered via ipc registry; removed output validation block from `ui/modules/ipc-handlers.js`
- Exposed `ctx.INCOMPLETE_PATTERNS` + `ctx.calculateConfidence` for quality checks

**Smoke tests:**
- `npx eslint modules/ipc/output-validation-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (output-validation-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Completion Quality) (Jan 28, 2026)

**Owner:** Implementer B

**Completion quality handlers**
- Added `ui/modules/ipc/completion-quality-handlers.js` (check-completion-quality, validate-state-transition, get-quality-rules)
- Registered via ipc registry; removed completion quality block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/completion-quality-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (completion-quality-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Checkpoint) (Jan 28, 2026)

**Owner:** Implementer B

**Checkpoint handlers**
- Added `ui/modules/ipc/checkpoint-handlers.js` (create-checkpoint, list-checkpoints, get-checkpoint-diff, rollback-checkpoint, delete-checkpoint)
- Registered via ipc registry; removed checkpoint rollback block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/checkpoint-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (checkpoint-handlers)
- Implementer B: proceed to next module after review

---

## Hardening Phase 2 — ipc-handlers Split (Activity Log) (Jan 28, 2026)

**Owner:** Implementer B

**Activity log handlers**
- Added `ui/modules/ipc/activity-log-handlers.js` (get-activity-log, clear-activity-log, save-activity-log, log-activity)
- Registered via ipc registry; removed activity log block from `ui/modules/ipc-handlers.js`

**Smoke tests:**
- `npx eslint modules/ipc/activity-log-handlers.js modules/ipc-handlers.js`
- Warnings only (existing unused vars), no errors

**Next:**
- Reviewer: per-module regression review (activity-log-handlers)
- Implementer B: proceed to next module after review

---

## Fix Z — Trigger File Encoding Normalization (Jan 28, 2026)

**Owner:** Architect

**Problem:** Codex panes writing trigger files via Windows cmd.exe echo or PowerShell produced garbled messages. cmd.exe uses OEM CP437, PowerShell defaults to UTF-16LE, but trigger reader assumed UTF-8.

**Investigation (Investigator):**
- cmd.exe echo ASCII-only: OK
- cmd.exe echo with `& | % ^ !`: breaks/truncates file
- PowerShell default redirect: writes UTF-16LE BOM — garbles on UTF-8 read
- PowerShell `Set-Content -Encoding UTF8`: works correctly
- Codex exec degrades unicode to `???` before cmd even runs

**Fix:** `triggers.js` `handleTriggerFile()` now reads raw bytes and detects encoding:
1. UTF-16LE BOM (FF FE) → convert via `utf16le`
2. UTF-8 BOM (EF BB BF) → strip BOM
3. Default → UTF-8
4. Strip null bytes and control characters

**File Modified:** `ui/modules/triggers.js` (lines 491-515)

**Verification:** Reviewer approved Jan 28, 2026. Needs restart to test live.

---

## Codex CLAUDE.md Trigger Instructions Update (Jan 28, 2026)

**Owner:** Architect

**Problem:** Orchestrator (Codex pane) failed 4 consecutive times to reply via trigger files. Responded in terminal output instead. User had to manually push messages. Other Codex panes (Implementer B, Investigator) worked correctly.

**Root Cause:** Codex defaults to conversational terminal output. Conceptual instructions ("write to trigger file") didn't translate to action. Only succeeded when given exact bash command to execute.

**Fix:** Updated CLAUDE.md for all 3 Codex panes with:
- Explicit "EVERY REPLY MUST USE THIS COMMAND" section with copy-paste echo template
- Command-first framing (bash template before explanation)
- Orchestrator gets additional "PRIME DIRECTIVE" section at top of file

**Files Modified:**
- `workspace/instances/orchestrator/CLAUDE.md`
- `workspace/instances/worker-b/CLAUDE.md`
- `workspace/instances/investigator/CLAUDE.md`

**Next:** Verify on next session that Orchestrator uses triggers without manual push.

---

## Bug 2 - Codex Exec Output Line Breaks (Jan 28, 2026)

**Owner:** Implementer B

**Problem:** Codex exec responses render as a single mashed line with no separation between events or runs.

**Fix:** Append `\r\n` to non-delta text in `handleCodexExecLine()` so completed messages are line-broken while streaming deltas remain unmodified.

**File Modified:** `ui/modules/codex-exec.js`

**Next:** Reviewer verify Codex panes show proper line breaks.
**Verification:** Reviewer approved on Jan 28, 2026.\r\n
---

## Fix Y - Codex Exec JSONL Format Mismatch + windowsHide (Jan 27, 2026)

**Owner:** Architect

**Problem:** Codex panes showed "[Codex exec mode ready]" then "Codex exec exited 0" with no output. Also 3 external cmd.exe windows appeared on desktop.

**Root Cause (confirmed via manual test):** Codex exec outputs `{"type":"item.completed","item":{"text":"Hello!"}}` but the JSONL parser only checked `payload.delta.text`, `payload.text`, etc. The `item.text` path was missing entirely, so all response text was silently discarded as "Unhandled event". Additionally, `shell: true` without `windowsHide: true` spawned visible cmd.exe windows. Session tracking expected `session_meta` but Codex uses `thread.started` with `thread_id`.

**Fixes (3 in 1):**
1. Added `payload.item.text` extraction in `extractCodexText()` â€” catches `item.completed` events
2. Added `windowsHide: true` to `spawn()` options â€” hides cmd.exe windows
3. Added `thread.started` handler to capture `thread_id` for session resume
4. Added `turn.started`, `turn.completed` (dot notation) to `SILENT_EVENT_TYPES`

**File Modified:** `ui/modules/codex-exec.js`

**Next:** Restart and verify Codex panes display actual responses, no external windows, resume works.

---

## Fix X - Unsilence `message_delta` Event (Jan 27, 2026) â€” FAILED

**Owner:** Architect

**Problem:** Codex panes showed "Codex exec mode ready" then "Codex exec exited 0" with no agent output. Fix W's `SILENT_EVENT_TYPES` included `message_delta`, which carries `payload.delta.text` â€” the actual streamed response text.

**Fix:** Removed `message_delta` from `SILENT_EVENT_TYPES`. Added debug logging for silent events.

**File Modified:** `ui/modules/codex-exec.js` (lines 31, 101)

**Next:** Restart and verify Codex panes display actual responses.

---

## Fix V - Remove Conflicting `--full-auto` Flag (Jan 27, 2026)

**Owner:** Architect

**Problem:** Codex panes failed with `the argument '--full-auto' cannot be used with '--dangerously-bypass-approvals-and-sandbox'` â€” the two flags are mutually exclusive in Codex CLI.

**Fix:** Removed `--full-auto` from both initial and resume exec arg arrays. `--dangerously-bypass-approvals-and-sandbox` already implies full autonomy.

**File Modified:** `ui/modules/codex-exec.js` (lines 108-109)

**Next:** Restart and verify Codex panes spawn cleanly.

---

## Codex Exec Swap Assessment (Jan 27, 2026)

**Owner:** Worker B

**What:** Mapped current Codex spawn path (ipc-handlers -> terminal.js -> daemon PTY) and assessed `codex exec --json --full-auto` swap. Conclusion: non-interactive exec needs a new child_process path (no PTY), JSONL parsing for outputs, and per-pane session id/resume handling; PTY-based piping would be brittle due to shell prompts/quoting.

**Notes:** `codex exec --help` confirms prompt via stdin/arg, `--json` for JSONL events, `--full-auto` and `--dangerously-bypass-approvals-and-sandbox`, plus `--cd` for per-pane cwd. Session logs in `~/.codex/sessions/` include `session_meta` with `payload.id` (UUID), likely emitted in `--json` output for tracking.

**Next:** Architect decide whether to implement exec-mode process path + JSON parsing for Codex panes.

## Fix S - Codex Exec Mode (Jan 27, 2026)

**Owner:** Worker B

**What:** Implemented Codex exec pipeline for Codex panes (non-interactive). New module `ui/modules/codex-exec.js` spawns `codex exec --json --full-auto --dangerously-bypass-approvals-and-sandbox` and streams JSONL to xterm; renderer sends prompts via new `codex-exec` IPC and injects identity prefix on first prompt. PTY remains for Claude/Gemini.

**Files Modified:**
- `ui/terminal-daemon.js`
- `ui/modules/codex-exec.js`
- `ui/modules/terminal.js`
- `ui/modules/ipc-handlers.js`
- `ui/daemon-client.js`
- `ui/preload.js`
- `ui/renderer.js`
- `ui/config.js`

**Notes:** Initial exec uses `--cd <instanceDir>` and stdin prompt; subsequent exec uses `resume <sessionId>` (captured from JSONL `session_meta`). JSONL parsing extracts text when possible, falls back to raw JSON line.
**Update:** Reviewer requested resume flag ordering fix (flags before `resume`); applied in `ui/modules/codex-exec.js`.

**Next:** Reviewer verify Codex panes run via exec, output renders, and resume continuity holds; Investigator to confirm `resume --last` keeps full context.

## Codex Auto-Submit Fix B - Dynamic Codex Panes (Jan 27, 2026)

**Owner:** Worker B

**What:** terminal.js now uses a dynamic CLI identity map (from pane-cli-identity) to detect Codex panes instead of a hardcoded list.

**Files Modified:**
- `ui/modules/terminal.js`

**Next:** Reviewer verify Codex panes auto-submit and non-Codex panes use trusted Enter.


## CLI Identity Badge - IPC Forwarding + Detection DONE (Jan 27, 2026)

**Owner:** Worker B

**What:** main.js now forwards `pane-cli-identity` to renderer and infers CLI identity from pane spawn command on daemon spawn/reconnect.

**Files Modified:**
- `ui/main.js`

**Next:** Reviewer verify badges render for Claude/Codex/Gemini panes.


## Codex Prompt Suppression Hardening - DONE (Jan 27, 2026)

**Owner:** Worker B

**Problem:** Codex CLI still showed approval prompts on some panes even with `--full-auto --ask-for-approval never`.

**Fixes Applied:**
- Codex spawn now appends `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`) for maximum suppression
- Daemon auto-approval fallback: detects approval prompt text and sends `2` ("Yes and don't ask again")

**Files Modified:**
- `ui/modules/ipc-handlers.js`
- `ui/terminal-daemon.js`

**Notes:** Best-effort fallback; Windows Codex prompts may still occur due to upstream behavior.

## ðŸŽ¯ MULTI-MODEL MILESTONE (Jan 26, 2026)

**STATUS:** PROVEN WORKING

Claude (Anthropic) and Codex (OpenAI) successfully collaborated in real-time:
- Codex replaced Claude in Reviewer pane (pane 4)
- Cross-model messaging via trigger files works
- Codex autonomously diagnosed and fixed ESC dispatch bug
- Direct pane routing restored after fix

### Fixes Applied by Codex (Reviewer)

| Fix | File | Lines | Description |
|-----|------|-------|-------------|
| ESC dispatch removal | `ui/modules/terminal.js` | - | Removed ESC being sent after message injection - was interrupting agents |
| Trigger diagnostics | `ui/modules/triggers.js` | - | Added logging for lead.txt debugging (KEEP - useful for multi-model) |

### Learnings for Multi-Model Setup

1. **Any pane can run any AI CLI** - just swap the binary
2. **Trigger file system is model-agnostic** - Claude, Codex, Gemini can all read/write files
3. **Different models bring different perspectives** - Codex found bugs Claude might miss
4. **Broadcast more reliable than direct** - use `all.txt` as fallback if `lead.txt` fails
5. **Restart clears context** - document everything before shutdown

### Upcoming: 6 Panes, 2 New Roles, 3 AI Models

External agent is expanding architecture:
- 6 panes (up from 4)
- 2 new roles (TBD)
- Claude Code + Codex CLI + Gemini CLI

---

## ðŸ’¡ FUTURE IDEAS

| Idea | Doc | Status |
|------|-----|--------|
| Distributed Hivemind (NAS) | `distributed-hivemind-nas-setup.md` | Documented, untested |
| Telegram Bot Messaging | `telegram-agent-messaging.md` | Documented, untested |
| SDKâ†’xterm hybrid mode | - | Concept only |

---

## â³ PENDING SDK TESTS (Switch to SDK mode to verify)

These features are code-complete and Reviewer-approved but untested because app is in PTY mode:

| Feature | Tag | Status | Blocker |
|---------|-----|--------|---------|
| Honeycomb thinking animation | `[SDK]` | âœ… Approved | Needs SDK mode |
| Streaming typewriter effect | `[SDK]` | âœ… Approved | Needs SDK mode |
| SDK session status indicators | `[SDK]` | âœ… Approved | Needs SDK mode |

**To test:** Enable SDK mode in settings, restart app.

---

## ðŸ”§ File Watcher Debounce Fix - âœ… DONE `[BOTH]` (Jan 26, 2026)

**Owner:** Worker B
**Priority:** MEDIUM (from blockers.md)

**Problem:** No debounce on `handleFileChange()` - big git operations (checkout, npm install) could queue up 50+ events within the 1-second polling window.

**Solution:** Added 200ms debounce wrapper with Set-based deduplication.

**Changes to `ui/modules/watcher.js`:**
- Added `DEBOUNCE_DELAY_MS = 200` constant
- Added `pendingFileChanges` Set for deduplication
- Added `handleFileChangeDebounced()` - batches events within 200ms window
- Renamed original logic to `handleFileChangeCore()`
- Updated watcher event handlers to use debounced version
- Export `handleFileChange` points to debounced version for backward compatibility

**How it works:**
1. File change triggers `handleFileChangeDebounced()`
2. File path added to `pendingFileChanges` Set (dedupes same file)
3. Debounce timer reset to 200ms
4. After 200ms of no new changes, all pending files processed together
5. Log shows: `[Watcher] Processing N batched file change(s)`

**Status:** âœ… DONE - Requires app restart to test.

---

## ðŸ Hivemind Honeycomb Animation - âœ… APPROVED `[SDK]` (Jan 26, 2026)

**Goal:** Replace generic braille spinner with branded honeycomb pulse animation.

**User Request:** "Make the thinking animation feel alive, use your imagination"

### Design
- 7 hexagons (1 center + 6 surrounding) in honeycomb pattern
- Wave pulse animation radiating from center
- Color-coded by tool type (thinking=gold, read=teal, write=red, search=blue, bash=purple)
- Respects `prefers-reduced-motion`
- Fade in/out transitions

### Files Modified
- `ui/index.html` - ~140 lines CSS (honeycomb styles, keyframes, tool colors)
- `ui/modules/sdk-renderer.js` - `generateHoneycombHTML()` + updated `streamingIndicator()`

### Status
| Task | Status |
|------|--------|
| Research & design | âœ… DONE |
| CSS implementation | âœ… DONE |
| JS implementation | âœ… DONE |
| Lead's preliminary audit | âœ… PASS |
| Reviewer full audit | âœ… PASS |
| Live testing | â³ PENDING (needs SDK mode) |

**Proposal doc:** `workspace/build/thinking-animation-proposals.md`
**Review doc:** `workspace/build/reviews/honeycomb-animation-audit.md`

---

## ðŸŽ¬ SDK Streaming Animation Sprint - âœ… COMPLETE (Jan 26, 2026)

**Goal:** Make SDK mode feel ALIVE - typewriter effect like real Claude Code CLI.

**Discovery:** SDK supports `include_partial_messages=True` for real character-by-character streaming via `StreamEvent` with `text_delta`.

### Task Status

| ID | Task | Owner | Status |
|----|------|-------|--------|
| STR-1 | Add `include_partial_messages=True` to Python | Worker B | âœ… DONE |
| STR-2 | Handle StreamEvent, emit text_delta to JS | Worker B | âœ… DONE |
| STR-3 | Handle text_delta in sdk-bridge.js | Worker B | âœ… DONE |
| STR-4 | Handle sdk-text-delta IPC in renderer | Worker A | âœ… DONE |
| STR-5 | Typewriter effect in sdk-renderer.js | Worker A | âœ… DONE |
| STR-6 | CSS polish for streaming text | Worker A | âœ… DONE |
| R-1 | Integration review - trace end-to-end | Lead (acting) | âœ… APPROVED |
| R-2 | UX review - does it feel alive? | Lead (acting) | âœ… APPROVED |

### Worker A Completion Notes (STR-4, STR-5, STR-6)

**Files Modified:**
- `ui/renderer.js` - Added `sdk-text-delta` IPC listener, status update to 'responding'
- `ui/modules/sdk-renderer.js` - Added typewriter streaming functions:
  - `appendTextDelta(paneId, text)` - Appends text with blinking cursor
  - `finalizeStreamingMessage(paneId)` - Removes cursor when streaming stops
  - `clearStreamingState(paneId)` - Clears state on new turn
- `ui/index.html` - Added CSS for `.sdk-streaming-text`, `.sdk-cursor`, `.sdk-typewriter`

**How It Works:**
1. Worker B sends `sdk-text-delta` IPC event with `{ paneId, text }`
2. `appendTextDelta()` creates or updates a streaming message element
3. New text is inserted before a blinking cursor (â–Œ)
4. When streaming stops (`sdk-streaming` with active=false), cursor is removed

**Handoff to Worker B:** STR-1,2,3 - Python backend needs to:
1. Set `include_partial_messages=True` in ClaudeAgentOptions
2. Handle `StreamEvent` messages and extract `text_delta`
3. Emit to JS via IPC: `{"type": "text_delta", "pane_id": "1", "text": "partial..."}`
4. sdk-bridge.js routes this as `sdk-text-delta` to renderer

**Status:** âœ… UI layer complete, waiting for Worker B's backend work.

### Worker B Completion Notes (STR-1, STR-2, STR-3)

**Files Modified:**
- `hivemind-sdk-v2.py` - Added streaming support:
  - Imported `StreamEvent` from claude_agent_sdk
  - Added `include_partial_messages=True` to ClaudeAgentOptions (line ~170)
  - Added `StreamEvent` handler in `_parse_message()` (lines ~360-395)
  - Extracts `text_delta` from `content_block_delta` events
  - Also handles `thinking_delta` for extended thinking streaming
- `ui/modules/sdk-bridge.js` - Added routing:
  - Added `text_delta` case in `routeMessage()` (lines ~533-540)
  - Forwards to renderer via `sdk-text-delta` IPC event
  - Also added `thinking_delta` handler for future use

**How It Works (Full Pipeline):**
1. `include_partial_messages=True` enables `StreamEvent` messages from SDK
2. SDK emits `StreamEvent` with raw Anthropic API events during response
3. Python `_parse_message()` detects `content_block_delta` with `text_delta` type
4. Emits `{"type": "text_delta", "pane_id": "1", "text": "partial..."}`
5. sdk-bridge.js routes as `sdk-text-delta` to renderer
6. Worker A's `appendTextDelta()` displays with blinking cursor

**Message Format:**
```json
{"type": "text_delta", "pane_id": "1", "text": "Hello", "session_id": "..."}
```

**Status:** âœ… Backend complete! Ready for Reviewer integration test (R-1).

### Lead Review Notes (R-1, R-2) - âœ… APPROVED

Lead performed integration review while user was AFK.

**Review Document:** `workspace/build/reviews/streaming-animation-review.md`

**Commits:**
- `66ff886` - feat: Add real-time text streaming with typewriter effect (SDK mode)
- `4e52899` - fix: Improve UTF-8 encoding for Python-JS communication

**Integration Trace:** Full data flow verified from Python StreamEvent â†’ sdk-bridge â†’ renderer â†’ typewriter display.

**Status:** âœ… APPROVED FOR TESTING - User can restart app to test streaming animation.

---

## UI Fix: Agent Message Styling - âœ… DONE (Jan 26, 2026)

**Owner:** Worker A
**Problem:** All trigger messages showed as "You:" with person icon - confusing UX.

**Fix Applied:**
- Detect `(ROLE):` prefix pattern in messages (LEAD, WORKER-A, WORKER-B, REVIEWER)
- Parse out the prefix and show appropriate agent styling
- "You:" label ONLY appears for actual user keyboard input (no prefix)

**Distinct Agent Styling:**
| Role | Icon | Color | CSS Class |
|------|------|-------|-----------|
| Lead | ðŸ‘‘ | Gold (#ffd700) | .sdk-agent-lead |
| Worker A | ðŸ”§ | Teal (#4ecca3) | .sdk-agent-worker-a |
| Worker B | âš™ï¸ | Purple (#9b59b6) | .sdk-agent-worker-b |
| Reviewer | ðŸ” | Orange (#ff9800) | .sdk-agent-reviewer |

**Files Modified:**
- `ui/modules/sdk-renderer.js` - Updated formatMessage() to detect and parse agent prefixes
- `ui/index.html` - Added CSS for .sdk-agent-msg and role-specific styles

**Status:** âœ… DONE - Requires app restart to test.

---

## Quality Gates - IN PROGRESS (Jan 26, 2026)

**Goal:** Stop shipping dumb bugs with automated checks.

| Gate | Status | Owner |
|------|--------|-------|
| Gate 1: mypy (Python) | âœ… DONE | Worker B |
| Gate 2: ESLint (JS) | âœ… DONE | Worker A |
| Gate 3: IPC Protocol Tests | â³ Pending | Lead |
| Gate 4: Serialization Tests | âœ… DONE | Worker B |
| Gate 5: Pre-commit Hook | âœ… DONE | Worker B |

**Gate 1 Results (Worker B):**
- Fixed 9 type errors in `hivemind-sdk-v2.py`
- Fixed 8 type errors in `hivemind-sdk.py`
- Both files pass: `python -m mypy <file> --ignore-missing-imports`
- Type fixes: Literal types, Optional params, collection annotations

**Gate 2 Results (Worker A):**
- Installed: ESLint 9.39.2, globals package
- Config: `ui/eslint.config.js` (flat config format)
- Scripts: `npm run lint`, `npm run lint:fix`
- Results: **0 errors**, 44 warnings (unused vars only)

**Gate 4 Results (Worker B):**
- Created `tests/test-serialization.py` (~300 lines)
- Tests: basic types, nested structures, default=str fallback, SDK message shapes, edge cases
- All 30+ test cases pass
- Added Windows encoding fix for emoji output

**Gate 5 Results (Worker B):**
- Created `.git/hooks/pre-commit`
- Runs: mypy (Python), ESLint (JS), syntax check, serialization tests
- Tested: All 4 gates pass
- Blocks commit on failure (bypass: `git commit --no-verify`)

**Commands:**
```bash
# Python type check
python -m mypy hivemind-sdk-v2.py --ignore-missing-imports

# JavaScript lint
cd ui && npm run lint

# Test pre-commit hook
sh .git/hooks/pre-commit
```

---

## SDK V2 Code Quality Fixes - âœ… APPLIED (Jan 26, 2026)

**Owner:** Reviewer (deep trace review)

**Issues found during full message flow trace:**

| Issue | File | Fix |
|-------|------|-----|
| Duplicate code | sdk-bridge.js:257-259 | Removed duplicate `this.ready = false`, fixed indentation |
| Unhandled event | sdk-bridge.js | Added handler for `message_received` (was showing raw JSON) |
| Unhandled event | sdk-bridge.js | Added handler for `all_stopped` (was showing raw JSON) |
| Magic number | sdk-bridge.js:709 | Removed arbitrary setTimeout(500), sendMessage queues properly |

**Review:** `workspace/build/reviews/sdk-v2-deep-trace-findings.md`

---

## SDK Message Type Handlers - âœ… APPLIED (Jan 26, 2026)

**Owner:** Reviewer (proactive audit)

**Audit:** Cross-referenced all `_emit()` in Python against `formatMessage()` in sdk-renderer.js.

**5 unhandled types found and fixed:**

| Type | File | Handler |
|------|------|---------|
| `warning` | sdk-renderer.js:287 | Yellow warning icon |
| `interrupted` | sdk-renderer.js:291 | Stop icon + role name |
| `agent_started` | sdk-renderer.js:295 | Rocket icon + role name |
| `ready` | sdk-bridge.js:576 | Log + emit 'python-ready' |
| `sessions` | sdk-bridge.js:582 | Log + emit 'sessions-list' |

**Review:** `workspace/build/reviews/sdk-renderer-audit.md`

---

## SDK V2 Critical Runtime Fixes - âœ… APPROVED (Jan 26, 2026)

**Status:** Reviewer approved + code quality fixes applied. Ready for user test.

**Problem:** SDK mode sort of worked but had multiple issues during user testing.

**Issues Found & Fixed:**

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| Content mismatch | "Unknown [Object]" in panes | Python sends content as ARRAY, JS expected STRING | `sdk-renderer.js` - handle array format |
| Missing user type | User messages not rendering | No handler for 'user' message type | `sdk-renderer.js` - added user handler |
| No immediate feedback | User types but nothing shows | Waited for Python to echo back | `daemon-handlers.js` - display immediately |
| Broadcast-only | Can't message specific pane | No pane targeting in SDK mode | `renderer.js` - added /1, /lead prefix syntax |
| No role identity | Agents don't know their role | All used same workspace directory | `hivemind-sdk-v2.py` - role-specific cwd |
| Fatal error crashes | "Fatal error in message reader" | Stale session IDs cause --resume to fail | `hivemind-sdk-v2.py` - disabled resume |
| Permission prompts | Agents stuck at permission prompt | `acceptEdits` doesn't accept reads | `hivemind-sdk-v2.py` - use bypassPermissions |
| No role identity | All agents respond as generic Claude | `setting_sources` was removed | `hivemind-sdk-v2.py` - re-enabled setting_sources=["project"] |
| JSON serialization | "ToolResultBlock not JSON serializable" | SDK objects passed to json.dumps | `hivemind-sdk-v2.py` - added default=str to all json.dumps |
| Broadcast to all | Single input went to all 4 agents | Default was sdk-broadcast | `renderer.js` - default now sends to Lead only, /all for broadcast |

**Critical Discovery - Stale Sessions:**
Session IDs in `session-state.json` were being passed to `--resume` flag, but those sessions no longer existed. SDK crashed with "Command failed with exit code 1". Fixed by disabling session resume and clearing session-state.json.

**Files Modified:**
- `ui/modules/sdk-renderer.js` - Content array handling, user message type
- `ui/modules/daemon-handlers.js` - Immediate message display
- `ui/renderer.js` - Pane targeting syntax
- `hivemind-sdk-v2.py` - Role cwd, disabled resume, bypassPermissions
- `session-state.json` - Cleared stale data

**Status:** All fixes applied. Requires app restart to test.

---

## SDK V2 PTY Bypass Fix (Round 2) - âœ… APPROVED (Jan 26, 2026)

**Problem:** User still saw "Claude running" badges and raw JSON in SDK mode after first fix.

**Root Cause:** Multiple code paths bypassed SDK mode check:
1. `checkAutoSpawn()` spawned Claude CLI regardless of SDK mode
2. `spawnClaude()` had no SDK mode guard
3. `freshStartAll()` could create PTY terminals in SDK mode
4. "Spawn All" button was visible in SDK mode
5. `terminal.setSDKMode()` not called from renderer

**ROUND 2 FIXES Applied (Lead - Jan 26):**

| File | Line | Change |
|------|------|--------|
| `ui/modules/settings.js` | ~147-151 | Added SDK mode check to `checkAutoSpawn()` |
| `ui/modules/settings.js` | ~76-80 | Hide "Spawn All" button when SDK mode enabled |
| `ui/modules/terminal.js` | ~24 | Added `sdkModeActive` module flag |
| `ui/modules/terminal.js` | ~553-557 | Added `setSDKMode(enabled)` function |
| `ui/modules/terminal.js` | ~560-564 | Added SDK guard to `spawnClaude()` |
| `ui/modules/terminal.js` | ~143-147 | Added SDK guard to `initTerminals()` |
| `ui/modules/terminal.js` | ~718-724 | Added SDK guard to `freshStartAll()` |
| `ui/renderer.js` | ~44 | Call `terminal.setSDKMode(true)` on settings load |

**Defense in Depth:** Multiple layers of SDK mode blocking:
- Layer 1: daemon-handlers skips PTY on daemon-connected (from Round 1)
- Layer 2: settings.js skips auto-spawn
- Layer 3: terminal.js blocks spawnClaude/initTerminals/freshStartAll
- Layer 4: UI hides spawn button
- Layer 5: terminal.js early terminal existence check (Worker A - Jan 26)
- Layer 6: ipc-handlers.js SDK guard on spawn-claude (Worker A - Jan 26)

**Additional Defense-in-Depth (Worker A - Jan 26):**
| File | Change |
|------|--------|
| `ui/modules/terminal.js:566-570` | Early check `!terminals.has(paneId)` before SDK guard |
| `ui/modules/ipc-handlers.js:109-113` | SDK mode guard in `spawn-claude` IPC handler |

**Status:** âœ… APPROVED FOR TESTING (see reviews/pty-bypass-fix-review.md) + defense-in-depth applied.

---

## SDK V2 Init Bug Fix (Round 1) - âœ… APPLIED (Jan 26, 2026)

**Problem:** Raw JSON appearing in xterm panes - PTY created before SDK mode detected.

**Root Cause:** Race condition - `daemon-connected` fired before settings loaded.

**Fixes Applied:**
- main.js: Added `sdkMode` flag to daemon-connected event
- daemon-handlers.js: Check data.sdkMode, skip PTY if true
- renderer.js: Set SDK mode flags on settings load, auto-init SDK panes

**Status:** Applied but insufficient - Round 2 fixes additional bypass paths.

---

## SDK V2 Migration - âœ… READY FOR TESTING

**Goal:** Replace PTY/keyboard hacks with 4 independent ClaudeSDKClient instances.

**Architecture:** 4 full Claude sessions (NOT subagents), each with own context window.

**Design Doc:** `workspace/build/sdk-architecture-v2.md`

### Final Verification Complete (Jan 25, 2026)

**Reviewer's Final Report:**
- Files verified: `hivemind-sdk-v2.py` (575 lines), `sdk-bridge.js` (636 lines)
- IPC Protocol: ALL 6 ASPECTS ALIGNED (command, pane_id, message, session_id, role, session format)
- Issues found: NONE
- Confidence: âœ… READY FOR TESTING

**Review Files:**
- `workspace/build/reviews/sdk-v2-audit-verification.md` - Audit fixes verified
- `workspace/build/reviews/sdk-v2-final-verification.md` - Protocol alignment verified

### Post-Audit Critical Fixes (Jan 25, 2026)

**User requested full audit before testing. Audit revealed critical bugs:**

| Issue | Status | Description |
|-------|--------|-------------|
| snake_case/camelCase mismatch | âœ… FIXED | Python sends `pane_id`, JS expected `paneId` - all routing broken |
| Missing `sdk-status-changed` | âœ… FIXED | UI status indicators never updated |
| Missing `sdk-message-delivered` | âœ… FIXED | No delivery confirmation in UI |
| `interrupt` command missing | âœ… FIXED | Added to Python IPC handler |
| Session file format mismatch | âœ… FIXED | Aligned JS to Python's nested format |
| Race condition on startup | âš ï¸ OPEN | Messages may queue before Python ready |

**Fixes Applied by Lead:**
1. `sdk-bridge.js`: Check both `msg.pane_id` AND `msg.paneId`, same for `session_id`/`sessionId`, `role`/`agent`
2. `sdk-bridge.js`: Added `sdk-status-changed` emissions in 5 locations
3. `sdk-bridge.js`: Added `sdk-message-delivered` emission in sendMessage()
4. `sdk-bridge.js`: Session state now uses nested `{ sdk_sessions: {...} }` format
5. `hivemind-sdk-v2.py`: Added `interrupt` command handler + `interrupt_agent()` method

**Process Failure Noted:** Reviewer approved without integration review. Updated CLAUDE.md with mandatory integration review requirements.

### Phase 1 Tasks

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Create hivemind-sdk-v2.py | Lead | âœ… COMPLETE |
| 2 | Update sdk-bridge.js for multi-session | Worker B | âœ… COMPLETE |
| 3 | Add session status indicators to UI | Worker A | âœ… COMPLETE |
| 4 | Review SDK V2 architecture | Reviewer | âœ… COMPLETE |

### Review Summary (Task #4)

**File:** `workspace/build/reviews/sdk-v2-architecture-review.md`
**Verdict:** âœ… APPROVED with recommendations

**Reviewer Recommendations:**
1. Verify ClaudeSDKClient API with minimal test before full integration
2. Confirm `setting_sources=["project"]` loads CLAUDE.md
3. Implement `can_use_tool` path restrictions for security

---

## SDK V2 Migration - Phase 2 Tasks âœ… COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| 5 | Replace PTY input with SDK calls | Lead | âœ… COMPLETE |
| 6 | Trigger integration (file â†’ SDK) | Worker B | âœ… COMPLETE |
| 7 | Session persistence + resume | Lead | âœ… COMPLETE |
| 8 | Full verification | Reviewer | âœ… APPROVED |
| 9 | Protocol alignment fixes | Lead | âœ… COMPLETE |

### Final Review (Task #8)

**File:** `workspace/build/reviews/sdk-v2-final-verification.md`
**Verdict:** âœ… APPROVED FOR TESTING

**Reviewer Notes:**
- All protocol fixes verified
- Minor: `interrupt` command not yet handled in Python (non-critical)
- Ready for end-to-end testing once `claude-agent-sdk` is installed

### Completed: Task #9 - Protocol Alignment Fixes (Lead)

**Issue:** Reviewer identified protocol mismatches between JavaScript and Python.

**Fixes Applied:**

| Issue | Before | After | File |
|-------|--------|-------|------|
| Command key | `action: 'send'` | `command: 'send'` | sdk-bridge.js |
| Pane ID key | `paneId` | `pane_id` | sdk-bridge.js |
| Session ID key | `sessionId` | `session_id` | sdk-bridge.js |
| Stop command | `action: 'stop-sessions'` | `command: 'stop'` | sdk-bridge.js |
| Interrupt key | `action: 'interrupt'` | `command: 'interrupt'` | sdk-bridge.js |
| IPC flag | Missing | `--ipc` added | sdk-bridge.js |
| Session file path | `/ui/session-state.json` | `/session-state.json` | hivemind-sdk-v2.py |

**Details:**
- `sendMessage()` - Uses Python's expected keys (`command`, `pane_id`, `session_id`)
- `stopSessions()` - Uses `command: 'stop'`
- `interrupt()` - Uses `command: 'interrupt'`, `pane_id`
- `startProcess()` - Spawns with `--ipc` flag for JSON protocol
- Python session file - Aligned to project root (same as JS)

**Status:** âœ… All protocol mismatches fixed. Ready for final testing.

---

### Completed: Task #5 - PTY to SDK Routing (Lead)

**Changes Made:**
1. `ui/modules/ipc-handlers.js` - Updated `sdk-broadcast` to use V2 `broadcast()` method
2. `ui/modules/triggers.js` - Updated `sendStaggered()` to route via SDK when enabled
3. `ui/main.js` - Connected SDK bridge to triggers, added SDK mode toggle on settings change

**Flow:**
- When `sdkMode` setting is true: Messages route through `sdkBridge.sendMessage(paneId, message)`
- When `sdkMode` is false: Legacy PTY/keyboard injection via `inject-message` IPC

**Key Integration Points:**
- `triggers.setSDKBridge(sdkBridge)` - Called on app start
- `triggers.setSDKMode(enabled)` - Called when settings change
- `sendStaggered()` - Central routing function, checks SDK mode first

### Completed: Task #1 - hivemind-sdk-v2.py (Lead)

**File:** `hivemind-sdk-v2.py`

**Features:**
- `HivemindAgent` class - single persistent ClaudeSDKClient per agent
- `HivemindManager` class - manages all 4 agents
- Session persistence via `session-state.json`
- IPC protocol (JSON over stdin/stdout) for Electron
- `setting_sources=["project"]` for CLAUDE.md loading
- CLI mode for testing, IPC mode for Electron integration

**API:**
```python
# Each agent is a full Claude instance
agents = {
    '1': HivemindAgent(AgentConfig.lead(), workspace),
    '2': HivemindAgent(AgentConfig.worker_a(), workspace),
    '3': HivemindAgent(AgentConfig.worker_b(), workspace),
    '4': HivemindAgent(AgentConfig.reviewer(), workspace),
}
```

**Why NOT subagents:**
- Subagents share/inherit context = less total context
- Full instances compact independently = more context capacity
- Each agent "sees everything in their domain" vs "hyperfocused summaries"

### Completed: Task #2 - sdk-bridge.js multi-session (Worker B)

**Files Modified:**
- `ui/modules/sdk-bridge.js` - Complete V2 rewrite for 4 independent sessions
- `ui/modules/ipc-handlers.js` - Added 8 new V2 IPC handlers

**New IPC Handlers:**
- `sdk-send-message(paneId, message)` - Send to specific agent
- `sdk-subscribe/unsubscribe(paneId)` - Control streaming subscription
- `sdk-get-session-ids` - Get all session IDs for persistence
- `sdk-start-sessions(options)` - Initialize all 4 agents
- `sdk-stop-sessions` - Graceful shutdown with session ID capture
- `sdk-pane-status(paneId)` - Get agent status
- `sdk-interrupt(paneId)` - Interrupt specific agent

**Session Persistence:** `session-state.json` loaded on startup, saved on stop.

**JSON Protocol:** Commands sent to Python via stdin, responses via stdout.

### Completed: Task #3 - SDK Session Status Indicators (Worker A)

**Files Modified:**
- `ui/index.html` - CSS for SDK status states + HTML elements in pane headers
- `ui/renderer.js` - Status update functions + IPC listeners

**Features:**
1. Status states: disconnected, connected, idle, thinking, responding, error
2. Visual indicator: Animated dot badge in each pane header
3. Message delivered: Flash animation confirms SDK receipt
4. Session ID: Hidden by default, visible in debug mode

**IPC Listeners Added:**
- `sdk-status-changed` - Updates pane status indicator
- `sdk-message-delivered` - Triggers delivery confirmation flash

**Status:** âœ… COMPLETE - Blocked until sdk-bridge.js (Task #2) is ready.

---

## UI Layout Redesign - âœ… COMPLETE (Lead)

**Goal:** Lead-focused layout - user only interacts with Lead, workers are monitoring-only.

### Changes Made
1. **Layout**: Lead takes full left side (65%), workers stacked on right (35%)
2. **Input**: Changed from "broadcast to all" to "message to Lead only"
3. **Expand buttons**: Worker panes have expand/collapse toggle
4. **Removed keyboard shortcuts from worker headers** (Ctrl+1-4 still works)

### Files Modified
- `ui/index.html` - New grid CSS, restructured pane HTML, expand buttons
- `ui/renderer.js` - Added toggleExpandPane(), expand button handlers
- `ui/modules/terminal.js` - broadcast() now sends only to Lead (pane 1)

### New Layout
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   â”‚  Worker A [â¤¢] â”‚
â”‚                   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚      Lead         â”‚  Worker B [â¤¢] â”‚
â”‚    (Main Pane)    â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                   â”‚  Reviewer [â¤¢] â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     [Message to Lead input]
```

**Status:** Requires app restart to test.

---

## SDK Migration Sprint - â¸ï¸ PAUSED (Lead)

**Goal:** Integrate SDK mode into Electron app as user-selectable option.

### Task #1: SDK Bridge Startup Integration - âœ… COMPLETE (Lead)
- Added `sdkMode` to DEFAULT_SETTINGS in main.js
- SDK bridge already initialized via ipc-handlers.js
- Broadcast routing now checks sdkMode and routes through SDK or PTY

### Task #2: SDK Mode Toggle UI - âœ… COMPLETE (Lead)
- Added toggle switch in Settings panel (index.html)
- Added sdkModeNotice indicator
- Updated settings.js to show/hide SDK mode notice

### Task #3: Test SDK Broadcast - â³ PENDING
Requires manual testing with SDK mode enabled.

### Task #4: Test SDK Subagent Delegation - â³ PENDING
Blocked by Task #3.

**Files Modified:**
- `ui/main.js` - Added sdkMode to DEFAULT_SETTINGS
- `ui/index.html` - Added SDK mode toggle and notice
- `ui/modules/settings.js` - Added sdkModeNotice visibility handling
- `ui/renderer.js` - Added sendBroadcast() helper with SDK/PTY routing

---

## SDK Prototype Sprint - âœ… COMPLETE (Acceptance Test Passed)

### Task #1: SDK Backend Integration - âœ… COMPLETE (Worker B)
- `hivemind-sdk.py` - SDK orchestrator with subagent definitions
- Installed claude-agent-sdk
- Verified query() API works

### Task #3: Multi-Agent Coordination - âœ… COMPLETE (Lead)
- `ui/modules/sdk-bridge.js` - Electron â†” SDK bridge
- IPC handlers: sdk-start, sdk-stop, sdk-write, sdk-status, sdk-broadcast
- Spawn/manage Python SDK process from Electron

### Task #4: Validation - âœ… COMPLETE (Reviewer)
Conditional pass - SDK prototype works, Windows encoding fixed.

---

### Task #2: SDK Message UI Renderer - âœ… COMPLETE (Worker A)

**Goal:** Replace xterm.js terminals with SDK message display for Agent SDK integration.

**Files Created/Modified:**
- `ui/modules/sdk-renderer.js` - NEW (~260 lines)
  - initSDKPane(), initAllSDKPanes() - pane initialization
  - appendMessage(), formatMessage() - message display with type-specific styling
  - streamingIndicator() - thinking animation
  - clearPane(), scrollToBottom() - pane control
  - getSessionId() - session management for resume

- `ui/index.html` - Added SDK CSS (~130 lines)
  - .sdk-assistant, .sdk-tool-use, .sdk-tool-result, .sdk-system, .sdk-error
  - Collapsible tool results, streaming animation

- `ui/renderer.js` - Added SDK integration
  - Import sdk-renderer module
  - window.hivemind.sdk API (start, stop, enableMode, disableMode)
  - IPC handlers: sdk-message, sdk-streaming, sdk-session-start, sdk-session-end, sdk-error

**Status:** âœ… COMPLETE - Ready for integration test with Lead's coordinator.

---

## ID-1: Session Identity Injection - âœ… FIXED (Worker B)

**Problem:** When using `/resume` in Claude Code, sessions are hard to identify. All 4 agent sessions look the same - no way to tell Lead from Worker B.

**Original Bug:** Identity message was written directly to PTY via daemon, but V16 proved PTY writes don't properly submit to Claude. Message appeared but wasn't processed.

**Solution (v2):** Moved identity injection from daemon to renderer, using `sendToPane()` which properly dispatches keyboard events.

1. **Shell Banner (on spawn):** Still works - daemon echoes role banner to terminal
2. **Claude Identity (4s after `spawn-claude`):** Now uses `sendToPane()` in renderer:
   ```
   [HIVEMIND SESSION: Worker B] Started 2026-01-25
   ```
   This shows up in `/resume` session list AND is submitted to Claude.

**Files Changed (v2 fix):**
- `ui/modules/ipc-handlers.js`:
  - REMOVED daemon identity injection (was line 129-137)
  - Added comment noting fix moved to renderer
- `ui/modules/terminal.js`:
  - Added `PANE_ROLES` constant
  - Added identity injection in `spawnClaude()` using `sendToPane()`

**Why This Works:** `sendToPane()` uses keyboard events with `_hivemindBypass` marker, same as working trigger system.

**Status:** âœ… FIXED - Requires app restart to test.

---

## V18.2: Auto-Nudge False Positive Fix - âœ… FIXED (Worker B)

**Problem:** Auto-nudge was detecting stuck agents and sending `(AGGRESSIVE_NUDGE)`, but then immediately marking them as "responded" because the nudge itself updated `lastInputTime`.

**Root Cause:** `hasAgentResponded()` checked if `lastInputTime > lastNudgeTime`, but the nudge process (ESC + 150ms delay + Enter) itself writes to PTY, updating `lastInputTime`. The daemon thought the agent responded when it was actually just seeing its own nudge.

**Fix:** Added 500ms grace period. Agent only counts as "responded" if input came AFTER `lastNudgeTime + 500ms`:
```javascript
const NUDGE_GRACE_PERIOD_MS = 500;
const nudgeCompleteTime = state.lastNudgeTime + NUDGE_GRACE_PERIOD_MS;
return lastInput > nudgeCompleteTime;
```

**File Changed:** `ui/terminal-daemon.js` - `hasAgentResponded()` function

**Status:** âœ… FIXED - Requires app restart to test.

---

## FX4-v7: Ghost Text Bug Fix - âœ… FIXED (Worker A)

**Problem:** Ghost text appearing in terminals after broadcasts. Phantom interrupts happening without user action.

**Root Cause:** 50ms delay in `doSendToPane()` between PTY write and Enter dispatch allows Claude Code to show autocomplete/ghost text suggestions. Our Enter event then submits BOTH the intended text AND the ghost text.

**Fix (v7):** Dispatch ESC, wait 20ms for state to settle, re-focus, then Enter:
```javascript
// FX4-v7: ESC to dismiss ghost text, delay, then Enter
textarea.dispatchEvent(escEvent);
setTimeout(() => {
  textarea.focus();  // Re-focus after ESC
  textarea.dispatchEvent(enterEvent);
}, 20);
```

**File Changed:** `ui/modules/terminal.js`

**Versions:**
- v6: ESC before Enter (broke message delivery - no delay)
- v7: ESC â†’ 20ms delay â†’ re-focus â†’ Enter (CURRENT)

**Status:** âœ… FIXED - Requires app restart to test.

---

## D2: Dry-Run Mode Bug Fix - âœ… FIXED (Worker A)

**Problem:** Dry-run mode was "100% non-functional" per Reviewer report. Toggling dryRun in settings had no effect.

**Root Cause:** `main.js:169` - `saveSettings()` was reassigning `currentSettings` to a new object:
```javascript
currentSettings = { ...currentSettings, ...settings };
```
This broke the reference held by `ipc-handlers.js`. The old reference still saw `dryRun: false` even after user toggled it on.

**Fix:** Changed to `Object.assign()` to mutate the existing object (preserves reference):
```javascript
Object.assign(currentSettings, settings);
```

**File Changed:** `ui/main.js` line 169

**Status:** âœ… FIXED - Requires app restart to test. Ready for Reviewer verification.

---

## V18: Auto-Aggressive-Nudge - âœ… SHIPPED

**Owner:** Worker B
**File:** `ui/terminal-daemon.js`

**Problem:** When agents get stuck, manual intervention was needed. FIX3 added aggressive nudge capability, but it required Lead or user to trigger it manually.

**Solution:** Daemon auto-detects stuck agents and sends `(AGGRESSIVE_NUDGE)` automatically.

**Escalation Flow:**
1. Heartbeat tick detects agent stuck (>60s idle)
2. Auto-send `(AGGRESSIVE_NUDGE)` to agent's trigger file
3. Wait 30 seconds
4. If still stuck, nudge again
5. After 2 failed nudges, alert user via UI + trigger

**New Functions:**
- `sendAggressiveNudge(paneId)` - sends nudge to specific agent
- `checkAndNudgeStuckAgents()` - runs on every heartbeat tick
- `hasAgentResponded(paneId)` - checks if agent recovered
- `alertUserAboutAgent(paneId)` - final escalation

**New Protocol Actions:**
- `nudge-agent` - manually nudge specific agent
- `nudge-status` - get current nudge state for all agents
- `nudge-reset` - reset nudge tracking

**Status:** âœ… SHIPPED - Reviewer verified (see `workspace/build/reviews/v18-auto-nudge-verification.md`)

**V18.1 BUG FIX (Jan 25):** Stuck detection not triggering because `lastActivity` was updated by PTY output (including thinking animation). Fixed by adding `lastInputTime` to track user INPUT instead of agent output. Requires restart to test.

---

## Stuck Issue Fixes (External Claude Recommendations) - âœ… VERIFIED

**Issue:** Claude Code instances getting stuck - known bug (GitHub #13224, #13188)

**Stress Test Round 2 Results (Jan 25, 2026):**
- 3 agents (Worker A, Worker B, Reviewer) got stuck mid-test
- Lead recovered ALL 3 using aggressive nudge (FIX3)
- No bunching, correct message ordering, no focus stealing
- Full report: `workspace/build/reviews/stress-test-round2-verification.md`

**Fixes Applied:**

| Fix | Status | Description |
|-----|--------|-------------|
| FIX1 | âœ… APPLIED | AUTOCOMPACT_PCT_OVERRIDE=70 in settings.json |
| FIX2 | âœ… VERIFIED | Stagger agent activity in triggers.js (avoid thundering herd) |
| FIX3 | âœ… VERIFIED | Aggressive nudge (ESC + Enter) - recovered 3 stuck agents in test |
| FIX4 | â¸ï¸ DEFERRED | Circuit breaker pattern (bigger code change) |
| FIX5 | âœ… VERIFIED | Focus steal prevention - save/restore user focus during message injection |

### FIX3 Details (Aggressive Nudge)

**Files Changed:**
- `ui/modules/terminal.js` - Added `aggressiveNudge()` and `aggressiveNudgeAll()` functions
- `ui/renderer.js` - Updated Nudge All button + watchdog-alert auto-nudge
- `ui/modules/daemon-handlers.js` - Added `(AGGRESSIVE_NUDGE)` command support

**Behavior:**
- Nudge All button now sends ESC + Enter (more forceful)
- Watchdog alert auto-triggers aggressive nudge on all panes
- New `(AGGRESSIVE_NUDGE)` trigger command available

### FIX5 Details (Focus Steal Prevention)

**Problem:** When messages were injected into terminals via `doSendToPane()`, focus was stolen from the broadcast input, making it hard for users to type while agents were active.

**Solution:** Save user's focus before terminal injection, restore after completion.

**File Changed:** `ui/modules/terminal.js`
- Save `document.activeElement` before focusing terminal textarea
- Detect if user was in UI input (not xterm textarea)
- Restore focus after message injection completes (all 3 code paths)

**Requires restart to test.**

---

## V17: Adaptive Heartbeat - âœ… SHIPPED

**Proposal:** #11 from improvements.md
**Owner:** Worker B
**Co-author:** Worker A
**Votes:** 4/4 UNANIMOUS (Lead's earlier YES finally delivered)
**Reviewer:** FORMAL APPROVAL - All checks passed
**Stress Test:** PASS - Verified in round 2 stress test (Jan 25, 2026)

### Task Breakdown

| Task | Status | Description |
|------|--------|-------------|
| HB-A1 | âœ… DONE | Add `getHeartbeatInterval()` to terminal-daemon.js |
| HB-A2 | âœ… DONE | Check status.md mtime for staleness detection |
| HB-A3 | âœ… DONE | Check shared_context.md for pending tasks |
| HB-A4 | âœ… DONE | Add "recovering" state (45sec grace period) |
| HB-A5 | â¸ï¸ DEFERRED | Make intervals configurable in settings (can add later) |
| HB-A6 | âœ… DONE | Fallback if status.md missing (default to "active") |
| HB-A7 | âœ… DONE | Event forwarding: daemon â†’ client â†’ main â†’ renderer |
| HB-UI | âœ… DONE | Heartbeat mode indicator in status bar (Worker A) |
| R1 | âœ… PASSED | Worker A sanity check |
| R2 | âœ… APPROVED | Reviewer formal verification |

### Files Changed

| File | Changes |
|------|---------|
| `ui/terminal-daemon.js` | Added adaptive heartbeat logic, state detection, dynamic timer |
| `ui/daemon-client.js` | Added event handlers for heartbeat-state-changed |
| `ui/main.js` | Added forwarding to renderer via IPC |

### Intervals (Agreed)

| State | Interval | Trigger |
|-------|----------|---------|
| Idle | 10 min | No pending tasks |
| Active | 2 min | Tasks in progress |
| Overdue | 1 min | Task stale (>5 min since status.md update) |
| Recovering | 45 sec | After stuck detection, before escalation |

### IPC Events (New)

- `heartbeat-state-changed` â†’ { state, interval } for UI indicator

---

## V16.11: Trigger System Fix - âœ… SHIPPED

**Problem:** Agents getting stuck and interrupted during trigger-based communication.

**Root Causes Found & Fixed:**
1. ESC spam in trigger injection (V16)
2. Hidden ESC in auto-unstick timer (V16.3)
3. xterm.paste() buffering issues (V16.1-V16.9)
4. Missing auto-refocus after message injection (V16.11)

**Final Solution:** Keyboard events + bypass marker + auto-refocus

**Versions Tested:**
| Version | Approach | Result |
|---------|----------|--------|
| V16 | Remove ESC spam | Fixed interrupts |
| V16.1 | xterm.paste instead of pty.write | Partial |
| V16.2 | Idle detection (2000ms) | Partial |
| V16.3 | Remove hidden ESC in auto-unstick | Improved |
| V16.4-V16.9 | Various timing/buffering attempts | Partial |
| V16.10 | Keyboard events + bypass marker | Almost |
| V16.11 | Auto-refocus after injection | âœ… SUCCESS |

**User Verified:** NO manual unsticking needed! All 4 agents processing automatically.

**Key Lessons Learned:**
1. PTY ESC â‰  Keyboard ESC (kills vs dismisses)
2. xterm.paste() buffers differently than keystrokes
3. Timing delays alone don't fix buffering
4. Auto-refocus ensures Claude sees the input

---

## V16.3: Auto-Unstick ESC Bug Fix - âœ… MERGED INTO V16.11

---

## V13: Autonomous Operation - âœ… SHIPPED

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| HB1 | Worker B | âœ… DONE | Heartbeat timer (5 min interval) |
| HB2 | Worker B | âœ… DONE | Lead response tracking (15s timeout) |
| HB3 | Worker B | âœ… DONE | Worker fallback (after 2 failed nudges) |
| HB4 | Worker A+B | âœ… DONE | User alert notification |
| HB5 | Lead | âœ… DONE | Heartbeat response logic |
| R1 | Reviewer | âœ… DONE | Verification - PARTIAL PASS |
| BUG1 | Worker B | âœ… FIXED | Heartbeat timer not firing |
| BUG2 | Lead | âœ… FIXED | False positive response detection |

### R1 Verification Summary

**Result:** PARTIAL PASS - Core flow works, fallbacks untested

- Heartbeat fires every 5 minutes âœ…
- Lead responds within timeout âœ…
- Fallback to workers: NOT TRIGGERED (Lead responsive)
- User alert: NOT TRIGGERED (no escalation needed)

**Full report:** `workspace/build/reviews/v13-verification.md`

---

## V12: Stability & Robustness - âœ… SHIPPED

| Task | Owner | Status | Commit | Description |
|------|-------|--------|--------|-------------|
| FX1 | Worker A | âœ… DONE | `fa2c8aa` | ESC key interrupt |
| FX2 | Worker B | âœ… DONE | `8301e7f` | Session persistence |
| FX3 | Lead | âœ… DONE | (in triggers.js) | Workflow gate unblock |
| FX4 | Worker A | âœ… DONE | (pending commit) | Ghost text fix v2 - ESC dismiss + isTrusted + debounce |
| FX5 | Worker A | âœ… DONE | (pending commit) | Re-enable broadcast Enter key (was over-blocked) |
| BUG2 | Lead | âœ… FIXED | (pending commit) | V13 watchdog - thinking animation counted as activity |

### FX2: Session Persistence (Worker B) - âœ… DONE

**Commit:** `8301e7f`

**Changes:**
- Save session state to disk (scrollback, cwd, terminal info)
- Load session state on daemon start
- Periodic auto-save every 30 seconds
- Save on shutdown (SIGINT, SIGTERM)
- Protocol: `get-session`, `save-session`, `clear-session`
- Client: `getSession()`, `saveSession()`, `clearSession()`

**Files:** ui/terminal-daemon.js, ui/daemon-client.js

---

## CRITICAL: ESC Key Fix - âœ… IMPLEMENTED (Pending Restart)

**Issue:** ESC key stopped working - xterm.js was capturing all keyboard input, preventing users from interrupting stuck agents. All agents (Lead, Worker A, Worker B) became stuck and unresponsive. Only Reviewer remained active.

**Root Cause:** xterm terminals capture keyboard focus and don't release it, blocking ESC from reaching the app's interrupt handlers.

**Fix (Reviewer - Emergency):**
1. **main.js:446-453** - Added `before-input-event` handler to intercept ESC at Electron main process level BEFORE xterm sees it
2. **renderer.js:199-214** - Added `global-escape-pressed` IPC listener that:
   - Blurs all terminals via `terminal.blurAllTerminals()`
   - Blurs any focused element
   - Shows visual feedback: "ESC pressed - keyboard released"

**Status:** Code committed. Requires app restart to test.

---

## Post-V11: Autocomplete Bug Fix - âœ… COMMITTED

**Commit:** `0ba5cb7`

**Issue:** Autocomplete suggestions were auto-submitted to agent terminals without user confirmation. Happened 3+ times in testing session.

**Fix (Worker A + Worker B collaboration):**
- Added `autocomplete="off"` and related attributes to all inputs
- Made broadcast keydown handler defensive (check !isComposing, trim, block empty)
- Added `blurAllTerminals()` function to release xterm keyboard capture
- Blur terminals when any input/textarea gets focus

**Files:** ui/index.html, ui/renderer.js, ui/modules/terminal.js

---

## V11: MCP Integration - âœ… SHIPPED

**Commit:** `c4b841a` (+ fix `c567726`)

**Goal:** Replace file-based triggers with Model Context Protocol for structured agent communication.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MC1 | Lead | âœ… DONE | MCP server skeleton with stdio transport |
| MC2 | Lead | âœ… DONE | Core messaging tools (send_message, get_messages) |
| MC3 | Lead | âœ… DONE | Workflow tools (get_state, trigger_agent, claim_task) |
| MC4 | Worker B | âœ… DONE | Connect MCP server to existing message queue |
| MC5 | Worker B | âœ… DONE | Agent identification via MCP handshake |
| MC6 | Worker B | âœ… DONE | State machine integration |
| MC7 | Worker A | âœ… DONE | MCP status indicator in UI |
| MC8 | Worker A | âœ… DONE | Auto-configure MCP per agent on startup |
| MC9 | Worker A | âœ… DONE | MCP connection health monitoring |
| R1 | Reviewer | âœ… DONE | Verify all MCP tools work correctly |

---

## V10: Messaging System Improvements - âœ… SHIPPED

**Commit:** `6d95f20`

**Goal:** Make agent-to-agent messaging robust and production-ready.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| MQ1 | Lead | âœ… DONE | Message queue backend - JSON array with append |
| MQ2 | Lead | âœ… DONE | Delivery confirmation IPC events |
| MQ3 | Worker A | âœ… DONE | Message history UI panel |
| MQ4 | Worker B | âœ… DONE | Message queue file watcher integration |
| MQ5 | Worker B | âœ… DONE | Gate bypass for direct messages |
| MQ6 | Worker A | âœ… DONE | Group messaging UI (workers only, custom) |
| R1 | Reviewer | âœ… DONE | Verify all messaging features |

### Worker A Completion Notes (MQ3 + MQ6)

**Files modified:**
- `ui/index.html` - Added CSS and HTML for Messages tab
- `ui/modules/tabs.js` - Added JavaScript for message display and composer
- `ui/renderer.js` - Added setup call for Messages tab

**MQ3: Message History UI:**
- New "Messages" tab in right panel
- Shows conversation history with from/to/time/content
- Filter buttons: All, Lead, Worker A, Worker B, Reviewer
- Delivery status indicators (âœ“ Delivered / â³ Pending)
- Auto-scroll to newest messages

**MQ6: Group Messaging UI:**
- Message composer with recipient selection
- Individual recipients: Lead, Worker A, Worker B, Reviewer
- Group recipients: Workers Only, All Agents
- Multi-select support for custom groups
- Enter to send, Shift+Enter for newline

**IPC handlers expected from Lead (MQ1+MQ2):**
- `get-message-history` - Returns message array
- `clear-message-history` - Clears all messages
- `send-group-message` - Sends to selected recipients
- `message-received` event - When new message arrives
- `message-delivered` event - When delivery confirmed

**Handoff to Lead:** MQ1+MQ2 - Backend handlers needed for full functionality.

---

## V9: Documentation & Polish - âœ… SHIPPED

Commit: `ac4e13c` - All 7 tasks complete.

---

## V8: Testing & Automation - âœ… SHIPPED

Commit: `4e8d7c3` - All tasks complete.

---

## V7: Quality & Observability - âœ… SHIPPED

Commit: `1df828b` - All 7 tasks complete.

---

## V6: Smart Automation - âœ… SHIPPED

**Goal:** Intelligent task routing and automated coordination.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| SR1 | Lead | âœ… DONE | Smart routing algorithm |
| SR2 | Lead | âœ… DONE | Routing IPC handlers |
| AH1 | Lead | âœ… DONE | Auto-handoff logic |
| AH2 | Worker A | âœ… DONE | Handoff notification UI |
| CR1 | Worker B | âœ… DONE | Conflict queue system |
| CR2 | Worker A | âœ… DONE | Conflict resolution UI |
| LM1 | Worker B | âœ… DONE | Learning data persistence |
| R1 | Reviewer | ðŸ”„ ACTIVE | Verify all V6 features |

**All implementation complete.** Awaiting Reviewer verification (R1).

---

## V5: Multi-Project & Performance - âœ… SHIPPED

Commit: `da593b1` - All tasks complete.

---

## V4: Self-Healing & Autonomy - âœ… SHIPPED

Commit: `f4e9453` - All 8 tasks complete.

---

## V3: Developer Experience - âœ… COMPLETE

**Goal:** Testing workflow, session history, project management

| Sprint | Focus | Status |
|--------|-------|--------|
| 3.1 | Dry-Run Mode | âœ… COMPLETE |
| 3.2 | History + Projects Tabs | âœ… COMPLETE |
| 3.3 | Polish & Verification | âœ… COMPLETE |

### Sprint 3.1: Dry-Run Mode âœ… COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker A | âœ… DONE | Settings toggle + header indicator |
| D2 | Worker B | âœ… DONE | Daemon dry-run mode (mock terminals) |

### Sprint 3.2: History & Projects âœ… COMPLETE

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| H1 | Worker A | âœ… DONE | Session History tab UI |
| H2 | Worker B | âœ… DONE | Session History data + IPC handler |
| J1 | Worker A | âœ… DONE | Projects tab UI |
| J2 | Worker B | âœ… DONE | Recent projects backend + IPC handlers |

#### Worker B Completion Notes (H2 + J2)

**Files modified:**
- `ui/modules/ipc-handlers.js` - Added 6 new IPC handlers
- `ui/main.js` - Added `recentProjects` to DEFAULT_SETTINGS

**H2: Session History IPC:**
- `get-session-history` - Returns enhanced history data with role names, formatted durations

**J2: Recent Projects IPC:**
- `get-recent-projects` - List recent projects (validates existence)
- `add-recent-project` - Add to list (max 10, dedupes)
- `remove-recent-project` - Remove specific project
- `clear-recent-projects` - Clear all
- `switch-project` - Switch + add to recent list

**Integration:**
- `select-project` now auto-adds to recent projects

**Handoff to Worker A (H1 + J1):**
Backend APIs are ready. See `workspace/checkpoint.md` for API reference.

#### Worker A Completion Notes (H1 + J1)

**Files modified:**
- `ui/index.html` - Added tab HTML structure + CSS styles
- `ui/modules/tabs.js` - Added UI logic and IPC integration
- `ui/renderer.js` - Wired up setup functions

**H1: Session History UI:**
- Tab pane with list container (`historyList`)
- Refresh button (`refreshHistoryBtn`)
- CSS: `.history-list`, `.history-item`, `.history-item-header`, `.history-item-agent`, `.history-item-duration`, `.history-item-time`, `.history-empty`
- Functions: `setupHistoryTab()`, `loadSessionHistory()`, `renderHistoryList()`, `formatHistoryTime()`, `formatDuration()`
- Uses `get-usage-stats` IPC (returns `recentSessions`)

**J1: Projects UI:**
- Tab pane with list container (`projectsList`)
- Add Project button (`addProjectBtn`) + Refresh button (`refreshProjectsBtn`)
- CSS: `.projects-list`, `.project-item`, `.project-item-info`, `.project-item-name`, `.project-item-path`, `.project-item-remove`, `.projects-empty`
- Functions: `setupProjectsTab()`, `loadRecentProjects()`, `renderProjectsList()`, `addCurrentProject()`, `getProjectName()`
- Uses `get-recent-projects`, `switch-project`, `remove-recent-project` IPC handlers
- Listens for `project-changed` event

**Note:** Implementation was completed in a previous session but status.md was not updated.

#### Worker B Completion Notes (D2)

**Files modified:**
- `ui/terminal-daemon.js` - Added dry-run mode support
- `ui/daemon-client.js` - Updated spawn() to accept dryRun flag

**Changes to terminal-daemon.js:**
- Added `DRY_RUN_RESPONSES` array with mock Claude responses
- Added `sendMockData()` function for simulated typing effect
- Added `generateMockResponse()` function to create context-aware mock responses
- Updated `spawnTerminal()` to accept `dryRun` flag
  - When dryRun=true: creates mock terminal (no real PTY spawned)
  - Shows welcome message with role and working dir
  - Fake PID: 90000 + paneId
- Updated `writeTerminal()` to handle dry-run mode
  - Echoes input, buffers until Enter
  - Generates mock response on Enter
- Updated `killTerminal()` to handle dry-run terminals
- Updated `listTerminals()` to include dryRun flag
- Imported `PANE_ROLES` from config for welcome message

**Changes to daemon-client.js:**
- Updated `spawn(paneId, cwd, dryRun)` to accept dryRun parameter
- Updated `spawned` event handler to capture dryRun flag

**Protocol extension:**
- spawn action: `{ action: "spawn", paneId, cwd, dryRun: true/false }`
- spawned event: `{ event: "spawned", paneId, pid, dryRun: true/false }`

**Handoff to Worker A (D1):**
- Settings toggle needs to pass dryRun flag when calling `window.hivemind.pty.create()`
- main.js needs to forward dryRun from settings to daemon spawn call
- Header indicator should show when dry-run is active

See `workspace/shared_context.md` for full task breakdown.

---

## V2 COMPLETE ðŸŽ‰

## Sprint 2.3: Polish âœ… COMPLETE (Jan 24, 2026)

**Final sprint of V2 - All features verified by Reviewer**

| Task | Owner | Feature | Status |
|------|-------|---------|--------|
| D1 | Worker B | Daemon logging to file | âœ… |
| D2 | Worker B | Health check endpoint | âœ… |
| D3 | Worker B | Graceful shutdown | âœ… |
| U1 | Worker A | Scrollback persistence | âœ… |
| U2 | Worker A | Visual flash on trigger | âœ… |
| U3 | Lead | Kill All button | âœ… |
| U4 | Lead | Others triggers | âœ… |
| P1 | Reviewer | Final verification | âœ… |

---

## Sprint 2.2: Modularize âœ… COMPLETE (Jan 24, 2026)

Renderer.js: 1635â†’185 lines (89%â†“), main.js: 1401â†’343 lines (76%â†“)

---

## Sprint 2.1: Test Suite âœ… COMPLETE (Jan 24, 2026)

**Goal:** Add test suite (was at 0 tests)
**Result:** 86+ tests passing

| File | Owner | Tests | Status |
|------|-------|-------|--------|
| config.test.js | Worker A | ~20 | âœ… |
| protocol.test.js | Worker A | ~25 | âœ… |
| daemon.test.js | Worker B | 28 | âœ… |
| triggers.test.js | Worker B | 24 | âœ… |

**Bonus:** Lead created shared `ui/config.js` consolidating constants.

**Verified by:** Claude-Reviewer

---

## Cleanup Sprint: âœ… COMPLETE (Jan 24, 2026)

**All cleanup tasks verified by Reviewer:**
- Worker A: A1-A4 code fixes âœ…
- Worker B: B1-B4 file cleanup âœ…
- Reviewer: R1-R3 verification âœ…

**V1 STATUS: APPROVED FOR RELEASE**

See: `workspace/build/cleanup-sprint.md` for details

---

## Chain Test: âœ… SUCCESS (Jan 24, 2026)

Agent-to-agent autonomous triggering verified:
- Lead triggered â†’ Worker A responded â†’ Worker B responded â†’ Reviewer completed chain
- See: `workspace/build/chain-test.md`

---

## SPRINT #2: Terminal Daemon Architecture âœ… COMPLETE

**Goal:** Separate PTY management into daemon process so terminals survive app restarts.

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker B | âœ… VERIFIED | Create `terminal-daemon.js` |
| D2 | Worker B | âœ… VERIFIED | Create `daemon-client.js` |
| D3 | Worker B | âœ… VERIFIED | Add daemon scripts to package.json |
| D4 | Lead | âœ… VERIFIED | Refactor `main.js` to use daemon |
| D5 | Worker A | âœ… VERIFIED | Update renderer for reconnection UI |
| D6 | Reviewer | âœ… DONE | Verify daemon survives app restart |

**Verification:** See `workspace/build/reviews/daemon-verification.md`

### Worker B Completion Notes (D1-D3)

**Files created:**
- `ui/terminal-daemon.js` - Standalone daemon process (280 lines)
  - Named pipe server at `\\.\pipe\hivemind-terminal`
  - Manages PTY processes in Map by paneId
  - Broadcasts output to all connected clients
  - Handles: spawn, write, resize, kill, list, attach, shutdown
  - Writes PID to `daemon.pid` for process management
  - Graceful shutdown on SIGINT/SIGTERM

- `ui/daemon-client.js` - Client library (320 lines)
  - EventEmitter-based for easy integration
  - Auto-spawns daemon if not running
  - Auto-reconnects on disconnect (5 retries)
  - Caches terminal state locally
  - Singleton pattern via `getDaemonClient()`

**Scripts added to package.json:**
- `npm run daemon:start` - Start daemon manually
- `npm run daemon:stop` - Stop daemon gracefully
- `npm run daemon:status` - Check if daemon is running

**Protocol implemented per spec:**
- Client â†’ Daemon: spawn, write, resize, kill, list, attach, ping, shutdown
- Daemon â†’ Client: data, exit, spawned, list, attached, killed, error, connected, pong

### Lead Completion Notes (D4)

**Changes to `ui/main.js`:**
- Removed `node-pty` import, replaced with `daemon-client`
- Added `initDaemonClient()` function - connects to daemon on app start
- Set up daemon event handlers: data, exit, spawned, connected, disconnected, reconnected, error
- Replaced all `pty-*` IPC handlers to use `daemonClient.spawn/write/resize/kill()`
- Updated `notifyAgents`, `notifyAllAgentsSync`, `broadcastToAllAgents` to use daemon client
- Changed app close behavior: disconnects from daemon instead of killing terminals
- Terminals now survive app restart!

**Handoff to Worker A:** D5 - check if renderer.js needs updates for reconnection UI.

**Handoff to Reviewer:** D6 - ready for verification once D5 is checked.

### Worker A Completion Notes (D5)

**Changes to `ui/renderer.js`:**
- Added `reattachTerminal(paneId)` - creates xterm UI and connects to existing PTY without calling `pty.create()`. Used when daemon already has terminals running.
- Added `setupDaemonListeners()` - handles daemon connection events:
  - `daemon-connected` - reattaches to existing terminals on startup
  - `daemon-reconnected` - shows status update when app reconnects
  - `daemon-disconnected` - warns user when daemon disconnects
- Called `setupDaemonListeners()` in DOMContentLoaded

**Behavior:**
- When app starts and daemon has existing terminals â†’ shows "Reconnecting to existing sessions..." â†’ reattaches each terminal â†’ shows "[Session restored from daemon]" in terminal
- When app reconnects after disconnect â†’ shows "Daemon reconnected" in status bar
- When daemon disconnects â†’ shows warning in status bar

**Handoff to Reviewer:** D6 ready - test full flow: start app, spawn terminals, close app, reopen â†’ terminals should still be there.

---

**Previous handoff from Worker B:** D4 can begin. Main.js needs to:
1. Import `getDaemonClient` from daemon-client.js
2. Replace `pty-create` handler to use `daemonClient.spawn()`
3. Replace `pty-write` handler to use `daemonClient.write()`
4. Setup listeners for `daemonClient.on('data', ...)` to forward to renderer
5. On app start: `await daemonClient.connect()` then list/reattach existing terminals

**Why:** Enables hot reload, crash recovery, and persistent terminal sessions.

**See:** `workspace/shared_context.md` for full spec and protocol.

---

## Previous: Feedback Sprint (COMPLETE)

**Worker B completed:**
1. Atomic writes for state.json - DONE (prevents corruption on crash)
2. Atomic writes for settings.json - DONE
3. Updated CLAUDE.md to reflect Electron architecture - DONE (removed Python refs)
4. Research on multi-agent frameworks - DONE (see workspace/research-notes.md)

**ALL FEEDBACK ACTION ITEMS COMPLETE:**
- [x] Cost tracking (HIGH) - DONE
  - Worker A: Session timers in pane headers (M:SS display)
  - Worker B: Backend usage tracking (main.js) + Build Progress tab display
    - Tracks: total spawns, sessions today, total session time
    - Persists to: `ui/usage-stats.json`
    - UI: Usage Stats section in Build Progress tab
- [x] Document failure modes (MEDIUM) - Lead DONE â†’ `docs/failure-modes.md`
- [x] Atomic writes for state.json (MEDIUM) - Worker B DONE
- [x] Clean up outdated docs (HIGH) - Worker B DONE
- [x] Document "Windows-first" (LOW) - Worker B DONE (added to CLAUDE.md)

**Worker A added (Jan 23 session):**
- Session timers in pane headers (cost tracking foundation)
  - CSS: `ui/index.html` lines 107-120
  - HTML: Timer elements in all 4 pane headers
  - JS: `ui/renderer.js` - sessionStartTimes, handleSessionTimerState, updateTimerDisplay, getTotalSessionTime

**Lead completed:** Created `docs/failure-modes.md` documenting 8 failure scenarios with detection, recovery, and prevention strategies.

---

## Current Exchange

1. **Reviewer** wrote `friction-audit-review.md` - identified wrong priorities, proposed quick wins
2. **Lead** wrote `lead-response-friction.md` - agreed to quick wins sprint
3. **Reviewer** wrote `reviewer-quickwins-approval.md` - approved sprint, assigned workers
4. **Workers** completed all 5 quick wins + Phase 4 panel structure
5. **Reviewer** wrote `quickwins-verification.md` - ALL VERIFIED

6. **Reviewer** wrote `phase4-verification.md` - Build Progress + Processes tabs VERIFIED

**Current:** Phase 4 core tabs complete. Deferred tabs: Projects, Live Preview, User Testing.

## Shell Test Results - FOR REVIEWER VERIFICATION

**Lead tested shell with user. Results:**

| Test | Result |
|------|--------|
| 4 terminals visible | âœ“ PASS |
| All terminals connected | âœ“ PASS |
| Broadcast to all panes | âœ“ PASS |
| Workers acknowledged roles | âœ“ PASS |
| Layout responsive | âœ“ PASS |
| ~5 sec delay on messages | Expected (Claude startup) |
| Permission prompts | Expected (normal Claude behavior) |

**Bugs fixed during testing:**
- Preload script conflict (removed)
- `terminal.onFocus` not a function (fixed)
- Layout too tall (fixed with min-height: 0)

---

## Phase Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Shell (Electron + xterm + node-pty) | âœ“ COMPLETE |
| Phase 2 | State Machine (chokidar + transitions) | âœ“ COMPLETE |
| Phase 3 | UX (settings, folder picker, friction) | âœ“ COMPLETE |
| Phase 4 | Right Panel with Tabs | âœ“ CORE COMPLETE |

**See:** `shell-verification.md`, `phase2-verification.md`, `phase3-verification.md`, `phase4-verification.md`

---

## âœ… QUICK WINS SPRINT - VERIFIED COMPLETE

**Files:**
- `lead-response-friction.md` - Lead agreed to quick wins
- `reviewer-quickwins-approval.md` - Reviewer approved
- `quickwins-verification.md` - Reviewer verified all 5 tasks

**Status:** All 5 quick wins verified. Phase 4 can resume.

---

## Phase 4 Tasks - RIGHT PANEL WITH TABS (âœ“ CORE COMPLETE)

| Task | Owner | Status |
|------|-------|--------|
| Right panel structure (toggleable) | Worker A | âœ“ VERIFIED |
| Screenshots tab (full) | Worker A+B | âœ“ VERIFIED |
| Build Progress tab | Worker A | âœ“ VERIFIED |
| Processes tab | Worker B | âœ“ VERIFIED |
| Projects tab | - | DEFERRED |
| Live Preview tab | - | DEFERRED |
| User Testing tab | - | DEFERRED |

**See:** `phase4-verification.md` for full review.

### Quick Wins Sprint - âœ“ COMPLETE

| # | Task | Owner | Status |
|---|------|-------|--------|
| QW-1 | Console log capture | Worker A | âœ“ VERIFIED |
| QW-2 | Track Claude running state | Worker A | âœ“ VERIFIED |
| QW-3 | Re-enable notifyAgents | Worker A | âœ“ VERIFIED |
| QW-4 | Agent status badges | Worker B | âœ“ VERIFIED |
| QW-5 | Refresh button per pane | Worker B | âœ“ VERIFIED |

**See:** `quickwins-verification.md` for full review.

---

## âœ… PHASE 2 COMPLETE - STATE MACHINE

| Task | Owner | Status |
|------|-------|--------|
| Create `state.json` structure | Lead | **DONE** â†’ `workspace/state.json` |
| Add chokidar file watcher | Worker A | **DONE** |
| Add transition logic | Worker A | **DONE** (included with watcher) |
| Add UI state display | Worker B | **DONE** |
| Test full workflow | Reviewer | **VERIFIED** |

**See:** `phase2-verification.md` for full review.

### Worker B - UI State Display (DONE)
Added to `ui/index.html`:
- State bar showing current workflow state (color-coded badges)
- Progress bar for checkpoint tracking
- Agent activity badges (green glow = active, gray = idle)

Added to `ui/renderer.js`:
- `updateStateDisplay(state)` - updates all UI elements on state change
- `setupStateListener()` - IPC listener for `state-changed` events
- `STATE_DISPLAY_NAMES` - human-readable state names

---

## âœ… PHASE 3 COMPLETE - UX IMPROVEMENTS

| Task | Owner | Status | File |
|------|-------|--------|------|
| Settings panel (visual toggles) | Worker A | **DONE** | `main.js` + `index.html` |
| Auto-spawn Claude option | Worker A | **DONE** | `main.js` + `renderer.js` |
| Folder picker (project selection) | Worker B | **DONE** | `main.js` + `renderer.js` + `index.html` |
| Friction panel (view/manage logs) | Worker B | **DONE** | `main.js` + `renderer.js` + `index.html` |

**See:** `phase3-verification.md` for full review.

---

## Phase 3 Task Details

### Worker A Tasks (Pane 2)

**P3-A1: Settings Panel**
- Add a collapsible settings panel to the UI
- Toggles for: auto-spawn Claude, auto-sync context, sound notifications
- Store settings in `localStorage` or a settings.json file
- IPC handlers in `main.js` for settings persistence

**P3-A2: Auto-spawn Claude Option**
- When enabled, automatically run `claude` in each pane on app start
- Add checkbox in settings panel
- Modify `initTerminals()` to check setting and spawn if enabled

### Worker B Tasks (Pane 3)

**P3-B1: Folder Picker (DONE)**
- Added "Select Project" button (green) to header
- `dialog.showOpenDialog` IPC handler in `main.js`
- Project path display in state bar
- Transitions to `PROJECT_SELECTED` state on selection
- `window.hivemind.project` API in renderer

**P3-B2: Friction Panel (DONE)**
- Collapsible panel with yellow theme (matches friction color in spec)
- Lists friction files from `workspace/friction/` sorted by date
- Click to view file contents (alert popup)
- "Refresh" and "Clear Resolved" buttons
- Badge count in header button
- IPC handlers: `list-friction`, `read-friction`, `delete-friction`, `clear-friction`

---

## Lead's Proposed Phases

1. **Test shell** - Does the Electron app even work?
2. **Add state machine** - The actual workflow logic
3. **Add UX** - Settings, folder picker, friction panel

---

## Files to Read

| File | What |
|------|------|
| `SPEC.md` | Reviewer's full product spec |
| `lead-response.md` | Lead's response and proposed plan |
| `plan.md` | Original (incomplete) plan |

**Reviewer:** Please read `lead-response.md` and confirm or push back.

---

## ðŸš¨ ARCHITECTURE PIVOT - NEW PLAN FOR REVIEW

**File**: `workspace/build/plan.md`

**Summary**: Instead of replacing Claude Code with custom API calls, we WRAP Claude Code:
- 4 Claude Code CLI instances in an Electron UI
- Each pane is a real `claude` process (xterm.js terminal)
- User types in any pane or broadcasts to all
- Shared context via `shared_context.md` (file watching syncs)
- We leverage Claude Code's existing tools/permissions, not rebuild them

**Status**: APPROVED - TASKS ASSIGNED

**Lead responded** to Reviewer conditions in `plan.md`:
- Sync: Option 2 (explicit button) for MVP
- Role injection: CLAUDE.md per instance working dir
- Session: Resume prompt on app reopen

## Active Tasks - Hivemind UI Build

### Phase 1 - Scaffold (Worker A) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U1 | **DONE** | Electron app scaffold - package.json, main.js, basic window |
| U2 | **DONE** | 4-pane layout with xterm.js |
| U3 | **DONE** | Spawn `claude` process per pane with node-pty |

### Phase 2 - Input (Worker B) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U4 | **DONE** | Input bar per pane â†’ sends to that instance |
| U5 | **DONE** | Broadcast input bar â†’ sends to all (included in U1) |
| U6 | **DONE** | Keyboard shortcuts (Ctrl+1-4 focus) (included in U1) |

### Phase 3 - Context (Lead) - DONE
| Task | Status | Description |
|------|--------|-------------|
| U7 | **DONE** | Create shared_context.md protocol |
| U8 | **DONE** | Sync button sends context to all |
| U9 | **DONE** | Role injection via working dirs |

## All Phases Complete - NEEDS TESTING

**Status:** Code written, but UI has bugs. Last session ended mid-debug.

**Known issues:**
- Desktop shortcut doesn't work (Windows batch file issue)
- UI buttons may not respond (was fixing renderer.js)
- node-pty rebuild failed, using prebuilt binaries

**To test:**
```bash
cd D:\projects\hivemind\ui
npm start
```

**Reviewer:** Please verify the UI works before we continue. Check `workspace/shared_context.md` for full context.

---

## Previous Work (Batch System - SUPERSEDED)

## Worker A (Instance 2)
- [x] A1 - settings.py (DONE)
- [x] A2 - spawner.py (DONE)
- [x] A3 - state_machine.py (DONE)
- [x] A4 - manager.py (DONE)
- [x] A5 - spawn_with_timeout (DONE - in spawner.py)
- [x] A6 - parallel worker spawning (DONE - WorkerManager in manager.py)

## Worker B (Instance 3)
- [x] B1 - watcher.py (DONE)
- [x] B2 - logging.py (DONE)
- [x] B3 - locking.py (DONE)

## Lead (Instance 1)
- [x] L1 - models (DONE - src/models/state.py, task.py, agent.py)
- [x] L2 - main.py stub (DONE - src/main.py)
- [x] L3 - integration (DONE - full CLI with new/run/status commands)

## Reviewer (Instance 4)
- [x] R1 - Reviewed L1, L2, A1 (APPROVED)
- [x] R2 - mypy run (4 minor type errors remaining - cosmetic)
- [x] R3 - Imports verified - ALL OK
- [x] Phase 1 Reviews: A2, A3, B1, B2, B3 (ALL APPROVED)
- [x] Phase 2 Review: A4/A5/A6 manager.py (APPROVED)
- [x] UI Review: ui.py (APPROVED)
- [x] Final Review: main.py bug FIXED, all imports pass

**All reviews written to `workspace/build/reviews/`**
**mypy: 4 cosmetic errors (watcher.py, locking.py) - runtime OK**

---

## Completed Tasks

### L1 - Models (Lead)
- Created `src/models/state.py` - State, Status, Phase, WorkerState, SubtaskState, etc.
- Created `src/models/task.py` - Task, Subtask, Plan, FileOperation, Checkpoint
- Created `src/models/agent.py` - AgentRole, Transition, AgentResult, AgentError, AgentAssignment, TRANSITIONS dict
- Created `src/models/__init__.py` - exports all models
- Verified imports work: `python -c "from src.models import State, Task"`

### L2 - main.py stub (Lead)
- Created `src/main.py` - entry point with placeholder for orchestrator loop
- Imports will work once Worker A and B components exist

### B1 - watcher.py (Worker B)
- Created `src/orchestration/watcher.py`
- `DebouncedWatcher` class - debounces rapid file changes
- `WorkspaceWatcher` class - watches workspace for state.json and .done.{agent_id} files
- `watch_workspace()` function - simple watcher for basic monitoring
- Uses watchfiles library (awatch)

### B2 - logging.py (Worker B)
- Created `src/orchestration/logging.py`
- `JSONLogHandler` class - writes JSON-formatted log entries
- `EventLogger` class - structured event logging with context (agent, task_id, worker_id, details)
- `setup_logging(workspace)` - configures events.jsonl and errors.jsonl loggers
- `get_events_logger()` / `get_errors_logger()` - accessor functions

### B3 - locking.py (Worker B)
- Created `src/workspace/locking.py`
- `FileLock` class - cross-platform file locking (fcntl on Unix, msvcrt on Windows)
- `file_lock()` context manager - convenient lock/unlock pattern
- Timeout support with configurable wait duration (default 30s)
- `FileLockError` / `FileLockTimeout` exceptions

### A1 - settings.py (Worker A)
- Created `src/config/settings.py`
- Pydantic `Settings` class with all orchestration config
- Timeouts: agent_timeout, worker_timeout, stuck_threshold, heartbeat_interval, heartbeat_timeout
- Limits: max_workers, max_retries, max_revision_cycles
- Paths: workspace_path, roles_path, logs_path
- Claude CLI: claude_command, claude_output_format
- Updated `src/config/__init__.py` with exports

### A2 - spawner.py (Worker A)
- Created `src/orchestration/spawner.py`
- `spawn_claude()` - basic async spawn function
- `spawn_with_timeout()` - spawn with timeout protection
- `spawn_with_retry()` - spawn with retry logic
- `spawn_agent()` - high-level function returning AgentResult
- `AgentTimeoutError` exception class
- Uses `--permission-mode bypassPermissions` per spec

### A3 - state_machine.py (Worker A)
- Created `src/orchestration/state_machine.py`
- Re-exports Status, Phase, Transition, TRANSITIONS from models
- `STATUS_TO_PHASE` mapping
- `TERMINAL_STATUSES` set
- `get_next_action(state)` - determines next transition
- `can_transition(from, to)` - validates transitions
- Helper functions: is_terminal_status, is_error_status, should_spawn_workers, etc.

### A4 - manager.py (Worker A)
- Created `src/orchestration/manager.py`
- `HivemindOrchestrator` - main orchestration loop
- `WorkerManager` - parallel worker management
- `StuckDetector` - detects system stuck state
- `run()` - watches state.json via watchfiles
- `handle_state()` - processes state changes, spawns agents
- `spawn_workers()` - spawns parallel workers
- Error handling: handle_agent_failure, handle_timeout, escalate

### A5/A6 - spawn_with_timeout and parallel spawning (Worker A)
- Included in spawner.py and manager.py respectively
- `spawn_with_timeout()` in spawner.py
- `WorkerManager.spawn_all()` / `wait_all()` for parallel execution

## Jan 27, 2026 - Codex Sandbox Config Fix (Worker B) - DONE
- Ensured %USERPROFILE%\.codex\config.toml includes sandbox_mode = "workspace-write" (appended, no overwrite).

## Jan 27, 2026 - Codex Config Bootstrap in main.js (Worker B) - DONE
- Added ensureCodexConfig() to create/append sandbox_mode = "workspace-write" before window creation.
- File: ui/main.js

## Jan 27, 2026 - Codex Config Bootstrap Refinement (Worker B) - DONE
- main.js: ensureCodexConfig() updates sandbox_mode value to "workspace-write" if present; appends if missing. Added comment on dependency.
## Delivery-Ack Enhancement Review (Jan 28, 2026)

**Owner:** Implementer B

**Summary:** Reviewer approved delivery-ack enhancement for trigger sequencing. recordMessageSeen now occurs only after renderer confirmation; failed injections do not ack; 30s timeout cleanup verified; SDK path unchanged.

**Review:** APPROVED (Reviewer, Jan 28, 2026) – see `workspace/build/reviews/delivery-ack-enhancement-review.md`

**Files updated:**
- `ui/modules/triggers.js`
- `ui/modules/daemon-handlers.js`
- `ui/modules/terminal.js`
- `ui/main.js`

---

---

## Session 30 - P1 Implementation

### Task #1: Agent Health Dashboard - DONE (Implementer A)
- HTML: Added health indicators, stuck warnings, action buttons to all 6 pane headers
- CSS: Color-coded health states (.recent green, .active gray, .stale yellow), stuck pulse animation
- JS: updateHealthIndicators() with 1-second interval, formatTimeSince() helper, button handlers for Ctrl+C and ESC

### Task #2: Message Delivery Visibility - DONE (Implementer A)
- HTML: Added delivery-indicator elements to all 6 pane headers
- CSS: Delivery indicator styling with pop animation, delivery-flash on pane header
- JS: showDeliveryIndicator() and showDeliveryFailed() in daemon-handlers.js
- Hooked into both SDK and PTY delivery completion paths in processQueue()

All 418 tests pass. Awaiting Reviewer audit.

## Jan 29, 2026 - P2 Debugging Sprint: Integration Test Harness (Implementer B) - DONE
- Added IPC test harness + smoke registration test for all IPC handler modules
- Added targeted IPC behavior tests (settings, shared-context, agent-claims)
- Added unit tests for `modules/codex-exec.js` and `mcp-server.js`
- Tests run: `npx jest --runInBand __tests__/codex-exec.test.js __tests__/mcp-server.test.js __tests__/ipc-handlers.test.js`

**Files added:**
- `ui/__tests__/helpers/ipc-harness.js`
- `ui/__tests__/ipc-handlers.test.js`
- `ui/__tests__/codex-exec.test.js`
- `ui/__tests__/mcp-server.test.js`

**Status:** ✅ APPROVED (Reviewer, Session 29) - See `workspace/build/reviews/task3-integration-harness-review.md`

---

## Session 34 - UI Overhaul Sprint

### Task #1: HTML Restructure - DONE (Implementer A)
- Restructured pane-layout to main-pane-container (60%) + side-panes-container (40%)
- Moved command-bar outside terminals-section
- **Status:** ✅ APPROVED (Reviewer) - See `workspace/build/reviews/task1-html-restructure-review.md`

### Task #2: Pane Swap Functionality - DONE (Implementer B)
- Click-to-swap from side pane to main
- Main pane click returns to default
- Proper resize handling with debounce
- **Status:** ✅ APPROVED (Reviewer) - See `workspace/build/reviews/task2-pane-swap-review.md`

### Task #3: Command Bar Enhancements - DONE (Implementer A)
- Target selection dropdown (All Agents + 6 individual)
- Delivery status indicator (sending/delivered/failed)
- Dynamic placeholder based on target
- `/target message` prefix support in SDK mode
- **Status:** ✅ APPROVED (Reviewer) - See `workspace/build/reviews/task3-command-bar-review.md`

### Task #4: Dead Code Cleanup - DONE (Reviewer)
- Removed Msgs tab button and content from index.html (~46 lines)
- Removed legacy broadcast CSS from layout.css (~31 lines)
- Removed Messages tab handlers from tabs.js (~314 lines)
- Removed Messages CSS from tabs.css (~188 lines)
- Removed setupMessagesTab() call from renderer.js
- **Total:** ~580 lines of dead code removed

---

## Session 40 - Maintenance (Jan 30, 2026)
**Owner:** Implementer B  
**Status:** ✅ COMPLETE

**Task:** Remove dead `.pane-grid` CSS from `ui/styles/layout.css`.

**Result:** Verified `.pane-grid` rules are already removed; no code changes needed.

**Task:** Clean version/fix comment prefixes in `ui/main.js` and `ui/renderer.js`.

**Result:** No `//V#`, `//BUG`, or `//FIX` markers found in `ui/main.js`; removed remaining `FIX3` tag from a renderer comment. No behavior changes.

**Task:** Clean version/fix comment prefixes in `ui/modules/watcher.js` and `ui/modules/sdk-bridge.js`.

**Result:** Removed V# prefixes from watcher and SDK bridge comments while preserving meaning. No behavior changes.

---

## Session 41 - Code Cleanup Sprint (Jan 30, 2026)
**Owner:** Reviewer  
**Status:** ✅ COMPLETE

### Task #1: SDK Mode Flag Architecture Clarification
- Updated renderer.js comment (lines 19-21) to clarify process boundary
- Renderer-process flags synced by setSDKMode(): sdkMode, daemonHandlers.sdkModeEnabled, terminal.sdkModeActive, settings.sdkMode
- Main-process flag (triggers.sdkModeEnabled) synced via IPC in main.js

### Task #2: SDK Mode Setter Enforcement
- Fixed daemon-handlers.js:337 - changed direct `sdkModeEnabled = true` to use `setSDKMode(true)` 
- Ensures centralized state management isn't bypassed

### Task #3: Cosmetic Log Noise Suppression
- Changed watcher.js:712 "Empty trigger file after retries" from INFO to DEBUG level
- Expected noise after trigger delivery/clear cycle no longer pollutes normal logs

### Task #4: Dead Code Verification
- Searched for duplicate `case 'ready'` in sdk-bridge.js - NOT FOUND (only one at line 590)
- Verified this.ready init - only one constructor init at line 78, other assignments are valid state management
- No dead code found - codebase is clean

---

## Session 47 - Cost Optimization Engine (Jan 30, 2026)
**Owner:** Implementer A  
**Status:** ✅ COMPLETE

### Task #24: Cost Optimization Engine

**Overview:** Track API costs per agent/task, predict budgets, suggest optimizations. Integrate with existing memory/activity systems.

**Files Created:**
1. **ui/modules/analysis/cost-optimizer.js** (~600 lines)
   - MODEL_PRICING constants for various AI models (Claude, GPT, etc.)
   - CostOptimizer class with comprehensive cost tracking
   - Methods: recordCost(), getSummary(), getCostsByAgent(), getCostsByTask()
   - Time series generation: getTimeSeries() with hourly/daily granularity
   - Budget predictions: getPredictions() using moving averages + linear regression
   - Optimization suggestions: getOptimizations() (model downgrade, caching, batching)
   - Budget alerts: setBudget(), getAlerts() with configurable thresholds
   - Token estimation: estimateTokens() (~4 chars per token)
   - Export/import: export(), import() for data persistence

2. **ui/modules/ipc/cost-optimizer-handlers.js** (~450 lines)
   - 18 IPC channels for cost operations
   - Channels: cost-get-summary, cost-get-by-agent, cost-get-by-task, cost-record, cost-get-history, cost-get-time-series, cost-get-predictions, cost-get-optimizations, cost-set-budget, cost-get-budget, cost-get-alerts, cost-clear-alerts, cost-reset, cost-export, cost-import, cost-estimate, cost-get-pricing, cost-simulate-optimization
   - Auto-persistence to workspace/memory/_cost-data.json
   - Real-time alerts via mainWindow.webContents.send()

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Added import and registration for cost-optimizer-handlers

2. **ui/index.html** (~100 lines added)
   - Costs tab button in tab bar
   - Costs tab pane with:
     - Cost overview cards (Total, Today, Week, Month)
     - Budget progress bar with labels
     - Predictions section with trend indicator
     - Agent breakdown list with cost bars
     - Optimization suggestions panel
     - Action buttons (Refresh, Set Budget, History, Alerts, Reset)
     - Loading overlay

3. **ui/styles/tabs.css** (~400 lines added)
   - Complete Costs tab styling
   - Overview cards grid, budget progress bar
   - Predictions and agents sections
   - Optimization items with priority indicators
   - Budget modal, history modal styles
   - Alert styling, responsive adjustments

4. **ui/modules/tabs.js** (~450 lines added)
   - setupCostsTab() function
   - loadCostData() - parallel loading of all cost data
   - renderCostOverview(), renderBudgetProgress()
   - renderPredictions(), renderAgentBreakdown()
   - renderOptimizations() with icons
   - showBudgetModal(), saveBudgetSettings()
   - showHistoryModal() with cost history list
   - loadCostAlerts(), showCostAlert(), renderAlerts()
   - resetCostData(), recordCost()
   - getCostsState() for external access

5. **ui/renderer.js**
   - Added tabs.setupCostsTab() call

**Total Lines Added:** ~2,000 lines

---

## Session 47 - Security Hardening (Jan 30, 2026)
**Owner:** Implementer A  
**Status:** ✅ COMPLETE

### Task #25: Security Hardening

**Overview:** Auth layer, encryption for sensitive data, permission system. Critical for production.

**Files Created:**
1. **ui/modules/security/security-manager.js** (~650 lines)
   - AES-256-GCM encryption/decryption
   - PBKDF2 key derivation (100,000 iterations, SHA-512)
   - Secure credential storage with encryption at rest
   - Session management with hashed tokens
   - Role-based permission system (viewer, operator, admin)
   - Security audit logging
   - Sensitive data masking
   - Input sanitization

2. **ui/modules/ipc/security-handlers.js** (~400 lines)
   - 24 IPC channels for security operations
   - Channels: security-get-status, security-create-session, security-validate-session, security-invalidate-session, security-check-permission, security-store-credential, security-get-credential, security-delete-credential, security-list-credentials, security-encrypt, security-decrypt, security-hash-password, security-verify-password, security-get-roles, security-assign-role, security-get-audit-log, security-mask-data, security-sanitize-input, security-cleanup, security-export, security-generate-token, security-get-user-sessions, security-extend-session

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Added import and registration for security-handlers

2. **ui/index.html** (~100 lines added)
   - Security tab button
   - Security tab pane with:
     - Status indicator with stats
     - Credentials section with add/copy/delete
     - Sessions section
     - Roles section
     - Audit log section
     - Action buttons

3. **ui/styles/tabs.css** (~350 lines added)
   - Security tab styling
   - Status indicator, credentials list, sessions list
   - Roles display, audit log styling
   - Modal styles for add/encrypt/session

4. **ui/modules/tabs.js** (~400 lines added)
   - setupSecurityTab() function
   - loadSecurityData() - parallel loading
   - renderSecurityStatus(), renderCredentialsList()
   - renderRolesList(), renderAuditLog()
   - showAddCredentialModal(), showAuditLogModal()
   - showEncryptModal(), showCreateSessionModal()
   - Credential management functions

5. **ui/renderer.js**
   - Added tabs.setupSecurityTab() call

**Total Lines Added:** ~1,900 lines

---

### Task #30: Multi-Project Dashboard

**Overview:** Manage multiple projects, switch contexts, aggregate metrics across projects.

**Files Created:**
1. **ui/modules/analysis/multi-project-dashboard.js** (~550 lines)
   - Project registry with metadata management
   - Cross-project metrics aggregation
   - Activity tracking per project
   - Project health scoring algorithm
   - Context switching with state preservation
   - Project comparison functionality

2. **ui/modules/ipc/multi-project-handlers.js** (~450 lines)
   - 18 IPC channels for multi-project operations
   - Project registration/unregistration
   - Active project switching
   - Metrics and health endpoints
   - Activity tracking
   - Export/import project data
   - Archive/restore functionality

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Added import and registration for multi-project-handlers

2. **ui/index.html** (~80 lines added)
   - Dashboard tab button
   - Dashboard tab pane with:
     - Summary stats (total projects, active, avg health)
     - Active project indicator with switch button
     - Project list section
     - Health scores section
     - Recent activity section
     - Export/Import/Compare actions

3. **ui/styles/tabs.css** (~350 lines added)
   - Dashboard summary styling
   - Project list with status indicators
   - Health bar visualization
   - Activity timeline styling
   - Compare modal styles

4. **ui/modules/tabs.js** (~350 lines added)
   - setupDashboardTab() function
   - loadDashboardData() - loads all dashboard data
   - renderDashboardSummary(), renderDashboardProjects()
   - renderDashboardHealth(), renderDashboardActivity()
   - switchToProject(), archiveProject()
   - showAddProjectModal(), exportProjectData()
   - importProjectData(), showCompareModal()

5. **ui/renderer.js**
   - Added tabs.setupDashboardTab() call

**Total Lines Added:** ~1,780 lines

**Status:** COMPLETE

---

## Session 48: Code Reviews for Sprint Tasks

**Reviewer:** Reviewer Agent
**Date:** 2026-01-30
**Status:** ✅ COMPLETE - 6 Tasks Reviewed

### Reviews Completed:

| Task | Module | Verdict | Critical Issues |
|------|--------|---------|-----------------|
| #25 | Security Manager | APPROVED WITH CONCERNS | Machine-derived key, unencrypted sessions |
| #24 | Cost Optimizer | APPROVED | Clean implementation |
| #18 | Code Review | **APPROVED WITH FIX REQUIRED** | **CRITICAL BUG in review-staged handler** |
| #36 | Knowledge Graph | APPROVED | Clean graph implementation |
| #21 | Debug/Replay | APPROVED | Solid replay system |
| #23 | Doc Generator | APPROVED | Minor regex issue |

### CRITICAL BUG FOUND - Task #18

**File:** `ui/modules/ipc/code-review-handlers.js:159-161`
```javascript
ipcMain.handle('review-staged', async (event, payload = {}) => {
  return ipcMain.handle('review-diff', event, { ...payload, mode: 'staged' });
});
```

**Problem:** `ipcMain.handle()` returns the handler function, NOT the result of calling it. The `review-staged` IPC channel is **completely broken**.

**Fix:** Extract shared logic into helper function or duplicate the review-diff logic.

### Review Files Created:
- `workspace/build/reviews/task25-security-manager-review.md`
- `workspace/build/reviews/task24-cost-optimizer-review.md`
- `workspace/build/reviews/task18-code-review-review.md`
- `workspace/build/reviews/task36-knowledge-graph-review.md`
- `workspace/build/reviews/task21-debug-replay-review.md`
- `workspace/build/reviews/task23-doc-generator-review.md`

---

### Task #12: Project Templates and Scaffolding

**Overview:** Pre-built project structures, config presets, directory scaffolding for rapid project creation.

**Files Created:**
1. **ui/modules/scaffolding/project-scaffolder.js** (~650 lines)
   - Project template definitions for 10+ project types:
     - Node.js Basic, Express, CLI
     - Python Basic, FastAPI
     - React TypeScript
     - Electron Basic
     - Hivemind Workspace
     - Monorepo
     - Empty project
   - Template variable substitution ({{projectName}}, etc.)
   - Directory and file creation with proper structure
   - Custom template support (add/remove/import/export)

2. **ui/modules/ipc/scaffolding-handlers.js** (~350 lines)
   - 11 IPC channels for scaffolding operations:
     - scaffolding-get-templates, scaffolding-get-template
     - scaffolding-preview, scaffolding-create
     - scaffolding-select-folder
     - scaffolding-add-custom, scaffolding-remove-custom
     - scaffolding-export-template, scaffolding-import-template
     - scaffolding-get-categories
     - scaffolding-create-from-existing

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Added import and registration for scaffolding-handlers

2. **ui/index.html** (~70 lines added)
   - Scaffold tab button
   - Scaffold tab pane with:
     - Category filter buttons (All, Node.js, Python, Frontend, etc.)
     - Template list with icons and badges
     - Preview panel showing structure
     - Create form (project name, description, location)
     - Import button for custom templates

3. **ui/styles/tabs.css** (~280 lines added)
   - Scaffold category buttons
   - Template list with icons by category
   - Preview panel styling
   - Create form styling
   - Loading overlay

4. **ui/modules/tabs.js** (~280 lines added)
   - setupScaffoldTab() function
   - loadScaffoldTemplates(), renderScaffoldTemplates()
   - selectScaffoldTemplate(), showScaffoldPreview()
   - selectScaffoldFolder(), updateScaffoldCreateButton()
   - createScaffoldProject(), importScaffoldTemplate()
   - getScaffoldState()

5. **ui/renderer.js**
   - Added tabs.setupScaffoldTab() call

**Total Lines Added:** ~1,630 lines

**Status:** COMPLETE

---

### Task #22: Cross-Project Agent Sharing

**Overview:** Share agent configurations between projects with import/export and per-project storage.

**Files Created:**
1. **ui/modules/ipc/agent-sharing-handlers.js**
   - Agent config store in workspace/memory/_agent-configs.json
   - IPC endpoints: list/get/save/apply/export/import/share/delete
   - JSON import/export with optional dialog and apply/merge support

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Registered agent-sharing handlers

2. **ui/modules/ipc/api-docs-handlers.js**
   - Added Agent Sharing IPC documentation

**Runtime Data:**
- **workspace/memory/_agent-configs.json** (created on first save/import)

**Status:** COMPLETE

---

### Task #19: Visual Workflow Builder Enhancement

**Overview:** Enhanced drag-and-drop workflow design with node-based agent orchestration UI.

**Files Created:**
1. **ui/modules/ipc/workflow-handlers.js** (~700 lines)
   - 14 IPC channels for workflow operations:
     - workflow-list, workflow-save, workflow-load, workflow-delete
     - workflow-duplicate, workflow-validate, workflow-generate-plan
     - workflow-export-file, workflow-import-file
     - workflow-get-node-types, workflow-get-templates
     - workflow-apply-template
   - Workflow validation with rules:
     - Disconnected nodes detection
     - Cycle detection (DAG enforcement)
     - Entry point validation
     - Dangling edge detection
   - Topological sort for execution order
   - Execution plan generation
   - 5 built-in workflow templates:
     - Simple Agent, Parallel Agents, Conditional Routing
     - Iteration Loop, Agent Chain
   - 12 node type definitions with config schemas:
     - Control: Trigger, Decision, Loop, Parallel, Merge, Delay
     - Processing: Agent, Tool, Transform
     - I/O: Input, Output
     - Advanced: Subworkflow

**Files Modified:**
1. **ui/modules/ipc/handler-registry.js**
   - Added import and registration for workflow-handlers

2. **ui/modules/tabs.js** (~500 lines added/modified)
   - Enhanced workflowState with zoom, pan, undo/redo, clipboard
   - Extended WORKFLOW_NODE_TYPES (4 → 12 node types)
   - Added WORKFLOW_NODE_CATEGORIES for toolbar grouping
   - New functions:
     - loadWorkflowNodeTypes(), loadWorkflowTemplates()
     - handleWorkflowWheel(), handleWorkflowPanStart/Move/End()
     - zoomWorkflow(), resetWorkflowZoom(), applyWorkflowTransform()
     - handleWorkflowKeyboard() (Delete, Ctrl+Z, Ctrl+Y, Ctrl+C/V/D, Esc)
     - pushWorkflowUndoState(), undoWorkflow(), redoWorkflow()
     - copySelectedWorkflowNode(), pasteWorkflowNode()
     - deleteSelectedWorkflowNode(), duplicateSelectedWorkflowNode()
     - validateWorkflowUI(), generateWorkflowPlan(), showExecutionPlan()
     - saveWorkflowToFile(), showWorkflowLoadDialog()
     - exportWorkflowToFile(), importWorkflowFromFile()
     - showWorkflowTemplates()
     - selectWorkflowEdge() - edge selection/editing
   - Enhanced updateWorkflowEdges() with:
     - Bezier curves instead of straight lines
     - SVG arrow markers for direction
     - Edge labels support
     - Edge click selection
   - Enhanced renderWorkflowInspector() with:
     - Node-specific config fields from IPC
     - Connection info display
     - Action buttons (Delete, Duplicate)
     - Select/textarea/number/checkbox field types
     - showIf conditional field visibility
   - Added 16 new exports

3. **ui/index.html** (~85 lines modified)
   - Reorganized workflow toolbar with node categories:
     - Control Flow: Trigger, Decision, Loop, Parallel, Merge, Delay
     - Processing: Agent, Tool, Transform
     - Input/Output: Input, Output
     - Advanced: Subworkflow
   - Secondary toolbar with:
     - Edit: Connect, Delete, Duplicate
     - Undo/Redo
     - View: Zoom In/Out/Reset, Layout
     - File: Template, Save, Load, Import, Export
     - Actions: Validate, Plan, Clear
   - Enhanced empty state with icon and hints

4. **ui/styles/tabs.css** (~180 lines added)
   - Node type button color indicators
   - Additional node type border colors (input, output, loop, etc.)
   - Inspector section styles
   - Plan step display
   - Improved empty state
   - Validation error/warning highlights
   - Edge hover effects
   - Zoom indicator

**Total Lines Added:** ~1,465 lines

**Features:**
- 12 node types for comprehensive agent orchestration
- Bezier curve edges with directional arrows
- Pan/zoom with mouse wheel and middle-click drag
- Undo/redo with 50-state history
- Copy/paste/duplicate nodes
- Keyboard shortcuts (Del, Ctrl+Z/Y/C/V/D, Esc)
- Workflow validation with error highlighting
- Execution plan generation with topological sort
- 5 workflow templates
- Save/load to file system
- Import/export JSON files
- Node-specific configuration with conditional fields
- Edge selection and editing

**Status:** COMPLETE

---

## Task #15: Automated Deployment Pipeline - COMPLETE
**Owner:** Implementer A
**Completed:** Session 47

### Implementation Summary

Created comprehensive CI/CD integration with build automation, deploy scripts, and pipeline management.

### Files Created

1. **ui/modules/deployment/deployment-manager.js** (~600 lines)
   - Core deployment logic
   - Build state tracking (BuildStatus enum)
   - Pipeline stages (PipelineStage enum)
   - Environment configurations (dev/staging/prod)
   - runPipeline() with stage execution
   - checkDeployReadiness() validation
   - deployToGitHub() deployment
   - Topological sort for stage dependencies
   - Build history management

2. **ui/modules/ipc/deployment-handlers.js** (~400 lines)
   - 18 IPC handlers:
     - deployment-get-config
     - deployment-start-build
     - deployment-cancel-build
     - deployment-check-readiness
     - deployment-deploy-github
     - deployment-get-history
     - deployment-get-build-status
     - deployment-get-environments
     - And more...
   - Build progress events
   - Build completion/failure events

3. **.github/workflows/ci.yml** (~200 lines)
   - Full GitHub Actions CI/CD pipeline
   - Jobs: lint, test, build (matrix: win/mac/linux), security, deploy-staging, deploy-production
   - Environment configurations
   - Manual deployment trigger
   - Artifact management
   - Coverage upload

### Files Modified

1. **ui/modules/tabs.js** (~350 lines added)
   - deployState object
   - setupDeployTab() event handlers
   - loadDeployConfig() configuration loading
   - checkDeployReadiness() validation
   - startDeployBuild() build execution
   - cancelDeployBuild() cancellation
   - handleDeployProgress() progress updates
   - handleDeployComplete() completion handler
   - handleDeployFailed() failure handler
   - renderPipelineStages() stage visualization
   - addDeployOutput() output logging
   - deployToGitHub() GitHub deployment
   - loadDeployHistory() history loading
   - renderDeployHistory() history display
   - formatDuration() time formatting
   - getDeployState() state getter
   - 8 new exports

2. **ui/modules/ipc/handler-registry.js**
   - Added deployment-handlers import
   - Added registerDeploymentHandlers to DEFAULT_HANDLERS

3. **ui/renderer.js**
   - Added tabs.setupDeployTab() call

4. **ui/index.html** (~90 lines added)
   - Deploy tab button
   - Deploy tab content:
     - Status bar with progress
     - Environment selector
     - Readiness checks panel
     - Pipeline stages visualization
     - Build output console
     - Action buttons (Start/Cancel/GitHub)
     - Build history panel

5. **ui/styles/tabs.css** (~280 lines added)
   - Deploy status bar
   - Readiness check styles
   - Pipeline stage visualization
   - Output console styles
   - History panel styles
   - Status colors (pending/running/success/failed)

6. **ui/package.json**
   - Added build scripts:
     - build, build:dev, build:staging, build:prod
     - package, package:win, package:mac, package:linux
     - release, release:draft
     - clean, prebuild, postbuild
     - notify:staging, notify:production

**Total Lines Added:** ~1,920 lines

**Features:**
- Environment-based builds (development/staging/production)
- Readiness checks before deployment
- Pipeline stage visualization with real-time progress
- Build output console with color-coded messages
- Build history tracking
- GitHub Actions CI/CD integration
- Cross-platform builds (Windows/macOS/Linux)
- Security scanning (npm audit, Trivy)
- Automated artifact management
- Manual deployment trigger

**Status:** COMPLETE

---

## Task #16: Agent Skill Marketplace

**Summary:** Added a backend marketplace for agent skills with browse/publish/install/import/export and per-agent assignments.

### Files Modified

1. **ui/modules/agent-skills.js**
   - Built-in skill catalog (architecture, backend, frontend, testing, etc.)
   - Metadata for categories, tags, capabilities, versions

2. **ui/modules/ipc/skill-marketplace-handlers.js**
   - Marketplace IPC endpoints: list/get/publish/install/uninstall/delete
   - Import/export with optional file dialogs
   - Assignment management per agent + install tracking
   - Storage in `workspace/memory/skill-marketplace.json`

3. **ui/modules/ipc/handler-registry.js**
   - Registered skill marketplace handlers

4. **ui/modules/ipc/api-docs-handlers.js**
   - Documented new marketplace IPC endpoints

**Features:**
- Built-in skill library with categories and capabilities
- Marketplace store with publish/install/uninstall/delete
- Import/export for sharing skills across systems
- Agent skill assignments with optional auto-install
- Renderer events for marketplace updates

**Status:** COMPLETE

---

## Task #11: Real-time Collaboration - COMPLETE
**Owner:** Implementer A
**Completed:** Session 47

### Implementation Summary

Created comprehensive real-time collaboration system with multi-user sessions, live sync, and chat.

### Files Created

1. **ui/modules/collaboration/collaboration-manager.js** (~700 lines)
   - Core collaboration logic
   - Session management (create, join, leave)
   - WebSocket server/client for real-time sync
   - User presence tracking
   - Terminal output synchronization
   - Chat messaging system
   - Cursor position sharing
   - Role-based permissions (host/editor/viewer)
   - Auto-reconnection with exponential backoff
   - Invite code generation

2. **ui/modules/ipc/collaboration-handlers.js** (~350 lines)
   - 16 IPC handlers:
     - collab-create-session
     - collab-join-session
     - collab-leave-session
     - collab-get-state
     - collab-get-users
     - collab-send-chat
     - collab-sync-cursor/terminal/settings
     - collab-set-user-role
     - collab-kick-user
     - collab-update-profile
     - collab-get-invite-link
   - Event forwarding to renderer

### Files Modified

1. **ui/modules/tabs.js** (~450 lines added)
   - collabState object
   - setupCollabTab() event handlers
   - loadCollabState() state loading
   - createCollabSession() / joinCollabSession()
   - Chat functions (send, render)
   - User management (render, kick)
   - Cursor rendering
   - Event handlers for all collab events
   - 7 new exports

2. **ui/modules/ipc/handler-registry.js**
   - Added collaboration-handlers import
   - Added registerCollaborationHandlers to DEFAULT_HANDLERS

3. **ui/renderer.js**
   - Added tabs.setupCollabTab() call

4. **ui/index.html** (~120 lines added)
   - Collab tab button
   - Collab tab content:
     - Connection status bar
     - Session create/join forms
     - Active session view
     - Invite section with link/code
     - Users list
     - Chat interface
     - Session settings (host only)
     - User profile settings

5. **ui/styles/tabs.css** (~200 lines added)
   - Collab status bar styles
   - Session controls forms
   - Active session display
   - User list and avatars
   - Chat message styles
   - Remote cursor overlay
   - Animation keyframes

**Total Lines Added:** ~1,820 lines

**Features:**
- Session hosting with WebSocket server
- Session joining with connection management
- Real-time user presence tracking
- Live cursor position sharing
- Terminal output synchronization
- Settings synchronization
- Real-time chat messaging
- Role-based permissions (host/editor/viewer)
- User kick/ban capability (host only)
- Invite link and code generation
- Auto-reconnection with backoff
- User profile customization (name, color)
- Unread chat notification badge
- Connection state indicators

**Status:** COMPLETE

---

## Task #17: Mobile Companion App - COMPLETE
**Owner:** Implementer A
**Completed:** Session 47

### Implementation Summary

Created comprehensive mobile API system with REST endpoints, SSE real-time updates, push notifications, and session management for remote monitoring.

### Files Created

1. **ui/modules/mobile/mobile-api-server.js** (~650 lines)
   - REST API server for mobile app integration
   - API versioning (/api/v1)
   - Agent status monitoring endpoints
   - Remote command execution
   - Push notification registration & preferences
   - Server-Sent Events (SSE) for real-time updates
   - Session management with API keys
   - Rate limiting with configurable limits
   - CORS support for mobile clients
   - Authentication middleware

2. **ui/modules/ipc/mobile-api-handlers.js** (~430 lines)
   - 12 IPC handlers:
     - mobile-api-start
     - mobile-api-stop
     - mobile-api-get-state
     - mobile-api-create-session
     - mobile-api-revoke-session
     - mobile-api-get-sessions
     - mobile-api-get-subscriptions
     - mobile-api-send-notification
     - mobile-api-get-qr-code
     - mobile-api-update-settings
     - mobile-api-reset
     - mobile-api-get-notification-types
   - Event forwarding to renderer
   - QR code generation for quick connect

### Files Modified

1. **ui/modules/tabs.js** (~400 lines added)
   - mobileState object
   - setupMobileTab() event handlers
   - loadMobileState() state loading
   - loadMobileSessions() / loadMobilePushSubscriptions()
   - revokeMobileSession() session management
   - QR code generation
   - UI update functions
   - Event listeners for mobile API events
   - 6 new exports

2. **ui/modules/ipc/handler-registry.js**
   - Added mobile-api-handlers import
   - Added registerMobileApiHandlers to DEFAULT_HANDLERS

3. **ui/index.html** (~110 lines added)
   - Mobile tab button in panel-tabs
   - Full mobile tab content:
     - Server status bar
     - Server controls (start/stop, port)
     - QR code section for quick connect
     - Connection info display
     - Sessions list with revoke
     - Push subscriptions list
     - Notification settings checkboxes
     - Test notification button

4. **ui/styles/tabs.css** (~240 lines added)
   - Mobile status bar styling
   - Mobile section styling
   - Form elements
   - QR code container
   - Sessions list
   - Push subscriptions list
   - Notification settings
   - Animations

5. **ui/renderer.js**
   - Added tabs.setupMobileTab() call

**Total Lines Added:** ~1,830 lines

**Features:**
- REST API server with versioning
- Agent status monitoring
- Remote command execution
- Push notification registration
- SSE for real-time updates
- Session management with API keys
- QR code generation for mobile connection
- Rate limiting
- Notification type preferences
- Connection info display
- Session revocation

**Status:** COMPLETE - SPRINT FINAL TASK

---

## Session 49 Reviews - Jan 30, 2026

### Codex Auto-Restart Feature
**Reviewed by:** Reviewer
**Status:** APPROVED & COMMITTED (3df1c01)
**Files:** ui/modules/recovery-manager.js, ui/main.js
**Review:** workspace/build/reviews/codex-auto-restart-review.md

### Voice Control Feature
**Reviewed by:** Reviewer
**Status:** APPROVED
**Files:** ui/index.html, ui/styles/layout.css, ui/renderer.js
**Review:** workspace/build/reviews/voice-control-review.md

### Codex Queue Starvation Fix
**Reviewed by:** Reviewer
**Status:** APPROVED
**Files:** ui/modules/terminal/injection.js
**Review:** workspace/build/reviews/codex-queue-starvation-fix-review.md

---

## Session 50 Post-Sprint: UI Layer Codebase Audit
**Completed:** 2026-01-30
**Owner:** Frontend

### Findings Summary
| Category | Count | Priority |
|----------|-------|----------|
| CSS Mismatch Bug | 1 | HIGH |
| Stale Role Names | 4 locations | MEDIUM |
| Dead Code | 1 | LOW |
| Open TODOs | 1 | LOW |

### Critical Bug Found
**SDK-Renderer CSS Mismatch:** JavaScript uses new CSS class names (`infra`, `frontend`, `backend`, `analyst`) but CSS file still has old names (`worker-a`, `worker-b`). Missing CSS classes cause SDK mode agent messages to lack accent colors.

### Stale Role Names (tabs.js)
- `MCP_AGENT_NAMES` (lines 673-680) - OLD names: Orchestrator, Implementer A/B, Investigator
- `PANE_NAMES` (lines 3563-3570) - Same old names
- `loadSequenceState()` (line 2126) - Using legacy role identifiers
- `setupDebugTab()` (line 6193) - Using legacy role identifiers

### Dead Code
- `sdk-renderer.js` lines 78-81: Unused SPINNER object (marked "kept for reference")

### Fixes Pending
1. Add missing CSS classes: `.sdk-agent-infra`, `.sdk-agent-frontend`, `.sdk-agent-backend`, `.sdk-agent-analyst`
2. Remove stale CSS: `.sdk-agent-worker-a`, `.sdk-agent-worker-b`
3. Update tabs.js role name constants (4 locations)

**Report sent to Architect via trigger.**

---

## Session 50 Post-Sprint: UX Language & UI Polish Audit
**Completed:** 2026-01-30
**Owner:** Frontend

### Task #7 - UX Language Audit
**Finding:** 14 tab names use cryptic 4-letter abbreviations (Shots, Insp, Hist, Mem, etc.)
**Finding:** 7 jargon terms need plain English alternatives (Friction→Issues, Spawn→Start, etc.)
**Finding:** Some tooltips too technical for new users

### Task #8 - UI Polish (SVG Opportunities)
**Finding:** 5 emoji should be replaced with SVGs (📷🔍🚀⚠️)
**Finding:** 5 pane header buttons use text characters (X, ~, R, L, !) - need SVG icons
**Finding:** 5 status indicators use text/emoji (●, —, ✓, ✕, ⏳) - need SVG consistency

**Status:** AUDIT COMPLETE - Awaiting implementation approval

---

## Sessions 53-69 (Archived from status.md - Session 80)

## Session 69 - Timing Fixes + Spawn Fix (Feb 3, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Gemini Enter delay (500ms final) | Analyst/Architect | ✅ DONE (`20a4548`) |
| Codex context timing fix (5000→8000ms) | Architect | ✅ DONE (`66b8e5f`) |
| Codex spawn ENOENT fix | Architect | ✅ DONE (`83f434f`) |
| Pane header cleanup (remove SDK indicators) | Frontend | ✅ DONE |
| Update injection paths after folder renames | Frontend | ✅ DONE (approved) |

**Gemini Enter Delay (20a4548):**
- Regression: 50ms delay insufficient when Gemini actively working
- Root cause (Analyst): OS can batch text+Enter even with renderer delay
- Final fix: 500ms delay + refresh button \n→\r
- VERIFIED working this session (ping test 5/5)

**Codex Context Timing (66b8e5f):**
- Bug: Codex delay starts at spawn, Architect delay starts after ready-detection
- Old: Codex 5000ms from spawn beat Architect 6-7s total
- Fix: Codex now 8000ms, guaranteed after Architect
- Review: APPROVED HIGH confidence

**Codex Spawn ENOENT Fix (83f434f):**
- Bug: Codex panes fail with `spawn cmd.exe ENOENT`
- Root cause: Electron env may not have ComSpec set
- Fix: Explicit shell path (ComSpec || C:\Windows\System32\cmd.exe)
- Review: APPROVED HIGH confidence

**Pane Header Cleanup:**
- Removed `pane-timer`, `sdk-status`, `sdk-session-id`, `delivery-indicator` from pane headers
- Cleaned related JS handlers and CSS rules (header-only indicators)
**Review:** ✅ Approved by Reviewer (Session 69)

## Session 68 - Gemini Fix + Instruction Audit (Feb 3, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Gemini PTY Enter fix | Architect | ✅ VERIFIED (`beee58b`) |
| Architect context injection delay (pane 1 faster) | Frontend | ✅ DONE (`462342b`, `d843e56`) |
| Instruction file audit + fixes | Architect | ✅ DONE (`b6d66c8`) |
| xterm flow control fix | Architect | ✅ DONE (`df1e38c`) |

**Gemini Enter Fix:**
- Root cause: Gemini CLI `bufferFastReturn()` eats Enter within 30ms
- Fix: 50ms delay between text write and Enter
- Verified: Analyst received and responded to test message

**Instruction File Fixes (12 files):**
- All startup check-ins use WebSocket (`hm-send.js`)
- All agent messaging uses WebSocket (not file triggers)
- Removed hardcoded pane-to-model mappings
- Added "check settings.json" note for model lookups

**xterm Flow Control Fix:**
- Root cause: PTY sends data faster than xterm can render, causing "write data discarded" errors
- Fix: Added write queue with callback-based flow control
- Waits for xterm to finish processing before sending next chunk
- Changes: 5 `terminal.write()` calls → `queueTerminalWrite()`
- Tests: 134/134 terminal + 70/70 injection pass

**Next Session 69:** Restructure to modular ROLE.md + model-notes.md

## Session 66 - Naming Audit & PTY Startup Fix (Feb 2, 2026)

| Task | Owner | Status |
|------|-------|--------|
| PTY startup injection ready-gate | Frontend | ✅ `6334c54` |
| MAP.md accuracy verification | All agents | ✅ `6334c54` |
| gemini-oracle test fix | Architect | ✅ `6334c54` |
| Role constants in config.js | Frontend | ✅ `1da06c5` |
| claudeRunning → agentRunning | Backend | ✅ `caa6727`, `14225d9`, `69cc636` |
| spawnClaude → spawnAgent | Frontend | ⏳ Lower priority |

**Commits:**
- `6334c54` - PTY startup injection fix, MAP.md fixes, gemini-oracle test fix
- `1da06c5` - feat: add centralized role constants to config.js
- `caa6727` - refactor: agentRunning in IPC handlers
- `14225d9` - refactor: agentRunning in core modules
- `69cc636` - refactor: complete agentRunning rename

**Naming Audit Progress:**
- ✅ Centralized ROLE_NAMES, LEGACY_ROLE_ALIASES, ROLE_ID_MAP in config.js
- ✅ claudeRunning → agentRunning COMPLETE (all files + tests + backward compat)
- ⏳ spawnClaude→spawnAgent (lower priority)

---

## Session 65 - SDK Rollout (Feb 2, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Analyst check-in | Analyst | ✅ COMPLETE |
| SDK Mode verification | Analyst | ✅ COMPLETE |
| **SDK dependency fix** | Infra | ✅ COMPLETE |
| Dependency review | Reviewer | ✅ APPROVED (HIGH confidence) |

**SDK Dependency Fix:**
- Root cause: Missing openai-agents, google-genai packages
- Installed: openai-agents 0.7.0, google-genai 1.61.0, tenacity 9.1.2
- All imports verified working

---

## Session 64 - Multi-Model SDK Integration (Feb 2, 2026)

| Task | Owner | Status |
|------|-------|--------|
| SDK documentation research | Architect | ✅ COMPLETE |
| Technical spec | Architect | ✅ `build/multi-model-sdk-spec.md` |
| Spec review | Reviewer | ✅ Issues found |
| sdk-bridge.js multi-model support | Frontend | ✅ APPROVED by Reviewer #4 |
| Python manager: BaseAgent class | Architect | ✅ COMPLETE |
| Python manager: CodexAgent | Architect | ✅ COMPLETE |
| Python manager: GeminiAgent | Architect | ✅ COMPLETE |
| HivemindManager factory method | Architect | ✅ COMPLETE |
| Initial COMMIT | Architect | ✅ `bef0445` PUSHED |
| GeminiAgent tool use implementation | Architect | ✅ COMPLETE |
| CodexAgent MCPServerStdio fix | Architect | ✅ COMPLETE |
| CodexAgent sandbox fix | Architect | ✅ COMPLETE |
| Tenacity retry logic | Architect | ✅ COMPLETE |
| E2E test | Architect | ✅ **PASSED** |
| **COMMIT: SDK V2 Fixes** | Architect | ✅ `3b0aa35` PUSHED |

**Session 64 Fixes (commit `3b0aa35`):**

GeminiAgent:
- Implement `_build_tools()` with 5 tool functions (read_file, write_file, run_bash, glob_files, grep_search)
- Enable Automatic Function Calling (AFC) via GenerateContentConfig
- Update model to gemini-3-flash (matches PTY mode)

CodexAgent:
- Fix MCPServerStdio pattern: use connect()/cleanup() not __aenter__/__aexit__
- Fix sandbox value: "workspace-write" (was invalid "elevated_windows_sandbox")
- Add list_tools() verification on connect

Resilience:
- Add tenacity retry decorator with exponential backoff
- Add requirements.txt with SDK dependencies

**E2E Test Results:**
- ✅ SDK imports successfully
- ✅ All 5 agent classes present
- ✅ GeminiAgent tools execute (read, write, bash, glob, grep)
- ✅ CodexAgent patterns verified
- ✅ Tenacity retry logic present

**sdk-bridge.js Updates (earlier commit `bef0445`):**
- Added `PANE_CONFIG` with role + model per pane (claude/codex/gemini)
- Added `getModelForPane()` helper method
- `sendMessage()` now includes `model` field in IPC payload
- Sessions initialized from PANE_CONFIG, track model type
- `PANE_ROLES` derived from PANE_CONFIG (backward compatible)
- Tests: 2634/2634 passing

---

## Session 63 - Bug Fixes + UX Improvements (Feb 2, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Fix duplicate Gemini context injection | Frontend | ✅ COMMITTED `4456fd5` |
| Fix Codex modelType in context injection | Frontend | ✅ COMMITTED `e6091dd` |
| System friction reduction (3-agent decision) | All | ✅ COMMITTED `2983d63` |
| Pane button SVG overhaul | Frontend | ✅ COMMITTED `8c359a6`, `204e376` |

**Pane Button UX Overhaul:**
- Replaced cryptic letter buttons (C, X, ~, K, R, L) with intuitive SVG icons
- Icons: Plus-circle (claim), Square (stop), Corner-up-left (escape), Rotate-cw (restart), File-text (refresh), Lock/Unlock
- Updated tooltips with friendlier language
- Files: `index.html`, `terminal.js`, `layout.css`, `terminal.test.js`
- Tests: 2634/2634 passing

---

## Session 62 - Gemini Startup Prompt + Modularization (Feb 2, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Gemini startup prompt injection | Frontend | ✅ REVIEWED - approved by Reviewer #2 |
| Gemini keyboard events fix | Frontend | ✅ REVIEWED - approved by Reviewer #2 |
| #3 renderer.js modularization | Frontend | ✅ COMMITTED `931bc4f` |

**Renderer Modularization - COMPLETE:**
- Created: `modules/utils.js` (debounce + shortcutTooltips, 34 lines)
- Created: `modules/command-palette.js` (171 lines)
- Created: `modules/target-dropdown.js` (124 lines)
- Created: `modules/status-strip.js` (196 lines)
- Created: `modules/model-selector.js` (73 lines)
- renderer.js: 2383 → 1774 lines (-609, -26%)
- Tests: 2634/2634 passing
- sdkMode solution: passed as parameter to initModelSelectors()

**Gemini Startup Prompt:**
- Problem: Gemini panes spawn but sit idle (unlike Claude, Gemini CLI needs explicit first message)
- Fix: Added startup prompt injection at 10000ms in `spawnClaude()` Gemini path
- Prompt: "Read GEMINI.md and check in as {role}. Start by reading workspace/app-status.json and workspace/current_state.md, then message Architect via trigger file."
- Timeline: Identity (6s) → Context (8s) → Startup prompt (10s)
- Applies to: Fresh spawns + model switches (via restartPane → spawnClaude)
- File: `ui/modules/terminal.js` lines 980-991
- Tests: 2634/2634 passing

---

## Session 60 - Tech Debt Quick Wins (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Finding #7: Queue logic disambiguation | Frontend | ✅ `415a363` |
| Finding #12: Test coverage (triggers.js) | Analyst | ✅ `e62c32b` |
| Finding #13: Test coverage (model-switch-handlers.js) | Backend | ✅ `079203a` |
| Finding #4: main.js modular refactor | Backend | ✅ COMPLETE |
| Finding #5: daemon-handlers headless refactor | Backend | ✅ COMPLETE |
| Finding #14: Context injection IPC infrastructure | Backend | ✅ COMPLETE |
| Finding #14: Context injection in spawnClaude | Frontend | ✅ APPROVED - ready for commit |
| Priority 2: Test coverage (daemon-handlers, watcher) | Analyst | ✅ `0cd906c` |
| Model Switch: per-pane dropdown | Frontend | ✅ `89afc50` |
| Model Switch: dropdown/spawn bug fixes | Frontend | ✅ `742c8db` |
| Model Switch: Gemini default to gemini-3-flash | Frontend | ✅ `cdf135c` |
| Model Switch: simplified Gemini spawn (--yolo) | Frontend | ✅ `c67ae03` |
| Model Switch: context injection on switch | Frontend | ✅ `aab538e` |
| **Model Switch: Full bug fix (3 root causes)** | Frontend | ✅ `817b209` |
| **Model Switch: Broadcast notification** | Frontend | ✅ `817b209` |

**Model Switch Full Bug Fix (3 Root Causes):**
- Bug: Switching model spawned OLD model (e.g. Gemini→Claude spawned Gemini)
- Root causes identified by Analyst #5 + Reviewer #2:
  1. Race condition - Recovery manager auto-restarts before settings update
     - Fix: `markExpectedExit(paneId, 'model-switch')` before kill
  2. PTY not recreated - Kill destroys PTY but spawnClaude tried to write to deleted PTY
     - Fix: Renderer calls `restartPane(paneId, model)` instead of `spawnClaude()`
     - recovery.js updated: `restartPane(paneId, model = null)` passes model to spawnClaude
  3. Wrong event listener - Waited for 'exit' but daemon sends 'killed'
     - Fix: Listen for 'killed' event with correct handler signature
- Files: model-switch-handlers.js, recovery.js, renderer.js
- Tests: 17/17 model-switch + 54/54 recovery passing

**Model Switch Broadcast Notification:**
- Broadcasts "(SYSTEM): [Role] switched to [Model]" to all.txt trigger file
- Notifies all agents when a pane changes model
- File: `ui/modules/ipc/model-switch-handlers.js`

**Queue logic disambiguation (Finding #7 Option B):**
- Renamed `messageQueues` → `throttleQueues` in daemon-handlers.js
- Renamed `processingPanes` → `throttlingPanes` in daemon-handlers.js
- Renamed `queueMessage()` → `enqueueForThrottle()` in daemon-handlers.js
- Renamed `processQueue()` → `processThrottleQueue()` in daemon-handlers.js
- Renamed `processQueue()` → `processIdleQueue()` in injection.js
- Added docstrings explaining two-queue architecture
- Updated injection.test.js to match new names
- All 2674 tests pass

---

## Session 59 - Tech Debt + Race Condition Fix (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Finding #9: Notification consolidation | Frontend | ✅ `5f64952` |
| Finding #10: formatDuration consolidation | Frontend | ✅ `2fa58bc` |
| Trigger file race condition fix | Frontend | ✅ `55025df` |
| parseMessageSequence test fixes | Analyst | ✅ (included in `55025df`) |

**Notification consolidation (Finding #9):**
- Created `ui/modules/notifications.js` - unified notification system
- Consolidated `showStatusNotice()` from renderer.js and `showToast()` from daemon-handlers.js
- New unified API: `showNotification(message, { type, location, timeout })`
- Legacy APIs preserved for backward compatibility
- Added 17 new tests in `ui/__tests__/notifications.test.js`
- All 2794 tests pass

---

## Session 58 - Message Timing Fix (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Increase DELIVERY_ACK_TIMEOUT_MS to 65s | Backend | ✅ `ab360d1` |
| Finding #8: Consolidate timing constants | Frontend | ✅ `0a38a53` |

**Constants consolidation (Finding #8):**
- Moved 25+ timing/debounce constants to `ui/modules/constants.js`
- Updated `renderer.js`, `watcher.js`, `terminal.js` to import from constants.js
- Resolved naming conflict: IDLE_THRESHOLD_MS → UI_IDLE_THRESHOLD_MS (30s) vs INJECTION_IDLE_THRESHOLD_MS (2s)
- All 2777 tests pass

**Pending:** Runtime verification after restart

---

## Session 57 - Backlog Fixes (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| restartPane spawn failure handling | Backend | Complete |
| Oracle delete-screenshot path traversal guard | Backend | Complete |
| Oracle rate limit retry (429 backoff) | Backend | Complete |
| Screenshot handler tests (invalid filename) | Backend | Complete |
| Oracle module unit tests | Backend | Complete |
| Watcher friction-resolution ordering fix | Backend | Complete |
| Watcher test update (friction-resolution) | Backend | Complete |
| Message timing investigation (Task #5) | Backend | Complete |
| CI workflow (concurrency + job deps) | Infra | Complete |
| **Gemini respawn fix** | Architect | ✅ `5279b1c` |
| **Message injection race condition fix** | Frontend | ✅ `176cbb5` |

**Gemini respawn bug (Session 57):**
- Bug: Respawn button failed for pane 5 (Gemini) - command not sent
- Root cause: After `pty.kill()`, PTY was only recreated for Codex panes
- Fix: recovery.js now recreates PTY for ALL panes after kill
- File: `ui/modules/terminal/recovery.js` lines 231-241

**Message injection race condition (Session 57):**
- Bug: Analyst messages not reaching Architect (intermittent)
- Root cause #1: daemon-handlers.js `processingPanes.delete()` called immediately after sendToPane(), not in onComplete
- Root cause #2: sendTrustedEnter IPC round-trip creates race window where focus can change
- Fix: Moved queue lock release into onComplete callback, added focus verification logging
- Files: `ui/modules/daemon-handlers.js`, `ui/modules/terminal/injection.js`

---

## Session 56 - Debug Logging Fixes (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Verify Task-Pool Status Expansion | Analyst | ✅ Verified |
| Investigate IdleDetection logging | Analyst | ✅ Found issue |
| Fix IdleDetection log (line 437) | Frontend | ✅ Fixed (log.debug → log.info) |
| Fix StatusStrip log (line 582) | Frontend | ✅ Fixed (log.debug → log.info) |
| Review fixes | Reviewer | ✅ Approved |
| Challenge-response on IPC bridge | Team | ✅ Simpler solution adopted |
| Verify logs working post-restart | Frontend | ✅ Verified (IdleDetection + StatusStrip in app.log) |
| Remove debug logging (cleanup) | Frontend | ✅ Complete (lines 437, 582 removed) |

**Root cause:** `log.debug()` writes to app.log but filtered by `minLevel=info`.
**Fix:** Changed to `log.info('Tag', ...)` - visible in app.log, agents can grep.

**Challenge-response:** Reviewer challenged IPC bridge proposal. Team agreed `log.info()` is simpler. Agents read app.log directly. IPC bridge backlogged.

**Post-verification cleanup:** Removed high-frequency log.info() calls after verifying they worked.

---

## Session 55 - Gemini Integration Phase 1 (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Test Gemini CLI on Windows | Infra | ✅ Complete (v0.26.0, 2.5-pro works) |
| Create GEMINI.md for Analyst | Architect | ✅ Complete |
| Update main.js paneCommands | Infra | ✅ Complete (line 99) |
| Update CLAUDE.md roles table | Architect | ✅ Complete |
| Update docs/instance-mapping.md | Architect | ✅ Complete |
| Update README.md | Architect | ✅ Complete |
| Fix agent communication gap | Architect | ✅ Fixed (Infra + Backend AGENTS.md) |
| Reviewer approval | Reviewer | ✅ Approved |
| **Runtime test** | All | ✅ Verified (Analyst checked in) |
| **DEFAULT_SETTINGS fix** | Architect | ✅ `f087eb1` |

**Committed:** Gemini with `-y` flag is now the default for pane 5. New installs work out of the box.

---

## Session 55 - Oracle Visual QA Phase 2 (Feb 1, 2026)

| Task | Owner | Status |
|------|-------|--------|
| gemini-oracle.js module | Backend | ✅ Complete |
| oracle:analyzeScreenshot IPC handler | Backend | ✅ Complete |
| Oracle UI tab | Frontend | ⏳ Pending |

---

## Session 54 - Task Pool Watcher + Stuck Detection (Jan 31, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Task-pool file watcher hookup | Backend | ✅ `83a259e` |
| Stuck Claude detection (0 tokens + timer) | Backend | ✅ `61df70e` |
| Constants consolidation (BYPASS_CLEAR_DELAY_MS) | Backend | ✅ `5da9189` |
| Task pool dead code cleanup | Backend | ✅ `5da9189` |
| Task-pool status expansion (in_progress/completed/failed/needs_input) | Backend | ✅ Committed `4f7629a` |
| UI button debounce | Frontend | ✅ Committed `134d231` |
| Codex output styling (thinking vs decision) | Frontend | ✅ Committed `dd10276` |
| Status strip UI (30px task counts) | Frontend | ✅ Committed `adae291` |
| PTY stuck detection workaround (disabled) | Architect | ✅ Committed `ef3970f` |
| PTY stuck detection proper fix | Backend | ✅ Committed `4fa7ec4` |

---

## Session 53 - Smart Parallelism Sprint (Jan 31, 2026)

| Task | Owner | Status |
|------|-------|--------|
| Smart parallelism design | Architect | ✅ `8fb1469` |
| Smart parallelism UI (Phase 3) | Frontend | ✅ `b3888c3` |
| PTY Enter timing fix | Backend | ✅ `5ae0c41` |

**Smart Parallelism UI deliverables:**
- Idle detection indicator (shows when agent idle 30s + claimable tasks)
- "Claim available task" button
- Task pool IPC handlers (get-task-list, claim-task)

**PTY Enter timing fix:**
- Extended _hivemindBypass clear from 0ms to 75ms
- Focus restoration via requestAnimationFrame

---

---

## Known Bugs (Session 54)

### PTY Stuck Detection Misfiring (FIXED ✅)
- **Symptoms:** Claude panes (1, 3, 6) got ESC'd mid-thought, interrupting reasoning
- **Root Cause:** `recovery-manager.js` interpreted "0 tokens for 15s" as stuck
- **Reality:** 0 tokens + timer advancing = Claude is THINKING (normal behavior)
- **Fix (`4fa7ec4`):** Now triggers on timer STALLED (not changing), not on thinking
- **Detection re-enabled:** `ptyStuckDetection: true` in main.js
- **Verification needed:** Claude should be able to think >15s without interruption

---

## Session 54 Process Discoveries

**New protocols added to CLAUDE.md:**
- Assignment Declaration - Architect declares STRATEGIC/CODE REVIEW/IMPLEMENTATION
- Disagreement Protocol - Rules for productive conflict
- Direction Gate - Verify user intent before building
- Human in the Loop - User is ultimate quality gate

**Why documented:** 3-agent strategic check (Architect + Analyst + Reviewer) validated role clarity and surfaced these gaps.

---

## Pending Runtime Verifications

### Sessions 52-54 - All Verified ✅

| Item | Session | Status |
|------|---------|--------|
| Copy/Paste UX | 52 | ✅ Verified |
| Codex Resume Context | 52 | ✅ Verified |
| Codex Auto-Restart | 52 | ✅ Verified |
| Smart Parallelism UI | 53 | ✅ Verified (Session 57 - Analyst) |
| PTY Enter Timing | 53 | ✅ Verified (Session 57 - Analyst) |
| Status Strip UI | 54 | ✅ Verified (Session 57 - Analyst) |
| PTY Stuck Detection Fix | 54 | ✅ Verified (Session 57 - Analyst) |
| Task-Pool Status Expansion | 54 | ✅ Verified (Session 57 - Analyst) |


## Session 66 - Feb 2, 2026

### SDK Mode Parallelism Fix ✅

**Task:** Fix SDK mode sequential execution - agents should work in parallel, not one at a time
**Owner:** Architect
**Status:** IMPLEMENTED - Ready for review

**Changes:**
- `hivemind-sdk-v2.py:1315-1370` - Command loop now spawns asyncio tasks instead of awaiting
- Agents run concurrently, not sequentially
- True parallelism like PTY mode

**Review Required:** Reviewer to verify code quality before testing


**Commit:** `ad2989a` - feat: SDK mode parallel execution
**Status:** ✅ COMMITTED + PUSHED

**Testing Required:**
1. Restart app in SDK mode
2. Send messages to multiple agents simultaneously
3. Verify all agents show "thinking" at the same time (not sequential)
4. Check npm console for proper error handling if any agent fails

### PTY Startup Injection Ready-Gate ✅

**Task:** Replace fixed startup timers with PTY-ready detection for identity/context injection  
**Owner:** Frontend  
**Status:** IMPLEMENTED - Ready for review + runtime verification  

**Changes:**
- `ui/modules/terminal.js` - Watch PTY output for ready prompt before injecting identity/context
- `ui/modules/constants.js` - Added startup readiness timing constants

**Behavior:**
- Detect ready via prompt pattern (`>`) or "How can I help" text
- Fallback inject after 30s if pattern never seen (edge case)
- Prevents injection during Claude Code subscription prompt

**Follow-up Fix (Reviewer #2):**
- Added ready-gate hook to initTerminal pty.onData (was only in reattach)
- Clear startup state on initTerminal exit
- Tests: `npm test -- terminal.test.js` (PASS, 134/134; Jest open-handles warning)

### Role Constants Centralized ✅

**Task:** Add canonical role constants in config.js  
**Owner:** Frontend  
**Status:** IMPLEMENTED - Ready for review  

**Changes:**
- `ui/config.js`: added ROLE_NAMES, LEGACY_ROLE_ALIASES, ROLE_ID_MAP exports
