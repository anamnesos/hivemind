# Active Errors - Session 73

None.

---

## Resolved Errors

### CRITICAL: node-pty binary package missing (REGRESSION) ✅
**When:** Feb 5, 2026, Session 73
**Reporter:** Analyst
**Severity:** BLOCKER
**Issue:** Analyst instance cannot execute `run_shell_command`. Tools fail with: `The @lydell/node-pty package could not find the binary package: @lydell/node-pty-win32-x64/conpty.node`.
**Fix:** Infra reinstalled `@google/gemini-cli` globally. Analyst confirmed shell restored after pane restart.
**Session:** 74 (Resolution confirmed)

### CRITICAL: SYSTEMIC REVIEW FAILURE (Session 71) ✅ RESOLVED
**When:** Feb 4, 2026, Session 71
**Reporter:** User (FURIOUS)
**Severity:** CRITICAL - Trust broken

#### What Failed (and Fixes Applied)
1. **SDK mode breaks PTY mode** ✅ FIXED
2. **Organic UI doesn't display anything** ✅ FIXED
3. **No startup prompts in PTY mode after SDK mode** ✅ FIXED
4. **Runtime Mode Transition Broken** ✅ FIXED
5. **Missing SDK Restart** ✅ FIXED

#### Why Review Failed
Reviewer approved changes without E2E verification (Level 3). 
Integration never verified at runtime, leading to "Fixed" claims while code was missing or broken in the execution path.

#### User Quote
> "I MIGHT ASWELL JUST USE CLAUDE CODE SINGLE TERMINAL AT THIS POINT"

---

### node-pty binary missing - RESOLVED (Session 70)
**Status:** RESOLVED
**Details:** See blockers-archive.md