# Active Errors

## Triage Snapshot
- Last Updated: 2026-02-13 06:33 (local)
- Severity Counts: CRITICAL 0 | HIGH 0 | MEDIUM 1 | LOW 1
- Top 3 Priorities:
  1. ERR-011 — pane 1 startup prompt not injected (MEDIUM)
  2. ERR-005 — memory leak CLOSED, cosmetic color bleed remains (task #5)

---

## ACTIVE (Max 5)

- [ERR-011] MEDIUM — Pane 1 (Architect) startup injection fires but submit verification rejects it. S122.
  * Symptom: Pane 1 sat idle after app launch; panes 2+5 auto-started. User had to manually type.
  * Root Cause: `injection.js:279` verifySubmitAccepted requires prompt transition when `promptWasReady=true`. Startup injection produces `output_transition_only` + `promptTransition=no` → rejected after 2 attempts → pane marked stuck. Panes 2+5 use Codex/Gemini paths with `verifySubmitAccepted=false`, so they succeed.
  * Fix: Startup injections should bypass or relax strict submit verification (similar to non-Claude paths).
  * Owner: DevOps (fix)

- [ERR-005] LOW — Memory leak CLOSED S120. Validated: peak 267MB, stable 207MB after 10 min. Remaining cosmetic: agent color bleed still visible briefly on new messages.
  * Root Cause: `agent-colors.js` fails to scan back to the origin tag line for long wrapped messages once `lastScannedLine` advances. Also, reset decorations are too narrow (only covering current text) and omitted if the line ends exactly at the tag.
  * Suggested Fix: 
    1. Update `scanStart` to back up to the nearest non-wrapped line.
    2. Always apply reset decoration after a tag with `width: terminal.cols` to cover future appends.
    3. Ensure continuation lines are always covered in the rescan loop.
  * Owner: Analyst (Investigation), Frontend (Implementation)

---

## Recently Resolved (Last 3 only)
- [ERR-005] Memory leak — CLOSED S120. 5 fixes across S119-S120. Primary cause: duplicate xterm decoration creation on unchanged cursor (ba529e6). Validated at runtime: 207MB stable over 10 min.
- [ERR-010] Runaway IPC polling — MISDIAGNOSIS S119.
- [ERR-009] Auto-submit false-positive — RESOLVED S119. Fix ca0bc44 validated at runtime.

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
