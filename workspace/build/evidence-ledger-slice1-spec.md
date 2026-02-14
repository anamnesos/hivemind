# Evidence Ledger Slice 1 Spec

Author: DevOps (Pane 2)
Date: 2026-02-11
Status: Draft for implementation
Scope: Slice 1 only (event kernel hardening + durable ledger + trace propagation)

---

## 1) Goal of Slice 1

Build a durable, queryable event backbone for delivery/injection execution traces, without replacing current workflows.

Slice 1 delivers:
1. Canonical event envelope contract enforced at ingestion points.
2. End-to-end trace propagation across ws -> inject -> ipc -> pty -> ack.
3. Durable append store (SQLite, WAL) with indexed query primitives.
4. Minimal replay API for trace reconstruction (not full investigation workspace UI).

Slice 1 does not deliver:
1. Full incident workspace UX.
2. Hypothesis/decision authoring UI.
3. Cross-session narrative generation.

---

## 2) Build Scope (Exact)

### 2.1 Canonical Envelope v1

Canonical event envelope (stored and transported):

```json
{
  "eventId": "evt_uuid",
  "traceId": "trc_uuid",
  "spanId": "spn_uuid",
  "parentEventId": "evt_uuid_or_null",

  "correlationId": "legacy_alias_of_traceId",
  "causationId": "legacy_alias_of_parentEventId",

  "type": "inject.submit.sent",
  "stage": "ws|trigger|route|inject|ipc|pty|ack|verify|system",
  "source": "module/file",
  "paneId": "1|2|5|system",
  "role": "architect|devops|analyst|system|unknown",

  "ts": 1739290000000,
  "seq": 123,
  "direction": "inbound|outbound|internal",

  "payload": {},
  "evidenceRefs": [
    {
      "kind": "file_line|log_slice|hash",
      "path": "ui/modules/terminal/injection.js",
      "line": 812,
      "hash": "sha256:...",
      "note": "optional"
    }
  ],

  "meta": {
    "messageId": "hm-...",
    "deliveryId": "optional",
    "transport": "ws|trigger|ipc|daemon",
    "attempt": 1,
    "maxAttempts": 3
  }
}
```

Rules:
1. `eventId`, `traceId`, `type`, `stage`, `source`, `ts` are required.
2. `correlationId = traceId` and `causationId = parentEventId` for backward compatibility.
3. Missing required fields are normalized if possible, else event is dropped with `event.invalid` diagnostic emission.
4. Payload stays as JSON; no schema lock per event type in Slice 1.

### 2.2 Correlation/Trace Propagation Points

Required path for each inbound message:
1. WS ingress: derive `traceId` from `message.messageId` if present; else generate.
2. Trigger ingress: derive `traceId` from `deliveryId` if present; else generate once at trigger handling.
3. Renderer injection queue: preserve same `traceId` through `inject.requested`, `inject.queued`, `inject.applied`, `inject.submit.*`.
4. IPC PTY write(s): each chunk gets unique `spanId`, same `traceId`, `parentEventId` set to injector event.
5. Daemon write requested/ack: ack reuses same `traceId`, parent links to request event.
6. WS send ack back to caller: includes same `traceId` in `handlerResult` metadata.

No new trace root should be created once one exists for the message.

### 2.3 Durable Store (SQLite WAL)

Database file:
- `workspace/runtime/evidence-ledger.db`

PRAGMAs at startup:
1. `journal_mode=WAL`
2. `synchronous=NORMAL`
3. `temp_store=MEMORY`
4. `foreign_keys=ON`
5. `busy_timeout=5000`

#### Table: `ledger_events`

```sql
CREATE TABLE IF NOT EXISTS ledger_events (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  trace_id TEXT NOT NULL,
  span_id TEXT,
  parent_event_id TEXT,

  correlation_id TEXT,
  causation_id TEXT,

  type TEXT NOT NULL,
  stage TEXT NOT NULL,
  source TEXT NOT NULL,
  pane_id TEXT,
  role TEXT,

  ts_ms INTEGER NOT NULL,
  seq INTEGER,
  direction TEXT,

  payload_json TEXT NOT NULL,
  payload_hash TEXT,
  evidence_refs_json TEXT,
  meta_json TEXT,

  ingested_at_ms INTEGER NOT NULL,
  session_id TEXT
);
```

#### Table: `ledger_edges`

```sql
CREATE TABLE IF NOT EXISTS ledger_edges (
  edge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id TEXT NOT NULL,
  from_event_id TEXT NOT NULL,
  to_event_id TEXT NOT NULL,
  edge_type TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  UNIQUE(trace_id, from_event_id, to_event_id, edge_type)
);
```

`edge_type` values for Slice 1:
1. `parent`
2. `ack_of`
3. `retry_of`

#### Table: `ledger_spans`

```sql
CREATE TABLE IF NOT EXISTS ledger_spans (
  span_id TEXT PRIMARY KEY,
  trace_id TEXT NOT NULL,
  parent_span_id TEXT,
  stage TEXT NOT NULL,
  source TEXT NOT NULL,
  pane_id TEXT,
  role TEXT,
  started_at_ms INTEGER NOT NULL,
  ended_at_ms INTEGER,
  status TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0
);
```

#### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ledger_events_trace_ts
  ON ledger_events(trace_id, ts_ms, row_id);

CREATE INDEX IF NOT EXISTS idx_ledger_events_type_ts
  ON ledger_events(type, ts_ms);

CREATE INDEX IF NOT EXISTS idx_ledger_events_stage_ts
  ON ledger_events(stage, ts_ms);

CREATE INDEX IF NOT EXISTS idx_ledger_events_pane_ts
  ON ledger_events(pane_id, ts_ms);

CREATE INDEX IF NOT EXISTS idx_ledger_events_parent
  ON ledger_events(parent_event_id);

CREATE INDEX IF NOT EXISTS idx_ledger_edges_trace
  ON ledger_edges(trace_id, created_at_ms);
```

Retention for Slice 1:
1. TTL default: 7 days.
2. Hard cap default: 2,000,000 rows.
3. Prune job in main/daemon at startup and every 15 minutes.

---

## 3) What Stays Untouched

Do not replace these in Slice 1:
1. Existing handoff docs/process (`workspace/build/status.md`, `errors.md`, `blockers.md`, session handoff files).
2. Existing event-bus ring buffer behavior and query API semantics.
3. Existing kernel event names and current consumers.
4. Existing trigger fallback behavior and ACK protocol.

Slice 1 is additive. Existing dashboards and workflows must continue working even if the ledger is disabled.

---

## 4) Integration Points (Code-Level)

### 4.1 Main process and WS ingress

1. `ui/modules/websocket-server.js`
- In `handleMessage`, build/attach trace context (`traceId`, `spanId`, `parentEventId`) for `send`/`broadcast`.
- Include `traceId` in ack payload details.
- Emit normalized ingress events (`ws.message.received`, `ws.send.ack.sent`) via kernel bridge/event bus.

2. `ui/modules/main/hivemind-app.js`
- In `onMessage` callback passed to websocket server, preserve/forward trace context when routing through triggers.
- Ensure `comms.send.started` and `comms.retry.attempted` events carry same trace context.

3. `ui/modules/main/kernel-bridge.js`
- Extend bridge event builder to accept pre-existing `traceId`/`parentEventId` (do not always generate new correlation).

### 4.2 Trigger and renderer routing

4. `ui/modules/triggers.js`
- Extend `sendDirectMessage`/`sendStaggered` and trigger-file route to pass `traceCtx` inside `inject-message` IPC payload.
- Keep `deliveryId` behavior intact; map `deliveryId` into trace metadata.

5. `ui/modules/daemon-handlers.js`
- On `ipcRenderer.on('inject-message')`, read `traceCtx` and pass into throttle queue item.
- In `processThrottleQueue`, pass trace info to `terminal.sendToPane` options.
- Emit `inject.route.received` and `inject.route.dispatched` events with trace context.

### 4.3 Injection to IPC to daemon

6. `ui/modules/terminal/injection.js`
- Update `sendToPane` to accept optional incoming `correlationId/traceId`; do not call `bus.startCorrelation()` when supplied.
- Update `createKernelMeta()` to include `traceId` and `parentEventId` in addition to current fields.
- Ensure all `bus.emit('inject.*')` preserve incoming trace.

7. `ui/modules/ipc/pty-handlers.js`
- Preserve trace metadata in `pty-write` and `pty-write-chunked` including per-chunk child span/event IDs.
- Emit failure event with trace on chunk write failure.

8. `ui/daemon-client.js`
- Keep `writeAndWaitAck` request/ack map keyed by event ID, but attach and return `traceId`.

9. `ui/terminal-daemon.js`
- In `write` action handling, preserve trace context when emitting `daemon.write.requested` and `daemon.write.ack`.
- Ensure ack event links back through `requestedByEventId` and `parentEventId`.

### 4.4 Ledger sink/writer

10. New module: `ui/modules/main/evidence-ledger-store.js`
- Own SQLite connection and schema migration.
- Provide `appendEvent(envelope)` and `appendBatch(events)`.
- Provide `queryTrace(traceId, options)` and `queryEvents(filters)`.

11. New module: `ui/modules/main/evidence-ledger-ingest.js`
- Normalize envelope v1.
- Build edge rows.
- Validate required fields.

12. Hook sink registration in app startup (`ui/modules/main/hivemind-app.js` or `ui/main.js`):
- Subscribe to kernel bridge/event emissions and persist to ledger asynchronously.

---

## 5) Implementation Plan (Practical Steps)

Phase A: Schema and sink
1. Add `evidence-ledger-store.js` with schema migration and append APIs.
2. Add ingestion normalizer and field validation.
3. Add basic trace query helper.

Phase B: Trace propagation
1. Add trace context creation at WS ingress.
2. Pass trace context through triggers -> renderer inject-message -> terminal.sendToPane.
3. Preserve trace through injection bus events and PTY kernelMeta.
4. Preserve trace in daemon write requested/ack events.

Phase C: Compatibility and guardrails
1. Keep ring buffer and existing queries unchanged.
2. Add config flag: `evidenceLedgerEnabled` (default true in dev, true in prod unless db open fails).
3. On DB failure, log once and degrade gracefully to in-memory only.

---

## 6) Test Plan

### 6.1 Unit tests

1. Envelope normalizer
- fills required fields
- preserves provided trace links
- maps legacy `correlationId/causationId` consistently

2. Store migration
- creates all tables/indexes
- idempotent migration on restart

3. Store append/query
- append single and batch
- query by trace, stage, type, time range

4. Edge builder
- parent and ack edges generated correctly

### 6.2 Integration tests

1. WS path trace continuity
- send via `hm-send.js`
- assert one trace spans ws ingress -> inject.* -> daemon.write.requested -> daemon.write.ack -> send-ack

2. Trigger fallback continuity
- force WS stale/unhealthy path
- assert trace continuity from trigger ingress to injection and ack path

3. Retry/handler error path
- simulate handler error and retries
- assert retry edges and terminal ack status still linked to original trace

4. Cross-pane routing
- send to pane 1/2/5 and validate pane-specific trace events

### 6.3 Performance and durability tests

1. Write throughput soak: 10k events, p95 append latency < 5ms (single writer, batched).
2. Crash safety: write events, hard-stop process, restart, verify committed rows present.
3. Memory check: no unbounded in-memory queue growth while ledger enabled.

---

## 7) Success Criteria

Slice 1 is done when all are true:
1. For a normal `hm-send` flow, at least 95% of emitted events in ws->inject->pty->ack path share one `traceId`.
2. Trace query returns ordered causal chain (parent links + timestamps) for any recent message.
3. Existing ring-buffer queries and current UI behavior are unchanged.
4. App remains functional if SQLite is unavailable (degraded mode).
5. New tests for normal path, fallback path, and handler_error path are green.

---

## 8) Risks and Edge Cases

1. Multi-process write contention
- Mitigation: single writer in main/daemon service; renderer never writes DB directly.

2. High-volume event storms (pty data)
- Mitigation: keep telemetry sampling for noisy types; only persist selected event families in Slice 1 if needed behind allowlist.

3. Trace breakage from legacy call sites
- Mitigation: normalization fallback + compatibility aliases; add assertion logs for trace resets.

4. Clock skew between renderer/main/daemon
- Mitigation: store both event `ts` and `ingested_at_ms`; order by causal edge first, ts second.

5. DB growth and privacy
- Mitigation: TTL + row cap pruning, payload redaction reuse from event-bus sanitizer, configurable retention.

6. Duplicate event IDs
- Mitigation: unique index on `event_id`; duplicates ignored with diagnostic counter.

---

## 9) Out of Scope (Slice 2+)

Deferred to later slices:
1. Analyst workspace objects (hypotheses, verdict revisions, confidence transitions).
2. Rich evidence binding UX (pinning log slices, file snapshot capture UI).
3. Narrative memory assistant over incident history.

Slice 1 only provides the trust-grade event substrate these features depend on.

---

## 10) Fresh-Agent Build Checklist

1. Create ledger store module and migrations.
2. Add envelope normalizer and validator.
3. Wire WS ingress trace context.
4. Pass trace context through triggers and renderer injection queue.
5. Preserve trace in injection -> ipc -> daemon write/ack.
6. Persist normalized events to SQLite asynchronously.
7. Add unit + integration + durability tests listed above.
8. Verify no regression in current tests and no change in existing handoff/ring buffer behavior.
