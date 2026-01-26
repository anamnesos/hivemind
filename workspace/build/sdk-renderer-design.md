# SDK Message Renderer Design

**Created:** 2026-01-25
**Owner:** Worker A
**Task:** #2 - SDK Message UI Renderer
**Status:** DESIGN PHASE (blocked on Task #1)

---

## Overview

Replace xterm.js terminal emulation with a simpler message renderer for SDK output. Keep the 4-pane layout, change the content from PTY streams to structured SDK messages.

---

## Current Architecture (to be replaced)

```
renderer.js → terminal.js → xterm.js → PTY via daemon
                                    ↓
                            Raw terminal output
```

**Problems with current approach:**
- Complex xterm.js integration (~500 lines in terminal.js)
- PTY keyboard hacks for message injection
- Ghost text, focus stealing, stuck detection issues
- Heavy dependency on node-pty and terminal-daemon

---

## New Architecture

```
renderer.js → sdk-renderer.js → Formatted HTML
                              ↓
                       SDK message events
                       (via IPC from Python SDK)
```

**Benefits:**
- No terminal emulation needed
- Structured message types with proper styling
- Simpler DOM manipulation
- No keyboard/focus issues

---

## Message Type Styling

| Type | CSS Class | Visual Style |
|------|-----------|--------------|
| `assistant` | `.sdk-assistant` | Default white text, monospace |
| `tool_use` | `.sdk-tool-use` | Yellow/amber, indented, tool icon |
| `tool_result` | `.sdk-tool-result` | Cyan, collapsible, code block |
| `system` | `.sdk-system` | Dim gray, italic, smaller |
| `error` | `.sdk-error` | Red background, prominent |
| `delegating` | `.sdk-delegating` | Purple, agent name highlighted |
| `subagent-complete` | `.sdk-subagent-done` | Green border, summary |

---

## Component Structure

### File: `ui/modules/sdk-renderer.js`

```javascript
/**
 * SDK Message Renderer
 * Replaces xterm.js with structured message display
 */

const PANE_IDS = ['1', '2', '3', '4'];
const PANE_ROLES = { '1': 'Lead', '2': 'Worker A', '3': 'Worker B', '4': 'Reviewer' };

// Message containers per pane
const containers = new Map();

// Initialize SDK pane (replaces initTerminal)
function initSDKPane(paneId) {
  const pane = document.querySelector(`.pane[data-pane-id="${paneId}"]`);
  const terminalDiv = pane.querySelector('.terminal-container');

  // Replace terminal with message container
  terminalDiv.innerHTML = `
    <div class="sdk-pane" data-pane-id="${paneId}">
      <div class="sdk-messages"></div>
    </div>
  `;

  containers.set(paneId, terminalDiv.querySelector('.sdk-messages'));
}

// Append message with type-specific formatting
function appendMessage(paneId, message) {
  const container = containers.get(paneId);
  if (!container) return;

  const msgEl = document.createElement('div');
  msgEl.className = `sdk-msg ${getMessageClass(message)}`;
  msgEl.innerHTML = formatMessage(message);

  container.appendChild(msgEl);
  scrollToBottom(paneId);
}

// Get CSS class based on message type
function getMessageClass(message) {
  if (message.type === 'assistant') return 'sdk-assistant';
  if (message.type === 'tool_use') return 'sdk-tool-use';
  if (message.type === 'tool_result') return 'sdk-tool-result';
  if (message.type === 'system') return 'sdk-system';
  if (message.error) return 'sdk-error';
  return 'sdk-default';
}

// Format message content based on type
function formatMessage(message) {
  if (message.type === 'assistant') {
    return `<pre class="sdk-content">${escapeHtml(message.content)}</pre>`;
  }
  if (message.type === 'tool_use') {
    const toolName = message.name || 'Unknown Tool';
    return `
      <div class="sdk-tool-header">🔧 ${escapeHtml(toolName)}</div>
      <pre class="sdk-tool-input">${escapeHtml(JSON.stringify(message.input, null, 2))}</pre>
    `;
  }
  if (message.type === 'tool_result') {
    return `
      <details class="sdk-tool-details">
        <summary>Tool Result</summary>
        <pre class="sdk-tool-output">${escapeHtml(message.content)}</pre>
      </details>
    `;
  }
  return `<pre>${escapeHtml(String(message))}</pre>`;
}

// Clear pane content
function clearPane(paneId) {
  const container = containers.get(paneId);
  if (container) container.innerHTML = '';
}

// Auto-scroll to bottom
function scrollToBottom(paneId) {
  const container = containers.get(paneId);
  if (container) container.scrollTop = container.scrollHeight;
}

// HTML escape helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show streaming/thinking indicator
function streamingIndicator(paneId, active) {
  const container = containers.get(paneId);
  if (!container) return;

  let indicator = container.querySelector('.sdk-streaming');

  if (active && !indicator) {
    indicator = document.createElement('div');
    indicator.className = 'sdk-streaming';
    indicator.innerHTML = '<span class="dot">●</span><span class="dot">●</span><span class="dot">●</span>';
    container.appendChild(indicator);
    scrollToBottom(paneId);
  } else if (!active && indicator) {
    indicator.remove();
  }
}

module.exports = {
  initSDKPane,
  appendMessage,
  clearPane,
  scrollToBottom,
  streamingIndicator,
  PANE_IDS,
  PANE_ROLES
};
```

---

## CSS Styles

### File: Add to `ui/index.html` or `ui/styles/sdk.css`

```css
/* SDK Renderer Styles */
.sdk-pane {
  height: 100%;
  overflow: hidden;
  background: #1a1a2e;
  font-family: 'Consolas', 'Monaco', monospace;
}

.sdk-messages {
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.sdk-msg {
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
}

.sdk-assistant {
  color: #eee;
}

.sdk-assistant pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.sdk-tool-use {
  background: rgba(255, 200, 87, 0.1);
  border-left: 3px solid #ffc857;
  color: #ffc857;
}

.sdk-tool-header {
  font-weight: bold;
  margin-bottom: 4px;
}

.sdk-tool-input {
  font-size: 11px;
  color: #aaa;
  margin: 0;
}

.sdk-tool-result {
  background: rgba(0, 217, 255, 0.1);
  border-left: 3px solid #00d9ff;
  color: #00d9ff;
}

.sdk-tool-details summary {
  cursor: pointer;
  font-weight: bold;
}

.sdk-tool-output {
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
}

.sdk-system {
  color: #666;
  font-style: italic;
  font-size: 11px;
}

.sdk-error {
  background: rgba(233, 69, 96, 0.2);
  border-left: 3px solid #e94560;
  color: #e94560;
}

.sdk-delegating {
  background: rgba(155, 89, 182, 0.1);
  border-left: 3px solid #9b59b6;
  color: #9b59b6;
}

/* Streaming indicator (thinking animation) */
.sdk-streaming {
  padding: 8px;
  color: #4ecca3;
}

.sdk-streaming .dot {
  animation: pulse 1.4s infinite;
  opacity: 0.3;
}

.sdk-streaming .dot:nth-child(1) { animation-delay: 0s; }
.sdk-streaming .dot:nth-child(2) { animation-delay: 0.2s; }
.sdk-streaming .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

---

## Integration Points

### 1. Replace terminal.initTerminals() with sdk-renderer.initSDKPanes()

### 2. IPC Events from Main Process

```javascript
// main.js - Forward SDK events to renderer
ipcMain.on('sdk-message', (event, paneId, message) => {
  mainWindow.webContents.send('sdk-message', paneId, message);
});

// renderer.js - Listen for SDK messages
ipcRenderer.on('sdk-message', (event, paneId, message) => {
  sdkRenderer.appendMessage(paneId, message);
});
```

### 3. Keep Broadcast Input Working

Broadcast input → IPC → Python SDK → Async iterator → IPC → Renderer

---

## Migration Checklist

- [ ] Create `ui/modules/sdk-renderer.js`
- [ ] Add SDK CSS to `index.html`
- [ ] Update `renderer.js` to use sdk-renderer instead of terminal
- [ ] Remove xterm.js imports (or keep for fallback)
- [ ] Add IPC handlers for SDK message events
- [ ] Test with Worker B's SDK backend
- [ ] Verify broadcast input still works

---

## Open Questions

1. **Streaming**: SDK uses async iterators. Should we buffer and display periodically, or append in real-time?
   - **Proposed**: Real-time append with requestAnimationFrame batching

2. **Agent separation**: With SDK, all 4 agents come from same `query()` call as subagents. How to route to 4 panes?
   - **Proposed**: Lead always in pane 1, subagent messages routed by agent name

3. **Fallback**: Keep xterm.js as fallback mode?
   - **Proposed**: No - clean break. SDK is the new architecture.

---

## Dependencies

- Task #1 complete (Worker B - SDK backend integration)
- Python SDK returning structured messages
- IPC bridge from Python to Electron main process

---
