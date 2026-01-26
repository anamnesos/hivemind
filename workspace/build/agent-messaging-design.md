# Agent-to-Agent Communication Design

**Author:** Worker B
**Date:** Jan 25, 2026
**Status:** DRAFT - Needs team input

---

## Problem Statement

Current behavior is broken:
1. Agent A sends trigger message to Agent B
2. Agent B receives message in terminal
3. Agent B responds in terminal output → talking to USER instead of Agent A
4. User has to manually relay responses between agents

This defeats the entire purpose of multi-agent coordination.

---

## Design Principles

### 1. Separate Communication Channels

| Channel | Purpose | Medium |
|---------|---------|--------|
| User → Agent | Human giving instructions | Terminal input / Broadcast |
| Agent → User | Work product, status updates | Terminal output |
| Agent → Agent | Coordination, handoffs, questions | Messaging system ONLY |

### 2. Message Routing

When an agent receives a message, they MUST identify:
- **Source**: User or another Agent?
- **Reply channel**: Terminal (if from user) or Messaging (if from agent)

### 3. Message Format

Agent messages should be clearly marked:
```
[FROM: Worker-A] [TO: Lead] [REPLY-TO: worker-a.txt]
Your message here...
```

The receiving agent:
1. Sees it's FROM another agent
2. Knows to reply via the REPLY-TO channel
3. Does NOT respond in terminal output

---

## Implementation Options

### Option A: Enhanced Trigger Files (Simple)

Modify trigger format to include routing:
```
---HIVEMIND-MSG---
FROM: worker-a
TO: lead
REPLY: worker-a.txt
---
Actual message content here
```

Agents parse this header and reply appropriately.

**Pros:** Works with current infrastructure
**Cons:** Relies on agents parsing correctly

### Option B: Dedicated IPC Channel (Robust)

Create separate IPC events for agent messages:
- `agent-message-received` - distinct from user input
- `agent-message-send` - agent initiates reply

Renderer shows agent messages in a SEPARATE panel, not terminal.

**Pros:** Clean separation, can't confuse with user input
**Cons:** More code changes

### Option C: MCP Tools (Already Built?)

We built MCP integration (V11). Use it:
- `send_message` tool to message other agents
- `get_messages` tool to check inbox
- Messages stored in queue, not injected into terminal

**Pros:** Already partially built
**Cons:** MCP setup may not be working for all agents

---

## Recommended Approach

**Phase 1: Immediate (Option A)**
- Add message headers to trigger files
- Update CLAUDE.md to instruct agents on proper reply behavior
- Agents reply via trigger files, not terminal

**Phase 2: Short-term (Option B)**
- Add "Agent Messages" panel to UI
- Agent messages displayed separately from terminal
- Clear visual distinction

**Phase 3: Full (Option C)**
- Get MCP working reliably
- Agents use MCP tools for all coordination
- File-based triggers as fallback only

---

## CLAUDE.md Update Needed

Add to all agent CLAUDE.md files:

```markdown
## Responding to Agent Messages

When you receive a message FROM another agent (not the user):
1. The message will be prefixed with (AGENT-NAME):
2. DO NOT respond in your terminal output
3. Reply by writing to their trigger file: workspace/triggers/{agent}.txt
4. Format your reply: (YOUR-ROLE): Your response here

Example:
- You receive: "(LEAD): Please review the auth changes"
- You reply by writing to workspace/triggers/lead.txt:
  "(WORKER-B): Reviewed. Found 2 issues. See blockers.md"
```

---

## Autocomplete Bug (STILL ACTIVE)

The autocomplete bug is still happening. Agents received auto-submitted messages during this session. The fixes we made (autocomplete="off", defensive handlers) aren't fully working.

**Theory:** The autocomplete is happening at the OS/browser level, not just HTML attributes.

**Potential fixes:**
1. Disable browser autocomplete entirely in Electron settings
2. Add debounce to prevent rapid-fire submissions
3. Require explicit confirmation before injecting to terminals

---

## Request for Input

Lead, Worker A, Reviewer - please respond to this design:
1. Which option do you prefer?
2. Any concerns?
3. Should we prioritize fixing autocomplete first?

Reply via trigger files: `workspace/triggers/worker-b.txt`
