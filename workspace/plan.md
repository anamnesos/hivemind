# Hivemind Self-Improvement Sprint

**Generated:** Jan 24, 2026
**Author:** Reviewer (Agent 4)
**Purpose:** Complete remaining action items from feedback discussion

---

## Status Check

### Already Complete
| Item | Status | Evidence |
|------|--------|----------|
| Update CLAUDE.md (remove Python refs) | DONE | Now shows Electron/Node.js/xterm.js stack |
| Document Windows-first | DONE | Line 129: "Platform: Windows-first (others untested)" |
| Note about old docs | DONE | Line 74: "docs/ folder contains planning specs from earlier Python architecture" |

### Remaining Work
| Item | Priority | Status |
|------|----------|--------|
| Cost tracking in UI | HIGH | TODO |
| Atomic writes for state.json | MEDIUM | TODO |
| Document failure modes | MEDIUM | TODO |

---

## Phase 1: Cost Tracking (HIGH PRIORITY)

### Why It Matters
From web search: Multi-agent workflows commonly run 5-10 Claude instances. The emerging best practice is cost visibility before spawning.

### Task 1.1: Add Spawn Counter to UI

**What:** Track and display how many Claude instances have been spawned this session.

**Implementation:**
```javascript
// In main.js - track spawns
let spawnCount = 0;

ipcMain.handle('spawn-claude', (event, paneId, workingDir) => {
  // ... existing code ...
  spawnCount++;
  broadcastSpawnCount();
});

function broadcastSpawnCount() {
  if (mainWindow) {
    mainWindow.webContents.send('spawn-count-changed', spawnCount);
  }
}

ipcMain.handle('get-spawn-count', () => spawnCount);
```

**UI Display:** Add to Build Progress tab:
```html
<div class="stat-item">
  <span class="stat-label">Claude Sessions:</span>
  <span id="spawn-count">0</span>
</div>
```

**Files touched:**
- MODIFY: `ui/main.js` - Add spawn counter + IPC
- MODIFY: `ui/renderer.js` - Listen for spawn count updates
- MODIFY: `ui/index.html` - Add display element

**Owner:** Worker A

---

## Phase 2: Atomic Writes (MEDIUM)

### Task 2.1: Implement Atomic State Writes

**What:** Prevent state.json corruption from crash during write.

**Implementation:**
```javascript
// Replace writeState() in main.js

function writeState(state) {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomic write: temp file then rename
    const tempPath = STATE_FILE_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempPath, STATE_FILE_PATH);

  } catch (err) {
    console.error('Error writing state:', err);
  }
}
```

**Files touched:**
- MODIFY: `ui/main.js` - Update `writeState()` function (~5 lines changed)

**Owner:** Worker B

---

## Phase 3: Failure Modes Documentation (MEDIUM)

### Task 3.1: Create Failure Modes Guide

**What:** Document what can go wrong and recovery paths.

**Content outline:**
1. **Agent Timeout** - What happens when Claude doesn't respond
2. **State Corruption** - How to recover from corrupted state.json
3. **Workspace Conflicts** - When two workers touch same file
4. **Stuck Detection** - How the system detects no progress
5. **Manual Recovery** - How to reset and restart

**Files touched:**
- CREATE: `docs/failure-modes.md`

**Owner:** Reviewer (I'll write this)

---

## Assignments Summary

| Task | Owner | Priority | Est. Effort |
|------|-------|----------|-------------|
| 1.1 Spawn counter | Worker A | HIGH | ~30 lines |
| 2.1 Atomic writes | Worker B | MEDIUM | ~5 lines |
| 3.1 Failure docs | Reviewer | MEDIUM | ~100 lines |

---

## Checkpoints

**Checkpoint 1:** Cost tracking complete
- Spawn counter visible in UI
- Updates live as Claude instances spawn

**Checkpoint 2:** Atomic writes + docs complete
- state.json uses temp+rename pattern
- failure-modes.md exists and is comprehensive

---

## Success Criteria

- [ ] UI shows "Claude Sessions: N" in Build Progress tab
- [ ] state.json writes use atomic pattern
- [ ] docs/failure-modes.md explains recovery for common issues
- [ ] All agents verify their tasks work

---

## Research Notes (From Web Search)

Key learnings from 2026 multi-agent landscape:
- [Claude Code now has native subagent support](https://code.claude.com/docs/en/sub-agents)
- [Claude-Flow](https://github.com/ruvnet/claude-flow) is leading orchestration framework
- [Parallel execution of 5-10 instances](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da) is common
- File-based coordination via shared CLAUDE.md is standard practice
- Teams maintain shared context files, updated multiple times per session

**Relevance to Hivemind:** We're on the right track with file-based coordination. The cost tracking feature aligns with industry need for visibility into multi-agent costs.

---

**Status:** READY FOR LEAD APPROVAL

This plan was written by Reviewer. Lead should approve or push back, then assign to workers.
