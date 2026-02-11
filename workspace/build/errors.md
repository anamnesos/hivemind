# Active Errors

## Triage Snapshot
- Last Updated: 2026-02-10 19:35 (local)
- Severity Counts: CRITICAL 0 | HIGH 0 | MEDIUM 1 | LOW 0
- Top 3 Priorities:
  1. [ERR-006] Auto-submit failure on pane 1 injection (MEDIUM) — investigating

---

## ACTIVE (Max 5)

- [ERR-006] **Auto-submit failure on incoming agent message to pane 1** (MEDIUM) — S110. Root cause: CLI busy-state ignored dispatched Enter. Injection reports success without verifying CLI accepted submit. Single occurrence. Recommended fix (Ana): 2-phase submit — Enter dispatched → submit accepted verification (prompt/input-state transition signal) with 1 retry+backoff if no acceptance, and/or defer Enter while pane reports active generation. Monitoring for recurrence before prioritizing fix.

---

## Recently Resolved (Last 3 only)
- [ERR-005] Memory leak — RESOLVED S110. v1: ringBuffer cap (55fd3fa). v2: terminal queue cap (55fd3fa). v3: xterm.js scrollback cap 5000 lines (b14b8e2). v4: pendingWarRoomMessages cap 500 (6a783b5). Runtime validated S110: 16-min monitor, baseline 655MB → idle floor 584MB (no ratchet, delta -70MB). SUCCESS/GREEN.
- [ERR-004] Large message cursor-state corruption — commit 74fd0cd — RUNTIME VALIDATED S109.
- [ERR-001] Trigger file message delivery split/mangled - fixed by atomic temp+rename in hm-send.js fallback + stable-size watcher guard in watcher.js - commit 32b9993 - runtime validated S109.

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
