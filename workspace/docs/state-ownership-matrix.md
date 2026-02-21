# State Ownership Matrix

Last verified: 2026-02-19

Scope labels:
- `Global`: shared across all projects (under `GLOBAL_STATE_ROOT` from `ui/config.js`).
- `Project`: per selected project (under `<project>/.squidrun/`).

| Concern | Store (path) | Scope | Authoritative writer(s) | Primary reader(s) | Notes |
| --- | --- | --- | --- | --- | --- |
| App runtime status | `app-status.json` | Global | `ui/modules/main/settings-manager.js` (`writeAppStatus`) | `ui/modules/main/settings-manager.js`, `ui/modules/ipc/project-handlers.js`, `ui/scripts/hm-send.js`, `ui/modules/context-compressor.js` | Source of current session number and app mode. |
| Usage stats | `usage-stats.json` | Global | `ui/modules/main/usage-manager.js` | `ui/modules/main/usage-manager.js`, `ui/modules/ipc/agent-metrics-handlers.js` | Cumulative usage metrics. |
| Message sequencing state | `message-state.json` | Global | `ui/modules/triggers/sequencing.js` | `ui/modules/triggers/sequencing.js`, `ui/modules/ipc/state-handlers.js` | Dedup/order state for trigger delivery. |
| Scheduler state | `schedules.json` | Global | `ui/modules/scheduler.js` | `ui/modules/scheduler.js`, `ui/modules/ipc/scheduler-handlers.js` | Persistent job definitions. |
| Trigger fallback files | `triggers/*.txt` | Global (new) | `ui/scripts/hm-send.js` | Expected by watcher path consumers | `hm-send` now prefers global triggers; watcher trigger workers currently watch coord + legacy paths. |
| Workflow/state machine | `state.json` | Project | `ui/modules/watcher.js` (`writeState`), `ui/modules/ipc/project-handlers.js` | `ui/modules/watcher.js` (`readState`), `ui/modules/ipc/project-handlers.js`, `ui/scripts/hm-send.js` (fallback context) | Includes `project`, workflow state, active agents, claims. |
| Project bootstrap link | `link.json` | Project | `ui/modules/ipc/project-handlers.js` (`writeProjectBootstrapFiles`) | `ui/scripts/hm-send.js` (`resolveProjectContextFromLink`) | Defines `hivemind_root`, `workspace`, `session_id`, role targets. |
| Activity log | `activity.json` | Project | `ui/modules/main/activity-manager.js` | `ui/modules/main/activity-manager.js` | Operator-facing activity history. |
| Evidence ledger DB | `runtime/evidence-ledger.db` | Project | `ui/modules/ipc/evidence-ledger-runtime.js`, `ui/modules/main/comms-journal.js` | Evidence ledger runtime/memory/investigator, `ui/modules/main/auto-handoff-materializer.js`, Team Memory backfill/integrity | Canonical event + comms journal store. |
| Team memory DB | `runtime/team-memory.sqlite` | Project | `ui/modules/team-memory/runtime.js` / `ui/modules/team-memory/worker-client.js` | `ui/modules/team-memory/*`, `ui/modules/main/auto-handoff-materializer.js` (`queryUnresolvedClaims`) | Claims, decisions, guards, patterns. |
| Team memory spool | `runtime/team-memory-pattern-spool.jsonl` | Project | `ui/modules/team-memory/patterns.js` | `ui/modules/team-memory/patterns.js` sweeps | Pattern mining event spool. |
| Experiment profiles | `runtime/experiment-profiles.json` | Project | `ui/modules/experiment/profiles.js` | `ui/modules/experiment/runtime.js` | Experiment runtime profile state. |
| WebSocket outbound queue | `state/comms-outbound-queue.json` | Project | `ui/modules/websocket-runtime.js` | `ui/modules/websocket-runtime.js` | Session-scoped queue persisted across process restarts. |
| Session handoff | `handoffs/session.md` | Project | `ui/modules/main/auto-handoff-materializer.js` | `ui/modules/context-compressor.js`, operators/agents | Auto-generated deterministic handoff index. |
| Context snapshots | `context-snapshots/*.md` | Project | `ui/modules/context-compressor.js` | Evidence-ledger seed path and operators | Per-pane context restoration artifacts. |
| Shared context file | `shared_context.md` | Project | Agents/operator workflows | `ui/modules/watcher.js`, `ui/modules/ipc-handlers.js` | Collaboration context; not global. |
| Message queue files | `.squidrun/messages/queue-*.json` | Project | `ui/modules/watcher.js` (`sendMessage`) | `ui/modules/watcher.js` (`getMessages`, watcher worker) | Queue artifacts for inter-agent messaging workflows. |

## Operator Rules

1. Treat `GLOBAL_STATE_ROOT` files as orchestrator-global truth.
2. Treat `<project>/.squidrun/` files/DBs as project truth.
3. Do not rely on `workspace/` mirrors for runtime truth.
4. For memory/journal diagnosis, use `<project>/.squidrun/runtime/evidence-ledger.db` only.
