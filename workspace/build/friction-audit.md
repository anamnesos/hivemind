# Friction Audit - Hivemind Build Process

## Summary

Reviewing all confusion, friction, and workflow issues encountered during the build.

---

## 1. PRODUCT vs WORKFLOW Confusion

**Issue:** Lead (me) confused what we're BUILDING (Hivemind UI) with HOW we're building it (4 Claude terminals).

**Example:** Kept saying "hit Sync" when the Sync button only exists in Hivemind UI, but we're building with separate terminals.

**Fix needed:**
- CLAUDE.md should clarify: "You are building Hivemind, but you're NOT running inside it yet"
- Clear distinction between dev workflow and product features

**Status:** Added to CLAUDE.md but could be clearer

---

## 2. Shared Context Staleness

**Issue:** Workers read shared_context.md once and cache it. When Lead updates it, workers say "no changes since last sync."

**Example:** Worker B said "no tasks assigned" because he had the old version.

**Fix needed:**
- Workers should re-read files when told to check for updates
- Or: timestamp/version in shared_context.md so workers know it changed
- Or: file watcher that notifies workers of changes (the auto-notify we disabled)

**Status:** NOT FIXED - manual workaround (tell workers directly)

---

## 3. Manual Coordination Overhead

**Issue:** User has to manually tell each worker what to do, copy/paste instructions between terminals.

**Examples:**
- "Tell Worker A to start"
- "Tell Worker B to wait"
- "Tell Reviewer to review"

**Fix needed:**
- Auto-handoff system (added to spec but not built)
- Task dependency tracking
- Automatic notifications when tasks are ready

**Status:** SPEC WRITTEN - not implemented yet

---

## 4. No Task Dependency Tracking

**Issue:** Worker B depends on Worker A finishing the panel, but there's no system to track this.

**Example:** User asked "shouldn't Worker B go automatically after Worker A?"

**Fix needed:**
- Task files with dependency declarations
- File watcher triggers next worker when dependency completes
- Build Progress tab visualizes this

**Status:** SPEC WRITTEN - not implemented yet

---

## 5. Workers Don't Hand Off

**Issue:** When Worker A finishes, they don't update shared_context.md with Worker B's task.

**Example:** Worker A finished panel structure, but shared_context.md still said "WAIT".

**Fix needed:**
- Added handoff rules to worker CLAUDE.md files
- Workers must update status.md AND shared_context.md when done

**Status:** FIXED - added to CLAUDE.md

---

## 6. Reviewer Not Consulted on Plans

**Issue:** Workers started before Reviewer approved the Phase 4 plan.

**Example:** User caught this: "shouldn't Reviewer review the plan first?"

**Fix needed:**
- Workflow should enforce: Plan → Review → Execute
- Workers should check for plan-approved.md before starting

**Status:** WORKFLOW ISSUE - need to enforce in CLAUDE.md

---

## 7. Missing Specs

**Issue:** Reviewer correctly rejected Phase 4 plan because there was no detailed spec.

**Example:** "plan is incomplete, there's no specs"

**Fix needed:**
- Every phase needs a spec document before implementation
- Spec template with required sections

**Status:** FIXED for Phase 4 - need template for future phases

---

## 8. PowerShell Context Message Errors

**Issue:** notifyAgents() sent messages to PowerShell terminals instead of Claude, causing parser errors.

**Example:** `Unexpected token 'Plan' in expression or statement`

**Fix needed:**
- Track whether Claude is running in each pane
- Only send context messages when Claude is active
- Or: different notification mechanism (file-based instead of terminal input)

**Status:** DISABLED - notifyAgents commented out

---

## 9. Can't See DevTools Console

**Issue:** User has to copy/paste console errors to Lead instead of agents seeing them directly.

**Quote:** "why can't we build it so that yall can see it without asking me"

**Fix needed:**
- Capture `webContents.on('console-message')` events
- Write to `workspace/console.log`
- Agents can read the file

**Status:** NOT IMPLEMENTED - on wishlist

---

## 10. Can't Interact with UI

**Issue:** Agents can't click around the UI to check for errors themselves.

**Quote:** "can we make it so you guys can click around to check for errors yourself"

**Fix needed:**
- Playwright/Puppeteer integration for web apps
- Electron webContents API for Hivemind itself
- Commands: click(selector), screenshot(), getErrors()

**Status:** NOT IMPLEMENTED - on wishlist

---

## 11. State Machine Limited to Phases

**Issue:** State machine handles PLANNING → EXECUTING transitions, but not task dependencies within EXECUTING.

**Example:** No way to say "Task B starts when Task A completes"

**Fix needed:**
- Extend state.json with active_tasks array
- Task-level state tracking, not just phase-level

**Status:** SPEC WRITTEN - not implemented yet

---

## 12. Copy/Paste from Terminals

**Issue:** Right-click copy didn't work - text was unhighlighted before copy.

**Fix:** Track selection via `onSelectionChange`, use stored selection on right-click.

**Status:** FIXED

---

## 13. Layout Issues

**Issue:** Terminals didn't fit, had to stretch window to see broadcast bar.

**Fix:** Added `min-height: 0` to CSS for flex containers.

**Status:** FIXED

---

## 14. No Saved Project List

**Issue:** Have folder picker but can't save favorite projects or reference multiple projects.

**Status:** On wishlist (Projects tab)

---

## 15. No Background Process Monitor

**Issue:** Can't see what's running (npm run dev, etc.) or kill processes.

**Status:** On wishlist (Processes tab)

---

## Priority Fixes for Smooth Workflow

### High Priority (Friction killers)
1. **Auto-handoff system** - Workers notify next worker automatically
2. **Console log capture** - Agents see errors without copy/paste
3. **Re-read mechanism** - Workers detect when files change

### Medium Priority (Nice to have)
4. **Task dependency UI** - Build Progress tab with visual tree
5. **Process monitor** - See/kill background processes
6. **Screenshot sharing** - Drag/drop images for agents to see

### Lower Priority (Future)
7. **Live Preview** - Embedded browser
8. **User Testing** - Checklist with auto-fix
9. **UI interaction** - Agents clicking around

---

## Files That Define Workflow

| File | Purpose | Issues Found |
|------|---------|--------------|
| `workspace/shared_context.md` | Task assignments | Goes stale, workers don't re-read |
| `workspace/build/status.md` | Progress tracking | Manual updates only |
| `workspace/state.json` | State machine | Phase-level only, no tasks |
| `instances/*/CLAUDE.md` | Role definitions | Added handoff rules |
| `workspace/build/*.spec.md` | Specs | Need template |

---

## Recommended CLAUDE.md Additions

For ALL agents:
```markdown
## Re-reading Files
When user says "check for updates" or "sync", ALWAYS re-read:
- workspace/shared_context.md
- workspace/build/status.md
- workspace/state.json

## Before Starting Work
1. Check state.json - is it your turn?
2. Check shared_context.md - what's your task?
3. Check for plan-approved.md - is the plan approved?
```

For Workers:
```markdown
## After Completing Work
1. Update status.md - mark your task DONE
2. Update shared_context.md - assign next worker's task
3. Write what you did, what files changed, what's next
```

---

## Conclusion

Main friction sources:
1. **Communication is manual** - no auto-notifications between agents
2. **Files go stale** - no mechanism to detect/notify changes
3. **Dependencies not tracked** - user has to sequence workers manually

The Build Progress tab + Task Dependency system will fix most of this once implemented.
