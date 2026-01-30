# Codex Exec Output Styling Fix Review

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** `ui/modules/codex-exec.js`, `ui/styles/layout.css`
**Status:** APPROVED

---

## Summary

Fixes Codex output rendering right-to-left and adds color coding for better scanability.

---

## Changes Reviewed

### 1. ANSI Color Constants (lines 8-17)

```javascript
const ANSI = {
  RESET: '\x1b[0m',
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
};
```

**Verdict:** Standard ANSI escape codes. Widely supported in xterm.js.

### 2. stripBidiControls() (lines 19-24)

```javascript
function stripBidiControls(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
}
```

**Unicode ranges:**
- `\u200E-\u200F` - LTR/RTL marks
- `\u202A-\u202E` - Embedding/override (LRE, RLE, PDF, LRO, RLO)
- `\u2066-\u2069` - Isolates (LRI, RLI, FSI, PDI)

**Verdict:** Correct. Strips control characters only, not actual RTL text content (Arabic/Hebrew would pass through). Type guard prevents crashes on non-strings.

### 3. Colored Markers

| Marker | Color | Location |
|--------|-------|----------|
| `[Working...]` | Cyan | line 46 |
| `[Done (exit 0)]` | Green | line 63 |
| `[Done (exit N)]` | Red | line 63 |
| `[FILE]` | Blue | line 214 |
| `[CMD]` | Yellow | line 224 |
| `[TOOL]` | Magenta | line 237 |

**formatTaggedLine signature** (line 109):
```javascript
function formatTaggedLine(tag, detail, color = ANSI.RESET)
```

Color applies to tag only, detail is plain. Good for readability.

**Verdict:** Good color differentiation. Exit code 0 = green, non-zero = red is intuitive.

### 4. stripBidiControls Usage

- **Line 295:** Applied to raw non-JSON lines
- **Line 349:** Applied to extracted text before formatting

Both call sites sanitize before broadcast. No gaps.

### 5. CSS Fix (layout.css lines 504-508)

```css
.pane-terminal .xterm {
  height: 100% !important;
  direction: ltr;
  unicode-bidi: isolate;
}
```

**Verdict:** Belt-and-suspenders with JS stripping. `direction: ltr` forces LTR, `unicode-bidi: isolate` prevents bidi context inheritance. Correct approach.

---

## Edge Cases Considered

1. **Intentional bidi output?** Unlikely for code. RTL bug fix takes priority.
2. **Non-string input to stripBidiControls?** Guarded with `typeof text !== 'string'`.
3. **Color support?** Standard ANSI codes, xterm.js supports them.

---

## Approval

**APPROVED** - Ready for runtime testing.

**Test checklist:**
1. Run Codex exec prompt
2. Confirm `[Working...]` appears in cyan
3. Confirm `[Done (exit 0)]` appears in green
4. Confirm `[Done (exit 1)]` appears in red
5. Confirm `[TOOL]`, `[CMD]`, `[FILE]` have distinct colors
6. Verify no RTL rendering issues in output

---

*Review by Reviewer, Session 45*
