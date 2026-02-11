# Evidence Ledger Slice 2 Spec — Investigator Workspace

Author: Architect (Pane 1)
Date: 2026-02-11
Status: Draft for team alignment
Depends on: Slice 1 (COMPLETE — store, ingest, traceId propagation, config flag, 27 tests)

---

## 1. Goal

Add a semantic investigation layer on top of Slice 1's raw event substrate.

**Slice 1 answers:** "What happened?" (events, traces, causal chains)
**Slice 2 answers:** "What do we think about what happened?" (incidents, hypotheses, verdicts)

Slice 2 delivers:
1. Incident objects — named investigations grouping related traces/failures.
2. Assertion objects — hypotheses about root causes, each linked to evidence.
3. Verdict objects — current best explanation per incident, versioned with confidence.
4. Evidence binding primitives — structured links from assertions to events, file lines, log slices.
5. Programmatic query API for incident lifecycle (no UI in this slice).

Slice 2 does NOT deliver:
1. UI for incident management (deferred to Bridge tab integration, Slice 3+).
2. Cross-session narrative generation (Slice 3).
3. Automated incident detection / anomaly triggers (future).

---

## 2. Schema — New Tables

All new tables live in the same `evidence-ledger.db` database. Migration is additive (no changes to existing Slice 1 tables).

### 2.1 `ledger_incidents`

```sql
CREATE TABLE IF NOT EXISTS ledger_incidents (
  incident_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  created_by TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  closed_at_ms INTEGER,
  session_id TEXT,
  tags_json TEXT DEFAULT '[]',
  meta_json TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_incidents_status_updated
  ON ledger_incidents(status, updated_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_session
  ON ledger_incidents(session_id, created_at_ms DESC);
```

**status** values: `open`, `investigating`, `resolved`, `closed`, `stale`
**severity** values: `critical`, `high`, `medium`, `low`, `info`
**created_by**: role identifier (`architect`, `analyst`, `devops`, `system`)

### 2.2 `ledger_incident_traces`

Links incidents to one or more traces from `ledger_events`.

```sql
CREATE TABLE IF NOT EXISTS ledger_incident_traces (
  incident_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  linked_at_ms INTEGER NOT NULL,
  linked_by TEXT NOT NULL,
  note TEXT,
  PRIMARY KEY (incident_id, trace_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_traces_trace
  ON ledger_incident_traces(trace_id);
```

### 2.3 `ledger_assertions`

Hypotheses/claims about an incident, each linked to evidence.

```sql
CREATE TABLE IF NOT EXISTS ledger_assertions (
  assertion_id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'hypothesis',
  confidence REAL NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'active',
  author TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  superseded_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  reasoning TEXT,
  meta_json TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_assertions_incident
  ON ledger_assertions(incident_id, updated_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_assertions_status
  ON ledger_assertions(status, confidence DESC);
```

**type** values: `hypothesis`, `observation`, `conclusion`, `counterevidence`
**status** values: `active`, `superseded`, `retracted`, `confirmed`
**confidence**: 0.0 to 1.0 — updated as evidence accumulates
**superseded_by**: points to a newer assertion_id that replaces this one

### 2.4 `ledger_evidence_bindings`

Links assertions to concrete evidence — events, file lines, log slices, or query results.

```sql
CREATE TABLE IF NOT EXISTS ledger_evidence_bindings (
  binding_id TEXT PRIMARY KEY,
  assertion_id TEXT NOT NULL,
  incident_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'supports',
  event_id TEXT,
  trace_id TEXT,
  span_id TEXT,
  file_path TEXT,
  file_line INTEGER,
  file_column INTEGER,
  snapshot_hash TEXT,
  log_start_ms INTEGER,
  log_end_ms INTEGER,
  log_source TEXT,
  log_filter_json TEXT,
  query_json TEXT,
  query_result_hash TEXT,
  note TEXT,
  created_at_ms INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0,
  meta_json TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_bindings_assertion
  ON ledger_evidence_bindings(assertion_id);

CREATE INDEX IF NOT EXISTS idx_bindings_incident
  ON ledger_evidence_bindings(incident_id);

CREATE INDEX IF NOT EXISTS idx_bindings_event
  ON ledger_evidence_bindings(event_id);
```

**kind** values: `event_ref`, `file_line_ref`, `log_slice_ref`, `query_ref`
**relation** values: `supports`, `contradicts`, `context`
**stale**: 1 if referenced evidence has changed (e.g., file hash mismatch)

### 2.5 `ledger_verdicts`

Versioned verdict history per incident — the "current best explanation."

```sql
CREATE TABLE IF NOT EXISTS ledger_verdicts (
  verdict_id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL NOT NULL,
  version INTEGER NOT NULL,
  reason TEXT,
  key_assertion_ids_json TEXT DEFAULT '[]',
  author TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  meta_json TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_verdicts_incident_version
  ON ledger_verdicts(incident_id, version DESC);
```

**version**: monotonically increasing per incident. Latest version = current verdict.
**key_assertion_ids_json**: JSON array of assertion_ids that most strongly support this verdict.

---

## 3. Module: `evidence-ledger-investigator.js`

New module at `ui/modules/main/evidence-ledger-investigator.js`.

Depends on `evidence-ledger-store.js` (uses same DB handle) and `evidence-ledger-ingest.js` (for ID generation).

### 3.1 API Surface

```js
class EvidenceLedgerInvestigator {
  constructor(store)           // Takes EvidenceLedgerStore instance

  // Incident lifecycle
  createIncident(opts)         // → { ok, incidentId }
  getIncident(incidentId)      // → incident object or null
  updateIncident(incidentId, updates) // → { ok }
  listIncidents(filters)       // → [incident, ...]
  linkTrace(incidentId, traceId, opts) // → { ok }
  closeIncident(incidentId, opts) // → { ok }

  // Assertions (hypotheses)
  addAssertion(incidentId, opts)  // → { ok, assertionId }
  getAssertion(assertionId)       // → assertion object or null
  updateAssertion(assertionId, updates) // → { ok }
  supersedeAssertion(assertionId, newOpts) // → { ok, newAssertionId }
  listAssertions(incidentId, filters) // → [assertion, ...]

  // Evidence bindings
  bindEvidence(assertionId, binding) // → { ok, bindingId }
  listBindings(assertionId)          // → [binding, ...]
  listBindingsForIncident(incidentId) // → [binding, ...]
  markBindingStale(bindingId)        // → { ok }

  // Verdicts
  recordVerdict(incidentId, opts)  // → { ok, verdictId, version }
  getCurrentVerdict(incidentId)    // → verdict object or null
  getVerdictHistory(incidentId)    // → [verdict, ...] (newest first)

  // Composite queries
  getIncidentSummary(incidentId)   // → { incident, traces, assertions, currentVerdict, evidenceCount }
  getIncidentTimeline(incidentId)  // → chronological list of all activity (assertions, verdicts, bindings)
}
```

### 3.2 Key Behaviors

1. **No assertion without evidence.** `addAssertion` requires at least one evidence binding in the same call (or immediately after via `bindEvidence`). The module does NOT enforce this at DB level (assertions can exist briefly without bindings during a transaction), but the API wrapper validates it.

2. **Confidence is never auto-calculated.** The caller (usually Ana/Analyst) sets confidence explicitly. The module stores it, never overrides it. This keeps the investigation semantics under agent control.

3. **Supersession chain.** When a hypothesis is replaced, the old one gets `status: superseded` and `superseded_by` pointing to the new one. The new assertion starts at version N+1. This creates an audit trail.

4. **Verdict versioning.** Each `recordVerdict` increments the version counter for that incident. `getCurrentVerdict` returns the highest version. The full history is queryable.

5. **Stale evidence detection.** When binding a `file_line_ref`, the caller can provide a `snapshot_hash`. Later, a utility can check if the file has changed and mark the binding `stale: 1`. Stale bindings don't invalidate assertions but flag them for review.

6. **Graceful degradation.** If the store is unavailable (SQLite missing, config disabled), all methods return `{ ok: false, reason: 'unavailable' }`. No throws.

---

## 4. Integration Points

### 4.1 Store Migration

`evidence-ledger-store.js` `_migrate()` gains a V2 migration block that creates the Slice 2 tables. Migration is additive — existing data untouched.

Pattern:
```js
_migrate() {
  this.db.exec(SCHEMA_V1_SQL);  // Existing Slice 1 tables
  this.db.exec(SCHEMA_V2_SQL);  // New Slice 2 tables (incidents, assertions, bindings, verdicts)
}
```

### 4.2 Store Constructor

The `EvidenceLedgerInvestigator` receives the store instance (not a separate DB connection). This ensures:
- Single WAL writer
- Shared transaction scope when needed
- Same config flag / degradation state

### 4.3 Analyst Integration

Ana (Analyst, pane 5) is the primary consumer. She creates incidents when investigating failures, adds hypotheses as she debugs, and records verdicts when confident.

**Programmatic access via IPC (main process):**
- New IPC handlers in `hivemind-app.js` or a dedicated `evidence-ledger-handlers.js`
- `evidence-ledger:create-incident`, `evidence-ledger:add-assertion`, etc.
- Renderer can call these via `ipcRenderer.invoke()`

**CLI access via script (for manual use / agent automation):**
- `ui/scripts/hm-investigate.js` — lightweight CLI wrapping the IPC channel
- Example: `node hm-investigate.js create-incident --title "ERR-008: Submit race" --severity high`
- Example: `node hm-investigate.js add-hypothesis --incident inc_abc --claim "Focus lock during broadcastInput" --confidence 0.6 --evidence-event evt_123`

### 4.4 Prune Extension

`prune()` in the store module extends to clean up investigation objects:
- Incidents with status `closed` older than retention period → deleted
- Orphaned assertions (incident deleted) → deleted
- Orphaned bindings (assertion deleted) → deleted
- Verdicts for deleted incidents → deleted

---

## 5. Implementation Plan

### Phase A: Schema + Investigator Module
1. Add V2 schema SQL to `evidence-ledger-store.js` migration.
2. Create `evidence-ledger-investigator.js` with full CRUD API.
3. Unit tests: incident lifecycle, assertion CRUD, evidence binding, verdict versioning.

### Phase B: Evidence Binding + Queries
1. Implement all 4 binding kinds (event_ref, file_line_ref, log_slice_ref, query_ref).
2. Implement composite queries (getIncidentSummary, getIncidentTimeline).
3. Implement stale detection utility.
4. Tests: binding validation, composite query correctness, stale marking.

### Phase C: IPC Handlers + CLI Script
1. Add IPC handlers for investigator operations.
2. Create `hm-investigate.js` CLI script.
3. Integration test: create incident → add hypothesis with evidence → record verdict → query summary.

---

## 6. Test Plan

### 6.1 Unit Tests (`evidence-ledger-investigator.test.js`)

1. **Incident lifecycle**: create → update status → link traces → close
2. **Assertion CRUD**: add hypothesis → update confidence → supersede → retract
3. **Evidence bindings**: bind event_ref → bind file_line_ref → bind log_slice_ref → bind query_ref
4. **Binding validation**: reject binding without required fields for each kind
5. **Verdict versioning**: record v1 → record v2 → getCurrentVerdict returns v2 → getHistory returns both
6. **Supersession chain**: create A1 → supersede with A2 → A1.status=superseded, A1.superseded_by=A2.id
7. **Stale evidence**: mark binding stale → verify flag → verify assertion still active
8. **Edge cases**: duplicate incident_id, invalid confidence (>1, <0, NaN), missing required fields
9. **Degraded mode**: all methods return ok:false when store unavailable

### 6.2 Integration Tests (`evidence-ledger-investigator-integration.test.js`)

1. **Full investigation flow**: create incident → link trace from Slice 1 events → add hypothesis with event_ref evidence → record verdict → query summary → verify all linked
2. **Multi-hypothesis incident**: 3 hypotheses with different confidences → supersede weakest → verdict references strongest
3. **Cross-reference**: evidence binding references real events from Slice 1 store → verify event_id resolves

### 6.3 Acceptance Criteria

Slice 2 is done when:
1. An agent can create an incident, link traces, add hypotheses with evidence, and record a versioned verdict — all programmatically.
2. `getIncidentSummary` returns a complete picture (incident + traces + assertions + current verdict + evidence count).
3. Supersession chains are queryable — you can trace how understanding evolved.
4. All Slice 1 tests still pass. No regression.
5. Store degrades gracefully if SQLite unavailable.
6. Prune cleans up closed incidents and orphaned records.

---

## 7. Risks and Mitigations

### 7.1 Schema Migration Ordering
Risk: V2 migration runs before V1 tables exist if somehow V1 migration is skipped.
Mitigation: V2 SQL uses `CREATE TABLE IF NOT EXISTS`. V1 always runs first in `_migrate()`.

### 7.2 Evidence Integrity
Risk: Bound event_id references a pruned/deleted event.
Mitigation: Prune cascades from events → bindings. Stale flag for file_line_ref hash mismatches.

### 7.3 Confidence Drift
Risk: Agent updates confidence without reasoning, making verdict history opaque.
Mitigation: `reasoning` field required on assertions, `reason` field on verdicts. API warns (doesn't block) if empty.

### 7.4 Transaction Scope
Risk: Creating incident + first assertion + binding in separate calls could leave partial state on crash.
Mitigation: Investigator module wraps create-with-evidence in a single transaction.

### 7.5 Performance at Scale
Risk: Composite queries (getIncidentSummary) join across 5 tables.
Mitigation: All tables indexed on incident_id. Incidents are bounded (typically <50 per session). Queries use LIMIT.

---

## 8. Assignment

| Phase | Owner | Estimated Scope |
|-------|-------|-----------------|
| Phase A | DevOps | Schema migration + investigator module + unit tests |
| Phase B | DevOps | Evidence bindings + composite queries + stale detection + tests |
| Phase C | DevOps | IPC handlers + CLI script + integration test |
| Review | Reviewer (internal) | Code review before each commit |
| Cross-model | Ana (Analyst) | Integration verification + investigation workflow validation |

---

## 9. Out of Scope (Slice 3+)

1. Bridge tab UI for incident management
2. Automated incident creation from failure patterns
3. Cross-session narrative generation (queryable handoff replacement)
4. AI-assisted hypothesis ranking
5. Evidence pinning UX (visual binding in Bridge tab)
