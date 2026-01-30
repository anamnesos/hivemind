# Codex Exec Output UX Audit (Session 42 follow-up)

Date: 2026-01-30
Owner: Investigator
Scope: ui/modules/codex-exec.js + renderer status UI

## TL;DR
Codex exec output is plain text with minimal markers ([Working...], [Task complete], [Codex exec exited]). Most JSONL event types are suppressed, so progress and tool activity are invisible. Pane status is text-only; CSS classes for running/idle exist but never toggled. Streaming is line-chunked deltas, not smooth char-by-char. UX feels "silent/flat."

## 1) Current State (how output is formatted)
- File: ui/modules/codex-exec.js
- Output format:
  - WORKING_MARKER and COMPLETE_MARKER are injected once per run (lines 28-44).
  - JSONL lines are parsed; if parse fails, raw line is printed (lines 104-115).
  - Delta text events (content_block_delta, response.output_text.delta) are written as-is; non-delta text gets \r\n appended (lines 117-163).
  - Errors: [Codex exec stderr], [Codex exec error], [Codex exec exited X] markers (lines 217-244).
- Many event types are silenced: session/tool/command/lifecycle events (lines 46-57).

## 2) Thinking State
- Indicated only by:
  - Inline marker: [Working...] (codex-exec.js:28-44)
  - Pane header status text set to "Working" when marker seen (terminal.js:593-599 and 739-744)
- No spinner/animation; no periodic updates for long runs.

## 3) Completion State
- Indicated by:
  - [Task complete] marker (codex-exec.js:28-44)
  - [Codex exec exited X] marker (codex-exec.js:241-244)
  - Pane header status set to "Codex exec ready" when either marker appears (terminal.js:597-599 / 742-744)
- This yields redundant completion signals in normal success cases.

## 4) Streaming Behavior
- stdout is buffered and split by newline; each line is parsed as JSON (codex-exec.js:207-214).
- Delta output is streamed as chunks, not per character; newline handling can create extra gaps when deltas already include line breaks (lines 160-163).

## 5) Colors / Styling
- No ANSI styling is added for Codex markers or events; output is plain text.
- Only Codex-specific styling is the CLI badge (ui/styles/panes.css:118-125).
- Pane status CSS classes exist (.pane-status.idle/starting/running) but updatePaneStatus does not set classes (ui/styles/layout.css:220-228, renderer.js:282-287).

## 6) Progress Indicators
- None beyond [Working...] and “Working” header text.
- No tool/command/file-change progress lines are shown (those events are currently silenced).

## 7) Best-Practice Notes (general CLI UX)
- Users expect immediate feedback for long-running tasks (spinner or status line).
- For multi-step work, short phase or tool banners improve confidence.
- Avoid duplicate or noisy status lines; a single success marker is clearer than multiple “done” lines.

## 8) Recommendations (actionable)
**A. Add a real working indicator**
- Show a spinner or animated dot in the pane header next to status during Codex exec runs.
- Start on first start/delta event; stop on completion or exit.
- Owner: Implementer A (renderer UI)

**B. Surface key JSONL events**
- Stop silencing tool/command/file-change events; instead render concise tags:
  - [TOOL] search…
  - [CMD] npm test
  - [FILE] edited 3 files
- Owner: Implementer B (codex-exec.js event parsing)

**C. Smooth newline handling**
- Only append \r\n when needed (avoid double spacing if text already ends with newline).
- Owner: Implementer B

**D. Unify completion signal**
- Consider showing a single “Done (exit 0)” line; only show exit marker on non-zero codes.
- Owner: Implementer B

**E. Make status color meaningful**
- Update updatePaneStatus to also toggle CSS classes (idle/starting/running) so “Working” is visually distinct.
- Owner: Implementer A

## Code References
- codex-exec markers and parsing: ui/modules/codex-exec.js:28-244
- Working/complete status detection: ui/modules/terminal.js:593-599 and 739-744
- Pane status text update: ui/renderer.js:282-287
- Pane status CSS classes: ui/styles/layout.css:220-228

