# Integration Review: Backlog Changes (Jan 28, 2026)

**Reviewer:** Reviewer (pane 6)
**Scope:** SDK 6-pane expansion, SDK pane unhide, focus save/restore, Codex exec input echo + line breaks
**Mode:** PTY (sdkMode=false) — regression check included

---

## 1. SDK 6-Pane Expansion (sdk-renderer.js)

**Files:** `ui/modules/sdk-renderer.js` lines 21-42

- `SDK_PANE_IDS` expanded to `['1','2','3','4','5','6']` ✅
- `SDK_PANE_ROLES` has all 6 roles with correct names ✅
- `setSDKPaneConfig()` passes both to `setPaneConfig()` ✅

**PTY regression risk:** NONE. These constants are only used when SDK mode is active. PTY path doesn't touch them.

**Verdict: KEEP** ✅

---

## 2. Unhide Panes 5/6 in SDK Mode (renderer.js)

**Files:** `ui/renderer.js` lines 18-25 (SDK_PANE_LABELS), lines 186-233 (applySDKPaneLayout)

- `SDK_PANE_LABELS` defines all 6 panes with names + avatars ✅
- `applySDKPaneLayout()` iterates `Object.keys(SDK_PANE_LABELS)` — gets all 6 ✅
- Sets `pane.style.display = ''` for each — previously panes 5/6 were hidden, now shown ✅
- Role names and avatars correctly assigned ✅
- Broadcast aliases include `'investigator': '5'` and `'reviewer': '6'` ✅

**PTY regression risk:** NONE. `applySDKPaneLayout()` is only called when SDK mode is enabled. PTY mode uses a different layout path.

**Verdict: KEEP** ✅

---

## 3. Focus Save/Restore in Codex Exec Path (terminal.js)

**Files:** `ui/modules/terminal.js` lines 483-506 (Codex path), lines 508-627 (Claude path)

### What changed:
- Codex exec path now snapshots `lastUserUIFocus` on entry (line 491)
- Restores focus after `codexExec()` call with 50ms setTimeout (line 502-504)
- Claude path already had this pattern — now consistent across both paths

### Input echo fix (was in blockers):
- Line 494-497: `terminal.write(\`\r\n\x1b[36m> ${text}\x1b[0m\r\n\`)` — echoes user input in cyan before exec ✅
- This resolves the blocker I filed: "BUG: User input not echoed in Codex panes"

### Line break fix in codex-exec.js:
- Line 120: Non-delta text gets `\r\n` appended, deltas don't (streaming chars) ✅
- Line 89: Non-JSON raw lines get `\r\n` ✅
- This resolves the blocker: "BUG: Codex output mashed together"

### Focus timing concern:
- Global `lastUserUIFocus` is shared across all concurrent `doSendToPane()` calls
- In rapid broadcast (6 panes, 100ms stagger), multiple restores fire within ~350ms
- Each restore targets the same global snapshot — this is CORRECT behavior for broadcast (all should restore to broadcast input)
- Edge case: if user clicks a different UI element mid-broadcast, the global updates and restores go to wrong target. This is a pre-existing condition, not a regression.

**PTY regression risk:** LOW. The Codex path (lines 490-506) only executes when `isCodexPane(id)` is true. Claude/PTY panes take the else branch (line 508+) which is unchanged in logic, only has focus restore added — which is strictly an improvement.

**Verdict: KEEP** ✅

---

## 4. Both Codex Exec Blockers — RESOLVED

| Blocker | Status | Fix Location |
|---------|--------|-------------|
| Input not echoed in Codex panes | ✅ FIXED | terminal.js:494-497 |
| Output mashed together | ✅ FIXED | codex-exec.js:120 |

These can be closed in blockers.md.

---

## Overall Recommendation

**KEEP ALL CHANGES.** No regressions for PTY mode. SDK changes are properly gated behind SDK mode checks. Focus restore is a strict improvement. Both Codex exec display bugs are fixed.

Minor note: the focus timing edge case during rapid broadcast is pre-existing and low-priority — not introduced by these changes.
