# SDK UI Design Spec

**Goal:** Match Claude Code's terminal UI quality in our HTML-based SDK renderer.

---

## Claude Code UI Elements (Our Baseline)

From research and observation:

### 1. Layout
- **Status bar at bottom** - Model name, cost ($X.XX), token count
- **Clean message separation** - Clear visual break between user/assistant turns
- **Proper whitespace** - Not cramped, breathing room between elements

### 2. Colors (Dark Theme)
- Background: Deep dark (#1a1a2e or similar)
- Text: Light gray/white (#e0e0e0)
- User input: Slightly different shade or highlight
- Success: Green tones (#10b981)
- Error: Red/coral (#ef4444)
- Info/Tool: Blue/purple accents (#6366f1, #8b5cf6)
- Borders: Subtle gray (#374151)

### 3. Tool Calls
- **Header with icon** - Tool name clearly visible
- **Colored differently** per tool type:
  - Read: Blue-ish
  - Edit: Yellow/amber
  - Write: Green
  - Bash: Purple
- **Collapsible** - Details hidden by default, expandable
- **Progress indicator** - Shows when tool is running

### 4. Typography
- **Monospace for code** - But not EVERYTHING in monospace
- **Sans-serif for UI text** - Labels, headers, status
- **Proper hierarchy** - Headers larger, content sized appropriately
- **Line height** - Readable, not cramped

### 5. Messages
- **User messages** - Clear indicator, maybe right-aligned or distinct background
- **Assistant messages** - Clean, readable, left-aligned
- **System messages** - Subtle, dimmed, not distracting

### 6. Thinking/Status
- **Subtle indicator** - Not flashy emoji, maybe animated dots or pulse
- **Non-intrusive** - Doesn't jump around or distract

### 7. Code Blocks
- **Syntax highlighting** - Or at minimum, proper monospace formatting
- **Copy button** - Nice to have
- **Clear boundaries** - Visually distinct from prose

---

## What We Have Now (Problems)

1. **Emoji overload** - 📋🔧👤❌ everywhere
2. **No visual hierarchy** - Everything same size/weight
3. **Harsh colors** - Bright blues/yellows on dark
4. **Cramped layout** - No breathing room
5. **Everything monospace** - Looks like raw terminal dump
6. **No subtle states** - Binary visible/hidden, nothing elegant

---

## Design Direction

### Modern Chat App Style (Claude.ai, ChatGPT)
- Clean cards with subtle shadows
- Rounded corners (4-8px)
- Smooth transitions
- Subtle hover states
- Proper padding (16-24px)

### Minimal Icons
- Use Unicode symbols or SVG icons, not emoji
- Small, subtle, contextual
- One color (accent color), not multicolor emoji

### Color Palette (Dark Mode)
```css
--bg-primary: #0f0f17;      /* Deep dark */
--bg-secondary: #1a1a2e;    /* Card backgrounds */
--bg-tertiary: #252542;     /* Hover/active states */
--text-primary: #e2e8f0;    /* Main text */
--text-secondary: #94a3b8;  /* Dimmed text */
--text-muted: #64748b;      /* Very subtle */
--accent-blue: #3b82f6;     /* Primary accent */
--accent-purple: #8b5cf6;   /* Secondary accent */
--accent-green: #10b981;    /* Success */
--accent-amber: #f59e0b;    /* Warning */
--accent-red: #ef4444;      /* Error */
--border: #1e293b;          /* Subtle borders */
```

### CSS Classes to Redesign
- `.sdk-message` - Base message container
- `.sdk-user` - User message bubble
- `.sdk-assistant` - Assistant message
- `.sdk-tool-header` - Tool call header
- `.sdk-tool-details` - Collapsible tool details
- `.sdk-content` - Text content
- `.sdk-system` - System/status messages
- `.sdk-error` - Error display
- `.sdk-result` - Completion info

---

## Implementation Priority

1. **Color palette** - Define CSS variables
2. **Message containers** - Cards with proper spacing
3. **User/Assistant distinction** - Clear visual difference
4. **Tool calls** - Clean collapsible with subtle icons
5. **Typography** - Font stack, sizes, weights
6. **Transitions** - Smooth show/hide, hover states

---

## References

- [Claude Code Output Styles](https://code.claude.com/docs/en/output-styles)
- [Terminal Config](https://code.claude.com/docs/en/terminal-config)
- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
