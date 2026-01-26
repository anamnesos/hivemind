# SDK Architecture V2: 4 Independent Sessions

**Date:** 2026-01-25
**Status:** APPROVED DIRECTION
**Author:** Lead (with user input)

---

## Core Principle

**4 full Claude instances, NOT subagents.**

Each agent is a persistent SDK session with its own complete context window. No delegation, no "summarize and report back" - each agent sees everything in their domain.

---

## Why NOT Subagents

| Subagent Model | Independent Sessions Model |
|----------------|---------------------------|
| Spawned on demand, temporary | Persistent, always running |
| Inherits parent's context (limited view) | Own full context window |
| Returns summary to parent | Communicates directly |
| Parent compacts = everyone loses context | Each compacts independently |
| "Hyperfocused" = misses big picture | Full context = smarter decisions |
| 1 context window shared 4 ways | 4 separate context windows |

**User quote:** "sometimes that agent is too hyperfocused on task and brings back misleading information rather than a smart full instance"

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON UI                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │                     │  │  ┌────────────────────────┐  │  │
│  │                     │  │  │ Worker A (SDK #2)      │  │  │
│  │   Lead (SDK #1)     │  │  │ Full context window    │  │  │
│  │   Full context      │  │  └────────────────────────┘  │  │
│  │   window            │  │  ┌────────────────────────┐  │  │
│  │                     │  │  │ Worker B (SDK #3)      │  │  │
│  │   User talks here   │  │  │ Full context window    │  │  │
│  │                     │  │  └────────────────────────┘  │  │
│  │                     │  │  ┌────────────────────────┐  │  │
│  │                     │  │  │ Reviewer (SDK #4)      │  │  │
│  │                     │  │  └────────────────────────┘  │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
│                    [Message to Lead input]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## What SDK Replaces

| Current (PTY)                          | New (SDK)                        |
|----------------------------------------|----------------------------------|
| `pty.write(text)` + keyboard events    | `sdk.query(sessionId, message)`  |
| 50ms delays, focus hacks, ESC tricks   | Single API call                  |
| Ghost text bugs                        | No terminal = no ghost text      |
| Stuck agent detection                  | Built-in timeouts                |
| Message sits in textarea, need Enter   | Message delivered directly       |

---

## What SDK Keeps (Unchanged)

| Component | Why Keep It |
|-----------|-------------|
| 4-pane UI layout | User likes seeing all agents |
| Trigger files for inter-agent comms | Works, simple, debuggable |
| `CLAUDE.md` role injection | SDK reads these natively |
| `workspace/` shared files | Agents read/write shared context |
| Message history panel | Visual confirmation of delivery |
| Expand/collapse worker panes | UI flexibility |

---

## Message Flow

### User → Lead
```
User types in broadcast input
    ↓
Electron sends to Lead's SDK session
    ↓
sdk.query(leadSessionId, userMessage)
    ↓
Lead receives, responds
    ↓
Response displayed in Lead pane
```

### Lead → Worker (via trigger)
```
Lead writes to triggers/worker-a.txt
    ↓
File watcher detects change
    ↓
sdk.query(workerASessionId, triggerContent)
    ↓
Worker A receives, responds
    ↓
Response displayed in Worker A pane
```

### Worker → Lead (via trigger)
```
Worker writes to triggers/lead.txt
    ↓
File watcher detects change
    ↓
sdk.query(leadSessionId, triggerContent)
    ↓
Lead receives, responds
```

---

## Session Management

Each agent has a persistent session ID:

```javascript
const sessions = {
  '1': { id: 'session-lead-xxxxx', role: 'Lead' },
  '2': { id: 'session-worker-a-xxxxx', role: 'Worker A' },
  '3': { id: 'session-worker-b-xxxxx', role: 'Worker B' },
  '4': { id: 'session-reviewer-xxxxx', role: 'Reviewer' }
};
```

**On app start:**
- Check for existing session IDs in `session-state.json`
- If found: resume sessions with `sdk.query({ resume: sessionId })`
- If not found: create new sessions, save IDs

**On app close:**
- Save session IDs (sessions persist on Anthropic's side)
- Next launch can resume with full context

---

## SDK API Reference (from official docs)

### ClaudeSDKClient - This is what we use

```python
class ClaudeSDKClient:
    def __init__(self, options: ClaudeAgentOptions | None = None)
    async def connect(self, prompt: str | None = None) -> None
    async def query(self, prompt: str, session_id: str = "default") -> None
    async def receive_messages(self) -> AsyncIterator[Message]
    async def receive_response(self) -> AsyncIterator[Message]
    async def interrupt(self) -> None
    async def disconnect(self) -> None
```

**Why ClaudeSDKClient, not query():**
- `query()` = new session each time (loses context)
- `ClaudeSDKClient` = maintains session across exchanges (WHAT WE WANT)

### Key Options

```python
ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    permission_mode="acceptEdits",  # or "bypassPermissions"
    cwd="/path/to/project",
    setting_sources=["project"],  # IMPORTANT: loads CLAUDE.md files!
    resume="session-id-here",     # Resume existing session
    can_use_tool=permission_callback,  # Custom permission logic
    hooks={...}  # Lifecycle hooks
)
```

### Message Types

```python
# Response from Claude
AssistantMessage(content=[TextBlock, ToolUseBlock, ...])

# Final result - CONTAINS SESSION ID
ResultMessage(
    session_id="abc123",  # SAVE THIS for resume
    total_cost_usd=0.05,
    duration_ms=1234
)
```

### Session Resume

```python
# First run - capture session_id from ResultMessage
async for msg in client.receive_response():
    if isinstance(msg, ResultMessage):
        session_id = msg.session_id  # Save this!

# Later - resume with full context
options = ClaudeAgentOptions(resume=session_id)
```

---

## Implementation Plan

### Phase 1: Python SDK Manager (`hivemind-sdk-v2.py`)

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

class HivemindAgent:
    """One persistent SDK session per agent."""

    def __init__(self, role: str, pane_id: str):
        self.role = role
        self.pane_id = pane_id
        self.session_id = None
        self.client = None

    async def start(self, cwd: str, resume_id: str = None):
        options = ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
            permission_mode="acceptEdits",
            cwd=cwd,
            setting_sources=["project"],  # Loads CLAUDE.md!
            resume=resume_id
        )
        self.client = ClaudeSDKClient(options)
        await self.client.connect()

    async def send(self, message: str):
        await self.client.query(message)
        async for msg in self.client.receive_response():
            yield msg  # Stream to UI
            if isinstance(msg, ResultMessage):
                self.session_id = msg.session_id

    async def stop(self):
        await self.client.disconnect()
        return self.session_id  # For persistence


# 4 independent agents
agents = {
    '1': HivemindAgent('Lead', '1'),
    '2': HivemindAgent('Worker A', '2'),
    '3': HivemindAgent('Worker B', '3'),
    '4': HivemindAgent('Reviewer', '4'),
}
```

### Phase 2: Electron ↔ Python Bridge

Update `sdk-bridge.js` to manage 4 agents:

```javascript
// IPC: sdk-send-message
ipcMain.handle('sdk-send-message', async (event, paneId, message) => {
  // Routes to correct Python agent
  return await sdkProcess.send({ paneId, message });
});

// IPC: sdk-get-response (streaming)
ipcMain.on('sdk-subscribe', (event, paneId) => {
  sdkProcess.onMessage(paneId, (msg) => {
    mainWindow.webContents.send('sdk-message', paneId, msg);
  });
});
```

### Phase 3: Replace PTY Input

In `terminal.js`, replace `doSendToPane()`:

```javascript
// OLD: Complex keyboard event hell
function doSendToPane(paneId, message) {
  // 80 lines of PTY/focus/ESC/Enter hacks
}

// NEW: One line
async function doSendToPane(paneId, message) {
  await window.hivemind.sdk.send(paneId, message);
}
```

### Phase 4: Session Persistence

```javascript
// On app close
const sessionState = {};
for (const [paneId, agent] of agents) {
  sessionState[paneId] = await agent.stop();
}
fs.writeFileSync('session-state.json', JSON.stringify(sessionState));

// On app start
const saved = JSON.parse(fs.readFileSync('session-state.json'));
for (const [paneId, sessionId] of Object.entries(saved)) {
  await agents[paneId].start(cwd, sessionId);  // Resume!
}
```

---

## Visual Benefits (What User Asked For)

1. **See message delivery** - SDK confirms message received
2. **See each agent's response** - 4 separate panes, full visibility
3. **See agent status** - "thinking", "responding", "idle"
4. **No mystery stuck states** - SDK has proper timeouts
5. **Full context per agent** - smarter, not hyperfocused

---

## Code Changes Required

### Keep:
- `ui/index.html` - layout, CSS
- `ui/renderer.js` - UI logic, pane management
- `ui/modules/terminal.js` - xterm for OUTPUT only
- `ui/modules/watcher.js` - trigger file watching
- `ui/modules/triggers.js` - trigger routing

### Modify:
- `ui/modules/terminal.js` - remove `doSendToPane()` keyboard hacks
- `ui/main.js` - add SDK session management
- `ui/renderer.js` - wire up SDK responses to panes

### Add:
- `ui/modules/sdk-sessions.js` - 4 independent session manager
- Update `sdk-bridge.js` - multi-session support

### Remove (eventually):
- PTY write for message input (keep for raw terminal if needed)
- All the keyboard event dispatch code
- Ghost text workarounds
- Focus management hacks

---

## Success Criteria

- [ ] User message reaches Lead reliably (no stuck in textarea)
- [ ] Trigger messages reach agents reliably
- [ ] Each agent maintains independent context
- [ ] Sessions resume across app restarts
- [ ] UI shows message delivery confirmation
- [ ] No more manual Enter pressing required

---

## Critical SDK Features

### 1. CLAUDE.md Loading
```python
setting_sources=["project"]  # MUST include to load CLAUDE.md
```
Without this, agents won't read their role-specific CLAUDE.md files!

### 2. Hooks for Trigger Integration
```python
hooks={
    "UserPromptSubmit": [HookMatcher(hooks=[log_prompt])],
    "PostToolUse": [HookMatcher(matcher="Write", hooks=[notify_on_write])]
}
```
Could use `PostToolUse` on Write to detect trigger file writes and route messages.

### 3. Permission Callbacks
```python
async def can_use_tool(tool_name, input_data, context):
    # Block dangerous operations per role
    if role == "Reviewer" and tool_name in ["Write", "Edit"]:
        return PermissionResultDeny(message="Reviewer is read-only")
    return PermissionResultAllow(updated_input=input_data)
```

### 4. Streaming for Real-time UI
```python
options = ClaudeAgentOptions(include_partial_messages=True)
# Now receive StreamEvent messages for typing indicator
```

---

## Not In Scope

- Subagent delegation (explicitly rejected)
- Replacing xterm.js output display
- Changing trigger file format
- Changing CLAUDE.md structure

---

## Sources

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Python SDK Reference](https://platform.claude.com/docs/en/agent-sdk/python)
- [GitHub - claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)
- [PyPI - claude-agent-sdk](https://pypi.org/project/claude-agent-sdk/)

---

## Next Steps

1. **Lead**: Create `hivemind-sdk-v2.py` with 4 ClaudeSDKClient instances
2. **Worker B**: Update `sdk-bridge.js` for multi-session IPC
3. **Worker A**: Add session status indicators to UI
4. **Reviewer**: Verify session persistence works

---
