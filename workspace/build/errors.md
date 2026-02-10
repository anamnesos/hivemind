# Active Errors

## Triage Snapshot
- Last Updated: 2026-02-10 10:10 (local)
- Severity Counts: CRITICAL 0 | HIGH 0 | MEDIUM 0 | LOW 2
- Top 3 Priorities:
  1. [ERR-001] Trigger file message delivery split/mangled (LOW, Shared)
  2. [ERR-002] Messages lost during Claude context compaction (LOW, Shared)

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
- Next Action: Implement ACK-timeout-resend protocol in hm-send.js (Phase 3)
- Done When: Messages auto-retry on failed delivery; no manual push needed
- Verification Method: runtime

### [ERR-002] Messages lost during Claude context compaction (Item 20)
- Severity: LOW
- Owner: Shared (Frontend + DevOps)
- Status: ACTIVE
- Last Verified: 2026-02-10 10:10 by Architect
- STALE: NO
- Stale Since: n/a
- Evidence Class: STRONG
- Symptom: Injected message swallowed when Claude CLI is mid-compaction
- Impact: Message never appears in conversation; sender believes delivery succeeded
- Repro: Inject message during active compaction (timing-dependent)
- Code Pointers: `ui/modules/contracts.js:25` (compaction-gate), `ui/modules/terminal.js:721` (detector init), `ui/modules/compaction-detector.js:191` (cli.compaction.started)
- Evidence: S101 — compaction output triggers false-positive delivery confirmation via `verifyAndRetryEnter`
- Mitigation: Sender resends message manually
- Next Action: Wire compaction-gate contract to block/defer injections while compaction active
- Done When: Injections deferred during compaction; no false-positive delivery confirmation
- Verification Method: runtime

---

## Recently Resolved (Last 3 only)
- [ERR-003] Settings overlay freezes app (Item 23) - fixed in 788399a - verified S102 by User
- [ERR-004] Agent message color bleed - fixed in c4fdc82 - verified S106 by Reviewer
- [ERR-005] War-room CR sanitization - fixed in 7ad2981 - verified S106 by Reviewer

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
