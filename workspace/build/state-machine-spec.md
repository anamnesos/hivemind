# Hivemind State Machine Spec

**Author:** Reviewer
**Date:** Jan 23, 2026
**Status:** DRAFT - for Lead to implement

---

## Overview

The state machine controls the workflow. It determines:
- Which agent is active
- When to transition to the next phase
- When to auto-handoff

---

## States

```typescript
enum State {
  // Startup
  IDLE = "idle",                    // App open, no project selected
  PROJECT_SELECTED = "project_selected", // User picked a folder

  // Planning
  PLANNING = "planning",            // Lead creating build plan
  PLAN_REVIEW = "plan_review",      // Reviewer checking plan
  PLAN_REVISION = "plan_revision",  // Lead addressing feedback

  // Execution
  EXECUTING = "executing",          // Workers building
  CHECKPOINT = "checkpoint",        // Workers hit a checkpoint
  CHECKPOINT_REVIEW = "checkpoint_review", // Reviewer checking work
  CHECKPOINT_FIX = "checkpoint_fix", // Lead/Workers fixing issues

  // Friction
  FRICTION_LOGGED = "friction_logged", // Agents logged friction
  FRICTION_SYNC = "friction_sync",   // All agents see friction
  FRICTION_RESOLUTION = "friction_resolution", // Lead fixing friction

  // Terminal
  COMPLETE = "complete",            // All done
  ERROR = "error",                  // Something broke
  PAUSED = "paused"                 // User paused
}
```

---

## Transitions

```
IDLE
  → PROJECT_SELECTED (user picks folder)

PROJECT_SELECTED
  → PLANNING (user gives task)

PLANNING
  → PLAN_REVIEW (Lead writes to plan.md)

PLAN_REVIEW
  → EXECUTING (Reviewer approves)
  → PLAN_REVISION (Reviewer requests changes)

PLAN_REVISION
  → PLAN_REVIEW (Lead updates plan)

EXECUTING
  → CHECKPOINT (Workers write to checkpoint.md)
  → ERROR (Worker crashes)

CHECKPOINT
  → CHECKPOINT_REVIEW (auto-trigger)

CHECKPOINT_REVIEW
  → EXECUTING (Reviewer approves, more work to do)
  → CHECKPOINT_FIX (Reviewer finds issues)
  → FRICTION_LOGGED (Reviewer approves, friction exists)
  → COMPLETE (Reviewer approves, no more work)

CHECKPOINT_FIX
  → CHECKPOINT_REVIEW (fixes applied)

FRICTION_LOGGED
  → FRICTION_SYNC (auto-trigger)

FRICTION_SYNC
  → FRICTION_RESOLUTION (Lead starts fixing)

FRICTION_RESOLUTION
  → PLAN_REVIEW (Lead proposes friction fixes)

COMPLETE
  → IDLE (user starts new task)

ERROR
  → PLANNING (user retries)
  → IDLE (user abandons)

PAUSED
  → (previous state) (user resumes)
```

---

## Active Agents Per State

| State | Lead | Reviewer | Worker 1 | Worker 2 |
|-------|------|----------|----------|----------|
| IDLE | - | - | - | - |
| PROJECT_SELECTED | ● | - | - | - |
| PLANNING | ● | - | - | - |
| PLAN_REVIEW | - | ● | - | - |
| PLAN_REVISION | ● | - | - | - |
| EXECUTING | - | - | ● | ● |
| CHECKPOINT | - | - | ○ | ○ |
| CHECKPOINT_REVIEW | - | ● | - | - |
| CHECKPOINT_FIX | ● | - | ● | ● |
| FRICTION_LOGGED | ○ | ○ | ○ | ○ |
| FRICTION_SYNC | ○ | ○ | ○ | ○ |
| FRICTION_RESOLUTION | ● | - | - | - |
| COMPLETE | - | - | - | - |

● = active (can write)
○ = reading only
- = idle

---

## Trigger Files

State changes are triggered by file writes:

| File | Written By | Triggers |
|------|------------|----------|
| `workspace/plan.md` | Lead | PLANNING → PLAN_REVIEW |
| `workspace/plan-approved.md` | Reviewer | PLAN_REVIEW → EXECUTING |
| `workspace/plan-feedback.md` | Reviewer | PLAN_REVIEW → PLAN_REVISION |
| `workspace/checkpoint.md` | Workers | EXECUTING → CHECKPOINT |
| `workspace/checkpoint-approved.md` | Reviewer | CHECKPOINT_REVIEW → EXECUTING or COMPLETE |
| `workspace/checkpoint-issues.md` | Reviewer | CHECKPOINT_REVIEW → CHECKPOINT_FIX |
| `workspace/friction/*.md` | Any | → FRICTION_LOGGED |
| `workspace/friction-resolution.md` | Lead | FRICTION_RESOLUTION → PLAN_REVIEW |

---

## state.json Format

```json
{
  "state": "executing",
  "previous_state": "plan_review",
  "active_agents": ["worker1", "worker2"],
  "timestamp": "2026-01-23T10:30:00Z",
  "project": "D:\\projects\\myapp",
  "current_checkpoint": 2,
  "total_checkpoints": 5,
  "friction_count": 3,
  "error": null
}
```

---

## Watcher Logic (Pseudo-code)

```javascript
// In Electron main process

const chokidar = require('chokidar');

function watchWorkspace(projectPath) {
  const watcher = chokidar.watch(path.join(projectPath, 'workspace'), {
    ignoreInitial: true
  });

  watcher.on('add', (filePath) => handleFileChange(filePath));
  watcher.on('change', (filePath) => handleFileChange(filePath));
}

function handleFileChange(filePath) {
  const filename = path.basename(filePath);
  const state = readState();

  // Transition logic
  if (filename === 'plan.md' && state.state === 'planning') {
    transition('plan_review');
  }
  else if (filename === 'plan-approved.md' && state.state === 'plan_review') {
    transition('executing');
  }
  else if (filename === 'checkpoint.md' && state.state === 'executing') {
    transition('checkpoint');
    // Auto-advance to review
    transition('checkpoint_review');
  }
  // ... etc
}

function transition(newState) {
  const state = readState();
  state.previous_state = state.state;
  state.state = newState;
  state.active_agents = getActiveAgents(newState);
  state.timestamp = new Date().toISOString();
  writeState(state);

  // Notify renderer to update UI
  mainWindow.webContents.send('state-changed', state);

  // Notify relevant agents
  notifyAgents(state.active_agents, newState);
}
```

---

## Agent Notification

When an agent becomes active, inject context:

```javascript
function notifyAgents(agents, newState) {
  for (const agent of agents) {
    const terminal = terminals[agent];
    const context = buildContextMessage(newState);

    // Send to terminal input
    terminal.write(context + '\n');
  }
}

function buildContextMessage(state) {
  switch (state) {
    case 'plan_review':
      return `[HIVEMIND] Plan submitted. Please review workspace/plan.md and write either plan-approved.md or plan-feedback.md`;

    case 'executing':
      return `[HIVEMIND] Plan approved. Begin implementation. Write to checkpoint.md when you reach a checkpoint.`;

    case 'checkpoint_review':
      return `[HIVEMIND] Checkpoint reached. Please review the work and write checkpoint-approved.md or checkpoint-issues.md`;

    // ... etc
  }
}
```

---

## UI Updates

The renderer listens for state changes:

```javascript
// In renderer.js

ipcRenderer.on('state-changed', (event, state) => {
  // Update state indicator
  document.getElementById('state-display').textContent = state.state;

  // Update agent status badges
  for (const [agent, terminal] of Object.entries(terminals)) {
    const isActive = state.active_agents.includes(agent);
    terminal.badge.classList.toggle('active', isActive);
    terminal.badge.classList.toggle('idle', !isActive);
  }

  // Update progress
  if (state.total_checkpoints) {
    updateProgress(state.current_checkpoint, state.total_checkpoints);
  }
});
```

---

## Questions for Lead

1. Does this state machine make sense?
2. Should checkpoints be numbered (1, 2, 3) or named ("auth", "api", "tests")?
3. Where should friction files go? `workspace/friction/` subdirectory?
4. Do we need a "blocked" state for when agents are waiting on user input?

---

**Status:** DRAFT - awaiting Lead feedback
