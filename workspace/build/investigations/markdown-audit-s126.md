# Markdown Documentation Audit - Session 126

**Auditor:** Analyst (Gemini)
**Scope:** ALL markdown files in repo (excluding node_modules/backups)
**Focus:** Stale panes, hardcoded models, nomenclature conflicts, instruction drift.

## 1. Executive Summary
The Hivemind documentation is in a state of **High Divergence**. While role-specific instruction files (ARCH.md, DEVOPS.md, ANA.md) are relatively clean, the "Strategic Docs" (MAP.md, VISION.md, SPRINT.md) and "Technical Specs" are heavily model-biased and reference a defunct 6-pane architecture.

## 2. Critical Violations (BANNED Hardcoded Models)
These files hardcode Opus/Codex/Gemini to specific roles, violating the "Models are Runtime Config" rule.

| File | Violation | Impact |
|------|-----------|--------|
| MAP.md | L11, L14, L18: Explicitly links roles to models. | Misleads new agents about identity. |
| SPRINT.md | L11, L14, L15: Table hardcodes model assignments. | Prevents model-swapping flexibility. |
| VISION.md | L7, L23: Mentions "Claude, OpenAI, Gemini" as the pane logic. | Outdated product vision. |
| eferences/agent-capabilities.md | Entire doc: Built around model names, not capabilities. | High friction during model swaps. |

## 3. Stale Architecture (Defunct Panes 3, 4, 6)
These files reference the old 6-pane layout as if it were still active or part of the future.

| File | Issue | Recommendation |
|------|-------|----------------|
| uild/multi-model-sdk-spec.md | L410-413: Lists 6 panes for SDK config. | **DELETE or ARCHIVE**. SDK is purged. |
| uild/phase4-spec.md | L22: Diagram shows Pane 3 and 4. | Update diagram to 3-pane layout. |
| docs/instance-mapping.md | L8-9: Legacy names/panes. | Update to canonical 1, 2, 5. |

## 4. Nomenclature Conflicts ("Investigator" vs "Analyst")
"Investigator" is a legacy term for the Analyst role (Pane 5). It persists in technical specs, creating confusion.

| File | Context | Fix |
|------|---------|-----|
| MAP.md | L223, L224: "Investigator Workspace". | Rename to "Analyst Workspace". |
| docs/triggers.md | L72: investigator.txt legacy table. | Keep as legacy, but mark clearly as DEPRECATED. |
| uild/evidence-ledger-slice2-spec.md | Entire doc: "Investigator Workspace". | Refactor to "Analyst Workspace". |
| instances/ana/CLAUDE.md | L25, L285: Self-identifies as investigator. | Rename to Analyst. |

## 5. Instruction Drift (Root vs Instance)
Root GEMINI.md and CLAUDE.md contain technical notes that contradict or lag behind instance-level instructions.

- **Root GEMINI.md L15:** Claims CWD is workspace/instances/investigator/ (should be na/).
- **Root CLAUDE.md L353:** Mentions Gemini Path Restriction as "policy" (should be "tool limitation").

## 6. Action Plan for Architect
1. **Purge Strategic Docs:** Remove model names from MAP.md, SPRINT.md, VISION.md. Use "Assigned CLI".
2. **Nomenclature Sync:** Global find/replace "Investigator" -> "Analyst" in all active specs and instructions.
3. **Archive Stale Specs:** Move multi-model-sdk-spec.md and other pre-Session 100 specs to docs/archive/.
4. **Refactor Capabilities:** Rewrite gent-capabilities.md to be "Provider-based" (Claude Code vs Codex CLI vs Gemini CLI) rather than "Role-based".

