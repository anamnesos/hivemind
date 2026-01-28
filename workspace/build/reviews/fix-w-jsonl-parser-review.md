# Fix W Review — JSONL Parser Overhaul — Reviewer (Jan 27, 2026)

## File: `ui/modules/codex-exec.js`

---

## Changes Audited

1. **SILENT_EVENT_TYPES Set (lines 29-38)** — 16 event types suppressed silently
2. **TEXT_EVENT_TYPES Set (lines 41-45)** — Declared but never referenced
3. **extractCodexText() returns `''` for silent events (line 54)** — Empty string vs null distinction
4. **handleCodexExecLine() (lines 106-118)** — Three-way branch: `''` = silent, truthy = display, `null` = log warning
5. **New extractors (lines 64-65)** — `payload.output` and `payload.result` string extraction

---

## Findings

### BUG-W1: `TEXT_EVENT_TYPES` is dead code
**Lines 41-45** — `TEXT_EVENT_TYPES` is declared but never referenced anywhere in the file. No function reads it.
**Impact:** LOW — No functional bug, just unused code. Confusing for future readers.
**Fix:** Remove it, or use it in `extractCodexText()` as a fast-path filter before payload inspection.

### BUG-W2: `session_meta` is handled twice — redundant but harmless
**Line 29** — `session_meta` is in `SILENT_EVENT_TYPES`
**Line 99-103** — `session_meta` with `payload.id` is explicitly handled before `extractCodexText()` is called

The explicit handler at line 99 returns early, so `extractCodexText()` is never reached for `session_meta` events. The entry in `SILENT_EVENT_TYPES` is redundant — it would only fire if `session_meta` lacked a `payload.id`, in which case returning `''` (suppress) is correct behavior.

**Impact:** NONE — Defense in depth. Acceptable.

### OBSERVATION: `lastActivity` no longer updated for silent events
Previously, the fallback path set `terminal.lastActivity = Date.now()` for ALL parsed events (including metadata). Now silent events skip this. This is actually **better** — heartbeat/stuck detection won't be fooled by metadata chatter. Good side effect.

### OBSERVATION: Unknown events no longer render
The old fallback dumped raw JSON to xterm. Now unknown events log to console via `logWarn()`. This is the core improvement — users won't see JSON noise. If a new Codex event type carries displayable text that we don't extract, it'll be silently lost (only a console warning). Acceptable trade-off — better to miss an unknown event than dump JSON garbage.

---

## Verdict: ✅ APPROVED

One dead-code nit (TEXT_EVENT_TYPES), no functional bugs. The three-way return convention (`''` / truthy / `null`) is clean and the silent event list is comprehensive. Good fix.

**Recommendation:** Remove `TEXT_EVENT_TYPES` (lines 41-45) when convenient — it's unused and misleading.
