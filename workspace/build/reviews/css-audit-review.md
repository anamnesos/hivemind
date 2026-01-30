# CSS Audit Review

Scope: `ui/styles/*.css`

## Findings

### Duplicate or conflicting styles
- **Class collisions across files:** `.sdk-status` and `.sdk-session-id` are defined for pane headers in `ui/styles/panes.css:4` and `ui/styles/panes.css:72`, but also defined for SDK message rendering in `ui/styles/sdk-renderer.css:685` and `ui/styles/sdk-renderer.css:304` (plus `.sdk-msg.sdk-status` at `ui/styles/sdk-renderer.css:774`). Because these are global selectors, SDK message styling can unintentionally affect pane header elements. Recommend scoping SDK renderer rules under `.sdk-pane` or renaming header classes (e.g., `.pane-sdk-status`, `.pane-sdk-session-id`).
- **Tabs duplication:** `.tab-pane`, `.tab-title`, and `.tab-description` are declared in both `ui/styles/layout.css:872-891` and `ui/styles/tabs.css:1394-1405` with different values. This makes behavior order-dependent. Consolidate into one file or scope the tab styles to the right panel to avoid overrides.
- **Collapsible panels duplication:** `.settings-panel` (`ui/styles/settings-panel.css:3-14`) and `.friction-panel` (`ui/styles/friction-panel.css:3-14`) share nearly identical base styling (background, border, max-height, transition, padding). Consider a shared `.collapsible-panel` class with modifier variants.

### Unused or likely-unused rules
- **Unused keyframes:** `@keyframes sdkPulse` is declared in `ui/styles/panes.css:56` and `ui/styles/sdk-renderer.css:646`, but there are no references to `sdkPulse` in the stylesheets. Either remove or wire to the intended element.

### Inconsistent naming conventions
- Button naming mixes `.btn-*` (e.g., `.btn`, `.btn-danger`, `.btn-secondary`) with `*-btn` (e.g., `.process-spawn-btn`, `.process-kill-btn`, `.pane-refresh-btn`). This makes reuse inconsistent across features. Consider a single base `.btn` + modifiers (`.btn--primary`, `.btn--danger`, `.btn--ghost`) and convert one-off names to semantic modifiers.
- State classes vary between `.active`, `.selected`, `.visible`, `.open`, `.show` across similar UI elements. Not inherently wrong, but it makes state logic harder to unify in JS and CSS. Standardize where possible (e.g., use `.is-open`, `.is-active`, `.is-selected`).

### Animation optimizations
- **Box-shadow animation:** `.pane.preview-highlight` uses `@keyframes previewPulse` (`ui/styles/layout.css:319`) animating heavy `box-shadow`. Consider using a pseudo-element with `opacity`/`transform` instead to reduce paint cost.
- **Filter usage:** `.pane:not(.focused)` uses `filter: brightness()` (`ui/styles/layout.css:299-308`). Filters are expensive on large regions; consider using an overlay or a simple `opacity` change on a child wrapper.
- **Drop-shadow filters:** SDK honeycomb animation uses `filter: drop-shadow(...)` on each hex (`ui/styles/sdk-renderer.css:452-523`). It looks good but is GPU-expensive. Consider reducing shadow strength or moving glow to a single container element.

### Color values that should be variables
- Repeated hex colors across multiple files could be consolidated into design tokens in `ui/styles/base.css`:
  - `#16213e`, `#0f3460`, `#1a1a2e` (background tiers)
  - `#e94560` (primary accent)
  - `#4ecca3` (success/active)
  - `#ffc857` (warning)
  - `#888`, `#666`, `#555` (muted text)
  - `#00d9ff`, `#6ec6ff`, `#4a9eff`, `#ff6b6b` (secondary accents)
- Current files (`ui/styles/layout.css`, `ui/styles/panes.css`, `ui/styles/tabs.css`, `ui/styles/settings-panel.css`, `ui/styles/friction-panel.css`) still hardcode these values rather than using `var(--color-*)` from `ui/styles/base.css`.

## Notes
- No functional changes recommended here; this is a consolidation and maintainability pass.
