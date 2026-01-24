# Phase 4 Spec - Right Panel with Tabs

## Overview

Add a toggleable right panel to Hivemind UI containing feature tabs for enhanced workflow.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: [State] [Progress] [Agents] [SelectProject] [⚙️] [📁 Panel]│
├───────────────────────────────────────┬─────────────────────────────┤
│                                       │  [Tab1] [Tab2] [Tab3] ...   │
│     Terminal Grid (2x2)               ├─────────────────────────────┤
│                                       │                             │
│  ┌─────────────┬─────────────┐        │     Tab Content Area        │
│  │   Pane 1    │   Pane 2    │        │                             │
│  │   (Lead)    │  (Worker A) │        │                             │
│  ├─────────────┼─────────────┤        │                             │
│  │   Pane 3    │   Pane 4    │        │                             │
│  │  (Worker B) │  (Reviewer) │        │                             │
│  └─────────────┴─────────────┘        │                             │
│                                       │                             │
├───────────────────────────────────────┴─────────────────────────────┤
│  Broadcast Bar                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Panel Behavior

| Property | Value |
|----------|-------|
| Default state | Closed |
| Width when open | 350px |
| Toggle button | Header icon (📁 or similar) |
| Animation | Slide in/out (CSS transition) |
| Resize terminals? | Yes - flex layout, terminals shrink |
| Persist state | Yes - save open/closed + active tab in settings |

---

## Tabs (in order)

### Tab 1: Screenshots
**Purpose:** Share images with agents without copy/paste hassle

| Feature | Implementation |
|---------|----------------|
| Drag & drop zone | HTML5 drag events, highlight on dragover |
| Paste support | Listen for paste event on panel |
| Preview thumbnails | Grid of images with delete button |
| Storage | `workspace/screenshots/` directory |
| Naming | timestamp-based: `screenshot-1706012345678.png` |
| Agent access | Agents read files from screenshots folder |

**IPC Handlers (main.js):**
- `save-screenshot` - Save base64 image to file
- `list-screenshots` - Get list of screenshot files
- `delete-screenshot` - Delete a screenshot
- `get-screenshot-path` - Get full path for agent reference

### Tab 2: Build Progress
**Purpose:** Visual tree showing plan execution

| Feature | Implementation |
|---------|----------------|
| Tree structure | Nested list from plan.md checkpoints |
| Status icons | ⚙️ working, ✅ done, ⏳ pending, ❌ failed |
| Animation | CSS spin on gear icon |
| Data source | Parse `workspace/plan.md` + `state.json` |
| Auto-update | File watcher triggers re-render |

### Tab 3: Processes
**Purpose:** Monitor background processes

| Feature | Implementation |
|---------|----------------|
| Process list | Show spawned child processes |
| Status | Running (green) / Stopped (gray) / Error (red) |
| Actions | Kill button per process |
| Common processes | npm run dev, tsc --watch, etc. |

**IPC Handlers:**
- `spawn-process` - Start a background process
- `list-processes` - Get running processes
- `kill-process` - Kill by PID

### Tab 4: Projects
**Purpose:** Quick project switching, multi-project reference

| Feature | Implementation |
|---------|----------------|
| Project list | Saved project paths |
| Add project | Button opens folder picker |
| Remove project | X button per project |
| Load project | Click to switch workspace |
| Multi-select | Checkbox to include in agent context |
| Storage | `settings.json` projects array |

### Tab 5: Live Preview
**Purpose:** See the app without leaving Hivemind

| Feature | Implementation |
|---------|----------------|
| Embedded browser | `<webview>` tag or BrowserView |
| URL input | Text field for localhost:3000 etc. |
| Refresh button | Reload the preview |
| DevTools | Optional toggle for preview DevTools |
| Auto-detect | Try to find running dev server |

### Tab 6: User Testing
**Purpose:** Structured feedback loop

| Feature | Implementation |
|---------|----------------|
| Checklist | Generated from plan checkpoints |
| Status per item | ✅ Works / ❌ Broken / ⏳ Not tested |
| Notes field | Text area for broken items |
| Submit | Writes results to `workspace/test-results.md` |
| Agent trigger | Agents read test-results.md and fix issues |

---

## File Changes

### index.html
- Add panel toggle button to header
- Add right panel container with tab bar
- Add tab content containers (one per tab)
- CSS for panel layout, transitions, tabs

### main.js
- IPC handlers for screenshots
- IPC handlers for processes
- IPC handlers for projects list

### renderer.js
- Panel toggle logic
- Tab switching logic
- Screenshot drag/drop/paste handlers
- Build progress tree renderer
- Process list renderer
- Projects list renderer
- Live preview controller
- User testing checklist renderer

---

## Implementation Order

1. **Worker A:** Panel structure + tab bar + toggle
2. **Worker B:** Screenshots tab (first real tab)
3. **Worker A:** Build Progress tab
4. **Worker B:** Processes tab
5. **Worker A:** Projects tab
6. **Worker B:** Live Preview tab
7. **Both:** User Testing tab

---

## Questions for Reviewer

1. Should panel overlay terminals or resize them? (Spec says resize)
2. 350px width - good default?
3. Tab order correct?
4. Any tabs missing or unnecessary?
5. Live Preview - webview vs BrowserView vs iframe?

---

## Task Dependency & Auto-Handoff System

**Problem:** User has to manually tell Worker B to start after Worker A finishes. This is friction.

**Solution:** Add task dependency tracking and auto-handoff.

### How it works

1. **Task file structure** - `workspace/tasks/` directory
```
workspace/tasks/
  task-001-panel-structure.md    # Worker A's task
  task-002-screenshots-tab.md    # Worker B's task (depends on 001)
```

2. **Task file format:**
```markdown
# Task: Panel Structure
Owner: Worker A
Status: done
Depends: none
Next: task-002-screenshots-tab

## Description
Build toggleable right panel...

## Completion Signal
[Worker writes "DONE" here when finished]
```

3. **File watcher logic (main.js):**
- Watch `workspace/tasks/*.md`
- When a task file changes and contains "Status: done"
- Find tasks that depend on it (`Depends: task-001`)
- Notify those workers automatically

4. **Notify mechanism:**
- Update `state.json` with new active task
- Send context message to the dependent worker's pane
- Worker sees: `[HIVEMIND] Task dependency met. Start: Screenshots tab`

### IPC Handlers

| Handler | Purpose |
|---------|---------|
| `create-task` | Create a new task file |
| `update-task-status` | Mark task pending/in_progress/done |
| `get-task-dependencies` | Get tasks that depend on a given task |
| `get-pending-tasks` | Get tasks ready to start (deps met) |

### State Machine Extension

Add to `state.json`:
```json
{
  "state": "executing",
  "active_tasks": [
    { "id": "task-001", "owner": "2", "status": "done" },
    { "id": "task-002", "owner": "3", "status": "in_progress" }
  ],
  "task_queue": ["task-003", "task-004"]
}
```

### UI Addition (Build Progress tab)

The Build Progress tab should visualize this:
- Tree view of tasks with dependencies
- Status indicators per task
- Show which worker owns each task
- Auto-updates as tasks complete

---

## Implementation Note

This feature can be built as part of the **Build Progress tab** - it needs the task tracking anyway to show the visual tree. Worker building that tab should implement both the visualization AND the auto-handoff logic.
