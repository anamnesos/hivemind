# Review: Dim Inactive Panes

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** layout.css (lines 161-173)
**Status:** APPROVED

---

## Summary

CSS-only visual enhancement that dims non-focused panes to create visual hierarchy.

## Code Analysis

### New CSS Rules (lines 161-173)

```css
/* Dim inactive panes to emphasize focused pane */
.pane:not(.focused) {
  filter: brightness(0.85);
  transition: filter 0.2s ease;
}

.pane:not(.focused):hover {
  filter: brightness(0.95);
}

.pane.focused {
  filter: brightness(1);
}
```

### Brightness Levels
| State | Brightness | Effect |
|-------|------------|--------|
| Inactive | 85% | Dimmed, de-emphasized |
| Inactive + Hover | 95% | Slightly brighter on hover |
| Focused | 100% | Full brightness |

### Technical Notes
- `filter: brightness()` is GPU-accelerated in modern browsers
- `transition: filter 0.2s ease` provides smooth state changes
- No JavaScript required - pure CSS solution

## Interaction Analysis

| Combined State | Result |
|----------------|--------|
| `.focused` | Full brightness + teal outline |
| `:not(.focused)` | Dimmed 85% |
| `:not(.focused):hover` | Dimmed 95% (brightens on hover) |
| `.preview-highlight:not(.focused)` | Dimmed 85% + yellow glow |
| `.preview-highlight.focused` | Full brightness + yellow glow |

**Note:** Preview-highlighted panes that aren't focused will be dimmed (85%). The yellow glow still appears but on a darker background. This is acceptable - the glow remains visible, and it's rare to preview-highlight a non-focused pane while it's focused elsewhere.

## Checklist

- [x] Non-focused panes dimmed (0.85)
- [x] Hover brightens (0.95)
- [x] Focused stays at full brightness (1.0)
- [x] Smooth transition (0.2s ease)
- [x] No JavaScript changes required
- [x] Complements existing focus ring

## Verdict

**APPROVED** - Clean CSS-only enhancement that adds visual hierarchy without complexity.
