# Friction: Agent Churning/Stall Issue

**Reported by:** Worker A
**Date:** Jan 24, 2026
**Severity:** HIGH - Blocks autonomous operation

---

## Problem

Agents occasionally get stuck in a "churning" state where:
- The terminal shows activity/spinning but no output
- The agent is unresponsive to triggers
- Manual interruption is required to unstick

## Impact

- **Breaks autonomous workflow** - If user walks away, stuck agent won't process triggers
- **Chain reactions stall** - Other agents waiting on the stuck agent will never get their triggers
- **Requires human intervention** - Defeats the purpose of autonomous multi-agent operation

## Observed Behavior

- Worker A completed a code review output
- After the output, the terminal showed "churning" with no new output
- Agent was not responding to any input
- User had to manually interrupt to recover

## Potential Causes

1. Claude Code CLI issue (model generating internally but no output stream)
2. PTY/terminal state issue
3. Something in the response generation hanging
4. Network/API timeout not surfacing properly

## Proposed Mitigations

### Short-term (Workarounds)
- User monitors for stuck agents and interrupts manually
- Keep sessions shorter to reduce chance of stalls

### Medium-term (Sprint candidates)
1. **Timeout Detection** - Daemon monitors agent output; if no output for X minutes, send alert
2. **Heartbeat System** - Periodic ping to confirm agent is responsive
3. **Watchdog Trigger** - Special trigger file that forces a minimal response to test liveness
4. **Auto-Recovery** - If agent is unresponsive, automatically restart that pane's Claude session

### Long-term (Investigation)
- Log what happens during churning (check workspace/console.log)
- Identify if it's Claude Code CLI, API, or local issue
- File bug report if it's upstream

## Status

OPEN - Needs investigation and mitigation implementation

---

*This is a blocking issue for true "walk away" autonomous operation.*
