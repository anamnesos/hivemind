# Hivemind Product Spec

**Author:** Reviewer (from user conversation)
**Date:** Jan 2026
**Status:** DRAFT - NEEDS LEAD REVIEW

---

## What Lead's Plan is Missing

Lead's plan describes the SHELL (Electron + 4 terminals). It doesn't describe:
1. The workflow / state machine
2. The UX improvements over raw terminals
3. Automatic handoffs
4. Friction logging
5. Settings UI

This spec fills those gaps.

---

## Core Problems We're Solving

| Current Pain | Hivemind Solution |
|--------------|-------------------|
| Open 4 terminals manually | One app, auto-spawns team |
| Type folder paths | Folder picker UI |
| Approve every action | Grant trust once, toggle settings |
| Manual sync ("go check status.md") | Auto-sync, everyone sees everything |
| Be the human router | Automatic handoffs based on workflow |
| No visibility into friction | Friction log, synced to all |

---

## The Workflow State Machine

This is the ACTUAL product logic Lead skipped:

```
                    ┌─────────────────┐
                    │   USER INPUT    │
                    │ (project + task)│
                    └────────┬────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────┐      ┌──────────┐                         │
│  │   LEAD   │─────▶│ REVIEWER │                         │
│  │  (plan)  │◀─────│ (review) │                         │
│  └──────────┘      └──────────┘                         │
│       │                  │                               │
│       │ [both agree]     │ [disagree: iterate]          │
│       ▼                  │                               │
│  ┌───────────────────────┴──┐                           │
│  │     WORKERS 1 & 2        │                           │
│  │  (parallel execution)    │                           │
│  └───────────────────────────┘                          │
│       │                                                  │
│       │ [checkpoint reached]                            │
│       ▼                                                  │
│  ┌──────────┐      ┌──────────┐                         │
│  │ REVIEWER │─────▶│   LEAD   │ ◀── [issues found]     │
│  │ (verify) │      │  (fix?)  │                         │
│  └──────────┘      └──────────┘                         │
│       │                  │                               │
│       │ [approved]       │ [iterate until agreed]       │
│       ▼                  │                               │
│  ┌───────────────────────┴──┐                           │
│  │   CONTINUE TO NEXT       │                           │
│  │      CHECKPOINT          │                           │
│  └───────────────────────────┘                          │
│       │                                                  │
│       │ [all log friction]                              │
│       ▼                                                  │
│  ┌───────────────────────────┐                          │
│  │  SYNC FRICTION TO ALL    │                           │
│  └───────────────────────────┘                          │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────┐      ┌──────────┐                         │
│  │   LEAD   │─────▶│ REVIEWER │                         │
│  │(fix friction)   │ (approve)│                         │
│  └──────────┘      └──────────┘                         │
│       │                                                  │
│       └──────────── REPEAT ──────────────────────────────│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### States

| State | Who's Active | Trigger to Next |
|-------|--------------|-----------------|
| `PLANNING` | Lead | Lead submits plan |
| `PLAN_REVIEW` | Reviewer | Reviewer approves OR requests changes |
| `PLAN_REVISION` | Lead | Lead addresses feedback |
| `EXECUTING` | Workers 1 & 2 | Workers hit checkpoint |
| `CHECKPOINT_REVIEW` | Reviewer | Reviewer approves OR finds issues |
| `CHECKPOINT_FIX` | Lead + Workers | Issues addressed |
| `FRICTION_SYNC` | All | All agents see friction logs |
| `FRICTION_RESOLUTION` | Lead → Reviewer | Friction fixes approved |
| `COMPLETE` | None | All checkpoints done, no issues |

### Automatic Transitions

These happen WITHOUT user intervention:
- Plan submitted → auto-routes to Reviewer
- Reviewer approves → auto-starts Workers
- Checkpoint reached → auto-pauses Workers, routes to Reviewer
- Issues found → auto-routes to Lead
- Friction logged → auto-syncs to all agents

---

## UX Requirements

### 1. Startup Flow

```
┌─────────────────────────────────────────┐
│           Welcome to Hivemind           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📁 Select Project Folder        │   │
│  │    [Browse...]                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Recent Projects:                       │
│  • D:\projects\myapp                   │
│  • D:\projects\api-server              │
│                                         │
│           [Start Hivemind]              │
└─────────────────────────────────────────┘
```

NO typing paths. Click to select.

### 2. Settings Panel

Visual toggles, not CLI flags:

```
┌─────────────────────────────────────────┐
│  ⚙️ Settings                            │
├─────────────────────────────────────────┤
│                                         │
│  Permissions                            │
│  ┌─────────────────────────────────┐   │
│  │ [✓] Allow file read/write       │   │
│  │ [✓] Allow terminal commands     │   │
│  │ [✓] Allow web search            │   │
│  │ [ ] Allow system modifications  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Workflow                               │
│  ┌─────────────────────────────────┐   │
│  │ [✓] Auto-route to Reviewer      │   │
│  │ [✓] Pause at checkpoints        │   │
│  │ [✓] Sync friction automatically │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Trust Level                            │
│  ┌─────────────────────────────────┐   │
│  │ ○ Ask for every action          │   │
│  │ ○ Ask for destructive actions   │   │
│  │ ● Trust agents fully            │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

Settings apply to ALL agents. No per-action prompts (unless user chose "Ask for every action").

### 3. Main Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  Hivemind │ Project: myapp │ State: EXECUTING │ ⚙️ Settings     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │    LEAD     │ │  REVIEWER   │ │  WORKER 1   │ │  WORKER 2  ││
│  │  [idle]     │ │  [idle]     │ │ [working]   │ │ [working]  ││
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├────────────┤│
│  │             │ │             │ │             │ │            ││
│  │ Waiting for │ │ Plan        │ │ Building    │ │ Building   ││
│  │ checkpoint  │ │ approved.   │ │ auth module │ │ API routes ││
│  │             │ │ Workers     │ │             │ │            ││
│  │             │ │ executing.  │ │ ...         │ │ ...        ││
│  │             │ │             │ │             │ │            ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 Message: [Type here to talk to focused agent or all]  [Send]│
│  [Broadcast to All]                                             │
├─────────────────────────────────────────────────────────────────┤
│  📋 Friction Log (3 items)  │  📁 Files Changed (7)            │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Friction Panel

Shows what each agent logged as friction:

```
┌─────────────────────────────────────────┐
│  📋 Friction Log                        │
├─────────────────────────────────────────┤
│ [Worker 1] "API response types unclear" │
│ [Worker 2] "Need shared constants file" │
│ [Reviewer] "No tests for auth module"   │
├─────────────────────────────────────────┤
│ Lead will address in next iteration     │
└─────────────────────────────────────────┘
```

---

## Technical Architecture

### What We Keep from Lead's Plan
- Electron app shell
- xterm.js for terminal rendering
- node-pty for process spawning
- File watching for sync

### What We Add
- State machine (workflow logic)
- Settings persistence
- Folder picker dialog
- Friction log aggregation
- Automatic handoff triggers

### How Automatic Handoffs Work

Each agent's CLAUDE.md includes:
```markdown
## Handoff Protocol

When you complete your phase:
1. Write status to `workspace/state.json`
2. The orchestrator detects the change
3. Next agent is automatically activated

You do NOT need to manually notify other agents.
```

The Electron app watches `workspace/state.json`:
- Detects state changes
- Routes to next agent based on workflow
- Updates UI to show who's active

---

## What Needs to Change in Lead's Plan

| Lead's Plan Says | Should Be |
|------------------|-----------|
| "Input bar per pane" | Input bar + Broadcast bar + state-aware routing |
| "Sync button" | Auto-sync on state change |
| Manual handoffs | Automatic handoffs via state machine |
| No settings UI | Full settings panel with toggles |
| No folder picker | Folder picker on startup |
| No friction logging | Friction panel synced across agents |

---

## Implementation Priority

### Phase 1: Fix the Shell (if Lead's Electron app works)
- [ ] Test current Electron app
- [ ] Fix any bugs
- [ ] Verify 4 Claude instances can spawn

### Phase 2: Add Workflow Engine
- [ ] Implement state machine
- [ ] Add automatic handoffs
- [ ] Add checkpoint detection

### Phase 3: UX Layer
- [ ] Settings panel with toggles
- [ ] Folder picker on startup
- [ ] Friction log panel

### Phase 4: Polish
- [ ] Session resume
- [ ] Error recovery
- [ ] Keyboard shortcuts

---

## Open Questions for Lead

1. Does the current Electron app actually work? Status says "has bugs."
2. Where is the state machine? The workflow logic isn't in any file I've seen.
3. Who's implementing automatic handoffs?
4. Did you read this spec? Push back if you disagree.

---

**Status:** AWAITING LEAD REVIEW

**Reviewer verdict:** Lead's technical approach (Electron + xterm.js) is fine, but the PRODUCT logic is missing. This spec fills that gap. Don't build more UI until we agree on the workflow.
