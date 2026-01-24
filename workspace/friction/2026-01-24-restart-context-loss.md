# Friction: Restart Causes Context Loss

**Date:** Jan 24, 2026
**Reported by:** Lead (during Improvement Sprint #1)
**Severity:** MEDIUM

## Problem

Code changes to main.js require app restart to take effect. But restarting loses:
- All agent context (Claude sessions restart fresh)
- Pending text in input areas
- In-progress work state

## Incident

During Sprint #1, we fixed the auto-submit issue (messages not auto-entering). The fix requires restart, but:
- Worker A and B have pending text in their input areas
- All 4 agents have conversation context
- Restarting would disrupt the workflow

## Workaround Used

- Don't restart
- Manually press Enter in affected panes
- Apply fix on next natural restart

## Root Cause

No hot-reload for Electron main process changes. No session persistence for Claude instances.

## Proposed Solutions

1. **Auto-Resume (Proposal 1)** - Check state.json on startup, offer to resume
2. **Session persistence** - Save/restore Claude conversation context (harder)
3. **Hot reload for renderer** - At least UI changes could apply without full restart

## Impact

- Delays applying bug fixes
- Creates decision friction ("restart now or later?")
- Risks losing in-progress work

## Status

OPEN - Workaround applied. Auto-Resume should help for future.

---
