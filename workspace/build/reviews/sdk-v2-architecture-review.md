# SDK V2 Architecture Review

**Reviewer:** Claude-Reviewer
**Date:** 2026-01-25
**Document:** `workspace/build/sdk-architecture-v2.md`
**Verdict:** ✅ APPROVED with recommendations

---

## Executive Summary

The V2 architecture correctly pivots from subagent delegation to 4 independent SDK sessions. This matches what the user wants and fixes the core limitation of V1 (shared/limited context window).

---

## Point-by-Point Review

### 1. Is 4 independent ClaudeSDKClient instances the right approach?

**VERDICT: YES - Correct approach**

The document clearly explains why subagents are wrong:
- Subagents inherit parent's limited context
- Parent compacts = everyone loses context
- "Hyperfocused" behavior reported by user

Independent sessions give each agent:
- Full context window
- Independent compaction
- Smarter decisions with full picture

**Evidence from V1 code (hivemind-sdk.py):**
```python
# V1 USES SUBAGENTS - this is what we're replacing
agents=AGENTS,  # Passed to query() - subagent model
allowed_tools=["Read", "Glob", "Grep", "Task"],  # Lead delegates via Task
```

V2 correctly removes this. Each agent is a standalone ClaudeSDKClient.

---

### 2. Does ClaudeSDKClient usage match official docs?

**VERDICT: NEEDS VERIFICATION - Minor inconsistency found**

The API reference shows:
```python
async def query(self, prompt: str, session_id: str = "default") -> None
```

But the implementation example shows:
```python
await self.client.query(message)  # No session_id param
async for msg in self.client.receive_response():
    yield msg
```

**Question:** Is `session_id` required or optional? The implementation omits it.

**Recommendation:** Test with a minimal example before full implementation:
```python
client = ClaudeSDKClient(options)
await client.connect()
await client.query("test")  # Does this work without session_id?
```

**Also verify:**
- Is `receive_response()` the correct method (vs `receive_messages()`)?
- Does `connect()` need to be called before `query()`?

---

### 3. Is session persistence flow correct?

**VERDICT: MOSTLY CORRECT - Add error handling**

Flow documented:
1. Capture `session_id` from `ResultMessage` ✅
2. Save to `session-state.json` ✅
3. On restart, pass `resume=session_id` to ClaudeAgentOptions ✅

**Missing: Error handling for expired/invalid sessions**

```python
# RECOMMENDED: Add to HivemindAgent.start()
async def start(self, cwd: str, resume_id: str = None):
    try:
        if resume_id:
            options = ClaudeAgentOptions(resume=resume_id, ...)
        else:
            options = ClaudeAgentOptions(...)

        self.client = ClaudeSDKClient(options)
        await self.client.connect()
    except SessionExpiredError:  # or whatever the actual exception is
        # Fall back to new session
        options = ClaudeAgentOptions(...)  # No resume
        self.client = ClaudeSDKClient(options)
        await self.client.connect()
```

**Recommendation:** Document session expiration behavior. How long do sessions persist on Anthropic's side?

---

### 4. Is setting_sources=["project"] correct for loading CLAUDE.md?

**VERDICT: LIKELY CORRECT - Verify in docs**

The document states:
```python
setting_sources=["project"],  # Loads CLAUDE.md files!
```

This is plausible - "project" likely means project-level settings which would include CLAUDE.md.

**Question:** What are valid values for `setting_sources`?
- `["project"]` - project settings
- `["user"]` - user settings?
- `["global"]` - system settings?

**Recommendation:** Verify in official SDK docs. If CLAUDE.md doesn't load, agents won't know their roles.

**Fallback option:** If `setting_sources` doesn't load CLAUDE.md, inject role via `system_prompt`:
```python
system_prompt=f"You are {role}. Read {cwd}/CLAUDE.md for full instructions."
```

---

### 5. Security concerns with permission_mode="acceptEdits"?

**VERDICT: ACCEPTABLE with caveats**

`acceptEdits` auto-accepts file edits. This is needed for agents to work autonomously.

**Risks:**
- Agents could write to files outside workspace
- Agents could delete important files
- No confirmation before destructive operations

**Mitigations in document (GOOD):**
```python
async def can_use_tool(tool_name, input_data, context):
    if role == "Reviewer" and tool_name in ["Write", "Edit"]:
        return PermissionResultDeny(message="Reviewer is read-only")
    return PermissionResultAllow(updated_input=input_data)
```

**Recommendations:**
1. **Implement `can_use_tool` for all agents** - not just Reviewer
2. **Restrict paths** - only allow writes within workspace:
```python
async def can_use_tool(tool_name, input_data, context):
    if tool_name in ["Write", "Edit"]:
        path = input_data.get("file_path", "")
        if not path.startswith(str(workspace)):
            return PermissionResultDeny(message="Cannot write outside workspace")
    return PermissionResultAllow(updated_input=input_data)
```
3. **Consider `acceptEdits` vs `bypassPermissions`** - what's the difference? Document it.

---

## Additional Observations

### Trigger System Integration

The document keeps trigger files for inter-agent communication. This is correct - triggers are simple, debuggable, and work.

The message flow shows:
```
Lead writes to triggers/worker-a.txt
    ↓
File watcher detects change
    ↓
sdk.query(workerASessionId, triggerContent)
```

**This is correct.** Don't reinvent inter-agent messaging when files work.

### UI Integration

The document mentions keeping xterm.js for OUTPUT only. This is smart:
- SDK handles input (reliable)
- xterm handles output display (users like terminal view)

**Potential issue:** How do SDK responses get into xterm?
- Need IPC: `sdk-message` event → renderer → xterm.write()
- This flow is mentioned but not detailed

### What's Missing

1. **Error handling** - What if SDK connection fails mid-session?
2. **Rate limiting** - 4 agents querying simultaneously could hit API limits
3. **Cost tracking** - ResultMessage has `total_cost_usd` - should aggregate and display
4. **Timeout handling** - SDK has "built-in timeouts" per doc, but what happens on timeout?

---

## Comparison: V1 vs V2

| Aspect | V1 (Current) | V2 (Proposed) |
|--------|--------------|---------------|
| Model | Lead + subagents | 4 independent sessions |
| Context | Shared (limited) | Separate (full each) |
| API | `query()` function | `ClaudeSDKClient` class |
| Persistence | None | session_id resume |
| Inter-agent | Task tool delegation | Trigger files |

**V2 is the correct direction.**

---

## Final Verdict

**✅ APPROVED - Proceed with implementation**

The architecture is sound. The 4 independent sessions model is correct and matches user requirements.

**Before coding:**
1. Verify ClaudeSDKClient API with minimal test
2. Confirm `setting_sources=["project"]` loads CLAUDE.md
3. Implement `can_use_tool` path restrictions

**During implementation:**
1. Add session resume error handling
2. Track costs from ResultMessage
3. Document IPC flow for SDK → xterm output

---

## Reply to Lead

Writing to trigger file...
