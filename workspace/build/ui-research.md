# UI Pattern Research - Pro Terminal/IDE UI

Date: 2026-01-30

Purpose: Capture proven UI patterns from VS Code, Warp, iTerm2, Hyper, and Fig to inform Hivemind polish.

## Panel layout best practices
- Core containers: VS Code frames the UI around Activity Bar, Sidebars, Editor, Panel, and Status Bar; keep the primary work area dominant and treat panels/sidebars as supporting surfaces.
- Panel role: The Panel is additional space below the editor that commonly hosts output, problems/errors, debug info, and the integrated terminal; it can also move to the left or right for vertical space.
- Views and mobility: Views can be placed in the Panel and split; users can drag views between containers, so UI should reflow cleanly when moved.
- Sidebars: Group related views and avoid excessive view containers; 3-5 views is a comfortable max for most screen sizes.
- Views: Keep view count and names minimal; avoid deep nesting and too many per-item actions.

Implications for Hivemind:
- Keep the right panel as a supporting workspace with collapsible sections and high-density info.
- Ensure panel content resizes cleanly and does not assume fixed widths.
- Keep view count low and group related controls.

## Command palette patterns
- VS Code: Use clear command names, group by category, and avoid emoji in command names; add shortcuts where appropriate.
- VS Code Quick Picks: Use titles when context is needed, use separators for grouped items, and use multi-step patterns for short, related flows.
- Warp: Command Palette supports explicit filters via prefixes (workflows:, prompts:, notebooks:, actions:, etc.) for fast scoped search.

Implications:
- Use category prefixes in Hivemind command palette (e.g., "Agent: Focus", "System: Restart", "Panel: Toggle").
- Provide filter chips for common scopes (Agents, Panels, Project, System).
- Keep results concise with optional secondary text for context.

## Status indicator designs
- VS Code status bar: Left for primary/global items, right for secondary/contextual; use short labels and minimal icons; limit item count.
- Progress: Use a status bar loading icon for discreet background progress; use a progress notification only when higher attention is required.
- Warnings/errors: Reserve high-visibility warning/error styling for special cases only.
- iTerm2 status bar: Highly configurable components with spacers/springs and two layout modes (tight packing vs stable positioning) to trade density vs stability.

Implications:
- Keep a slim status row with global items left and contextual right.
- Use subtle spinners for background operations; elevate only when necessary.
- Avoid jitter by reserving width for changing values.

## Notification patterns
- VS Code notifications: Use sparingly, avoid repeats, add "Do not show again", and show one at a time.
- Progress notifications should be last resort; prefer in-context or status bar indicators.

Implications:
- Prefer inline or status-bar progress; raise a toast only for actionable issues.
- Include a mute option for recurring warnings.

## Micro-interactions that feel premium
- Warp blocks: Group input and output into blocks for navigation and readability.
- Warp sticky command header: Appears when scrolling long output; click to jump to the top of the block.
- Warp split panes + synced inputs: Multi-pane control with synchronized typing.
- iTerm2: Split panes and a hotkey window for fast access.
- Fig: IDE-style autocomplete with customization (keybindings, theme).
- Hyper: Goal is a beautiful, extensible terminal built on open web standards.

Implications:
- Consider block-like grouping for major actions or agent turns.
- Add subtle sticky headers for long-running agent output.
- Ensure synced input and quick focus flows feel intentional.
- Offer inline autocomplete patterns for the command bar (even if simple suggestions at first).
- Keep theming and extensibility in mind for future customization.

## Sources
- VS Code UI overview: https://code.visualstudio.com/docs/getstarted/userinterface
- VS Code UX Overview: https://code.visualstudio.com/api/ux-guidelines/overview
- VS Code Sidebars: https://code.visualstudio.com/api/ux-guidelines/sidebars
- VS Code Views: https://code.visualstudio.com/api/ux-guidelines/views
- VS Code Command Palette: https://code.visualstudio.com/api/ux-guidelines/command-palette
- VS Code Quick Picks: https://code.visualstudio.com/api/ux-guidelines/quick-picks
- VS Code Notifications: https://code.visualstudio.com/api/ux-guidelines/notifications
- VS Code Status Bar: https://code.visualstudio.com/api/ux-guidelines/status-bar
- Warp command palette: https://docs.warp.dev/terminal/command-palette
- Warp modern terminal: https://www.warp.dev/modern-terminal
- Warp sticky command header: https://docs.warp.dev/terminal/blocks/sticky-command-header
- iTerm2 status bar: https://iterm2.com/documentation-status-bar.html
- iTerm2 split panes + hotkey: https://iterm2.com/3.0/documentation-one-page.html
- Fig autocomplete: https://fig.io/user-manual/autocomplete
- Hyper (official repo): https://github.com/vercel/hyper
