# Session Semantics

Last verified: 2026-02-19

Hivemind has multiple session concepts. They are related but not identical.

## 1) App Session Scope (`commsSessionScopeId`)

- Owner: main process (`ui/modules/main/hivemind-app.js`).
- Created at startup in `initializeStartupSessionScope()`.
- Format: `app-session-<sessionNumber>-<ledgerSessionId>` (or fallback `app-<pid>-<timestamp>`).
- Used for:
  - WebSocket runtime session scope (`websocketServer.start({ sessionScopeId })`)
  - Comms journal `session_id` writes (`upsert-comms-journal`)
  - Auto-handoff filtering (`materializeSessionHandoff({ sessionId })`)

This is the authoritative "current app run" session boundary.

## 2) Project Bootstrap Session (`.hivemind/link.json -> session_id`)

- Owner: project selection/switch flow (`ui/modules/ipc/project-handlers.js`).
- Written by `writeProjectBootstrapFiles(...)` into `<project>/.hivemind/link.json`.
- Source value comes from:
  - `deps.getSessionId()` when available, else
  - app-status session fields.
- Used by `hm-send` to attach project metadata for cross-project routing context.

This is project-attached metadata, not the live in-memory app scope.

## 3) Per-Message Session Fields

There are two common session fields on message paths:

1. `comms_journal.session_id`
   - Written by broker/main process as `this.commsSessionScopeId`.
   - Meaning: "which app session handled this delivery record."
2. `metadata.project.session_id`
   - Attached by `hm-send` from `link.json`/runtime session resolution.
   - Meaning: "project context claimed by sender at send time."

These can differ.

## Example

`hm-send` outbound payload includes project metadata:

```json
{
  "type": "send",
  "metadata": {
    "project": {
      "name": "hivemind",
      "path": "D:/projects/hivemind",
      "session_id": "app-session-145-s_abc123"
    }
  }
}
```

Broker journal upsert uses app scope:

```json
{
  "messageId": "hm-...",
  "sessionId": "app-session-145-s_abc123",
  "metadata": {
    "project": {
      "session_id": "app-session-145-s_abc123"
    }
  }
}
```

If `link.json` is stale, `metadata.project.session_id` may lag behind app scope until project bootstrap is rewritten.

## Operator Rules

1. For runtime slicing and handoff generation, trust `comms_journal.session_id`.
2. For sender/project attribution, inspect `metadata.project.*`.
3. Do not assume unresolved claims are session-scoped in handoff generation; unresolved claim query is currently cross-session.
