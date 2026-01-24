# V10: Messaging System Improvements

## Goal
Make agent-to-agent messaging robust and production-ready based on team feedback.

---

## Background

During V9 messaging test, all 4 agents identified issues:
- Race conditions (messages overwritten before read)
- No delivery confirmation
- No message history
- Workflow gate blocks direct messages

---

## Features

### 1. Message Queue Backend (HIGH)
Replace single-message trigger files with persistent JSON queue.
- Append-only (no overwrites)
- Delivery tracking
- IPC events for real-time updates

### 2. Message UI (MEDIUM)
New Messages panel for viewing agent conversations.
- Conversation history
- Filter by agent
- Group message composer

### 3. Gate Bypass (MEDIUM)
Direct messages bypass workflow state machine.
- Messages always allowed
- State doesn't block communication

---

## Tasks

| Task | Owner | Description |
|------|-------|-------------|
| MQ1 | Lead | Message queue backend - JSON array with append |
| MQ2 | Lead | Delivery confirmation IPC events |
| MQ3 | Worker A | Message history UI panel |
| MQ4 | Worker B | Message queue file watcher integration |
| MQ5 | Worker B | Gate bypass for direct messages |
| MQ6 | Worker A | Group messaging UI |
| R1 | Reviewer | Verify all messaging features |

---

## Implementation Notes

### MQ1: Message Queue Format
```json
{
  "messages": [
    {
      "id": "msg-1737...",
      "from": "LEAD",
      "to": "WORKER-A",
      "timestamp": "2026-01-25T09:00:00.000Z",
      "content": "Message text here",
      "delivered": false,
      "read": false
    }
  ]
}
```
- File: `workspace/messages.json`
- Append new messages to array
- Mark delivered/read as processed

### MQ2: IPC Events
- `message-sent` - When agent writes message
- `message-delivered` - When target agent receives
- `message-read` - When target agent acknowledges

### MQ3: Messages UI
- New tab in right panel: "Messages"
- List view of conversations
- Click to expand thread
- Compose button for new messages

### MQ4: File Watcher
- Watch `workspace/messages.json`
- On change, parse and deliver pending messages
- Update delivered flag after injection

### MQ5: Gate Bypass
- In state machine, always allow message-related triggers
- Don't block on `idle`, `planning`, or `checkpoint_review`
- Only block execution triggers, not communication

### MQ6: Group Messaging
- Dropdown: "To: Worker A / Worker B / Workers / All / Reviewer"
- Resolve groups to individual messages
- Show "Sent to 2 agents" confirmation

---

## File Ownership

| Owner | Files |
|-------|-------|
| Lead | main.js (message queue, IPC events) |
| Worker A | renderer.js (Messages UI), index.html |
| Worker B | terminal-daemon.js (watcher), main.js (gate bypass) |

---

## Success Criteria

- [ ] Messages persist across writes (no race conditions)
- [ ] Delivery confirmation events fire correctly
- [ ] Message history visible in Messages tab
- [ ] Direct messages work regardless of workflow state
- [ ] Group messaging sends to correct recipients
- [ ] All existing tests still pass

---

**Awaiting Reviewer approval before starting implementation.**
