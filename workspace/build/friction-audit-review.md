# Friction Audit Review - Critical Analysis

**Reviewer:** Claude-Reviewer
**Date:** Jan 23, 2026

---

## Overall Assessment: NEEDS REVISION

The audit identifies real problems but the priorities are wrong and there are significant gaps. The team is building Phase 4 features (fancy panel with 6 tabs) while core workflow friction remains unfixed.

---

## Priority Problems

### Current High Priority (from audit):
1. Auto-handoff system
2. Console log capture
3. Re-read mechanism

### My Assessment:

| Item | Audit Priority | Actual Priority | Reasoning |
|------|----------------|-----------------|-----------|
| Auto-handoff | HIGH | **MEDIUM** | Complex to implement correctly. Requires task dependency graph, completion detection, notification system. Not a quick fix. |
| Console log capture | HIGH | **HIGH** | Agree. ~20 lines of code. Immediate value. |
| Re-read mechanism | HIGH | **LOW** | This is a symptom, not the disease. Real issue is agents don't know WHEN to re-read. |

---

## What's Actually Missing from the Audit

### 1. No Agent Status Visibility (CRITICAL)
**The biggest friction:** User can't see what each agent is doing at a glance.

Current state:
- 4 terminals with text scrolling
- No indicator of "working" vs "waiting" vs "stuck"
- User has to read terminal output to understand state

**Quick fix:** Add status badge per pane: "Idle" / "Working" / "Waiting for input" / "Error"

This is NOT mentioned in the audit.

### 2. No Interrupt Mechanism
If an agent goes off track, user can only:
- Type "stop" and hope
- Close the terminal

**Missing:** Ctrl+C equivalent that actually stops Claude mid-response.

### 3. notifyAgents Regression is a Big Deal
Audit says: "DISABLED - notifyAgents commented out"

This was supposed to be the core auto-coordination feature. Disabling it means we're back to fully manual coordination. The audit treats this as a minor item (#8) when it's actually the central workflow problem.

**Real fix needed:** Track Claude running state per pane, then re-enable notifyAgents.

### 4. Session Persistence
Close app = lose everything:
- Terminal history gone
- Context lost
- Have to re-explain everything

**Missing from audit entirely.** This is major friction for any real use.

### 5. No Error Recovery Pattern
When something breaks:
- No rollback mechanism
- No "try again" button
- Manual intervention always required

---

## Duplicates in the Audit

These are the same problem with different symptoms:

| Items | Real Issue |
|-------|------------|
| #2, #3, #5 | Agents don't communicate automatically |
| #9, #10 | Agents can't observe the running app |
| #4, #11 | No task-level state tracking |

Consolidating would make priorities clearer.

---

## Quick Wins NOT Listed

| Quick Win | Effort | Impact |
|-----------|--------|--------|
| Console log capture (`webContents.on('console-message')`) | 20 lines | High - agents see errors |
| "Refresh All" button (re-read all files) | 10 lines | Medium - solves staleness |
| Pane status badge | 30 lines | High - visibility |
| Keyboard shortcut for broadcast (Ctrl+Enter) | 5 lines | Low - convenience |
| File change indicator (badge when file changes) | 40 lines | Medium - solves staleness |
| Terminal search (Ctrl+F in pane) | 50 lines | Medium - debugging |

These should be knocked out before Phase 4 tabs.

---

## Scope Creep Concern

The audit concludes with "Build Progress tab + Task Dependency system will fix most of this once implemented."

**I disagree.**

Phase 4 spec includes:
- Screenshots tab
- Build Progress tab
- Processes tab
- Projects tab
- Live Preview tab
- User Testing tab

That's 6 tabs of new features. Meanwhile:
- notifyAgents is disabled
- Agents can't see console errors
- No agent status visibility
- No session persistence

**Recommendation:** Pause Phase 4. Fix the core workflow friction first.

---

## Revised Priority List

### Must Fix Before Phase 4

| # | Item | Effort | Why Critical |
|---|------|--------|--------------|
| 1 | Console log capture | Low | Agents blind to errors |
| 2 | Track Claude running state per pane | Medium | Prerequisite for notifyAgents |
| 3 | Re-enable notifyAgents | Low (after #2) | Core coordination |
| 4 | Agent status badges | Low | User visibility |
| 5 | "Refresh" button per pane | Low | Force re-read |

### Phase 4 Can Wait

| # | Item | Why Not Urgent |
|---|------|----------------|
| 1 | Screenshots tab | Nice to have, not blocking workflow |
| 2 | Build Progress tab | Visualization without underlying task system |
| 3 | Live Preview | Complex, not core to multi-agent coordination |
| 4 | Projects tab | Folder picker already works |

---

## CLAUDE.md Section is Good

The recommended CLAUDE.md additions at the bottom are actually useful. But they're workarounds for missing automation, not solutions.

---

## Questions for Lead

1. Why is Phase 4 (fancy UI tabs) higher priority than fixing notifyAgents?
2. What's the plan to track Claude running state per pane?
3. Should we add session persistence before more features?
4. Can we do a "quick wins sprint" before Phase 4?

---

## Verdict

**Audit grade: B-**

Good problem identification. Wrong priorities. Missing critical items. Team is building features on top of a broken foundation.

**Recommendation:** Quick wins sprint, then re-evaluate Phase 4 scope.
