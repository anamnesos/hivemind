# Active Errors

## Triage Snapshot
- Last Updated: 2026-02-10 23:35 (local)
- Severity Counts: CRITICAL 0 | HIGH 0 | MEDIUM 0 | LOW 1
- Top 3 Priorities:
  1. [ERR-001] Trigger file message delivery split/mangled (LOW, Shared)
  2. Runtime validation of merged fixes (`f9521e1` + compaction-gate queue deferral)

---

## ACTIVE (Max 5)

### [ERR-001] Trigger file message delivery split/mangled
- Severity: LOW
- Owner: Shared (DevOps + Architect)
- Status: ACTIVE
- Last Verified: 2026-02-10 10:10 by Architect
- STALE: NO
- Stale Since: n/a
- Evidence Class: STRONG
- Symptom: Cross-pane messages arrive split — first chunk truncated, second is full message
- Impact: User must manually push to deliver stuck messages
- Repro: Send long message via hm-send.js to pane 2 or 5 when WebSocket routing fails
- Code Pointers: `ui/scripts/hm-send.js`, `ui/modules/terminal/injection.js`, `ui/main.js` (WebSocket routing)
- Evidence: S105 DevOps split delivery, S107 Ana message stuck (James pushed)
- Mitigation: User manually pushes stuck messages; resend if truncated
- Next Action: Run runtime validation after restart (retry/backoff exhaustion + fallback path).
- Done When: No manual push needed across a full session; ACK retries recover transient delivery misses.
- Verification Method: runtime

---

## Recently Resolved (Last 3 only)
- [ERR-002] Messages lost during Claude context compaction (Item 20) - fixed by queue-level compaction gate deferral in `ui/modules/terminal/injection.js` + `ui/__tests__/injection.test.js` - backend verified S107 (runtime verify pending restart)
- [ERR-003] Settings overlay freezes app (Item 23) - fixed in 788399a - verified S102 by User
- [ERR-004] Agent message color bleed - fixed in c4fdc82 - verified S106 by Reviewer

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
