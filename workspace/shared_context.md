# Hivemind Shared Context

**Last Updated:** Jan 23, 2026 - D4 COMPLETE, WORKER A GO

---

## SPRINT #2: Terminal Daemon Architecture

**Status:** EXECUTING
**Priority:** HIGH - Core architectural improvement

---

## Why This Matters

Current architecture: PTY processes are children of Electron main process. If main.js restarts (hot reload, crash, user closes app), ALL terminals die and we lose context.

New architecture: Separate daemon process owns the PTYs. Electron app is just a client. Terminals survive app restarts.

**This enables:**
- Hot reload without losing terminal sessions
- Crash recovery (terminals survive, just reconnect)
- Close app, reopen later, we're still running
- True autonomous development loop

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  terminal-daemon.js (separate Node process)         │
│  - Runs independently, survives app restarts        │
│  - Manages all PTY processes                        │
│  - Listens on named pipe (Windows) or Unix socket   │
├─────────────────────────────────────────────────────┤
│  PTY 1 ──┬── PTY 2 ──┬── PTY 3 ──┬── PTY 4         │
│  (Lead)  │ (Worker A)│ (Worker B)│ (Reviewer)       │
└──────────┴───────────┴───────────┴──────────────────┘
              ▲
              │ IPC (named pipe)
              ▼
┌─────────────────────────────────────────────────────┐
│  Electron App (client)                              │
│  - main.js connects to daemon                       │
│  - Relays input/output only                         │
│  - Can restart without killing terminals            │
│  - Reconnects automatically on startup              │
└─────────────────────────────────────────────────────┘
```

---

## Task Assignments

| Task | Owner | Status | Description |
|------|-------|--------|-------------|
| D1 | Worker B | **DONE** | Create `terminal-daemon.js` - PTY management, named pipe server |
| D2 | Worker B | **DONE** | Create `daemon-client.js` - Client library for connecting |
| D3 | Worker B | **DONE** | Add daemon lifecycle scripts to package.json |
| D4 | Lead | **DONE** | Refactor `main.js` to use daemon-client instead of direct PTY |
| D5 | Worker A | **DONE** | Update renderer.js for reconnection UI |
| D6 | Reviewer | **NOW** | Verify full flow: daemon survives app restart |

---

## Protocol Spec

### Client → Daemon
```json
{ "action": "spawn", "paneId": 1, "cwd": "D:\\projects\\hivemind" }
{ "action": "write", "paneId": 1, "data": "hello\n" }
{ "action": "resize", "paneId": 1, "cols": 80, "rows": 24 }
{ "action": "kill", "paneId": 1 }
{ "action": "list" }
{ "action": "attach", "paneId": 1 }
```

### Daemon → Client
```json
{ "event": "data", "paneId": 1, "data": "output here" }
{ "event": "exit", "paneId": 1, "code": 0 }
{ "event": "spawned", "paneId": 1, "pid": 1234 }
{ "event": "list", "terminals": [{ "paneId": 1, "pid": 1234, "alive": true }] }
{ "event": "error", "message": "..." }
```

---

## File Ownership

| File | Owner | Notes |
|------|-------|-------|
| `ui/terminal-daemon.js` | Worker B | NEW - daemon process |
| `ui/daemon-client.js` | Worker B | NEW - client library |
| `ui/main.js` | Lead | MODIFY - use daemon-client |
| `ui/renderer.js` | Worker A | MODIFY if needed |
| `ui/package.json` | Worker B | MODIFY - add scripts |

---

## Startup Flow

1. App launches
2. Try to connect to daemon (named pipe: `\\.\pipe\hivemind-terminal`)
3. If connection fails → spawn daemon as detached process → wait → retry connect
4. Once connected → send `list` to get existing terminals
5. If terminals exist → reattach (reconnect UI to existing sessions)
6. If no terminals → spawn new ones as before
7. Renderer displays terminals normally

---

## Workers: Start Here

**Worker B:** ✅ D1, D2, D3 COMPLETE.

**Lead:** ✅ D4 COMPLETE. main.js now uses daemon client.

---

## WORKER A: D5 COMPLETE ✅

Added to `renderer.js`:
- `reattachTerminal(paneId)` - creates xterm UI, connects to existing PTY (no create call)
- `setupDaemonListeners()` - handles daemon-connected, daemon-reconnected, daemon-disconnected

**Behavior:** On startup, if daemon has existing terminals, they get reattached automatically with "[Session restored from daemon]" message.

---

**Reviewer:** D6 ready after Worker A confirms D5.

---

## Reference: What Lead Changed in D4

- Removed `node-pty` import, added `daemon-client` import
- Added `initDaemonClient()` with event handlers for data, exit, spawned, connected, etc.
- All `pty-*` IPC handlers now call `daemonClient.spawn/write/resize/kill()`
- App close now disconnects from daemon (doesn't kill terminals)
- Terminals survive app restart!

---

## Success Criteria

1. Start app → daemon spawns automatically
2. Terminals work as before
3. Close app completely
4. Reopen app → terminals still there, context preserved
5. Hot reload main.js → terminals survive

---

**STATE: EXECUTING**
