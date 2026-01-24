# Hivemind UI - Build Plan

## Architecture Pivot

**OLD**: Custom Claude API wrapper replacing Claude Code
**NEW**: UI wrapper around Claude Code CLI instances

## Why This Is Better

1. Claude Code already handles tools, permissions, file ops - we don't rebuild
2. We wrap, not replace - leverage existing battle-tested CLI
3. Shared context via file watching (already built)
4. Each agent is a real Claude Code instance with full capabilities

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Hivemind UI (Electron)                 │
├──────────────┬──────────────┬──────────────┬───────────────┤
│    Lead      │ Orchestrator │   Reviewer   │    Worker     │
│  (xterm.js)  │  (xterm.js)  │  (xterm.js)  │  (xterm.js)   │
│   claude     │    claude    │    claude    │    claude     │
├──────────────┴──────────────┴──────────────┴───────────────┤
│           shared_context.md (file watcher syncs)            │
│           workspace/build/* (coordination files)            │
└─────────────────────────────────────────────────────────────┘
```

## User Interaction

1. **Type in any pane** → Message goes to that Claude instance
2. **Broadcast button** → Message sent to ALL 4 instances
3. **Shared context** → All instances auto-read `shared_context.md`
4. **File watching** → Changes trigger re-read across all instances

## Components Needed

### UI Layer (Electron + xterm.js)
- [ ] Main window with 4-pane layout
- [ ] xterm.js terminal in each pane
- [ ] Input bar per pane + broadcast input bar
- [ ] Pane headers showing agent role/status

### Process Manager
- [ ] Spawn 4 `claude` CLI processes
- [ ] Pipe stdin/stdout to xterm.js
- [ ] Handle process lifecycle (start, restart, kill)
- [ ] Environment setup per instance (role injection)

### Shared Context Protocol
- [ ] `shared_context.md` - all instances read this
- [ ] File watcher triggers context reload
- [ ] Agents append to shared context to communicate

### Role Injection
- [ ] Each instance gets CLAUDE.md with its role
- [ ] Roles: Lead, Orchestrator, Reviewer, Worker
- [ ] Use existing role files in `roles/`

## Task Breakdown

### Phase 1: Basic Shell (Worker A)
1. **[U1]** Create Electron app scaffold
2. **[U2]** Add 4-pane layout with xterm.js
3. **[U3]** Spawn `claude` process per pane

### Phase 2: Input Handling (Worker B)
4. **[U4]** Input bar per pane → sends to that instance
5. **[U5]** Broadcast input → sends to all instances
6. **[U6]** Keyboard shortcuts (Ctrl+1-4 to focus pane)

### Phase 3: Context Sync (Lead)
7. **[U7]** Create shared_context.md protocol
8. **[U8]** File watcher integration
9. **[U9]** Role injection via CLAUDE.md per instance

### Phase 4: Polish (All)
10. **[U10]** Pane headers with status indicators
11. **[U11]** Restart/kill individual instances
12. **[U12]** Save/load session state

## Tech Stack

- **Electron** - Desktop app shell
- **xterm.js** - Terminal emulator in browser
- **node-pty** - Spawn PTY processes for proper terminal behavior
- **chokidar** - File watching (or reuse our watcher.py)

## File Ownership

| Component | Owner |
|-----------|-------|
| Electron scaffold, main process | Worker A |
| xterm.js integration, input handling | Worker B |
| Shared context, role injection | Lead |
| Review all, integration tests | Reviewer |

## Questions for Reviewer

1. Should we use Electron or a web app with local server?
2. Should each instance have its own CLAUDE.md or share one?
3. How do we handle instance crashes/restarts gracefully?

---

## Lead Response to Reviewer Conditions

### Sync Mechanism: Option 2 (MVP), then Option 3

For MVP: **Explicit sync button** - "Sync All" sends contents of `shared_context.md` to all instances.

Post-MVP: Upgrade to Option 3 (hybrid auto-inject on first message after file change).

Rationale: Get something working first. Optimization later.

### Role Injection on Startup

Each instance launched with:
1. **Working directory**: `workspace/instances/{role}/` (e.g., `workspace/instances/lead/`)
2. **CLAUDE.md in that dir**: Role-specific instructions copied from `roles/{role}.md`
3. **CLI arg**: `claude --resume` or fresh start based on session state

So: CLAUDE.md per working dir, not CLI args for role.

### Session Persistence

On app close:
- Each instance's conversation is in its working dir (Claude Code already persists)
- On reopen, prompt: "Resume previous session?"
- Yes → `claude --resume` in each pane
- No → fresh `claude` in each pane, archive old session dirs

---

**Status**: APPROVED - Ready for task assignment

**Author**: Lead
**Date**: 2024-01-18
