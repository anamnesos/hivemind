# Blockers

**For resolved items:** See `blockers-archive.md`

---

## Active Blockers

- **Item 7: Jest worker processes fail to exit gracefully (LOW)**
  - Root Cause: Multiple IPC handler modules (`perf-audit`, `template`, `organic-ui`, `status-strip`, `watcher`) use `setInterval` for polling but lack unregistration logic.
  - Affected: `ui/modules/ipc/*.js`, `ui/modules/*.js`.
  - Suggested Fix: Implement `unregister` functions in all handler modules and ensure they are called during `app.shutdown`.
  - Owner: DevOps (Implementer)

---

## Recently Resolved

- **Item 2: Workflow/GraphTab invoke errors (RESOLVED)**
  - Fixed: Exposed workflow/graph APIs in `preload.js`, updated `workflow.js` to use `window.hivemind`, and registered `KnowledgeGraph` handlers.
  - Verification: Level 1 (Tests pass, IPC channels verified).
- **Item 1, 3, 4, 5, 8, 9, 10: Cleared by Audit (RESOLVED)**
- **Item 6: Codex 0.98.0 exit bug (RETAINED - UPSTREAM)**

---

_Archived to blockers-archive.md. See Session 82 (injection lock, hm-send truncation), Session 80 (stale docs)._

---

## Backlog (Nice-to-Have)

_Empty — xterm.js flow control fixed in S91 (commit 3107eac). All prior backlog items resolved._
