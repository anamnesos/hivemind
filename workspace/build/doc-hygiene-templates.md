# Doc Hygiene Templates (Phase 1)

Last updated: 2026-02-10  
Owner: DevOps (template draft)  
Status: Ready for Architect apply

---

## Global Rules (applies to all three docs)

1. Keep an `ACTIVE` section at the top, max **5 items**.
2. Add a `Triage Snapshot` header with:
   - Severity counts (`CRITICAL/HIGH/MEDIUM/LOW`)
   - Top 3 priorities
   - Last updated timestamp
3. Every item must include `Owner` and `Last Verified`.
4. Move historical details to archive files (`*-archive.md`).
5. Use a normalized item shape so incident scanning is predictable.
6. Mark stale items automatically by policy:
   - `CRITICAL/HIGH`: stale after 24h without verification
   - `MEDIUM`: stale after 72h
   - `LOW`: stale after 7d
7. Stale marker format: `STALE: YES` plus `Stale Since` timestamp.

---

## Template: errors.md

```md
# Active Errors

## Triage Snapshot
- Last Updated: YYYY-MM-DD HH:MM (local)
- Severity Counts: CRITICAL X | HIGH X | MEDIUM X | LOW X
- Top 3 Priorities:
  1. [ERR-###] Short title (Severity, Owner)
  2. [ERR-###] Short title (Severity, Owner)
  3. [ERR-###] Short title (Severity, Owner)

---

## ACTIVE (Max 5)

### [ERR-###] Title
- Severity: CRITICAL|HIGH|MEDIUM|LOW
- Owner: Architect|DevOps|Analyst|Shared
- Status: ACTIVE|MONITORING|BLOCKED
- Last Verified: YYYY-MM-DD HH:MM by <role>
- STALE: NO|YES
- Stale Since: YYYY-MM-DD HH:MM | n/a
- Symptom: one sentence
- Impact: one sentence
- Repro: one line or `Unknown`
- Evidence: log path / event ids / commit refs
- Mitigation: current workaround (or `None`)
- Next Action: single concrete step

### [ERR-###] Title
- Severity:
- Owner:
- Status:
- Last Verified:
- STALE:
- Stale Since:
- Symptom:
- Impact:
- Repro:
- Evidence:
- Mitigation:
- Next Action:

---

## Recently Resolved (Last 3 only)
- [ERR-###] Title - fixed in <commit> - verified <date> by <role>
- [ERR-###] Title - fixed in <commit> - verified <date> by <role>
- [ERR-###] Title - fixed in <commit> - verified <date> by <role>

---

## Archive
- Older resolved entries: `workspace/build/errors-archive.md`
```

---

## Template: blockers.md

```md
# Blockers

## Triage Snapshot
- Last Updated: YYYY-MM-DD HH:MM (local)
- Active Blockers: X
- Severity Counts: CRITICAL X | HIGH X | MEDIUM X | LOW X
- Top 3 Priorities:
  1. [BLK-###] Short title (Severity, Owner)
  2. [BLK-###] Short title (Severity, Owner)
  3. [BLK-###] Short title (Severity, Owner)

---

## ACTIVE (Max 5)

### [BLK-###] Title
- Severity: CRITICAL|HIGH|MEDIUM|LOW
- Owner: Architect|DevOps|Analyst|Shared
- Blocked Area: build|runtime|workflow|infra|comms
- Last Verified: YYYY-MM-DD HH:MM by <role>
- STALE: NO|YES
- Stale Since: YYYY-MM-DD HH:MM | n/a
- Blocking: what cannot proceed
- Why Blocked: one sentence
- Unblock Condition: exact condition
- Mitigation: temporary workaround (or `None`)
- Next Action: single owner step

### [BLK-###] Title
- Severity:
- Owner:
- Blocked Area:
- Last Verified:
- STALE:
- Stale Since:
- Blocking:
- Why Blocked:
- Unblock Condition:
- Mitigation:
- Next Action:

---

## Recently Resolved (Last 5 one-liners)
- [BLK-###] Title - resolved by <commit> - verified <date> by <role>
- [BLK-###] Title - resolved by <commit> - verified <date> by <role>
- [BLK-###] Title - resolved by <commit> - verified <date> by <role>
- [BLK-###] Title - resolved by <commit> - verified <date> by <role>
- [BLK-###] Title - resolved by <commit> - verified <date> by <role>

---

## Archive
- Full blocker history: `workspace/build/blockers-archive.md`
```

---

## Template: shared_context.md

```md
# Hivemind Shared Context

## Triage Snapshot
- Last Updated: YYYY-MM-DD HH:MM (local)
- Session: S###
- Health: GREEN|YELLOW|RED
- Active Risks (Top 3):
  1. [RISK-###] Short title (Severity, Owner)
  2. [RISK-###] Short title (Severity, Owner)
  3. [RISK-###] Short title (Severity, Owner)

---

## Current Operating Model
- Layout: 3 panes (1 Architect, 2 DevOps, 5 Analyst)
- Messaging: WebSocket via `hm-send.js` (trigger files fallback only)
- Runtime Mode: PTY|SDK (current default)

---

## Current Priorities (Max 5)

### [PRI-###] Title
- Severity: CRITICAL|HIGH|MEDIUM|LOW
- Owner: Architect|DevOps|Analyst|Shared
- Last Verified: YYYY-MM-DD HH:MM by <role>
- STALE: NO|YES
- Stale Since: YYYY-MM-DD HH:MM | n/a
- Why It Matters: one sentence
- Current State: one sentence
- Next Milestone: one concrete milestone

### [PRI-###] Title
- Severity:
- Owner:
- Last Verified:
- STALE:
- Stale Since:
- Why It Matters:
- Current State:
- Next Milestone:

---

## Open Risks (Max 5)
- [RISK-###] title - severity - owner - last verified - one-line mitigation
- [RISK-###] title - severity - owner - last verified - one-line mitigation

---

## References
- Build status: `workspace/build/status.md`
- Active blockers: `workspace/build/blockers.md`
- Active errors: `workspace/build/errors.md`
- Event kernel plan/spec: `workspace/build/event-kernel-plan.md`, `docs/event-kernel-spec.md`

---

## Archive
- Historical context: `workspace/shared_context_archive.md`
```

---

## Optional follow-up automation (small script later)

- Add a lint/check script to:
  - enforce active item cap (<=5)
  - require `Owner` and `Last Verified` on all active items
  - compute stale marker from timestamp + severity threshold
  - fail CI/pre-commit if template invariants are violated
