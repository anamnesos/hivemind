# Toolbar Button Audit

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Status:** COMPLETE

---

## Current Toolbar Buttons (11 total)

| # | Button | CSS Class | Color | Purpose |
|---|--------|-----------|-------|---------|
| 1 | Select Project | btn-folder | Teal (#4ecca3) | Choose project folder |
| 2 | Sync Context | btn | Default (blue) | Broadcast shared_context.md |
| 3 | Spawn All Agents | btn | Default (blue) | Start all 6 agent CLIs |
| 4 | Kill All | btn-danger | Red outline | Terminate all sessions |
| 5 | Nudge All | btn-nudge | Yellow outline | ESC+Enter to unstick agents |
| 6 | Fresh Start | btn-fresh | Cyan outline | Kill + restart without context |
| 7 | Shutdown | btn-restart | Orange outline | Clean shutdown (restart needed) |
| 8 | Friction | btn-friction | Pink/magenta | View friction logs |
| 9 | Cost Alert | badge | Red (hidden) | Shows when cost threshold exceeded |
| 10 | Settings | settings-btn | Gray outline | Configure Hivemind |
| 11 | Panel | btn-panel | Default | Toggle right panel |

---

## Question 1: Are all buttons needed?

### Essential (Keep Visible)
- **Select Project** - Critical for setup, used every session
- **Spawn All Agents** - Primary workflow action
- **Sync Context** - Frequently used for agent coordination
- **Settings** - Needed for configuration
- **Panel** - Toggles right panel (screenshots, tests, etc.)

### Redundant/Confusing (Consider Consolidating)
- **Kill All** vs **Fresh Start** vs **Shutdown** - 3 destructive actions with subtle differences:
  - Kill All: Just terminates sessions
  - Fresh Start: Kill + restart without context
  - Shutdown: Full app shutdown
  - **Recommendation:** Group into single "Power" dropdown with clear labels

### Niche/Recovery (Hide Behind Dropdown)
- **Nudge All** - Only needed when agents get stuck. Niche use case.
- **Friction** - Developer tool, not daily workflow

### Auto-Show (Keep Current Behavior)
- **Cost Alert** - Hidden by default, shows when needed. Good pattern.

---

## Question 2: Do they all work correctly?

| Button | Handler Location | Works? |
|--------|-----------------|--------|
| Select Project | daemonHandlers.selectProject | ✅ Yes |
| Sync Context | terminal.syncSharedContext | ✅ Yes |
| Spawn All Agents | terminal.spawnAllClaude | ✅ Yes |
| Kill All | terminal.killAllTerminals | ✅ Yes |
| Nudge All | terminal.aggressiveNudgeAll | ✅ Yes |
| Fresh Start | terminal.freshStartAll | ✅ Yes |
| Shutdown | IPC quit + app.relaunch | ✅ Yes |
| Friction | tabs.js toggle panel | ✅ Yes |
| Settings | settings.js toggle panel | ✅ Yes |
| Panel | tabs.js togglePanel | ✅ Yes |

**All buttons have working handlers.** Also available via Command Palette (Ctrl+K).

---

## Question 3: Do they look modern?

### Positives
- Color-coded scheme provides clear visual distinction
- Outline style with colored borders is clean
- Hover effects (fill on hover) are responsive
- Consistent sizing and padding

### Issues
- **11 buttons = crowded toolbar** - Feels dense
- **Text-only labels** - Icons would aid recognition
- **No visual grouping** - Related actions (Kill/Fresh/Shutdown) not grouped
- **Inconsistent styling** - Settings button has different base style (transparent vs filled)

---

## Recommendations

### Priority 1: Reduce Visual Clutter
Group destructive/recovery actions into dropdowns:

```
[Select Project] [Spawn All] [Sync] [Kill ▼] [Settings] [Panel]
                                      └── Kill All
                                      └── Fresh Start
                                      └── Shutdown
                                      └── Nudge All
```

### Priority 2: Add Icons
Add icons alongside text for faster recognition:
- 📁 Select Project
- 🚀 Spawn All
- 📡 Sync
- ⚙️ Settings
- 📊 Panel

### Priority 3: Move Friction to Panel
Friction logs could be a tab in the right panel instead of a toolbar button.

---

## Summary

| Aspect | Rating | Notes |
|--------|--------|-------|
| Functionality | ✅ Good | All buttons work, handlers present |
| Necessity | ⚠️ Mixed | 3 destructive buttons could be 1 dropdown |
| Modern Look | ⚠️ Acceptable | Functional but crowded, no icons |

**Overall:** Toolbar is functional but could be cleaner. Main issue is 11 buttons creates visual clutter. Grouping related actions into dropdowns would improve UX significantly.
