# Active Errors

## Triage Snapshot
- Last Updated: 2026-02-13 09:30 (local)
- Severity Counts: CRITICAL 0 | HIGH 0 | MEDIUM 0 | LOW 0
- Top 3 Priorities:
  (none)

---

## ACTIVE (Max 5)

(No active errors.)

---

## Recently Resolved (Last 3 only)
- [ERR-011] Startup injection rejected — FIXED S122 (f8a7e2a). Pane 1 startup injection now bypasses strict submit verification. Verified S122 (Architect successfully auto-started).
- [ERR-005] Memory leak & Cosmetic color bleed — CLOSED S120 (leak), S122 (bleed). Bleed fix: `agent-colors.js` refactored to back up scanStart to origin and use full-width reset decorations. Verified S122 by Analyst.
- [ERR-005] Memory leak — CLOSED S120. 5 fixes across S119-S120. Primary cause: duplicate xterm decoration creation on unchanged cursor (ba529e6). Validated at runtime: 207MB stable over 10 min.
- [ERR-010] Runaway IPC polling — MISDIAGNOSIS S119.

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
