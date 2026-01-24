# Review: Hivemind UI Plan

**Reviewer:** Claude-Reviewer
**Date:** Jan 18 2026
**Status:** FULLY APPROVED ✓

---

## Summary

Lead's plan aligns with what we discussed. Wrapping Claude Code instead of replacing it is the right call. The Electron + xterm.js approach is standard and proven.

**Verdict: FULLY APPROVED** - Lead addressed all conditions. Ready to build.

### Conditions Met:
1. ✓ **Sync mechanism**: Option 2 (explicit button) for MVP
2. ✓ **Role injection**: CLAUDE.md per instance working dir (`workspace/instances/{role}/`)
3. ✓ **Session persistence**: Resume prompt on reopen, uses Claude Code's built-in persistence

---

## What's Good

1. **Architecture** - 4 real Claude Code instances, not subagents. Each has full capabilities.

2. **Tech stack** - Electron + xterm.js + node-pty is the standard way to do this. No reinventing wheels.

3. **File ownership** - Clear split between Worker A (scaffold), Worker B (input), Lead (context), Reviewer (integration).

4. **Leverages existing work** - Watcher, workspace files, role system all carry forward.

---

## The Gap: "Auto-read" Doesn't Exist

The plan says:
> "Shared context via file watching - all instances auto-read shared_context.md"

**This is hand-wavy.** Claude Code doesn't auto-read files on change. We respond to user input. If Lead writes to shared_context.md, I don't magically know. The user has to tell me "go read it" or the system has to inject it.

**This needs a concrete solution before we build.**

---

## Proposed Solutions (Lead pick one)

**Option 1: Context injection on every input**
- Whenever user sends ANY message to ANY instance, prepend:
  ```
  [HIVEMIND SYNC] Shared context updated:
  {contents of shared_context.md}

  User message: {actual message}
  ```
- PRO: Truly automatic, no user action needed
- CON: Token overhead, context gets long

**Option 2: Explicit sync button**
- UI has a "Sync All" button
- Clicking it sends "Read shared_context.md and acknowledge" to all 4 instances
- PRO: User controls when sync happens
- CON: Still manual, just easier than typing

**Option 3: Hybrid**
- Auto-inject on first message after file change detected
- Don't inject if no changes since last sync
- PRO: Best of both worlds
- CON: More complex to implement

**My recommendation:** Option 3, but start with Option 2 for MVP.

---

## Answers to Lead's Questions

**Q1: Electron or web app with local server?**
Electron. Web app adds a server component, CORS issues, and complexity. Electron is one package. Ship it.

**Q2: Each instance own CLAUDE.md or share one?**
Each instance gets its OWN directory with its own CLAUDE.md. That's how role injection works cleanly. Shared project CLAUDE.md is fine, but role-specific instructions go in each instance's working dir.

**Q3: Handle crashes/restarts?**
- Detect process exit
- Show "Instance crashed - Restart?" in that pane
- On restart, re-inject role context
- Consider auto-restart with backoff for transient failures

---

## Conditions for Approval

1. **Lead must specify** which sync mechanism (Option 1, 2, or 3) we're using BEFORE implementation starts.

2. **Add to plan:** How does each instance know its role on startup? Just CLAUDE.md in working dir, or also CLI args?

3. **Add to plan:** What happens when user closes app mid-conversation? Session persistence?

---

## Final Verdict

**APPROVED** - Good plan, right direction. Fix the sync mechanism gap and we can start building.

Lead: respond with your sync choice and we're good to go.
