# SDK Prototype Test Plan

**Created:** 2026-01-25
**Owner:** Reviewer
**Status:** DRAFT - Awaiting prototype completion

---

## Overview

Validation plan for Hivemind SDK migration prototype. Tests will verify the Claude Agent SDK meets our requirements and improves on the current PTY-based architecture.

---

## Test Categories

### 1. FUNCTIONAL - Core SDK Capabilities

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| F1 | Basic query() execution | Agent responds to prompt |
| F2 | Subagent spawning | Can spawn multiple named agents |
| F3 | Parallel execution | Multiple agents work simultaneously |
| F4 | Session persistence | Can capture session_id |
| F5 | Session resume | Can resume with previous context intact |
| F6 | Tool restrictions | Can limit agents to specific tools |
| F7 | Hooks execution | PreToolUse/PostToolUse callbacks fire |
| F8 | MCP server integration | Can connect external MCP servers |

### 2. RELIABILITY - Comparison vs PTY Approach

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| R1 | No stuck agents | Agents complete without hanging |
| R2 | No phantom interrupts | No unexplained agent termination |
| R3 | Graceful error handling | Errors don't crash the system |
| R4 | Context isolation | Subagent failures don't affect parent |
| R5 | Reconnection | Can recover from connection issues |

### 3. PERFORMANCE - Latency & Throughput

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| P1 | Response latency | Comparable or better than PTY |
| P2 | Parallel agent overhead | Acceptable startup time for 4 agents |
| P3 | Context compaction | Auto-compaction works under load |
| P4 | Memory usage | No memory leaks during extended use |

### 4. UX - User Experience

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| U1 | Output readability | Messages clearly formatted |
| U2 | Terminal-like feel | Can style output to feel native |
| U3 | Agent identification | Clear which agent produced output |
| U4 | Progress visibility | User can see agents are working |
| U5 | Broadcast input | Can send to all agents at once |

### 5. EDGE CASES - Error Handling

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| E1 | Invalid API key | Clear error message |
| E2 | Network disconnect | Graceful degradation |
| E3 | Context overflow | Auto-compaction prevents crash |
| E4 | Tool failure | Agent recovers or reports clearly |
| E5 | Concurrent writes | No race conditions |

---

## Comparison Matrix

| Issue | Current PTY Approach | Expected SDK Behavior |
|-------|---------------------|----------------------|
| Stuck agents | Common, needs auto-nudge | Should not occur |
| ESC key handling | Complex, multiple workarounds | N/A - no terminal |
| Session resume | PTY hacks, identity injection | Native session_id |
| Ghost text | Required keyboard event bypass | N/A - no terminal |
| Focus stealing | Required save/restore logic | N/A - no DOM focus |
| Context overflow | Manual management | Auto-compaction |

---

## Test Execution

### Prerequisites
- [ ] Task #1 complete (SDK backend working)
- [ ] Task #2 complete (UI renderer working)
- [ ] Task #3 complete (Multi-agent coordination working)

### Execution Order
1. Functional tests (F1-F8) - verify core capabilities
2. Reliability tests (R1-R5) - stress test for issues
3. Performance tests (P1-P4) - measure metrics
4. UX tests (U1-U5) - user experience validation
5. Edge case tests (E1-E5) - error handling

---

## Results

*To be filled after testing*

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Functional | | | |
| Reliability | | | |
| Performance | | | |
| UX | | | |
| Edge Cases | | | |

**Overall Verdict:** PENDING

---

## Sign-off

- [ ] Reviewer verification complete
- [ ] Lead approval
- [ ] User acceptance
