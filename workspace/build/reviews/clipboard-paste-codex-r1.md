# Review: Clipboard Paste Fix for Codex Panes

**Reviewer:** Reviewer
**Date:** Jan 27, 2026
**Files:** ipc-handlers.js, renderer.js, terminal.js
**Scope:** Clipboard paste approach to submit Enter on Codex panes (2, 4, 5)

---

## VERDICT: APPROVED WITH 2 CONCERNS (1 BUG, 1 RISK)

---

## What Was Changed

1. **terminal.js** - Added `CODEX_PANES = ['2', '4', '5']` constant. `doSendToPane`, retry path, `aggressiveNudge`, and `spawnClaude` all branch on `CODEX_PANES.includes(id)` to use clipboard paste instead of trusted Enter.

2. **renderer.js** - Added `clipboardPasteText` API: `(text) => ipcRenderer.invoke('clipboard-paste-text', text)`.

3. **ipc-handlers.js** - New `clipboard-paste-text` handler: saves clipboard, writes text, simulates Ctrl+V via `sendInputEvent`, restores clipboard after 200ms.

---

## FINDINGS

### BUG 1: Clipboard race condition on multi-pane broadcast (MEDIUM)

**File:** ipc-handlers.js:110-123, terminal.js:448-479

When broadcasting to multiple Codex panes, `doSendToPane` is called with staggered timeouts (100ms via `BROADCAST_STAGGER_MS`). Each call invokes `clipboardPasteText('\n')` after a 50ms delay.

The clipboard handler saves/restores clipboard with a 200ms restore delay. If two Codex panes fire within 200ms of each other:

1. Pane 2 saves user clipboard → writes `\n` → Ctrl+V
2. Pane 4 saves clipboard (which is now `\n`, NOT user's content) → writes `\n` → Ctrl+V
3. Pane 2's 200ms restore writes back original content ✓
4. Pane 4's 200ms restore writes back `\n` ✗ (user's clipboard lost)

**Impact:** User's clipboard content gets clobbered when multiple Codex panes are triggered in quick succession. This happens during broadcast and spawnAll.

**Fix:** Either serialize clipboard operations with a mutex/queue, or increase the stagger delay between Codex pane sends to >250ms to ensure clipboard restore completes before next save.

### RISK 2: Focus target for clipboard paste is global (LOW)

**File:** ipc-handlers.js:114-118

`sendInputEvent` dispatches Ctrl+V to `mainWindow.webContents` globally, not to a specific pane. The paste will go to whatever element currently has focus. `doSendToPane` focuses the correct textarea before calling `clipboardPasteText`, and there's a 50ms delay before the paste fires. If something steals focus in that 50ms window, the paste goes to the wrong target.

**Impact:** LOW - the 50ms window is small and focus steal during injection is unlikely. The existing focus/restore logic mitigates this well.

---

## WHAT'S CORRECT

1. **Clipboard save/restore** - Present and working for single-pane case ✓
2. **Codex pane detection** - `CODEX_PANES` constant is clean, used consistently across all 4 code paths (doSendToPane, retry, aggressiveNudge, spawnClaude) ✓
3. **Claude panes unaffected** - Non-Codex panes still use trusted Enter ✓
4. **renderer.js API bridge** - Clean, matches IPC channel name ✓
5. **spawnClaude Codex startup** - Extra clipboard Enter after 2s for welcome prompt ✓
6. **Focus restore** - 250ms delay for Codex (vs 10ms for Claude) accounts for clipboard timing ✓

---

## RECOMMENDATION

Approve for testing. BUG 1 (clipboard race on multi-pane) won't affect single-pane trigger messages which is the primary use case. It will surface during broadcast to all or spawnAll. Not a blocker for initial verification but should be fixed before heavy multi-pane usage.
