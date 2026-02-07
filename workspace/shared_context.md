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

## Session 82-84 — Hooks + Intent Board + Capabilities (Feb 6, 2026)

**Commits pushed:**
- Expand button fix, tooltip fix, coordinator delegation rule
- Intent board protocol (3 CLAUDE.md files + seed JSON files)
- Gemini CLI hooks (ana-hooks.js + .gemini/settings.json)
- Claude Code hooks (arch-hooks.js + .claude/settings.local.json)
- Agent capabilities reference (workspace/references/agent-capabilities.md)
- Plain English section for capabilities reference
- README.md + MAP.md updates

**Key decisions:**
- Lifecycle hooks automate intent board sync (write side solved for Architect + Analyst)
- Claude Code's `additionalContext` injection gives fresh Architect sessions team state automatically
- Codex CLI has no lifecycle hooks — needs Skills/SKILL.md alternative
- Hook scripts must stay fast (sub-10ms, synchronous blocking)

---

## Session 80 — Doc Cleanup + Source Audit Sprint (Feb 6, 2026)

**Commits:**
- `a7ac5e6` — 16 docs updated to 3-pane architecture
- `8b1ffc9` — README, VISION, triggers, instance-mapping updated
- `5a4848a` — shared_context archived, .gitignore updated
- `bd64803` — 5 untracked source files tracked
- `d143270` — Source JSDoc + 14 test mocks aligned to 3-pane

**What was done:**
- All documentation files updated from 6-pane → 3-pane references
- blockers.md archived (400+ → 25 lines), status.md archived (882 → 90 lines)
- shared_context.md archived (386 → lean), .gitignore updated
- Source JSDoc: sdk-renderer (12x), mcp-bridge, watcher, api-docs-handlers
- Test mocks: 14 test files — PANE_ROLES, PANE_IDS, ROLE_ID_MAP aligned
- 87 suites / 2796 tests passing, all pushed

---

## Known Issues

| Issue | Severity |
|-------|----------|
| Codex Windows sandbox experimental | LOW |
| Codex 0.98.0 random exit bug (#10511) | MEDIUM |
| xterm.js flow control warning (cosmetic) | LOW |
