# Review: Target Preview Dropdown

**Reviewer:** Reviewer
**Date:** 2026-01-30
**Files:** renderer.js, layout.css
**Status:** APPROVED

---

## Summary

Custom dropdown that highlights target pane(s) on hover, replacing native select while maintaining compatibility.

## Code Trace

### 1. Initialization (renderer.js:882)
`initCustomTargetDropdown()` called during init.

### 2. Native Select Handling (lines 900-904)
```javascript
const nativeSelect = document.getElementById('commandTarget');
nativeSelect.style.display = 'none';
```
Hidden but retained for compatibility.

### 3. Option Click Handler (lines 966-979)
```javascript
// Update native select
nativeSelect.value = opt.value;
nativeSelect.dispatchEvent(new Event('change'));
```
- Sets native select value
- Dispatches change event (triggers `updateCommandPlaceholder`)
- Updates visual state
- Closes dropdown with cleanup

### 4. sendBroadcast Compatibility (line 677-679)
```javascript
} else if (commandTarget) {
  targetPaneId = commandTarget.value;
}
```
`sendBroadcast` reads from `commandTarget.value` - fully compatible since custom dropdown updates native select.

### 5. Pane Highlighting (lines 947-959)
- Single pane: `.pane[data-pane-id="${opt.pane}"]` gets `.preview-highlight`
- All Agents: All `.pane` elements get `.preview-highlight`

### 6. Cleanup Paths
| Trigger | Code |
|---------|------|
| Option click | line 978: `clearPaneHighlights()` |
| Outside click | line 993: `clearPaneHighlights()` |
| List mouseleave | line 999: `clearPaneHighlights()` |
| Escape key | line 1009: `clearPaneHighlights()` |

All paths covered.

### 7. CSS Classes (layout.css)

**.preview-highlight (lines 161-172):**
- Dashed yellow outline (#ffc857)
- Pulse animation
- Distinct from `.focused` (solid teal)

**.custom-target-dropdown (lines 742-850):**
- Opens upward (`bottom: 100%`) - good for bottom command bar
- z-index 1000 (below search bar 10001, other overlays 10000) - correct layering
- Keyboard accessible (Enter/Space toggle, Escape close)

## Verification Checklist

- [x] Native select hidden but still updated
- [x] sendBroadcast reads commandTarget.value - compatible
- [x] Change event dispatched - updateCommandPlaceholder triggered
- [x] .preview-highlight separate from .focused
- [x] All panes highlighted for "All Agents"
- [x] Cleanup on all close paths
- [x] Keyboard navigation (Enter/Space/Escape)
- [x] z-index doesn't conflict

## Verdict

**APPROVED** - Clean implementation, maintains backward compatibility, proper cleanup.
