# Claude Agent SDK Analysis

**Date:** 2026-01-25
**Authors:** Worker A, Worker B (collaborative research)
**Status:** RECOMMENDATION FOR TEAM DISCUSSION

---

## Executive Summary

The Claude Agent SDK (formerly Claude Code SDK) provides native multi-agent orchestration that could replace 80%+ of our custom Hivemind implementation. This document analyzes how the SDK addresses our pain points and proposes a migration path.

---

## Pain Points Solved

| Current Hivemind Pain | SDK Solution |
|-----------------------|--------------|
| PTY write vs keyboard events | No PTY - direct `query()` API |
| ESC character kills agents | No terminal signals to manage |
| Ghost text / autocomplete bugs | No xterm.js = no ghost text |
| Stuck agent detection | Built-in agent loop with timeouts |
| Auto-nudge complexity | Hooks provide lifecycle control |
| Focus stealing | No DOM/browser to steal focus |
| Session persistence hacks | Native `resume: sessionId` |
| Context overflow | Auto-compaction built-in |
| Trigger file IPC | Subagents report directly to orchestrator |
| Message queue system | Parent-child message passing native |
| Terminal daemon architecture | SDK IS the daemon |

---

## SDK Capabilities (Official)

### 1. Subagents (Multi-Agent Native)

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async for message in query(
    prompt="Coordinate team to implement feature X",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Glob", "Task"],
        agents={
            "worker-a": AgentDefinition(
                description="UI specialist for renderer and HTML",
                prompt="Handle UI changes in renderer.js and index.html",
                tools=["Read", "Edit", "Write"]
            ),
            "worker-b": AgentDefinition(
                description="Backend specialist for daemon and watchers",
                prompt="Handle terminal-daemon.js and watcher.js",
                tools=["Read", "Edit", "Bash"]
            ),
            "reviewer": AgentDefinition(
                description="Code quality reviewer",
                prompt="Review all changes for bugs and best practices",
                tools=["Read", "Glob", "Grep"]  # Read-only
            )
        }
    )
):
    print(message)
```

**Key benefits:**
- Subagents use **isolated context windows**
- Only **relevant information** flows back to orchestrator
- **Parallel execution** built-in
- `parent_tool_use_id` tracks which subagent produced what

### 2. Session Management

```python
# First query - capture session
session_id = None
async for message in query(prompt="Analyze the codebase"):
    if hasattr(message, 'subtype') and message.subtype == 'init':
        session_id = message.session_id

# Later - resume with full context
async for message in query(
    prompt="Now implement the fix",
    options=ClaudeAgentOptions(resume=session_id)
):
    print(message)
```

No more:
- `session-state.json` files
- daemon session tracking
- manual context injection on `/resume`

### 3. Lifecycle Hooks

```python
async def on_tool_complete(input_data, tool_use_id, context):
    # Log, validate, transform output
    log_to_audit(input_data)
    return {}

options = ClaudeAgentOptions(
    hooks={
        "PostToolUse": [HookMatcher(matcher="Edit|Write", hooks=[on_tool_complete])],
        "SessionEnd": [cleanup_hook],
        "Stop": [summary_hook]
    }
)
```

Available hooks:
- `PreToolUse` - validate/block before tool runs
- `PostToolUse` - audit/transform after tool runs
- `SessionStart` / `SessionEnd` - lifecycle
- `UserPromptSubmit` - intercept user input
- `Stop` - cleanup on completion

### 4. Permission Control

```python
# Read-only agent (Reviewer pattern)
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"],
    permission_mode="bypassPermissions"
)

# Full access agent (Worker pattern)
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Write", "Bash"],
    permission_mode="acceptEdits"
)
```

### 5. MCP Integration (We Already Built This)

```python
options = ClaudeAgentOptions(
    mcp_servers={
        "hivemind": {"command": "node", "args": ["./mcp-server.js"]}
    }
)
```

Our existing MCP work (`ui/mcp-server.js`) could plug directly in.

---

## Proposed Migration

### Phase 1: Proof of Concept
- Create `hivemind-sdk.py` with Lead + 3 subagents
- Test basic coordination without any UI
- Verify session resume works

### Phase 2: UI Wrapper (Optional)
- Simple Electron app that displays SDK output
- No terminals - just formatted message display
- User input routes to `query()` calls

### Phase 3: Feature Parity
- Port trigger system to hooks
- Port workflow gates to permission modes
- Port heartbeat to SDK lifecycle

### What We Keep
- `CLAUDE.md` role injection (SDK reads these natively)
- `workspace/` structure for shared files
- MCP server if needed for custom tools
- Review/verification workflow (as subagent definitions)

### What We Delete
- `terminal-daemon.js` (SDK replaces this)
- `daemon-client.js` (no daemon needed)
- `xterm.js` integration (no terminals)
- PTY management (no PTY)
- Keyboard event hacks (no DOM)
- Auto-nudge/stuck detection (SDK handles)
- Focus management (no focus to manage)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SDK is new, may have bugs | Start with PoC, keep old code |
| Requires API key (not Claude.ai auth) | User likely already has API access |
| Less visual (no terminal streams) | Build simple output viewer |
| Learning curve | SDK is simpler than our current code |

---

## Recommendation

**STRONG RECOMMEND: Migrate to Claude Agent SDK**

Reasons:
1. Solves 90% of our active bugs (PTY, ghost text, stuck agents)
2. Native multi-agent is exactly what Hivemind needs
3. Maintained by Anthropic (not us debugging xterm edge cases)
4. Simpler codebase = easier to extend
5. Session management is built-in

The ~3000 lines in `ui/` could become ~200 lines of SDK calls.

---

## Sources

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [SDK Python GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [SDK TypeScript npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)

---

## Next Steps

1. **Lead**: Review this analysis, decide on PoC scope
2. **Workers**: Stand by for PoC implementation tasks
3. **Reviewer**: Verify SDK claims against our requirements
4. **User**: Confirm API key availability and interest in migration
