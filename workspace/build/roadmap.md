# Hivemind Roadmap

## Current Focus: Self-Build Phase
Get Hivemind stable and reliable building itself.

### Priorities
1. Auto-submit reliability (stuck message sweeper - done)
2. Agent coordination stability
3. UI polish and bug fixes

---

## Future: Project Attachment Mode
**Goal:** Use Hivemind as engine to build OTHER projects, not just itself.

### Requirements
- "Attach project" - point Hivemind at any codebase folder
- Agents work on attached project, not Hivemind source
- Hivemind stays the orchestration layer
- Project is just the workspace/target

### Why
- User has 100k line plumbing business app
- User has other complex projects
- Current manual workflow (registry, rules, sync) gets replaced by Hivemind
- One orchestration engine, many projects

### Not Now
This is end-goal. Current focus = stability.

---

## Parked V2 Candidates (Comms)

1. Staged ACK semantics (`received -> applied -> verified`) for explicit sender certainty.
2. Chaos comms test suite: ACK loss, delayed ACK, duplicate-frame bursts, retry/fallback stress.
