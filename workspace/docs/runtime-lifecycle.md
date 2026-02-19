# Runtime Lifecycle

Last verified: 2026-02-19

## Startup Order (Main Process)

1. `HivemindApp.initialize()` loads settings and window (`ui/modules/main/hivemind-app.js`).
2. Daemon connection completes; app status is written (`settings-manager.writeAppStatus`).
3. If a new app session was spawned, startup records an Evidence Ledger session via `executeEvidenceLedgerOperation('record-session-start', ...)` and sets `this.commsSessionScopeId`.
4. WebSocket comms starts via `websocketServer.start({ sessionScopeId: this.commsSessionScopeId, ... })`.
5. Post-load, watcher workers start (`watcher.startWatcher`, `startTriggerWatcher`, `startMessageWatcher`).
6. Auto-handoff timer starts (`startAutoHandoffMaterializer`).
7. Team Memory/Experiment runtimes stay lazy until first use.

## Shared Runtime Matrix

| Runtime | Created | Cache model | Reset API | Project switch behavior |
| --- | --- | --- | --- | --- |
| Evidence Ledger | First `initialize/executeEvidenceLedgerOperation` call (startup session-start usually triggers it) | Module singleton `sharedRuntime` in `ui/modules/ipc/evidence-ledger-runtime.js` (or worker runtime) | `closeSharedRuntime()`, or `initializeEvidenceLedgerRuntime({ forceRuntimeRecreate: true })` | `ui/modules/ipc/project-handlers.js` calls force recreate during `syncProjectRoot(...)`. |
| Team Memory | First `ensureTeamMemoryInitialized(...)`/operation call | Module singleton `sharedRuntime` in `ui/modules/team-memory/runtime.js` (or worker runtime) | `closeTeamMemoryRuntime()` / `runtime.closeSharedRuntime()`, or `initializeTeamMemoryRuntime({ forceRuntimeRecreate: true })` | `ui/modules/ipc/project-handlers.js` calls force recreate during `syncProjectRoot(...)`. |
| Watcher workers (workspace/trigger/message) | `initPostLoad()` | Process refs in `ui/modules/watcher.js` (`workspaceWatcher`, `triggerWatcher`, `messageWatcher`) | `stopWatcher()`, `stopTriggerWatcher()`, `stopMessageWatcher()` | Not explicitly restarted on project switch; state/project path is updated via `watcher.writeState(...)` + `setProjectRoot(...)`. |
| WebSocket runtime | `websocketServer.start(...)` in app init | Singleton `wss` + in-memory/outbound queue state in `ui/modules/websocket-runtime.js` | `websocketServer.stop()` / `websocket-runtime.stop()` | Not explicitly restarted on project switch. Current session scope remains the app session scope. |
| Comms worker client/process | When worker mode enabled and `websocketServer.start(...)` delegates to `comms-worker-client.start(...)` | Cached `workerProcess`, `running`, `lastStartOptions` in `ui/modules/comms-worker-client.js`; worker auto-restart with backoff | `workerClient.stop()` (via `websocketServer.stop()`) | Not explicitly reset on project switch. Restart app/comms stack if transport context must be fully clean. |

## Session-Scope Behavior in Comms Runtime

- WebSocket queue persistence (`state/comms-outbound-queue.json`) is session-scoped by `sessionScopeId`.
- On start, `websocket-runtime.loadOutboundQueue()` discards queue data from a different session scope.
- This prevents cross-session ghost replays.

## Project Switch Contract

When `select-project`/`switch-project` runs (`ui/modules/ipc/project-handlers.js`):

1. `.hivemind/link.json` is rewritten for the selected project.
2. Watcher state `state.project` is updated.
3. `setProjectRoot(projectPath)` is applied.
4. Evidence Ledger + Team Memory runtimes are force-recreated (project DB rebind).
5. UI warns to restart agents so pane CWD/session context is clean.

## Shutdown Contract

`HivemindApp.shutdown()` performs:

1. stop auto-handoff + context compressor + Team Memory sweeps
2. close Evidence Ledger runtime
3. close Experiment + Team Memory runtimes
4. stop WebSocket/comms transport
5. stop watcher workers
6. cleanup IPC handlers and daemon connections
