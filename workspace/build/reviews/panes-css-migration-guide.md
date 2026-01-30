# panes.css CSS Variable Migration Guide

**Reviewer:** Reviewer
**Date:** Jan 30, 2026 (Session 47)
**Purpose:** Document exact changes needed to migrate panes.css to CSS design system

---

## COMPLETED (Tasks #9 + #10)

### Handoff Notifications (lines 200-283) ✅
Already uses CSS variables with fallbacks.

### Conflict Notifications (lines 285-384) ✅
Already uses CSS variables with fallbacks.

---

## NEEDS MIGRATION

### SDK Status Indicator (lines 4-69)

**Current (hardcoded):**
```css
.sdk-status.disconnected { color: #666; }
.sdk-status.disconnected::before { background: #666; }
.sdk-status.connected { color: #4ecca3; }
.sdk-status.connected::before { background: #4ecca3; }
.sdk-status.idle { color: #888; }
.sdk-status.idle::before { background: #888; }
.sdk-status.thinking { color: #ffc857; }
.sdk-status.thinking::before { background: #ffc857; }
.sdk-status.responding { color: #4ecca3; }
.sdk-status.responding::before { background: #4ecca3; }
.sdk-status.error { color: #e94560; }
.sdk-status.error::before { background: #e94560; }
```

**Should be:**
```css
.sdk-status.disconnected { color: var(--color-text-muted); }
.sdk-status.disconnected::before { background: var(--color-text-muted); }
.sdk-status.connected { color: var(--color-secondary); }
.sdk-status.connected::before { background: var(--color-secondary); }
.sdk-status.idle { color: var(--color-text-muted); }
.sdk-status.idle::before { background: var(--color-text-muted); }
.sdk-status.thinking { color: var(--color-accent); }
.sdk-status.thinking::before { background: var(--color-accent); }
.sdk-status.responding { color: var(--color-secondary); }
.sdk-status.responding::before { background: var(--color-secondary); }
.sdk-status.error { color: var(--color-error); }
.sdk-status.error::before { background: var(--color-error); }
```

Also fix spacing/radius:
```css
.sdk-status {
  gap: var(--space-1);  /* was: 4px */
  font-size: var(--text-xs);  /* was: 10px */
  padding: var(--space-1) var(--space-2);  /* was: 2px 6px */
  border-radius: var(--radius-sm);  /* was: 3px */
  transition: all var(--transition-normal);  /* was: 0.2s */
}
```

### SDK Session ID (lines 72-85)
```css
/* CHANGE: */
color: #555;
/* TO: */
color: var(--color-text-muted);
font-size: var(--text-xs);  /* was: 9px */
```

### Pane Timer (lines 88-102)
```css
/* CHANGE: */
font-size: 10px;
color: #555;
border-radius: 2px;
/* TO: */
font-size: var(--text-xs);
color: var(--color-text-muted);
border-radius: var(--radius-sm);

/* AND for .pane-timer.active: */
color: var(--color-secondary);  /* was: #4ecca3 */
```

### CLI Badge (lines 104-130)
```css
/* CHANGE: */
font-size: 9px;
border-radius: 3px;
/* TO: */
font-size: var(--text-xs);
border-radius: var(--radius-sm);

/* CLI-specific colors can remain as brand identifiers */
/* But can add fallbacks: */
.cli-badge.claude { color: var(--color-claude, #e9a060); }
.cli-badge.codex { color: var(--color-codex, #6ec6ff); }
.cli-badge.gemini { color: var(--color-gemini, #a78bfa); }
```

### CLI Codex Pane Accents (lines 132-153)
```css
/* These use #6ec6ff which is --color-info */
/* CHANGE to: */
color: var(--color-info);
border-color: color-mix(in srgb, var(--color-info) 45%, transparent);
```

### Pane Project Indicator (lines 156-177)
```css
/* CHANGE: */
font-size: 9px;
color: #4ecca3;
border-radius: 3px;
/* TO: */
font-size: var(--text-xs);
color: var(--color-secondary);
border-radius: var(--radius-sm);
```

### Agent Task Display (lines 180-198)
```css
/* CHANGE: */
font-size: 10px;
color: #888;
border-radius: 3px;
/* .has-task color: #ffc857 */
/* TO: */
font-size: var(--text-xs);
color: var(--color-text-muted);
border-radius: var(--radius-sm);
/* .has-task: */ color: var(--color-accent);
```

### Auto-Trigger Indicator (lines 388-426)
```css
/* CHANGE: */
background: #16213e;
border: 1px solid #4ecca3;
border-radius: 6px;
color: #4ecca3;
/* TO: */
background: var(--color-bg-medium);
border: 1px solid var(--color-secondary);
border-radius: var(--radius-lg);
color: var(--color-secondary);
```

### Pane Header Auto-Trigger Pulse (lines 418-426)
```css
/* CHANGE: */
background-color: #4ecca3;
background-color: #16213e;
/* TO: */
background-color: var(--color-secondary);
background-color: var(--color-bg-medium);
```

### Heartbeat Indicator (lines 428-453)
```css
/* CHANGE hardcoded colors to variables: */
.heartbeat-indicator {
  margin-left: var(--space-3);  /* was: 12px */
  padding: var(--space-1) var(--space-2);  /* was: 2px 8px */
  border-radius: var(--radius-md);  /* was: 4px */
  font-size: var(--text-xs);  /* was: 10px */
}
.heartbeat-indicator.idle {
  background: color-mix(in srgb, var(--color-secondary) 20%, var(--color-bg-dark));
  color: var(--color-secondary);  /* was: #4ecca3 */
}
.heartbeat-indicator.active {
  background: color-mix(in srgb, var(--color-info) 20%, var(--color-bg-dark));
  color: var(--color-info);  /* was: #4fc3f7 */
}
.heartbeat-indicator.overdue {
  background: color-mix(in srgb, var(--color-accent) 20%, var(--color-bg-dark));
  color: var(--color-accent);  /* was: #ffc857 */
}
.heartbeat-indicator.recovering {
  background: color-mix(in srgb, var(--color-warning) 30%, var(--color-bg-dark));
  color: var(--color-warning);  /* Use warning or add --color-orange: #ff9800 */
}
```

### Pane Title (lines 456-460)
```css
/* CHANGE: */
color: #e94560;
/* TO: */
color: var(--color-primary);
```

---

## Summary

**Lines needing changes:** ~50 lines across 10 sections
**Effort:** Medium - straightforward find-replace with semantic variable names
**Risk:** Low - CSS variables have fallbacks so existing colors preserved if vars undefined

---

## Recommendation

This work should be assigned to Implementer A or B as a follow-up task after the core layout.css tasks (#3-6) are complete. It's lower priority since panes.css widgets are smaller UI elements, but completing this would achieve 100% CSS variable coverage.
