# V11: MCP Integration

## Goal
Replace file-based triggers with Model Context Protocol for structured, reliable agent communication.

---

## Background

Current system uses file-based triggers (`workspace/triggers/*.txt`) which:
- Require file watcher (race conditions possible)
- No structured protocol
- No built-in error handling
- Workaround for Claude CLI's black-box nature

MCP (Model Context Protocol) is Anthropic's standard for AI-tool integration:
- Native to Claude Code
- Structured JSON-RPC protocol
- Built-in tool discovery
- Proper error handling

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hivemind Electron App                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Hivemind MCP Server                     │    │
│  │  (stdio transport, runs as child process)           │    │
│  │                                                      │    │
│  │  Tools:                                              │    │
│  │  - send_message(to, content)                        │    │
│  │  - get_messages()                                   │    │
│  │  - claim_task(task_id)                              │    │
│  │  - complete_task(task_id, result)                   │    │
│  │  - get_workflow_state()                             │    │
│  │  - trigger_agent(agent_id, context)                 │    │
│  │  - get_shared_context()                             │    │
│  │  - update_status(task, status)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│         ▲              ▲              ▲              ▲       │
│         │ stdio        │ stdio        │ stdio        │ stdio │
│  ┌──────┴───┐   ┌──────┴───┐   ┌──────┴───┐   ┌──────┴───┐  │
│  │ Claude   │   │ Claude   │   │ Claude   │   │ Claude   │  │
│  │ (Lead)   │   │ (Wkr A)  │   │ (Wkr B)  │   │ (Review) │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. MCP Server Core (HIGH - Lead)
Build the MCP server that all Claude instances connect to.

**Files:** `ui/mcp-server.js` (new)

**Dependencies:**
```json
"@modelcontextprotocol/sdk": "^1.0.0"
```

**Implementation:**
- Stdio transport (spawned per-agent)
- Agent identification via init params
- Tool definitions with JSON schemas

### 2. MCP Tool Integration (HIGH - Worker B)
Connect MCP tools to existing message queue and state machine.

**Files:** `ui/mcp-server.js`, `ui/modules/watcher.js`

**Implementation:**
- Bridge `send_message` to `watcher.sendMessage()`
- Bridge `get_messages` to `watcher.getMessages()`
- Bridge state tools to state.json read/write

### 3. MCP UI & Auto-Setup (MEDIUM - Worker A)
Show MCP status and auto-configure on startup.

**Files:** `ui/renderer.js`, `ui/index.html`

**Implementation:**
- MCP connection indicator per pane
- Auto-run `claude mcp add` on first launch
- Health check polling

---

## Tasks

| Task | Owner | Description |
|------|-------|-------------|
| MC1 | Lead | MCP server skeleton - stdio transport, tool registration |
| MC2 | Lead | Messaging tools - send_message, get_messages |
| MC3 | Lead | Workflow tools - get_state, trigger_agent, claim_task, complete_task |
| MC4 | Worker B | Connect MCP to watcher.js message queue |
| MC5 | Worker B | Agent identification - pass paneId in MCP init |
| MC6 | Worker B | State machine integration via MCP |
| MC7 | Worker A | MCP status indicator in agent header |
| MC8 | Worker A | Auto-configure MCP on app startup |
| MC9 | Worker A | MCP health monitoring and reconnection |
| R1 | Reviewer | Verify all MCP tools work correctly |

---

## Implementation Notes

### MC1: MCP Server Skeleton

```javascript
// ui/mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server({
  name: 'hivemind',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Tool definitions registered here
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'send_message',
      description: 'Send a message to another agent',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', enum: ['lead', 'worker-a', 'worker-b', 'reviewer', 'all'] },
          content: { type: 'string' },
        },
        required: ['to', 'content'],
      },
    },
    // ... more tools
  ],
}));

const transport = new StdioServerTransport();
server.connect(transport);
```

### MC2: Messaging Tools

```javascript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'send_message':
      const result = await sendMessage(agentId, args.to, args.content);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };

    case 'get_messages':
      const messages = await getMessages(agentId);
      return { content: [{ type: 'text', text: JSON.stringify(messages) }] };
  }
});
```

### MC3: Workflow Tools

```javascript
// get_workflow_state - Read state.json
// trigger_agent - Write to trigger file + emit event
// claim_task - Update claims in state.json
// complete_task - Update status.md + trigger next agent
```

### MC4: Bridge to watcher.js

```javascript
// In mcp-server.js, import watcher functions
const watcher = require('./modules/watcher');

async function sendMessage(fromAgent, toAgent, content) {
  const fromPaneId = AGENT_TO_PANE[fromAgent];
  const toPaneId = AGENT_TO_PANE[toAgent];
  return watcher.sendMessage(fromPaneId, toPaneId, content, 'mcp');
}
```

### MC5: Agent Identification

Each Claude instance runs with agent ID:
```bash
claude mcp add --transport stdio hivemind -- node mcp-server.js --agent lead
```

Server reads `--agent` arg to identify which pane it serves.

### MC6: State Machine Integration

```javascript
case 'get_workflow_state':
  const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
  return { content: [{ type: 'text', text: JSON.stringify(state) }] };

case 'trigger_agent':
  await triggerAgent(args.agent, args.context);
  return { content: [{ type: 'text', text: 'Agent triggered' }] };
```

### MC7: Status Indicator

```html
<div class="mcp-status" id="mcp-status-1">
  <span class="mcp-dot connected"></span>
  <span>MCP</span>
</div>
```

### MC8: Auto-Configure

On app startup, for each pane:
```javascript
async function configureMcpForAgent(paneId, agentName) {
  const mcpServerPath = path.join(__dirname, 'mcp-server.js');
  const command = `claude mcp add --transport stdio hivemind-${agentName} -- node "${mcpServerPath}" --agent ${agentName}`;
  // Execute in terminal or via child_process
}
```

### MC9: Health Monitoring

Poll MCP server status, show reconnect button if disconnected.

---

## File Ownership

| Owner | Files |
|-------|-------|
| Lead | mcp-server.js (new), package.json |
| Worker A | renderer.js, index.html (status UI) |
| Worker B | watcher.js (bridge), mcp-server.js (integration) |

---

## Migration Path

1. V11 adds MCP as **additional** communication method
2. File-based triggers remain for backward compatibility
3. Future version can deprecate file triggers once MCP proven stable

---

## Success Criteria

- [ ] `node mcp-server.js --agent lead` starts without error
- [ ] Claude Code can connect: `claude mcp add --transport stdio hivemind -- node mcp-server.js --agent lead`
- [ ] `send_message` tool delivers to target agent
- [ ] `get_messages` returns pending messages
- [ ] `get_workflow_state` returns current state
- [ ] UI shows MCP connection status
- [ ] Auto-configuration works on fresh install
- [ ] All existing functionality still works

---

## Dependencies

```bash
cd ui && npm install @modelcontextprotocol/sdk
```

---

**Awaiting Reviewer approval before starting implementation.**
