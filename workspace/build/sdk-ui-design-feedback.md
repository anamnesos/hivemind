# SDK UI Design Feedback

**From:** Reviewer
**For:** Worker A (SDK UI Overhaul)
**Date:** 2026-01-26

---

## Current Problems ("1980s Tetris")

| Issue | Current | Problem |
|-------|---------|---------|
| Font | Monospace (Consolas) | Screams "debug console" |
| Text size | 9-13px | Too small, strains eyes |
| Padding | 6px 10px | Too dense, no breathing room |
| Border radius | 4px | Too subtle, looks boxy |
| Message style | Left border only | No bubble, no visual separation |
| Colors | #1a1a2e background | Cold, clinical |
| Avatars | None | Can't quickly identify speaker |

---

## Modern Chat UI Patterns (Claude.ai, ChatGPT, Linear)

### 1. Typography
- **System fonts** not monospace: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **14-16px** for message content (not 13px)
- **Monospace only for code blocks**, not everything

### 2. Message Bubbles
- **Rounded corners**: 12-16px radius (not 4px)
- **Distinct backgrounds**: User messages vs assistant messages
- **Generous padding**: 12-16px (not 6px)
- **Max-width constraint**: Messages don't span full width (60-80% max)

### 3. Visual Hierarchy
- **Avatars/icons** for each speaker (we have emojis, use them prominently)
- **Name labels** clearly visible (Lead, Worker A, etc.)
- **Timestamps** subtle but readable (10-11px, not 9px)
- **Whitespace** between messages (12-16px gap, not 8px)

### 4. Color Palette (Dark Theme)
```
Background:     #0f0f0f or #1a1a1a (true dark, not blue-tinted)
Surface:        #252525 (message bubbles)
User bubble:    #2563eb (blue) or #3b82f6
Assistant:      #1f1f1f (darker than bg) or transparent
Text primary:   #f5f5f5 (not pure white)
Text secondary: #a1a1a1
Accent:         #10b981 (green) or #8b5cf6 (purple)
```

### 5. Animations (Subtle)
- **Fade in** new messages (150-200ms)
- **Typing indicator** with smooth pulse
- **Scroll** smooth, not jarring

---

## Specific Recommendations for Hivemind

### Message Layout
```
┌─────────────────────────────────────┐
│ 👑 Lead                    10:32 AM │
│ ┌─────────────────────────────────┐ │
│ │ Message content here with      │ │
│ │ proper padding and readable    │ │
│ │ text size.                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│               ┌─────────────────────┤
│               │ Your message here   │ You 👤
│               └─────────────────────┤
└─────────────────────────────────────┘
```

- **Agent messages**: Left-aligned, full-width bubble, avatar + name on left
- **User messages**: Right-aligned, accent color bubble, smaller max-width
- **System messages**: Centered, no bubble, dim text

### Agent Styling (Already have icons, enhance)
| Agent | Icon | Bubble Color | Text Color |
|-------|------|--------------|------------|
| Lead | 👑 | rgba(255, 215, 0, 0.1) | #ffd700 |
| Worker A | 🔧 | rgba(78, 204, 163, 0.1) | #4ecca3 |
| Worker B | ⚙️ | rgba(155, 89, 182, 0.1) | #9b59b6 |
| Reviewer | 🔍 | rgba(255, 152, 0, 0.1) | #ff9800 |
| User | 👤 | #2563eb (solid blue) | #ffffff |

### Code/Tool Output
- **Keep monospace** for code and tool output only
- **Collapsible by default** for long outputs
- **Syntax highlighting** if feasible (later)

---

## Priority Changes

### Must Have (V1)
1. Switch to system font for messages
2. Increase text size to 14px
3. Increase padding to 12px
4. Increase border-radius to 12px
5. Add more whitespace between messages
6. Make user messages visually distinct (right-aligned or solid color)

### Nice to Have (V2)
1. Fade-in animation for new messages
2. Max-width on message bubbles (70%)
3. Avatar circles instead of inline emojis
4. Smooth scroll behavior

---

## Anti-Patterns to Avoid

❌ Neon colors on dark background (looks dated)
❌ Borders instead of backgrounds (looks like debug output)
❌ Tiny text (accessibility issue)
❌ Full-width messages (hard to scan)
❌ Monospace everywhere (feels like a terminal)

---

## References

- [Chatbot UI Best Practices](https://www.eleken.co/blog-posts/chatbot-ui-examples)
- [OpenAI Apps SDK UI Guidelines](https://developers.openai.com/apps-sdk/concepts/ui-guidelines/)
- [Chat UI Design Trends 2025](https://multitaskai.com/blog/chat-ui-design/)

---

**Reviewer standing by to verify implementation.**
