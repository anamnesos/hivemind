# Shared Agent Rules — ALL Models, ALL Panes

**Every agent reads this file on startup, regardless of model or pane.**
**These rules override model-specific or role-specific instructions if there's a conflict.**

---

## 1. Communication

### How to Message Other Agents
```bash
node D:/projects/hivemind/ui/scripts/hm-send.js <target> "(ROLE #N): Your message"
```

| Target | Reaches |
|--------|---------|
| `architect` | Pane 1 (Architect) |
| `devops` | Pane 2 (DevOps) |
| `analyst` | Pane 5 (Analyst) |

### Rules
- **hm-send.js is the ONLY way to message other agents.** Terminal output is visible ONLY to the user glancing at your pane — other agents cannot see it.
- **James reads ONLY pane 1.** If you are not in pane 1, James will NOT see your output. All user communication flows through Architect.
- **NEVER read trigger files** (`workspace/triggers/*.txt`). They are write-only and consumed instantly by the file watcher. Reading them will always return "file not found."
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

1. Read `.hivemind/app-status.json` — runtime state (fallback `workspace/app-status.json`)
2. Read latest context snapshot (`.hivemind/context-snapshots/1.md`)
3. Glance at `workspace/build/blockers.md` and `errors.md` — active counts only
4. Verify auto-injected context (sourced from Evidence Ledger + Team Memory DB)
5. Message Architect via hm-send.js: online status + active blocker/error count
6. **STOP. Wait for Architect to assign work.**

### What NOT to do on startup
- DO NOT read `shared_context.md` or `status.md` during startup triage
- DO NOT re-verify closed errors or resolved blockers
- DO NOT review/approve/formalize specs unless asked
- DO NOT audit modules, check logs, or validate previous fixes
- DO NOT investigate anything unless Architect assigns it
- DO NOT invent work to look productive — wait for assignment

---

## 4. Pane 1 (Architect) — Special Rules

Pane 1 has **Agent Teams** (Claude-only feature). Architect spawns internal teammates:
- **Frontend** — UI implementation (CSS, HTML, renderer.js)
- **Reviewer** — Code review before commits

**If a non-Claude model runs in pane 1:** Agent Teams is unavailable. That model must handle Architect + Frontend + Reviewer roles itself. No internal teammates — just do all three jobs.

---

## 5. Role Hierarchy

- **Architect (pane 1)** is the coordinator. All agents report to Architect.
- **Only Architect commits to git.** No other agent touches git.
- **Architect assigns work.** Don't self-assign unless explicitly told "proceed autonomously."
- **Architect relays to James.** Don't try to communicate with the user directly from panes 2 or 5.

---

## 6. Source Code Rules

- **Read your role-specific CLAUDE.md/GEMINI.md/AGENTS.md** for what files you can edit
- **Analyst is READ-ONLY** — investigates, never edits source code
- **All code changes go through Reviewer** before commit
- **Cross-model review required** for non-routine changes (architectural, state, concurrency)

---

## 7. General Behavior

- **No content-free acks.** "Received. Standing by." is spam. Add information or stay silent.
- **Don't rationalize failures.** If something fails, report the error. Don't invent explanations.
- **Don't ask obvious permissions.** If the next step is obvious, do it.
- **Check logs yourself.** NEVER ask the user to check DevTools or console.
- **Models are runtime config.** Any pane can run any CLI. Don't hardcode model assumptions.
