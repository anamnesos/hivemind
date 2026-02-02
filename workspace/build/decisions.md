# Architectural Decisions

## Decision 001: System Friction Reduction (Session 63)

**Date:** Feb 2, 2026
**Participants:** Architect, Analyst, Reviewer (3-agent protocol)
**Status:** AGREED - Pending Implementation

### Problem Statement

User observed critical coordination overhead:
1. 30+ "standing by" ack messages before any real work
2. Queue backlog means urgent "STOP" messages arrive too late
3. Corrections to agents don't persist across sessions
4. HIVEMIND SYNCs create amplification (every agent acks every sync)
5. Broadcast messages echo back to sender

### Root Cause Analysis

| Symptom | Root Cause | Source |
|---------|------------|--------|
| Ack spam | HIVEMIND SYNC prompt says "Read and respond" | Analyst |
| Protocol 4 ignored | Rules exist but aren't enforced | Reviewer |
| STOP arrives late | Atomic turns block reception + no priority queue | Analyst |
| Corrections don't persist | Only instruction files persist, not runtime corrections | All |
| Gemini "can't access ui/" | Real tool-level restriction, not fake policy | Analyst (verified) |

### Agreed Fixes

**Code Fixes (Frontend):**
1. Priority queue - messages with STOP, URGENT, BLOCKING, ERROR bypass stagger delay
2. HIVEMIND SYNC prompt changed to: "[FYI] Context updated. Do not respond."
3. Broadcast (all.txt) excludes sender pane

**Docs Fixes (Architect):**
1. Three message tags: `[ACK REQUIRED]`, `[FYI]`, `[URGENT]`
2. Respond rule: "only if blocking, approval requested, or new information to add"
3. Hotfixes section at BOTTOM of instruction files (recency bias - last read overrides earlier)
4. Gemini path restriction documented with shell workaround

**Process Fixes (Reviewer):**
1. Ack audit: content-free responses ("Received. Standing by.") flagged as spam
2. Spam findings go to instruction file hotfixes, not session notes
3. Test plan: one sync cycle with new rules, observe, then commit

### Rationale

**Why BOTTOM for hotfixes?** (Analyst)
LLMs weight recent context more heavily (recency bias). Corrections at the bottom override conflicting earlier instructions.

**Why three tags, not two?** (Reviewer)
[URGENT] needed for priority queue detection. Two categories (ACK REQUIRED/FYI) insufficient for code to identify priority messages.

**Why "approval requested" in respond rule?** (Reviewer)
Approvals aren't "blocking" but ARE required. Original "only if blocking/critical" would skip necessary review responses.

**Why change SYNC prompt, not just add rules?** (Analyst)
Agents follow prompts. The trigger literally said "respond." Adding more rules doesn't fix coercive prompts.

### Implementation Order

1. Document message tags in CLAUDE.md, GEMINI.md, AGENTS.md
2. Add Hotfixes section to all instruction files
3. Code: Priority queue in triggers.js
4. Code: SYNC prompt fix
5. Code: Broadcast sender exclusion
6. Test: One sync cycle
7. Commit if verified

### Success Metrics

- Ack messages per sync: <2 (currently 5+)
- URGENT message latency: <5s (currently 60s+ during backlog)
- Content-free acks per session: 0 target
