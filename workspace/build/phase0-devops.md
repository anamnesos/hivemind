# Phase 0 - DevOps Review (Daemon + Bridge)

**Author:** DevOps  
**Date:** 2026-02-10  
**Inputs reviewed:**
- `workspace/build/event-kernel-plan.md` (v3)
- `docs/event-kernel-spec.md` (draft 0.1)
- Current daemon/runtime implementation (`ui/terminal-daemon.js`, `ui/daemon-client.js`, `ui/modules/ipc/pty-handlers.js`, `ui/modules/main/hivemind-app.js`)

---

## Executive Summary

The direction is sound. The biggest constraint is cross-process reality: renderer-only events are useful, but the highest-value incident chains cross `renderer -> main -> daemon -> PTY -> main -> renderer`.

My recommendation:
1. Keep Lane A authoritative in renderer/main for Phase 1/2, **but define daemon event compatibility now**.
2. Add a thin daemon bridge in first vertical slice (Phase 2), not later.
3. Treat `pty.data.received` as **metadata-first** (bytes/chunk/meaningful flag), not full payload by default, to keep overhead predictable.
4. Keep most `defer/drop` contract enforcement in renderer/main initially; daemon should support only deterministic, bounded defer/drop where local state is sufficient.

---

## 1) Daemon-Side Event Taxonomy - What is Cheap vs Expensive

### Cheap (emit immediately; low risk)

- `daemon.write.requested`
  - Emit at daemon message ingress for `action=write`.
  - Payload: `{ paneId, dataLen, mode, dryRun, requestedBy }` (sanitized, no body by default).

- `daemon.write.ack`
  - Emit after write attempt with status.
  - Status enum (recommended):
    - `accepted` (write applied to PTY/mock)
    - `rejected_terminal_missing`
    - `rejected_not_alive`
    - `rejected_mode_noninteractive` (e.g., codex-exec terminal)
    - `blocked_ghost_dedup`
    - `error`
  - Payload: `{ paneId, status, reason?, bytesAccepted? }`.

- `bridge.connected` / `bridge.disconnected`
  - Emit from main bridge layer when daemon socket connects/disconnects/reconnects.
  - Already available via `daemon-client` state.

- `event.dropped`
  - Emit from bridge when event queue overflows, serialization fails, or socket write fails.
  - Payload: `{ stage, reason, droppedCount, oldestSeq, newestSeq }`.

### Medium cost (emit with throttling/coalescing)

- `pty.data.received`
  - Raw PTY chunks are high-frequency; per-chunk full payload emission will storm.
  - Recommended default payload: `{ paneId, byteLen, meaningful, chunkType, sampleHash? }`.
  - Coalesce at 50-100ms window per pane for telemetry lane.
  - Full chunk body only in dev mode + explicit sampling gate.

- `pane.state.changed` from daemon perspective
  - Emit only on explicit transitions (alive->dead, mode changes, etc.), not every heartbeat.

### Expensive / avoid in Phase 0

- Emitting full PTY bodies as lane events in normal mode.
- Deep process metrics per event (CPU/mem per chunk).
- Regex-heavy semantic classification in daemon hot path beyond existing meaningful activity checks.

---

## 2) IPC Bridge Shape for Spec Section 7 (Daemon <-> Renderer)

### Recommended topology

`Renderer Event Kernel` <-> `Main Bridge` <-> `Daemon Socket`

Keep one canonical envelope, with a bridge wrapper for transport metadata.

### Transport envelope (bridge wrapper)

```json
{
  "bridgeVersion": 1,
  "bridgeSeq": 1234,
  "bridgeTs": 1739212345678,
  "direction": "daemon->renderer",
  "event": {
    "eventId": "...",
    "correlationId": "...",
    "causationId": "...",
    "type": "daemon.write.ack",
    "source": "daemon",
    "paneId": "2",
    "ts": 1739212345670,
    "seq": 99,
    "payload": { "status": "accepted", "dataLen": 42 }
  }
}
```

### Command path (renderer -> daemon)

Extend existing daemon actions with optional kernel metadata:

```json
{
  "action": "write",
  "paneId": "2",
  "data": "...",
  "kernelMeta": {
    "eventId": "renderer-event-id",
    "correlationId": "...",
    "causationId": "...",
    "source": "injection.js",
    "seq": 314
  }
}
```

Daemon copies `correlationId`/`causationId` into ack/event emissions.

### Renderer/main IPC channel recommendation

Add a single channel for kernel events from main to renderer:
- `kernel:bridge-event` (push)

Optional diagnostics channel:
- `kernel:bridge-stats` (drop counts, queue depth, lag)

### Ordering and loss semantics

- Maintain per-source monotonic `seq` in daemon and renderer sources.
- Main bridge maintains `bridgeSeq` to detect handoff gaps.
- On overflow/loss, emit `event.dropped` with counters (never silent).

### Backpressure behavior

- Lane A events: bounded queue with priority (contract/system > lifecycle > telemetry).
- Lane B events: drop-oldest in ring buffer; emit `event.dropped` summary.

---

## 3) Contract Fallback Actions - Daemon Feasibility

### Practical rule

If contract depends on UI/focus/composer state, enforce in renderer/main (not daemon).
If contract depends only on PTY/terminal local state, daemon enforcement is feasible.

### Day-1 contract feasibility

1. `focus-lock-guard` (`inject.requested`)
- **Daemon feasibility:** Not reliable (daemon has no authoritative UI focus/lock state).
- **Recommendation:** enforce in renderer kernel only.

2. `compaction-gate`
- **Daemon feasibility:** Partial.
  - Daemon can observe PTY stream and local terminal mode.
  - But compaction detection confidence comes from higher-level semantics; keep authority in renderer/main initially.
- **Recommendation:**
  - Phase 2: renderer/main enforced.
  - Daemon supports deterministic fallback execution when instructed (`defer` queue with TTL, then `drop`).

3. `ownership-exclusive`
- **Daemon feasibility:** Yes for daemon-owned operations (write/resize/kill sequencing per pane).
- **Recommendation:** add per-pane operation lock/queue in daemon for conflicting terminal ops.

### Defer/drop implementation notes (daemon side)

Implementable with bounded queue per pane:
- `defer`: enqueue with `{ correlationId, expiresAt, reason }`
- resume trigger: explicit release event from renderer/main OR daemon-local trigger where safe
- TTL expiry: emit drop event + deterministic reason code
- `drop`: never silent; always emit `inject.dropped`/`contract.violation` with reason

**Important:** daemon should not invent UI-level defer rules; it should execute deterministic policy handed down by Lane A owner.

---

## Gaps to close in spec before Phase 1

1. Section 7 currently TODO - add bridge envelope, channels, ack statuses, loss semantics.
2. Define status enums for `daemon.write.ack` now (avoid drift later).
3. Specify dev-mode payload policy for `pty.data.received` (redacted default, sampled full payload optional).
4. Clarify which contracts are renderer-authoritative vs daemon-authoritative.

---

## Recommended minimal Phase 2 acceptance tests (DevOps side)

1. Write roundtrip chain appears end-to-end:
`inject.requested -> daemon.write.requested -> daemon.write.ack(status=accepted)`

2. Missing terminal path emits deterministic ack:
`daemon.write.ack(status=rejected_terminal_missing)` + contract/system visibility.

3. Bridge disconnect/reconnect emits:
`bridge.disconnected` then `bridge.connected` with no silent gap (or explicit `event.dropped`).

4. Storm behavior:
Under synthetic resize+data burst, event path remains bounded and emits `event.dropped` summaries instead of hanging.

---

## Bottom Line

- The daemon can emit high-value, low-cost lifecycle signals today.
- The bridge must carry correlation + sequence metadata across process boundaries from day 1.
- `defer/drop` is implementable daemon-side only as bounded deterministic execution, not policy ownership.
- Keep policy ownership in Lane A kernel (renderer/main) until daemon-side semantics are formally proven.
