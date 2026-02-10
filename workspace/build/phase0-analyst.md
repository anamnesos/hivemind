# Phase 0 Analyst Findings: Event Kernel

**Author:** Analyst (ANA)
**Date:** 2026-02-10
**VERIFIED AGAINST CODE:** 2026-02-10 (build plan v3 + current spec draft)

---

## 1. Scope

This report addresses Phase 0 analyst tasks:

1. Failure taxonomy mapping for Items 14, 15, 16, 19, 22, 23 (spec Section 8)
2. Compaction detection model (spec Section 9)
3. Per-pane state machine refinements (spec Section 4)
4. Success metrics realism review (spec Section 10)

---

## 2. Section 8: Failure Taxonomy Mapping

### 2.1 Mapping Table (Incident -> Catchable Event Model)

| Item | Observed Failure Mode | Event Chain That Should Have Existed | Missing / High-Value Events to Add | Contract / Invariant That Would Have Caught It |
|---|---|---|---|---|
| 14 | Agent messages executed as shell commands due double-submit ownership (`triggers` + `injection`) | `inject.requested -> inject.applied -> inject.submit.sent -> inject.verified/failed` | `inject.submit.requested`, `inject.submit.sent`, `inject.submit.owner.changed`, `ownership.conflict` | **Single submit owner per pane/action**. If second submit actor appears in same correlation: block second actor, emit `contract.violation`. |
| 15 | Gemini injection fragility (payload transforms + submit path timing) | `inject.requested -> inject.transform.applied -> inject.applied -> inject.verified` | `inject.transform.applied`, `inject.transform.lossy`, `inject.mode.selected` | **No lossy transform without explicit policy**. Multiline integrity must be preserved unless policy says otherwise; lossy transform must emit violation/warn. |
| 16 | Injection collisions during active terminal typing (global typing check missed per-pane typing) | `focus.changed`, `typing.activity`, `focus.locked`, `inject.deferred(reason=locked)` | `typing.activity`, `typing.idle`, `focus.lock.owner` | **Per-pane typing lock precedence over injection**. Injection must defer while pane lock active. |
| 19 | Terminal layout/fitting regressions (PTY resize race, hidden pane resize, timer conflicts) | `resize.requested -> resize.started -> pty.resize.requested -> pty.resize.ack -> resize.completed` | `pty.resize.requested`, `pty.resize.ack`, `pane.visibility.changed`, `resize.coalesced`, `fit.skipped` | **Resize sequencing contract**: fit/PTY resize only on visible pane and in valid order; stale resize intents coalesced. |
| 22 | broadcastInput interrupted by xterm focus steal during agent injection | `focus.arbitration.requested -> focus.locked(user) -> inject.deferred -> focus.released -> inject.resumed` | `focus.arbitration.requested`, `focus.arbitration.resolved`, `focus.steal.blocked` | **User focus lock non-preemptive**. Agent injection cannot steal focus while user lock is active. |
| 23 | Settings overlay freeze from resize/fit path under WebGL pressure | `overlay.opened -> resize.requested -> fit.skipped(reason=overlay_open)` | `fit.skipped`, `ui.longtask.detected`, `resize.storm.detected` (already planned) | **Overlay-fit exclusion**. No fit while overlay is open; violations emit immediately. |

### 2.2 Failure Classes (Cross-Incident)

These six items collapse into five repeated failure classes that the taxonomy should model explicitly:

1. Ownership ambiguity (`who is allowed to submit/apply now?`)
2. Focus arbitration races (`user intent vs agent intent`)
3. Hidden mode/state (`overlay open`, `compacting`, `pane hidden`) not represented in control path
4. Cross-process ack gaps (`write requested` without confirmed ack / ordering)
5. High-frequency storm collapse (`resize`, retries) without coalescing/backpressure visibility

### 2.3 Taxonomy Additions Recommended for Spec Section 3

Add these event types to make Section 8 operationally complete:

- `inject.submit.requested`
- `inject.submit.sent`
- `inject.submit.owner.changed`
- `inject.transform.applied`
- `inject.transform.lossy`
- `typing.activity`
- `typing.idle`
- `focus.arbitration.requested`
- `focus.arbitration.resolved`
- `focus.steal.blocked`
- `pty.resize.requested`
- `pty.resize.ack`
- `pane.visibility.changed`
- `resize.coalesced`
- `fit.skipped`
- `ui.longtask.detected`

---

## 3. Section 9: Compaction Detection Model

### 3.1 Problem to Solve

Item 20 showed that output activity is currently used as a generic "submit succeeded" signal. During CLI compaction, that signal can become false-positive confirmation for unrelated injections.

### 3.2 Detector State Model

Use a 4-state detector per pane:

- `none`: no compaction evidence
- `suspected`: early/weak evidence
- `confirmed`: high-confidence compaction
- `cooldown`: compaction ended recently; suppress rapid flapping

### 3.3 Multi-Signal Detection (Not Keyword-Only)

Compaction confidence score should combine lexical, structural, and temporal features from PTY output.

| Signal | Example | Weight | Notes |
|---|---|---|---|
| Lexical marker | "compacting", "summarizing conversation" | Medium | Useful but not sufficient alone |
| Structured compaction block pattern | repeated summary/system-like scaffold | High | More robust than single tokens |
| Burst without prompt-ready transition | sustained output window | Medium | Distinguishes internal processing windows |
| Absence of user-correlated causation | no recent user `inject.requested` root | Medium | Reduces false positives during normal replies |

### 3.4 Transition Rules

- `none -> suspected`: confidence >= `T_suspect` for >= `W1`
- `suspected -> confirmed`: confidence >= `T_confirm` for >= `W2` OR repeated suspect hits in short window
- `confirmed -> cooldown`: explicit end marker OR prompt-ready restoration + confidence decay
- `cooldown -> none`: cooldown timer elapsed with no renewed evidence

Recommended starting values:

- `W1 = 300ms`
- `W2 = 800ms`
- cooldown `= 1500ms`

### 3.5 Contract Behavior by Confidence

- `none`: no compaction gating
- `suspected`: do not hard-block; emit `cli.compaction.suspected`; mark verification risk
- `confirmed`: enforce compaction gate on non-critical injects (`inject.deferred`)
- `cooldown`: continue deferred queue hold briefly to avoid thrash

High-priority recovery intents (`kill`, `restart`) bypass gate and emit `contract.override`.

### 3.6 False Positive Risks and Mitigations

| Risk | Why It Happens | Mitigation |
|---|---|---|
| Long normal model response misclassified as compaction | output burst + summary-like text | Require multi-signal confirmation + minimum sustained window |
| Tool output contains compaction-like words | lexical-only triggers | Lexical signal never sufficient alone |
| Flapping between compacting and normal | noisy output boundaries | Cooldown state + hysteresis thresholds |

### 3.7 Events and Payload Fields Needed

Use existing events plus payload fields for tuning and replay:

- `cli.compaction.suspected` payload: `{ confidence, detectorVersion, signals[] }`
- `cli.compaction.started` payload: `{ confidence, detectorVersion, transitionReason }`
- `cli.compaction.ended` payload: `{ durationMs, endReason }`
- `verify.false_positive` payload: `{ suspectedCompaction: true, confidenceAtVerify }`

This makes detector quality measurable, not anecdotal.

---

## 4. Section 4: Per-Pane State Machine Refinement

### 4.1 Recommendation: Use a State Vector, Not a Single Enum

Current spec says one active state (except compacting+locked). That is too restrictive for real incidents. Use orthogonal lanes per pane:

- `activity`: `idle | injecting | resizing | recovering | error`
- `gates`: `focusLocked: boolean`, `compacting: none|suspected|confirmed|cooldown`, `safeMode: boolean`
- `connectivity`: `bridge: up|down`, `pty: up|down`

`pane.state.changed` should emit full vector diff, not only one label.

### 4.2 Core Transition Rules

1. `inject.requested` while `focusLocked=true` or `compacting=confirmed` -> `inject.deferred`
2. `inject.requested` while allowed -> `activity=injecting`
3. `inject.verified|inject.failed|inject.dropped` -> `activity=idle` (unless another active op)
4. `resize.requested` during `activity=injecting` -> coalesce/defer resize, do not preempt submit path
5. `bridge.down|pty.down` -> `activity=recovering` (or `error` if recovery fails)
6. `overlay.opened` + resize intent -> `fit.skipped(reason=overlay_open)`

### 4.3 Co-Existing States That Must Be Legal

- `injecting + focusLocked` (user took lock mid-flow)
- `resizing + compacting.suspected`
- `idle + compacting.confirmed`
- `recovering + safeMode=true`

### 4.4 Edge Cases to Encode Explicitly

1. **Dual gate deferral:** injection blocked by both focus and compaction. Store ordered reasons in payload.
2. **Compaction starts mid-verification:** verification result should degrade to risked/false-positive class, not clean pass.
3. **Resize storm during deferred queue:** resizes must coalesce to latest dimensions to prevent backlog amplification.
4. **Safe mode during active injection:** finish or abort deterministically, then freeze non-critical new intents.
5. **Bridge reconnect with pending deferred intents:** resume in FIFO with gate re-check on each dequeue.

---

## 5. Section 10: Success Metrics Validation

### 5.1 Existing Targets: Realism Check

| Metric | Current Target | Analyst Assessment | Recommendation |
|---|---|---|---|
| p95 time-to-root-cause | < 2 min | Ambitious for early phases | Phase-gate it: `< 5 min` by Phase 2, `< 2 min` by Phase 4 |
| % complete lifecycle chain | >= 95% | Realistic if event integrity holds | Keep |
| False-positive submit rate | < 5% | Reasonable first threshold | Keep initially, tighten to `< 2%` after detector tuning |
| Event loss rate (normal) | 0% | Strict but correct for Lane A; harder for Lane B bridge | Split target: Lane A `0%`, Lane B `<=0.1%` |
| Out-of-order rate | < 1% | Realistic | Keep |
| p95 emit overhead | < 1ms | Realistic | Keep, also track p99 |
| p95 storm overhead | < 2ms | Realistic with coalescing | Keep |
| Violation detection latency | < 10ms | Realistic | Keep |
| Replay fidelity | qualitative | Too subjective | Add scored checklist pass rate |

### 5.2 Missing Metrics (Should Be Added)

1. Compaction detector precision/recall vs adjudicated samples
2. Contract false-positive rate by contract ID
3. Deferred-to-dropped ratio by reason (focus/compaction/ownership)
4. Queue wait latency p95 (`inject.queued -> inject.applied`)
5. Safe-mode trigger quality (`true incident` vs `false escalation`)

### 5.3 Measurement Practicality

All proposed metrics are derivable from event stream alone if payload discipline is enforced.
No additional invasive instrumentation is required beyond fields already proposed in this report.

---

## 6. Phase 0 Decisions Recommended Before Phase 1 Coding

1. Adopt state-vector model in spec Section 4 (single enum is insufficient for real race conditions).
2. Add event taxonomy items in Section 2.3 of this report before locking schema.
3. Ship compaction detector as confidence/hysteresis model (not simple regex).
4. Split metric targets by phase and by lane (control vs telemetry) to avoid false confidence.
5. Require each day-1 contract to include deterministic fallback and explicit bypass policy in spec text.

---

## 7. Suggested Spec Insertions

- Section 8: Use Table 2.1 directly as initial failure taxonomy mapping.
- Section 9: Use Sections 3.2-3.7 as initial detector spec.
- Section 4: Replace single-state wording with state-vector semantics and transition rules in Section 4.2.
- Section 10: Apply metric adjustments in Sections 5.1 and 5.2.

