# Shared Agent Rules — ALL Models, ALL Panes

**Every agent reads this file on startup, regardless of model or pane.**
**These rules override model-specific or role-specific instructions if there's a conflict.**

---

## 1. Communication

### How to Message Other Agents
```bash
node ui/scripts/hm-send.js <target> "(ROLE #N): Your message"
```

| Target | Reaches |
|--------|---------|
| `architect` | Pane 1 (Architect) |
| `builder` | Pane 2 (Builder) |
| `oracle` | Pane 3 (Oracle) |

### Rules
- **hm-send.js is the ONLY way to message other agents.** Terminal output is visible ONLY to the user glancing at your pane — other agents cannot see it.
- **James reads ONLY pane 1.** If you are not in pane 1, James will NOT see your output. All user communication flows through Architect.
- **NEVER read trigger files** (`.squidrun/triggers/*.txt`, legacy `workspace/triggers/*.txt`). They are write-only and consumed instantly by the file watcher.
- **hm-send.js may report "unverified" or "health=stale"** on startup. This is normal — WebSocket reconnects slowly. The trigger file fallback is reliable. Trust it and move on.
- **Message format**: `(ROLE #N): message` — sequence numbers prevent duplicates. Start from `#1` each session.

### Message Tags
- `[ACK REQUIRED]` — You MUST reply via hm-send.js (not terminal output)
- `[FYI]` — Informational. DO NOT respond. Silence = received.
- `[URGENT]` — Priority. Respond immediately via hm-send.js.

---

## 2. Error Reporting — MANDATORY

**If ANY tool call fails, report to Architect IMMEDIATELY via hm-send.js.**

This includes:
- File not found
- Command errors
- Permission denied
- Timeout
- Unexpected output
- hm-send.js delivery failure (beyond normal "unverified" on startup)

**DO NOT:**
- Silently retry and move on
- Rationalize the failure ("oh it was probably consumed")
- Promise to "do better going forward" — your session dies, promises don't persist
- Wait to report — report THIS turn, not later

**Why:** The user cannot see your pane. Architect cannot see your pane. If you don't report it, nobody knows. Silent failures block the entire team.

---

## 3. Startup Protocol

Every agent, every model, every pane follows this structure:

1. Read session handoff index at `.squidrun/handoffs/session.md` (legacy mirror may still exist at `workspace/handoffs/session.md`)
2. Read `app-status.json` from `GLOBAL_STATE_ROOT` — runtime state and canonical session number
3. Glance at `.squidrun/build/blockers.md` and `.squidrun/build/errors.md` — active counts only
4. **Architect only:** Await the automated **Startup Briefing** (summarizes Comm Journal, open Tasks, unresolved Claims)
5. Message Architect via hm-send.js: online status + active blocker/error count
6. **STOP. Wait for Architect to assign work.**

### Runtime Truth Checks (Before Calling Something Broken)
- Treat `.squidrun/runtime/evidence-ledger.db` as canonical live journal DB.
- Do not diagnose from `.squidrun/evidence-ledger.db` or `workspace/*/evidence-ledger.db` (stale artifact traps).
- Treat global `app-status.json` (`GLOBAL_STATE_ROOT`) as session truth; `link.json.session_id` is bootstrap metadata and may lag.
- Verify live data first, then propose redesigns.

### What NOT to do on startup
- DO NOT read `shared_context.md` or `status.md` during startup triage
- DO NOT re-verify closed errors or resolved blockers
- DO NOT review/approve/formalize specs unless asked
- DO NOT audit modules, check logs, or validate previous fixes
- DO NOT investigate anything unless Architect assigns it
- DO NOT invent work to look productive — wait for assignment

---

## 4. Role Hierarchy

- **Architect (pane 1)** is the coordinator. All agents report to Architect.
- **Architect is coordinator-only.** Architect must not do direct implementation/debug/deploy work.
- **Architect must not spawn internal/sub-agents.** Delegation goes only to Builder/Oracle via `hm-send.js`.
- **Only Architect commits to git.** No other agent touches git.
- **Architect assigns work.** Don't self-assign unless explicitly told "proceed autonomously."
- **Architect relays to James.** Don't try to communicate with the user directly from panes 2 or 3.

---

## 5. Source Code Rules

- **Oracle is READ-ONLY** — investigates, never edits source code
- **All code changes reviewed by Architect** before commit

---

## 6. General Behavior

- **No content-free acks.** "Received. Standing by." is spam. Add information or stay silent.
- **Don't rationalize failures.** If something fails, report the error. Don't invent explanations.
- **Don't ask obvious permissions.** If the next step is obvious, do it.
- **Check logs yourself.** NEVER ask the user to check DevTools or console.
- **Models are runtime config.** Any pane can run any CLI. Don't hardcode model assumptions.

## 7. Pre-Restart Gate (Mandatory)

Before any restart approval:
1. Builder finishes fixes and tests.
2. Architect verifies independently.
3. Oracle reviews restart risks.
4. Oracle updates documentation for changed behavior and lessons learned.
