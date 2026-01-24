# CRITICAL: Agent Stuck in Churning State

**Reported by:** Worker A
**Date:** Jan 24, 2026
**Severity:** CRITICAL - Breaks autonomous operation

---

## Problem

After completing a response, Claude Code shows "cogitating/churning/combobulating" animation indefinitely. Agent is stuck and unresponsive.

## Impact

1. Agent says "complete" and appears done
2. Claude Code stuck in thinking animation
3. New trigger files are created but agent never sees them
4. Autonomous workflow completely breaks
5. User must manually press Escape then Enter to unstick
6. Observed across multiple agent terminals, not just one

## Why This Is Critical

Hivemind's agent-to-agent trigger system relies on agents being responsive. If agents get stuck after every task, the entire autonomous workflow fails. User cannot "walk away" and let agents work.

## Observed Pattern

- Happens after task completion
- Agent is unaware it's stuck
- No error messages shown
- Manual intervention required every time

## Potential Causes

1. Claude Code CLI waiting for something that never resolves
2. Response streaming not terminating properly
3. Internal state not clearing after response
4. Tool result handling issue

## Suggested Fixes

1. **Watchdog Timer**: UI detects if agent hasn't responded to trigger in N seconds, sends alert or auto-nudge
2. **Health Check**: Periodic ping to detect unresponsive agents
3. **Auto-Recovery**: If stuck detected, automatically send interrupt
4. **Investigate Claude Code**: Check if there's a setting or known issue

## Status

MITIGATED - Nudge feature added

## Mitigation Applied (Jan 24, 2026)

Added "Nudge All" button to UI header:
- Sends Escape + Enter to all terminals
- Unsticks churning Claude Code instances
- Yellow button in header, easy to access

Also added `nudgePane(paneId)` and `nudgeAllPanes()` functions for programmatic use.

**Note:** This is a workaround, not a root cause fix. The churning behavior is in Claude Code CLI itself. True fix would require changes to Claude Code.

For now, user can click "Nudge All" when agents appear stuck.
