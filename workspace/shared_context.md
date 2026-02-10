# Hivemind Shared Context

## Triage Snapshot
- Last Updated: 2026-02-10 23:30 (local)
- Session: S107
- Health: GREEN
- Active Risks (Top 3):
  1. [RISK-001] Runtime validation pending for comms reliability protocol (LOW, Shared)
  2. [RISK-002] Trigger file delivery split/mangled fallback path still needs runtime burn-in (LOW, Shared)
  3. [RISK-003] Codex exit bug #10511 (MEDIUM, Upstream)

---

## Current Operating Model
- Layout: 3 panes (1 Architect, 2 DevOps, 5 Analyst)
- Messaging: WebSocket via `hm-send.js` (trigger files fallback only)
- Runtime Mode: PTY (current default)
- Config source of truth: `ui/config.js` → PANE_ROLES, PANE_IDS, ROLE_ID_MAP, TRIGGER_TARGETS

| Pane | Agent | Role | CLI | Trigger |
|------|-------|------|-----|---------|
| 1 | Claude (Opus) | Architect + Frontend/Reviewer teammates | claude | architect.txt |
| 2 | Codex | DevOps (Infra + Backend combined) | codex | devops.txt |
| 5 | Codex | Analyst (switched from Gemini S101) | codex | analyst.txt |

Panes 3, 4, 6 removed (S77/S79). Frontend and Reviewer run as Agent Teams teammates inside Pane 1.

---

## Current Priorities (Max 5)

### [PRI-001] Transition Objects / Transition Ledger
- Severity: HIGH
- Owner: Shared (DevOps scaffold, Analyst spec, Architect coordination)
- Last Verified: 2026-02-10 10:00 by Architect
- STALE: NO
- Stale Since: n/a
- Why It Matters: Team independently converged — most bugs are invisible handoff failures between correct components
- Current State: Team consensus achieved S107. DevOps ready to scaffold, Analyst ready to formalize spec.
- Next Milestone: Schema + lifecycle enum + evidence classes drafted

### [PRI-002] Doc Hygiene Overhaul
- Severity: MEDIUM
- Owner: Shared (DevOps templates, Analyst validation, Architect apply)
- Last Verified: 2026-02-10 10:00 by Architect
- STALE: NO
- Stale Since: n/a
- Why It Matters: Status docs are history books, not dashboards — slows triage under pressure
- Current State: Templates drafted by DevOps, being applied by Architect, Ana pressure-testing
- Next Milestone: All three docs migrated, Ana validates triage flow

### [PRI-003] Comms Reliability Protocol
- Severity: MEDIUM
- Owner: DevOps
- Last Verified: 2026-02-10 10:00 by Architect
- STALE: NO
- Stale Since: n/a
- Why It Matters: Fire-and-forget messaging causes silent stalls — James has to manually push
- Current State: Implemented and merged in `f9521e1` (ACK-timeout-resend, exponential backoff, server-side dedup, trigger fallback).
- Next Milestone: Runtime validation after next app restart (dedup under resend race + fallback exhaustion path).

---

## Open Risks (Max 5)
- [RISK-001] Comms protocol runtime validation pending (f9521e1) - LOW - Shared - 2026-02-10 - verify on restart
- [RISK-002] Trigger file delivery split/mangled fallback path - LOW - Shared - 2026-02-10 - monitor post-retry
- [RISK-003] Codex exit bug #10511 - MEDIUM - Upstream - 2026-02-10 - upgraded to 0.99.0-alpha.10, monitor
- [RISK-004] Jest worker leak warning (cosmetic) - LOW - DevOps - 2026-02-10 - 36 modules have unregister, 1 residual timer

---

## Communication

**WebSocket (preferred):**
```bash
node D:/projects/hivemind/ui/scripts/hm-send.js <target> "(ROLE #N): message"
```

| Target | Reaches |
|--------|---------|
| `architect` | Pane 1 |
| `devops` | Pane 2 |
| `analyst` | Pane 5 |

**Trigger files (fallback):** Write to `D:\projects\hivemind\workspace\triggers\{role}.txt`

---

## References
- Build status: `workspace/build/status.md`
- Active blockers: `workspace/build/blockers.md`
- Active errors: `workspace/build/errors.md`
- Event kernel spec: `docs/event-kernel-spec.md`
- Session handoff: `workspace/session-handoff.json`

---

## Archive
- Historical context (Sessions 1-73): `workspace/shared_context_archive.md`
