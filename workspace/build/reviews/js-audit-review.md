# JS Audit Review

Scope: `ui/renderer.js` (plus UI-related handlers it calls)

## Findings

### Unused functions
- No obvious unused functions detected in `ui/renderer.js`; all top-level helpers are referenced in this file. (Spot-checked via `rg` on each function name.)

### Duplicate logic
- **Status bar notifications:** Three handlers build status-bar messages with similar DOM creation + inline styling (`ui/renderer.js:1270`, `1316`, `1460`). Consider a small helper (e.g., `appendStatusBarNotice(text, opts)`) to reduce duplication and centralize removal behavior.
- **Pane status updates:** `updatePaneStatus` (`ui/renderer.js:282`) and the `codex-activity` handler (`ui/renderer.js:1395`) both manipulate status text + classes + spinner. Consider a shared helper to avoid diverging status-class logic over time.

### Console.log statements
- No `console.log` calls in `ui/renderer.js`. Only `ui/modules/logger.js` uses `console.log` by design; no removal needed here.

### Performance issues / unnecessary DOM queries
- **Health polling:** `updateHealthIndicators` runs every second (`ui/renderer.js:331`, scheduled at `ui/renderer.js:1250`) and repeatedly calls `getElementById` for each pane. With only six panes this is minor, but caching those elements would reduce DOM churn and make the loop cheaper.
- **Repeated status-bar lookups:** `document.querySelector('.status-bar')` is called in multiple event handlers (`ui/renderer.js:1270`, `1316`, `1460`). Consider caching once after DOMContentLoaded.
- **Codex activity updates:** The handler clears `statusEl.innerHTML` and re-appends nodes on every activity update (`ui/renderer.js:1395`). Consider keeping a text node reference and only updating its `.textContent` to reduce layout work during high-frequency updates.

### Error handling gaps
- **`codex-activity` event:** No guard for malformed payload before accessing `data.paneId/state/detail` (`ui/renderer.js:1395`). If IPC sends bad data, this handler can throw. Add a simple `if (!data || !data.paneId) return;` guard.
- **`heartbeat-state-changed` event:** Assumes `interval` is numeric; missing or invalid values will produce `NaN` in UI (`ui/renderer.js:1331`). Add a fallback (e.g., default interval or skip update).
- **SDK session start/end:** Loops hard-coded to panes 1..4 (`ui/renderer.js:1535-1545`). If pane count changes or SDK mode uses all 6 panes, statuses for 5/6 will not update. Consider deriving pane IDs from DOM (`document.querySelectorAll('.pane')`) or a shared config.
- **Idle indicator interval:** `enterIdleState` sets a `setInterval` without storing it on `paneIdleState` (`ui/renderer.js:460-515`). It clears itself when pane leaves idle, but if a pane is removed while idle the interval can leak. Consider storing the interval handle and clearing on teardown.

## Notes
- This audit is focused on maintainability and stability. No code changes applied here.
