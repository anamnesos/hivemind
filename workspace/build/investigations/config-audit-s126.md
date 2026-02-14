# Config and Documentation Audit Log (S126)
Date: 2026-02-14
Analyst: Gemini

## 1. Root Files Audit

### D:/projects/hivemind/CLAUDE.md
- **L115:** Hardcoded roles table links Pane 2 to Codex and Pane 5 to Gemini. (BANNED)
- **L118:** References removed Panes 3, 4, 6.
- **L120:** Hardcodes model configuration policy but contradicts its own table on L115.
- **L129:** `session-handoff.json` description is slightly outdated regarding context restoration.

### D:/projects/hivemind/AGENTS.md
- **L7-9:** Hardcoded role-to-model mapping. (BANNED)
- **L11:** Mentions 3-pane layout correctly but still lists models next to roles.

### D:/projects/hivemind/GEMINI.md
- **L8-10:** Hardcoded role-to-model mapping. (BANNED)
- **L33:** Auto-start instructions are older than instance-level version.
- **L145:** Mentions "Analyst Instance (YOU - Gemini)" - hardcoded identity.

## 2. Instance Files Audit

### D:/projects/hivemind/workspace/instances/arch/CLAUDE.md
- **L13:** Links Pane 2 to Codex and Pane 5 to Gemini. (BANNED)
- **L33:** Claims startup hook auto-injects context, but instruction L36 tells agent to "Review the hook-injected context" - redundant if it's already in the prompt.
- **L165:** Links Pane 2 to Codex and Pane 5 to Gemini again.
- **L172:** Cross-model review protocol links models to roles (Ana=Gemini, DevOps=Codex). (BANNED)

### D:/projects/hivemind/workspace/instances/arch/AGENTS.md
- **STATUS:** FILE MISSING (ENOENT).

### D:/projects/hivemind/workspace/instances/ana/CLAUDE.md
- **L8:** Mentions "Analyst (YOU)" - acceptable, but L9 links roles to models again.
- **L10:** Correctly notes "Models can be swapped anytime" but contradicts previous line.
- **L101:** List of absolute paths is good, but includes `bash` which should be `powershell` on Win32.

### D:/projects/hivemind/workspace/instances/ana/AGENTS.md
- **L11:** Correctly states model assignment is runtime config. (GOOD)
- **L15:** CWD is `workspace/instances/ana/` but root `GEMINI.md` thinks it is elsewhere.

### D:/projects/hivemind/workspace/instances/ana/GEMINI.md
- **L8-10:** Hardcoded role-to-model mapping. (BANNED)
- **L141:** "Analyst Instance (YOU - Gemini)" - hardcoded.

### D:/projects/hivemind/workspace/instances/devops/CLAUDE.md
- **L8:** Hardcoded mapping. (BANNED)
- **L11:** Duplicate "NOTE: Models can be swapped anytime" lines.
- **L105:** Links DevOps to Codex and Analyst to Gemini. (BANNED)

### D:/projects/hivemind/workspace/instances/devops/AGENTS.md
- **L11:** Correctly states model assignment is runtime config. (GOOD)

## 3. Conflicting Role Info
- **Analyst vs Investigator:** Analyst is called "Analyst" in 90% of files, but root `CLAUDE.md` L115 calls pane 5 "Analyst" while `arch/CLAUDE.md` L115 legacy aliases mention "investigator".
- **Startup Protocols:** Root files (CLAUDE.md/GEMINI.md) provide broad startup instructions that are often 1-2 sessions behind the specific instance-level instructions.

## 4. Proposed Fixes
1. **Model Purge:** Remove all mentions of "Opus", "Codex", or "Gemini" from role definitions. Replace with "assigned model" or "runtime model".
2. **Pane Sync:** Remove all references to Panes 3, 4, and 6. Standardize on Panes 1, 2, and 5.
3. **Inheritance:** Instance files should `include` or reference the root files for "Identity" and "Communication" to prevent drift.
4. **Agent Teams:** Standardize the description of Architect's internal teammates (Frontend/Reviewer) across all files.
5. **Pathing:** Root `AGENTS.md` should define the canonical path list once.
