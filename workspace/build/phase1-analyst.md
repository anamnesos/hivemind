# Phase 1 Analyst Pressure Test: Compact Triage Docs

**Author:** Analyst (ANA)  
**Date:** 2026-02-10  
**VERIFIED AGAINST CODE:** 2026-02-10 02:10 local

---

## Scope

Pressure-test the compact templates now applied to:

- `workspace/build/errors.md`
- `workspace/build/blockers.md`
- `workspace/shared_context.md`

Scenario used: `startup scan -> identify top issue -> root-cause trace -> handoff package`.

---

## Scenario Results

| Stage | Result | Notes |
|---|---|---|
| Startup scan | PASS | Fast to parse due `Triage Snapshot` and bounded `ACTIVE` sections. |
| Identify top issue | PASS | `errors.md` top priorities are explicit (`ERR-001`, `ERR-002`). |
| Root-cause trace | PARTIAL | One active item links to stale root-cause text not aligned with current code path. |
| Handoff clarity | PARTIAL | Next action exists, but acceptance criteria and evidence-quality requirements are missing. |

---

## What Works

1. Active-first layout works. Startup triage now takes one quick pass through snapshot blocks instead of scrolling historical archaeology.
2. Severity and owner are visible at first read, which makes assignment routing immediate.
3. `Last Verified` + `STALE` fields create accountability and reduce "ghost-open" issues.
4. Archive split is effective; active docs are now operational dashboards.

---

## What Is Missing

1. **Evidence quality classification is missing.** We still need to distinguish strong vs weak proof to prevent Item 20-class misreads.
2. **Code pointers are not required.** Root-cause entries should require `file:line` references for first-hop debugging.
3. **Exit criteria are not explicit.** `Next Action` exists, but no `Done When` / acceptance checks.
4. **Handoff contract is incomplete.** Missing SLA fields (`Owner ETA`, `Reviewer`, `Verification Method`).
5. **Cross-doc sync guard is missing.** An item can remain ACTIVE even when implementation changed substantially.

---

## What Slowed Me Down

1. `ERR-002` still cites `verifyAndRetryEnter` in `workspace/build/errors.md:38`, but that path is no longer the active architecture.  
   Current control path now includes:
   - `ui/modules/contracts.js:25` (`compaction-gate`, enforced)
   - `ui/modules/terminal.js:721` (detector initialization)
   - `ui/modules/compaction-detector.js:191` (`cli.compaction.started`)
2. Because the root-cause text lagged code reality, I had to re-derive current behavior before determining if the issue was truly open or only verification-pending.
3. Priority duplication exists across `shared_context.md` risks/priorities and `errors.md` top priorities; this creates minor drift risk when one gets updated first.

---

## Recommended Template Deltas (Small, High-Leverage)

Add these required fields to ACTIVE entries in `errors.md` and `blockers.md`:

- `Evidence Class: STRONG | WEAK | INFERRED`
- `Code Pointers: path:line (1-3 required)`
- `Done When: concrete acceptance checks`
- `Owner ETA: date/session`
- `Verification Method: runtime | test | code-audit`
- `Linked Transition IDs: [optional now, required after Transition Ledger lands]`

Add one field to `shared_context.md` priorities:

- `Source of Truth: ERR-### | BLK-### | STATUS-TASK`

---

## Analyst Verdict

The compact template direction is good and already materially better for triage speed.  
Remaining gap is not layout; it is **evidence rigor + sync discipline**. Add the fields above and the docs become investigation-grade, not just status-grade.

