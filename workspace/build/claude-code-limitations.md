# Claude Code Limitations for Hivemind

**Author:** Reviewer
**Date:** Jan 25, 2026

---

## Overview

Hivemind wraps Claude Code CLI instances. Some behaviors cannot be controlled from Hivemind because they're internal to Claude Code.

---

## 1. Ghost Text / Autocomplete Suggestions

**What it is:** Claude Code shows greyed-out text suggestions in the terminal. User can press Tab to accept or keep typing to dismiss.

**Why it's a problem for Hivemind:**
- When Hivemind sends `\r` (Enter) to the terminal, Claude Code may accept the ghost suggestion
- This happens BEFORE our actual message arrives
- Result: Random text gets submitted to all 4 agents

**Claude Code Settings (Researched Jan 25, 2026):**
- `promptSuggestionEnabled: false` in `~/.claude/settings.json`
- `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false` environment variable
- **STATUS: BUGGY** - Multiple GitHub issues confirm these don't work reliably
- Issues: #14003, #14629, #15427, #15709, #16032, #17572, #18817
- Main feature request (#14003) closed as "not planned"

**What we tried:**
- Sending ESC before messages (doesn't reliably dismiss)
- `isTrusted` checks (only blocks synthetic events, not real Enter)
- Daemon deduplication (only blocks same-pane duplicates)
- Increased delays (helps but doesn't eliminate)
- V14: Removed auto-Enter entirely (prevents submission but ghost text still appears)

**What we CANNOT do:**
- Access Claude Code's internal autocomplete state
- Programmatically dismiss suggestions
- Rely on Claude Code's own disable setting (it's broken)

**Potential Hivemind-side solutions:**
1. Send Ctrl+U before injection (clears entire input line)
2. Increase ESC timing/count
3. Don't auto-send Enter - require manual submission
4. Accept that ghost text will occasionally appear (but we no longer auto-submit it)

---

## 2. Permission Prompts

**What it is:** Claude Code asks "Allow X? [y/n]" for various operations.

**Why it's a problem:**
- Prompts interrupt automated workflows
- Different agents may get different prompts
- Can't predict when prompts will appear

**Workarounds:**
- Use `--dangerously-skip-permissions` flag (security risk)
- Pre-approve common operations
- Accept that some manual intervention is needed

---

## 3. Session State

**What it is:** Claude Code maintains conversation context internally.

**Why it's a problem:**
- We can't read Claude Code's internal state
- Can't know what the agent "remembers"
- Session may be lost on restart

**Workarounds:**
- Use `--resume` flag when restarting
- Maintain external context in shared_context.md
- Accept that context syncing is imperfect

---

## 4. Output Parsing

**What it is:** Claude Code's terminal output includes ANSI codes, thinking indicators, etc.

**Why it's a problem:**
- Hard to detect when agent is "done"
- Thinking animation looks like activity
- Can't reliably parse structured data from output

**Workarounds:**
- Pattern matching for known completions (risky)
- Timeout-based detection
- Accept some false positives/negatives

---

## Recommendation

**Accept these limitations rather than fighting them.**

Hivemind should be a "coordinator" not a "controller". We can:
- Route messages between agents
- Provide shared context
- Offer a unified UI

We cannot:
- Control Claude Code's internal behavior
- Guarantee zero ghost text
- Fully automate permission handling

---

## For Users

If you experience ghost text:
1. Press ESC in the affected terminal
2. Clear the input and retype
3. This is a Claude Code behavior, not a Hivemind bug
