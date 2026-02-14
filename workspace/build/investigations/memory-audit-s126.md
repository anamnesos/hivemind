# Memory System Audit Report (S126)
Date: 2026-02-14
Analyst: Gemini

## 1. Executive Summary
The Team Memory and Evidence Ledger systems are currently "partially broken" due to a lack of integration. While high-level session synchronization works (via hooks and `hm-memory.js`), the real-time event flow is non-existent.

## 2. Key Findings

### A. Lifecycle Failure
- **Symptom:** `EvidenceLedgerWorker` logs "Worker stopped (exit)" shortly after startup.
- **Root Cause:** `HivemindApp.init` calls `ipcHandlers.setupIPCHandlers`, which triggers a full `unregister` of all handlers to avoid duplicates. The Evidence Ledger handler's `unregister` function explicitly closes the shared runtime/worker.
- **Impact:** The worker is killed before it can do anything useful. It only restarts if an IPC call is received later.

### B. Event Flow Disconnect
- **Symptom:** Team Memory backfill finds 0 events. `ledger_events` table is empty.
- **Root Cause:**
    1. No broad-spectrum event bus feeds `ledger_events`.
    2. Team Memory uses its own private, ephemeral spool file (`team-memory-pattern-spool.jsonl`).
    3. Events written to the spool (guards, delivery failures) are processed and then **deleted** by the pattern miner.
- **Impact:** There is no persistent event log for the collective. Backfill is impossible because the data is gone.

### C. Database Inspection
- `evidence-ledger.db` (356 KB):
    - `ledger_events`: 0 rows.
    - `ledger_decisions`: 55 rows (seeded from `session-handoff.json`).
    - `ledger_context_snapshots`: 31 rows (working).
- `team-memory.sqlite` (299 KB):
    - `claims`: 0 rows.
    - `patterns`: 3 rows (orphaned from deleted events).

### D. Redundancy & Fragmentation
- **Redundancy:** `session-handoff.json` is duplicated into `ledger_context_snapshots`.
- **Fragmentation:**
    - `session-handoff.json` = High-level state (User/Architect source of truth).
    - `Evidence Ledger` = Structured version of above (mostly unused).
    - `Team Memory` = Automated learning (orphaned).
    - `MEMORY.md` = Manual learnings (human source of truth).

## 3. Recommendations
1. **Unify Ingest:** Redirect `appendTeamMemoryPatternEvent` to write directly to `EvidenceLedgerStore.appendEvent`.
2. **Persistence:** Stop deleting events after pattern mining. Let `EvidenceLedger` handle retention/pruning.
3. **Source of Truth:** Move `SessionStart` hook to read directly from Evidence Ledger `get-context` instead of `session-handoff.json`.
4. **Cleanup:** Once Ledger is proven, remove `session-handoff.json`.
