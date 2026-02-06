# Blockers

**For resolved items:** See `blockers-archive.md`

---

## Active Blockers

None.

---

## Recently Resolved

### Architect injection lock-hang risk (Session 82) FIXED
- **Priority:** CRITICAL
- **Owner:** Architect
- **Fix:** Safety timer in injection.js changed from const→let with 10s replacement timer covering full Enter+verify phase. Prevents permanent injectionInFlight lock.

### hm-send.js message truncation (Session 82) FIXED
- **Priority:** MEDIUM
- **Owner:** Architect
- **Fix:** Changed arg parsing to join all args between target and --flags, handling PowerShell splitting quoted strings.

### Main CLAUDE.md stale role table (Session 80) FIXED
- **Priority:** LOW
- **Owner:** Architect
- **Fix:** Updated all docs to reflect 3-pane layout (CLAUDE.md, SPRINT.md, AGENTS.md, GEMINI.md, instance files, docs/roles/, docs/models/)
- **Session:** 80

---

## Backlog (Nice-to-Have)

### xterm.js flow control warning (Session 60)
- **Priority:** LOW (cosmetic/warning)
- **Owner:** Frontend
- **Issue:** "write data discarded, use flow control to avoid losing data" in devtools
- **Impact:** Some terminal output may be lost during heavy bursts - warning only, not crash
