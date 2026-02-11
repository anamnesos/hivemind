# Evidence Ledger Query Spec (Slice 1/3 - Analyst View)

**Author:** Analyst (ANA)
**Date:** 2026-02-11
**Status:** Draft for Architect + DevOps alignment
**VERIFIED AGAINST CODE:** `ui/modules/event-bus.js`, `ui/modules/main/kernel-bridge.js`, `ui/modules/daemon-handlers.js`, `ui/modules/tabs/bridge.js`, `ui/modules/transition-ledger.js`

---

## 1. Purpose and Boundary

This document defines the **query/investigation contract** for the Evidence Ledger.

- DevOps spec owns: storage engine, WAL config, ingestion path, write concurrency, retention implementation.
- This spec owns: investigator-useful query behaviors, required envelope fields for causality, evidence-linking primitives, and handoff-query shape.

Goal: ensure Slice 1 decisions produce data that supports daily debugging immediately and enables Slice 3 queryable handoff without schema rework.

---

## 2. Slice 1 Must-Support Queries

### 2.1 Q1 - Trace Reconstruction by `traceId`

**Question answered:** "Show me the full causal chain for one operation."

Required behavior:

1. Input: `traceId` (alias support for existing `correlationId` during migration).
2. Return all events in the trace, ordered by causal graph first, timestamp second.
3. Include orphan detection flag when `parentEventId` does not resolve.
4. Include stage summary counts (requested/applied/ack/failed/dropped).
5. Include latency summary for key hops (`ws->inject`, `inject->ipc`, `ipc->pty`, `pty->ack`).
6. Include span continuity checks (`spanId` present, duplicated span IDs, missing parent linkage where applicable).

Minimum output shape:

```json
{
  "traceId": "trc_...",
  "events": [{ "eventId": "...", "spanId": "...", "parentEventId": "...", "type": "inject.requested", "ts": 0 }],
  "orphans": ["evt_..."],
  "hopLatencyMs": { "ws_to_inject": 23, "inject_to_ipc": 5, "ipc_to_pty": 12, "pty_to_ack": 88 },
  "spanContinuity": { "missingSpanId": 0, "duplicateSpanId": 0, "suspectParentLinks": 0 }
}
```

### 2.2 Q2 - Failure Path Lookup

**Question answered:** "Where did this message fail, stall, or get dropped?"

Required filters:

- by `traceId`
- by `paneId`
- by failure classes: `failed`, `dropped`, `timeout`, `contract.violation`, `ack_missing`
- by time window

Required outputs:

1. First failure node (causal earliest failure in chain).
2. Downstream impact list (events causally descending from failure node).
3. Suspected reason classification (`ownership_conflict`, `focus_lock`, `compaction_gate`, `bridge_drop`, `ack_gap`, `unknown`).
4. Confidence score + reason inputs.

### 2.3 Q3 - Message Journey View (for Bridge/Timeline UI)

**Question answered:** "Show operation journey as human-readable stages."

Required stage model (Slice 1 baseline):

1. `ws` (ingress/dispatch)
2. `trigger` (fallback path if used)
3. `route` (message routing and queueing)
4. `inject`
5. `ipc`
6. `pty`
7. `ack`
8. `verify` (or `failure.final`)

Required view output:

- one row per stage with status: `seen | missing | failed | inferred`
- timestamp and delta from previous stage
- `eventId` + `spanId` backing each stage (if seen)

This must power both:

- producer trace graph (DevOps lens)
- investigator timeline (Analyst lens)

---

## 3. Canonical Event Envelope (Investigation-Mandatory Fields)

Slice 1 ingestion may normalize aliases, but these fields must exist post-normalization.

### 3.1 Mandatory

- `eventId`: immutable unique ID
- `traceId`: operation chain ID (map from legacy `correlationId`)
- `spanId`: operation sub-step ID for hop-level reconstruction
- `parentEventId`: direct causal parent (map from legacy `causationId`)
- `type`: canonical event type
- `stage`: normalized journey stage key
- `source`: module/process emitter
- `paneId`: `1|2|5|system`
- `ts`: event time (ms epoch)
- `seq`: per-source monotonic sequence
- `status`: `ok|deferred|failed|dropped|timeout|unknown`
- `payload`: sanitized, structured payload object
- `evidenceRefs`: optional structured references (`file_line|log_slice|hash`) attached at event level

### 3.2 Strongly Recommended in Slice 1 (needed for low-friction investigations)

- `correlationId`: keep as compatibility mirror to avoid breaking existing tooling
- `direction`: `daemon->renderer`, `main->renderer`, etc. for boundary analysis
- `transport`: `ws|trigger|ipc|pty|internal`
- `actorRole`: `architect|devops|analyst|system|user`
- `reasonCode`: stable machine reason for failures/defers

### 3.3 Normalization Rules

1. If only `correlationId` is present, copy to `traceId`.
2. If only `causationId` is present, copy to `parentEventId`.
3. If `spanId` is missing at ingestion, generate one and mark `meta.spanGenerated=true`.
4. Preserve originals in payload metadata for migration window.
5. Query APIs must prefer canonical names, support legacy aliases.

---

## 4. Slice 3 "Queryable Handoff" Contract (Design Target)

Slice 1 must store enough to support this later without re-ingestion.

### 4.1 Handoff Query Questions

A fresh instance should be able to ask:

1. "What was decided on incident X?"
2. "Why was that decision made?"
3. "What evidence backed it?"
4. "What changed after that decision?"
5. "How confident should I be now?"

### 4.2 Handoff Query Shape

```json
{
  "incidentId": "inc_...",
  "currentVerdict": { "value": "focus_lock_race", "confidence": 0.84, "version": 3 },
  "decisionTimeline": [
    { "assertionId": "ast_1", "eventId": "evt_101", "why": "submit missing after pty.write", "ts": 0 }
  ],
  "evidence": [
    { "refId": "evr_1", "kind": "event", "eventId": "evt_101" },
    { "refId": "evr_2", "kind": "file_line", "path": "ui/modules/terminal/injection.js", "line": 412 }
  ],
  "supersededBy": "ast_3"
}
```

### 4.3 Slice 1 Prerequisites for Slice 3

Even before incidents/assertions tables are populated, Slice 1 storage must retain:

- stable `eventId`/`traceId`/`parentEventId`
- stable `spanId` lineage for hop-level causality
- queryable `reasonCode` and `status`
- precise timestamps and source metadata
- `evidenceRefs` and payload references usable by evidence links

---

## 5. Evidence Binding Primitives

These primitives define how humans and agents bind claims to proof.

### 5.1 Primitive Types

1. `event_ref`
- pointer to `eventId`
- optional `spanId` and stage snapshot
- optional extracted fields snapshot (stage/status/reason)

2. `file_line_ref`
- `path`, `line`, optional `column`
- `snapshotHash` of referenced file segment at assertion time

3. `log_slice_ref`
- `[startTs, endTs]` + source stream
- optional inclusion filter (`traceId`, `paneId`, `type[]`)
- content hash for immutability checks

4. `query_ref`
- serialized query + result hash
- enables replay of evidence-producing query

### 5.2 Assertion Link Model

An assertion must link to one or more evidence refs and at least one event ref.

Minimum assertion record (logical):

```json
{
  "assertionId": "ast_...",
  "incidentId": "inc_...",
  "claim": "focus lock blocked submit",
  "supports": ["evr_1", "evr_2"],
  "contradicts": ["evr_5"],
  "confidence": 0.72,
  "ts": 0
}
```

Rules:

1. No assertion without evidence links.
2. Evidence links are immutable; assertion confidence/version can evolve.
3. If referenced file changes and hash mismatches, mark assertion `stale_evidence` but keep history.

---

## 6. What Stays Untouched in Slice 1

To control risk/scope, Slice 1 must NOT replace current workflow surfaces.

1. Existing handoff files (`shared_context.md`, `session-handoff.json`) remain operational.
2. Intent board / status docs (`status.md`, `blockers.md`, `errors.md`) remain source-of-record for active process management.
3. Existing Bridge tab remains functional; it can consume normalized events incrementally.
4. Transition ledger semantics remain unchanged; only event correlation quality improves underneath.
5. No forced migration of historical archives in Slice 1.

---

## 7. Risks and Edge Cases

### 7.1 Correlation Breaks at Process Boundaries

Risk: `traceId` not propagated consistently between WS, main bridge, renderer ingestion, and PTY/ack emitters.

Mitigation:

- explicit propagation contract tests per boundary
- ingestion warning event when parent/trace fields are missing

Also enforce span hygiene:

- missing `spanId` must be generated deterministically at ingestion
- duplicate `spanId` within a trace should emit diagnostic warning

### 7.2 Clock Skew / Timestamp Inconsistency

Risk: causal reconstruction ambiguity if clocks diverge across processes.

Mitigation:

- causal ordering uses parent links first, timestamp second
- include boundary sequence (`seq`) and bridge sequence where available

### 7.3 Event Storm and Sampling Side Effects

Risk: noisy event suppression hides needed causal nodes.

Mitigation:

- never sample/drop stage-boundary events required for journey model
- dropped-event summaries must carry counts + range

### 7.4 Payload Sanitization vs Investigability

Risk: redaction removes context required for debugging.

Mitigation:

- keep structured metadata fields (`reasonCode`, `stage`, `status`) unredacted
- allow secure dev-mode expansion with policy logging

### 7.5 Duplicate / Retries Causing False Chains

Risk: retries appear as separate failures without linkage.

Mitigation:

- retry events must include `parentEventId` and retry ordinal in payload
- failure query should group by trace + retry lineage

### 7.6 Schema Drift During Migration

Risk: mixed `correlationId`/`traceId` usage fractures queries.

Mitigation:

- canonicalization at ingestion
- query API alias support with deprecation telemetry

---

## 8. Slice 1 Acceptance (Analyst Lens)

Slice 1 is investigation-usable when all are true:

1. Given a `traceId`, system returns a causal chain with stage completeness report.
2. Given a failed message, system identifies first failure node + likely reason class.
3. Bridge/timeline can render journey stages with backing `eventId` + `spanId`.
4. At least one assertion can be linked to event + file/line + log slice refs.
5. Existing operational docs/workflows still function unchanged.

