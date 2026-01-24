# V9 Checkpoint: Documentation & Polish

**Date:** Jan 24, 2026
**Phase:** V9 - Documentation & Polish

---

## Worker B Tasks - DONE

### DC3: API Documentation Generator ✅

**File:** `ui/modules/ipc-handlers.js`
**Output:** `workspace/api-docs.md`

**Features:**
- Comprehensive IPC handler metadata (60+ handlers documented)
- Categorized documentation (PTY, Projects, Settings, etc.)
- Auto-generated markdown with Table of Contents
- Handler search capability
- Per-handler documentation lookup

**IPC Handlers:**
- `generate-api-docs` - Generate full markdown documentation
- `get-api-docs` - Get generated docs content
- `get-handler-doc` - Get doc for single handler
- `list-api-handlers` - List all handlers with summaries
- `search-api-docs` - Search handlers by keyword

**Documentation Categories:**
- PTY/Terminal (7 handlers)
- Shared Context (3 handlers)
- State (4 handlers)
- Settings (3 handlers)
- Projects (4 handlers)
- Multi-Project (4 handlers)
- Templates (4 handlers)
- Agent Management (5 handlers)
- Smart Routing (3 handlers)
- Conflict Resolution (4 handlers)
- Learning (5 handlers)
- Observability (4 handlers)
- Quality (3 handlers)
- Rollback (5 handlers)
- Testing (4 handlers)
- CI (4 handlers)
- Usage (3 handlers)
- Performance (4 handlers)
- Screenshots (2 handlers)
- Processes (3 handlers)

### PL3: Performance Audit ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/perf-profile.json`

**Features:**
- Real-time handler call profiling
- Tracks: calls, totalMs, avgMs, minMs, maxMs per handler
- Slow call detection (configurable threshold, default 100ms)
- Slow call history (last 50)
- Summary statistics (total calls, avg time, slowest handlers)
- Enable/disable profiling
- Auto-save every 60 seconds
- Benchmarking capability

**IPC Handlers:**
- `get-perf-profile` - Get full profile with summary
- `set-perf-enabled` - Enable/disable profiling
- `set-slow-threshold` - Set slow call threshold
- `reset-perf-profile` - Clear all profiling data
- `save-perf-profile` - Force save to disk
- `get-slow-handlers` - Get slowest handlers ranked
- `get-handler-perf` - Get perf for single handler
- `benchmark-handler` - Run benchmark on a handler

**Profiling Data Model:**
```javascript
{
  handlers: {
    'get-state': {
      calls: 150,
      totalMs: 450,
      avgMs: 3,
      maxMs: 15,
      minMs: 1
    },
    // ... per handler
  },
  slowCalls: [
    { handler: 'run-tests', duration: 2500, timestamp: '...' },
    // ... last 50 slow calls
  ],
  slowThreshold: 100,
  enabled: true
}
```

---

## Worker A Tasks - DONE

### DC2: In-App Help Tooltips ✅

**File:** `ui/index.html`

**Tooltips Added To:**
- Header buttons (9): Select Project, Sync Context, Spawn All, Kill All, Nudge All, Fresh Start, Friction, Settings, Panel
- Settings toggles (11): All general settings, permissions, cost alerts with descriptive tooltips
- Friction panel buttons (2): Refresh, Clear Resolved
- State bar elements (3): Project, State, Progress indicators
- Broadcast bar (2): Input field, Broadcast button
- Panel tabs (9): Screenshots, Tests, Activity, History, Projects, Perf, Templates, Progress, Processes
- Tab action buttons (15+): All Refresh, Clear, Export, Save, Start buttons
- Activity filters (4): All, Errors, Files, State
- Form inputs (4): Search, template name, process command, cost threshold

**Total:** 50+ interactive elements with helpful tooltips

### PL2: UI Consistency Pass ✅

**File:** `ui/index.html`

**Improvements:**
- Added consistent focus states (outline) for accessibility
- Added consistent disabled button styling
- Ensured all interactive elements have transitions
- Added secondary button style class
- Added keyboard shortcut hint style (.kbd)
- Standardized empty state styling across all tabs
- Consistent tab pane padding (16px)
- Consistent action bar styling (margin, border, gap)
- Consistent title/description typography

**CSS Classes Added:**
- `.btn:focus` - Accessibility focus state
- `.btn:disabled` - Disabled button styling
- `.btn-secondary` - Secondary button variant
- `.kbd` - Keyboard shortcut hint styling
- Standardized empty state styling

---

## V9 API Reference

```javascript
// API Documentation (DC3)
const { path, handlerCount } = await window.hivemind.invoke('generate-api-docs');
const { content } = await window.hivemind.invoke('get-api-docs');
const doc = await window.hivemind.invoke('get-handler-doc', 'get-state');
const { handlers } = await window.hivemind.invoke('list-api-handlers');
const { matches } = await window.hivemind.invoke('search-api-docs', 'project');

// Performance Audit (PL3)
const { handlers, slowCalls, summary } = await window.hivemind.invoke('get-perf-profile');
await window.hivemind.invoke('set-perf-enabled', true);
await window.hivemind.invoke('set-slow-threshold', 200);
const { handlers: slow } = await window.hivemind.invoke('get-slow-handlers', 10);
const { stats } = await window.hivemind.invoke('get-handler-perf', 'run-tests');
const result = await window.hivemind.invoke('benchmark-handler', 'get-state', 10);
```

---

## V9 Status

| Task | Owner | Status |
|------|-------|--------|
| DC1 | Lead | PENDING |
| DC2 | Worker A | ✅ DONE |
| DC3 | Worker B | ✅ DONE |
| PL1 | Lead | PENDING |
| PL2 | Worker A | ✅ DONE |
| PL3 | Worker B | ✅ DONE |
| R1 | Reviewer | PENDING |

---

# V8 Checkpoint: Testing & Automation

**Date:** Jan 24, 2026
**Phase:** V8 - Testing & Automation

---

## Worker B Tasks - DONE

### TE2: Test Execution Daemon ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/test-results.json`

**Framework Detection:**
- Jest (via package.json)
- npm test (fallback)
- Extensible framework config

**Features:**
- Auto-detect test framework
- Run tests with timeout (2 min)
- Parse JSON output (Jest)
- Track active test runs
- Emit `test-run-started` / `test-run-complete` events

**IPC Handlers:**
- `detect-test-framework` - Detect available frameworks
- `run-tests` - Execute tests
- `get-test-results` - Get last results
- `get-test-status` - Check if tests running

### CI1: Pre-Commit Validation Hooks ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/ci-status.json`

**Pre-commit Checks:**
1. Run tests (fail if any fail)
2. Validate staged files (confidence check)
3. Check for incomplete markers (TODO/FIXME)

**Features:**
- Enable/disable CI checks
- Block commits on failure
- Stale check detection (> 5 min)
- Emit `ci-check-complete` event

**IPC Handlers:**
- `run-pre-commit-checks` - Run all checks
- `get-ci-status` - Get last check result
- `set-ci-enabled` - Toggle CI
- `should-block-commit` - Check if commit should be blocked

---

## V8 API Reference

```javascript
// Test Execution (TE2)
const { frameworks } = await window.hivemind.invoke('detect-test-framework', projectPath);
const { results } = await window.hivemind.invoke('run-tests', projectPath, 'jest');
const { results } = await window.hivemind.invoke('get-test-results');
const { running } = await window.hivemind.invoke('get-test-status');

// CI Hooks (CI1)
const { passed, checks } = await window.hivemind.invoke('run-pre-commit-checks', projectPath);
const { status } = await window.hivemind.invoke('get-ci-status');
await window.hivemind.invoke('set-ci-enabled', true);
const { block, reason } = await window.hivemind.invoke('should-block-commit');
```

---

## Worker A Tasks - DONE

### TR1: Test Results UI Panel ✅

**Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/renderer.js`

**Features:**
- New "Tests" tab in right panel
- Test summary cards (passed/failed/skipped counts)
- Color-coded progress bar
- Test status badge (idle, running, passed, failed)
- Scrollable test results list with expandable error details
- Run Tests, Refresh, Clear buttons
- Listens for `test-started`, `test-result`, `test-complete` events

**Functions:**
- `renderTestSummary()` - Update summary counts and progress bar
- `renderTestResults()` - Render test list with status colors
- `addTestResult(result)` - Add single test result
- `setTestResults(results, summary)` - Set all test results
- `runTests()` - Trigger test execution
- `loadTestResults()` - Load from backend
- `clearTestResults()` - Clear all results
- `setupTestsTab()` - Wire up UI and IPC listeners

### CI2: CI Status Indicator ✅

**Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/renderer.js`

**Features:**
- Header indicator next to dry-run indicator
- Shows status: passing (green ✓), failing (red ✗), running (yellow spinner)
- Pulsing animation when failing
- Auto-hides when idle or after 10s when passing
- Listens for `ci-status-changed`, `ci-validation-started/passed/failed` events

**Functions:**
- `updateCIStatus(status, details)` - Update indicator display
- `setupCIStatusIndicator()` - Wire up IPC listeners

---

## V8 API Reference (UI)

```javascript
// Test Results (TR1) - IPC events listened
ipcRenderer.on('test-started', () => { ... });
ipcRenderer.on('test-result', (event, result) => { ... });
ipcRenderer.on('test-complete', (event, data) => { ... });

// CI Status (CI2) - IPC events listened
ipcRenderer.on('ci-status-changed', (event, data) => { ... });
ipcRenderer.on('ci-validation-started', () => { ... });
ipcRenderer.on('ci-validation-passed', () => { ... });
ipcRenderer.on('ci-validation-failed', (event, data) => { ... });
```

---

## V8 Status

| Task | Owner | Status |
|------|-------|--------|
| TE1 | Lead | PENDING |
| TE2 | Worker B | ✅ DONE |
| TR1 | Worker A | ✅ DONE |
| TR2 | Lead | PENDING |
| CI1 | Worker B | ✅ DONE |
| CI2 | Worker A | ✅ DONE |
| R1 | Reviewer | PENDING |

---

# V7 Checkpoint: Quality & Observability

**Date:** Jan 24, 2026
**Phase:** V7 - Quality & Observability

---

## Worker A Tasks - DONE

### OB2: Activity Log UI Panel ✅

**Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/renderer.js`

**Features:**
- New "Activity" tab in right panel
- Real-time scrolling log of agent activity
- Filter buttons: All, Errors, Files, State
- Search box for text filtering
- Clear and Export buttons
- Listens for `activity-entry` IPC events

**Functions:**
- `addActivityEntry(entry)` - Add entry to log
- `renderActivityLog()` - Render with filters applied
- `loadActivityLog()` - Load from backend
- `clearActivityLog()` / `exportActivityLog()`
- `setupActivityTab()` - Wire up UI

### RB2: Rollback Confirmation UI ✅

**Files:** `ui/index.html`, `ui/modules/daemon-handlers.js`, `ui/renderer.js`

**Features:**
- Floating indicator when rollback available
- Shows list of files to revert (max 5 + count)
- Confirm/Dismiss buttons
- Pulsing animation to draw attention
- Listens for `rollback-available` / `rollback-cleared` events

**Functions:**
- `showRollbackUI(data)` - Display rollback indicator
- `hideRollbackUI()` - Remove indicator
- `setupRollbackListener()` - Wire up IPC listeners

---

## Worker B Tasks - DONE

### QV1: Output Validation Hooks ✅

**File:** `ui/modules/ipc-handlers.js`

**Validation Features:**
- Incomplete work detection (TODO, FIXME, placeholder, etc.)
- Completion indicator detection (✅, DONE, COMPLETE)
- JavaScript syntax validation
- JSON validation
- Confidence scoring (0-100%)

**IPC Handlers:**
- `validate-output` - Validate text with options
- `validate-file` - Validate file with auto-detected options
- `get-validation-patterns` - Get pattern lists

**Confidence Algorithm:**
- Base score: 50
- Incomplete patterns: -15 each
- Completion indicators: +10 each
- Short text (<50 chars): -20
- Long text (>500 chars): +10

### RB1: Checkpoint Rollback Support ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/rollbacks/cp-{timestamp}/`

**Features:**
- Create file snapshots before changes
- Max 10 checkpoints (auto-cleanup)
- Diff view between checkpoint and current
- One-click restore

**IPC Handlers:**
- `create-checkpoint` - Backup files with label
- `list-checkpoints` - Get all checkpoints
- `get-checkpoint-diff` - Compare checkpoint vs current
- `rollback-checkpoint` - Restore files from checkpoint
- `delete-checkpoint` - Remove checkpoint

**Events:**
- `rollback-complete` - Emitted after restore

---

## V7 API Reference

```javascript
// Validation (QV1)
const { valid, confidence, issues } = await window.hivemind.invoke('validate-output', text, { checkSyntax: true });
const result = await window.hivemind.invoke('validate-file', '/path/file.js');

// Rollback (RB1)
await window.hivemind.invoke('create-checkpoint', ['/path/file1.js', '/path/file2.js'], 'Before refactor');
const { checkpoints } = await window.hivemind.invoke('list-checkpoints');
const { diffs } = await window.hivemind.invoke('get-checkpoint-diff', 'cp-123');
await window.hivemind.invoke('rollback-checkpoint', 'cp-123');
```

---

## V7 Status

| Task | Owner | Status |
|------|-------|--------|
| OB1 | Lead | PENDING |
| OB2 | Worker A | PENDING |
| QV1 | Worker B | ✅ DONE |
| QV2 | Lead | PENDING |
| RB1 | Worker B | ✅ DONE |
| RB2 | Worker A | PENDING |
| R1 | Reviewer | PENDING |

---

# V6 Checkpoint: Smart Automation

**Date:** Jan 24, 2026
**Phase:** V6 - Smart Automation

---

## Worker A Tasks - DONE

### AH2: Handoff Notification UI ✅

**Files:** `ui/index.html`, `ui/modules/daemon-handlers.js`, `ui/renderer.js`

**Features:**
- Slide-in notification when task handoff occurs
- Shows from-agent → to-agent with reason
- Auto-dismiss after 5 seconds
- Listens for `task-handoff` and `auto-handoff` IPC events

**Functions:**
- `showHandoffNotification(data)` - Display handoff notification
- `setupHandoffListener()` - Wire up IPC listeners

### CR2: Conflict Resolution UI ✅

**Files:** `ui/index.html`, `ui/modules/daemon-handlers.js`, `ui/renderer.js`

**Features:**
- Left-side notification for file conflicts
- Shows conflicting file path and involved agents
- Status display: pending, queued, resolved
- Auto-dismiss (5s for resolved, 10s for pending)
- Listens for `file-conflict`, `conflict-resolved`, `conflict-queued` events

**Functions:**
- `showConflictNotification(data)` - Display conflict notification
- `setupConflictResolutionListener()` - Wire up IPC listeners

---

## Worker B Tasks - DONE

### CR1: Conflict Queue System ✅

**File:** `ui/modules/watcher.js`

**Data Structures:**
- `conflictQueue` - Map of file -> pending operations
- `activeFileLocks` - Map of file -> lock holder paneId

**Functions:**
- `requestFileAccess(filePath, paneId, operation)` - Request lock, queue if busy
- `releaseFileAccess(filePath, paneId)` - Release lock, grant to next in queue
- `getConflictQueueStatus()` - Get all locks and queues
- `clearAllLocks()` - Force release all (for Fresh Start)

**IPC Handlers:**
- `request-file-access`, `release-file-access`, `get-conflict-queue-status`, `clear-all-locks`

**Events emitted:**
- `conflict-queued` - When operation is queued
- `conflict-resolved` - When lock granted to queued agent
- `conflicts-cleared` - When all locks cleared

### LM1: Learning Data Persistence ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/learning.json`

**Data Model:**
```javascript
{
  taskTypes: {
    'code-review': {
      agentStats: {
        '1': { success: 5, failure: 1, totalTime: 30000, attempts: 6 }
      },
      totalAttempts: 10
    }
  },
  routingWeights: { '1': 0.9, '2': 0.75, '3': 0.85, '4': 0.8 },
  totalDecisions: 50,
  lastUpdated: timestamp
}
```

**IPC Handlers:**
- `record-task-outcome` - Record success/failure, update weights
- `get-learning-data` - Get all data with insights
- `get-best-agent-for-task` - Get recommended agent for task type
- `reset-learning` - Clear all learning data
- `get-routing-weights` - Get current weights

**Weight Algorithm:**
- Weights range from 0.5 to 1.0
- `weight = 0.5 + (successRate * 0.5)`
- Min 2 attempts before agent is recommended

---

## V6 API Reference

```javascript
// Conflict Queue (CR1)
await window.hivemind.invoke('request-file-access', '/path/file.js', '1', 'write');
await window.hivemind.invoke('release-file-access', '/path/file.js', '1');
const { locks, queues } = await window.hivemind.invoke('get-conflict-queue-status');

// Learning (LM1)
await window.hivemind.invoke('record-task-outcome', 'code-review', '1', true, 5000);
const { insights, routingWeights } = await window.hivemind.invoke('get-learning-data');
const { bestAgent } = await window.hivemind.invoke('get-best-agent-for-task', 'code-review');
```

---

## V6 Status

| Task | Owner | Status |
|------|-------|--------|
| SR1 | Lead | ✅ |
| SR2 | Lead | ✅ |
| AH1 | Lead | ✅ |
| AH2 | Worker A | ✅ |
| CR1 | Worker B | ✅ |
| CR2 | Worker A | ✅ |
| LM1 | Worker B | ✅ |
| R1 | Reviewer | PENDING |

---

# V5 Checkpoint: Multi-Project & Performance

**Date:** Jan 24, 2026
**Phase:** V5 - Multi-Project & Performance

---

## Worker B Tasks - DONE

### MP1: Per-Pane Project Assignment ✅

**Files:** `ui/main.js`, `ui/modules/ipc-handlers.js`

**Settings:**
- `paneProjects: { '1': null, '2': null, '3': null, '4': null }`

**IPC Handlers:**
- `set-pane-project` - Assign project to pane
- `get-pane-project` - Get pane's project
- `get-all-pane-projects` - Get all assignments
- `clear-pane-projects` - Reset all

### PT1: Performance Tracking ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/performance.json`

**Data Model:**
```javascript
{
  agents: {
    '1': { completions: 0, errors: 0, totalResponseTime: 0, responseCount: 0 },
    // ... per pane
  },
  lastUpdated: timestamp
}
```

**IPC Handlers:**
- `record-completion` - Increment completion count
- `record-error` - Increment error count
- `record-response-time` - Track response time
- `get-performance` - Get all stats with averages
- `reset-performance` - Clear all stats

### TM1: Template Save/Load ✅

**File:** `ui/modules/ipc-handlers.js`
**Storage:** `workspace/templates.json`

**Template Structure:**
```javascript
{
  id, name, description,
  config: { /* settings */ },
  paneProjects: { /* per-pane projects */ },
  createdAt, updatedAt
}
```

**IPC Handlers:**
- `save-template` - Save/update template (max 20)
- `load-template` - Apply template settings
- `list-templates` - Get all templates
- `get-template` - Get single template
- `delete-template` - Remove template

---

## API Reference (V5)

```javascript
// Multi-Project
await window.hivemind.invoke('set-pane-project', '1', '/path/to/project');
await window.hivemind.invoke('get-pane-project', '1');
await window.hivemind.invoke('get-all-pane-projects');

// Performance
await window.hivemind.invoke('record-completion', '1');
await window.hivemind.invoke('record-response-time', '1', 1500);
const { agents } = await window.hivemind.invoke('get-performance');

// Templates
await window.hivemind.invoke('save-template', { name: 'Dev Setup', config: {...} });
await window.hivemind.invoke('load-template', 'tmpl-123');
const { templates } = await window.hivemind.invoke('list-templates');
```

---

## Worker A Tasks - DONE

### MP2: Project Indicator in Pane Header ✅

**Files:** `ui/index.html`, `ui/modules/daemon-handlers.js`, `ui/renderer.js`

**UI Elements:**
- `.pane-project` indicator next to agent name in each pane header
- Click to select different project for that pane
- Shows truncated project name with full path on hover

**Functions:**
- `updatePaneProject(paneId, path)` - Update indicator
- `loadPaneProjects()` - Load on startup
- `setupPaneProjectClicks()` - Handle click to change project

### PT2: Performance Dashboard UI ✅

**Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/renderer.js`

**New Tab:** "Perf" in right panel

**UI Elements:**
- 2x2 grid of performance cards (one per agent)
- Shows: Completions, Avg Time, Success Rate
- Refresh and Reset buttons

**Functions:**
- `renderPerformanceData()` - Render stats from backend
- `loadPerformanceData()` - Fetch via `get-performance-stats`
- `resetPerformanceData()` - Reset via `reset-performance-stats`
- `setupPerformanceTab()` - Wire up buttons

### TM2: Template Management UI ✅

**Files:** `ui/index.html`, `ui/modules/tabs.js`, `ui/renderer.js`

**New Tab:** "Templates" in right panel

**UI Elements:**
- Save form with template name input
- Template list with Load/Delete buttons
- Shows template name and creation date

**Functions:**
- `renderTemplateList()` - Render saved templates
- `loadTemplates()` - Fetch via `get-templates`
- `saveTemplate()` - Save via `save-template`
- `setupTemplatesTab()` - Wire up buttons

---

## V5 Status: ALL TASKS COMPLETE

Ready for Reviewer (R1) verification.

---

# V4 Checkpoint: Self-Healing & Autonomy (Previous)

**Date:** Jan 24, 2026
**Phase:** V4 - Auto-Recovery & Agent Coordination

---

## Lead Tasks - DONE

### AR2: Auto-Nudge IPC Handler ✅

**Files:** `ui/modules/ipc-handlers.js`, `ui/main.js`, `ui/daemon-client.js`

**Handlers added:**
- `nudge-agent` - Send nudge to specific pane
- `nudge-all-stuck` - Check all panes and nudge stuck ones

**Settings:**
- `stuckThreshold: 60000` - 60 seconds before considered stuck
- `autoNudge: true` - Enable auto-nudge

**Daemon-client:**
- `lastActivity` Map tracks output timestamps
- `getLastActivity(paneId)` returns timestamp
- `getAllActivity()` returns all timestamps

### AT1: Completion Detection Patterns ✅

**File:** `ui/modules/ipc-handlers.js`

**Handlers:**
- `check-completion` - Check text against patterns
- `get-completion-patterns` - Get pattern list

**Patterns:** task complete, ready for review, handing off, triggering, ✅ done, DONE:, COMPLETE:

---

## Worker B Tasks - DONE

### AR1: Stuck Detection in Daemon ✅

**File:** `ui/terminal-daemon.js`

**Changes:**
- Added `lastActivity` timestamp to terminal info
- Track activity in `onData` callback
- Added `getStuckTerminals(thresholdMs)` function
- Added `stuck` protocol action

**Protocol:**
```javascript
// Client → Daemon
{ action: "stuck", threshold: 60000 }

// Daemon → Client
{ event: "stuck", terminals: [...], threshold, count }
```

### CB2: Agent Claim/Release Protocol ✅

**File:** `ui/modules/watcher.js`

**Functions:**
- `claimAgent(paneId, taskId, description)` - Claim a task
- `releaseAgent(paneId)` - Release claim
- `getClaims()` - Get all claims
- `clearClaims()` - Clear all claims

**State.json:**
- Added `claims: {}` field to track who's doing what

**IPC Handlers:**
- `claim-agent`, `release-agent`, `get-claims`, `clear-claims`

### CP1: Session Summary Persistence ✅

**File:** `ui/modules/ipc-handlers.js`

**Storage:** `workspace/session-summaries.json`

**IPC Handlers:**
- `save-session-summary` - Save summary (keeps last 50)
- `get-session-summaries` - Get summaries (most recent first)
- `get-latest-summary` - Get most recent summary
- `clear-session-summaries` - Clear all

---

## Waiting For Worker A

| Task | Owner | Description |
|------|-------|-------------|
| CB1 | Worker A | Startup state display |
| AT2 | Worker A | Auto-trigger UI feedback |

---

## API Reference

```javascript
// Auto-Nudge (Lead)
await window.hivemind.invoke('nudge-agent', paneId, 'message');
await window.hivemind.invoke('nudge-all-stuck');

// Completion Detection (Lead)
const { completed, pattern } = await window.hivemind.invoke('check-completion', text);

// Activity Tracking (Lead)
const timestamp = daemonClient.getLastActivity(paneId);

// Agent Claims (Worker B)
await window.hivemind.invoke('claim-agent', paneId, taskId, 'description');
await window.hivemind.invoke('release-agent', paneId);
const claims = await window.hivemind.invoke('get-claims');
await window.hivemind.invoke('clear-claims');

// Session Summaries (Worker B)
await window.hivemind.invoke('save-session-summary', { title, content, agents });
const { summaries } = await window.hivemind.invoke('get-session-summaries', 10);
const { summary } = await window.hivemind.invoke('get-latest-summary');
```
