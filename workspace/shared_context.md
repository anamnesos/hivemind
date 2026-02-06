# Hivemind Shared Context

**Last Updated:** Feb 6, 2026 (Session 80)
**Status:** Doc cleanup sprint complete

**For historical context (Sessions 1-73):** See `shared_context_archive.md`

---

## Architecture (Session 79+)

| Pane | Agent | Role | Trigger |
|------|-------|------|---------|
| 1 | Claude (Opus) | Architect + Frontend/Reviewer teammates | architect.txt |
| 2 | Codex | DevOps (Infra + Backend combined) | devops.txt |
| 5 | Gemini | Analyst | analyst.txt |

Panes 3, 4, 6 removed. Frontend and Reviewer run as Agent Teams teammates inside Pane 1.

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

## Session 80 — Doc Cleanup Sprint (Feb 6, 2026)

**Commits:**
- `a7ac5e6` — 16 files updated to 3-pane architecture
- `8b1ffc9` — README, VISION, triggers, instance-mapping updated

**What was done:**
- All documentation files updated from 6-pane → 3-pane references
- blockers.md archived (400+ → 25 lines)
- status.md archived (882 → 90 lines)
- shared_context.md archived (386 → lean)
- .gitignore updated for runtime cruft

---

## Known Issues

| Issue | Severity |
|-------|----------|
| Codex Windows sandbox experimental | LOW |
| Codex 0.98.0 random exit bug (#10511) | MEDIUM |
| xterm.js flow control warning (cosmetic) | LOW |
