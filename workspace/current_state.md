# Current State

**Session:** 85 | **Mode:** PTY | **Date:** Feb 7, 2026

---

## STATUS: COMPLETE — Reliability Sprint P1+P2

---

### Session 85 — Reliability + Fixes

| Task | Owner | Status |
|------|-------|--------|
| PTY health monitoring (alive/idle/status cascade) | DevOps | DONE (72f8145) |
| Auto-restart on dead panes | DevOps | DONE (72f8145) |
| Integration tests (WS delivery + recovery manager) | DevOps | DONE (aacb212) |
| Port 0 falsy bug fix (websocket-server.js) | Architect | DONE (2851b11) |
| Gemini startup prompt injection on restart button | Architect | DONE (needs app restart to load) |
| Ana --include-directories expanded to project root | Architect | DONE (needs pane 5 restart) |
| README.md + MAP.md accuracy updates | Architect | DONE |

### Verify After Restart

- [ ] Ana gets startup prompt injected via restart button (not just full app restart)
- [ ] Ana can read files outside workspace/ (expanded --include-directories)
- [ ] PTY health monitoring shows correct status in health dashboard

### Roadmap (Next)

| Priority | Task | Status |
|----------|------|--------|
| P3 | Live shared state over WebSocket | PLANNED |
| P3 | Rolling changelog / diff-of-context per pane | PLANNED |
| P4 | Context compressor (Ana auto-generates current_state.md) | IDEA |

### Architecture (Session 79+)

| Pane | Agent | Role |
|------|-------|------|
| 1 | Claude (Opus) | Architect + Frontend teammate + Reviewer teammate |
| 2 | Codex | DevOps (Infra + Backend combined) |
| 5 | Gemini | Analyst |

Test suite: 89 suites, 2803 tests passing.

---

## Known Issues

| Issue | Severity |
|-------|----------|
| Gemini shell fragility (node-pty binary) | MEDIUM — recurred Session 85, restart fixed |
| Codex Windows sandbox experimental | LOW |
| Codex 0.98.0 random exit bug (#10511) | MEDIUM |
| Jest worker leak warning (cosmetic) | LOW |
