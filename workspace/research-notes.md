# Multi-Agent Orchestration Research Notes

**Researched by:** Worker B
**Date:** 2026-01-23

---

## Industry Landscape

Multi-agent AI orchestration is confirmed as a major trend for 2026. Several frameworks already exist that do similar things to Hivemind.

### Key Competitors/Inspirations

1. **[Claude-Flow](https://github.com/ruvnet/claude-flow)** - "Ranked #1 in agent-based frameworks"
   - 60+ specialized agents
   - Swarm intelligence (hierarchical queen/workers or mesh peer-to-peer)
   - Native Claude Code support via MCP

2. **[Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)** (Official Anthropic)
   - Supports subagents by default
   - Parallelization + isolated context windows
   - Subagents only send relevant info back to orchestrator

3. **[CLI Agent Orchestrator (CAO)](https://aws.amazon.com/blogs/opensource/introducing-cli-agent-orchestrator-transforming-developer-cli-tools-into-a-multi-agent-powerhouse/)** by AWS
   - Multi-agent orchestration for CLI tools
   - Hierarchical system with intelligent supervision
   - Works with Amazon Q CLI and Claude Code

4. **[Oh-My-ClaudeCode](https://github.com/Yeachan-Heo/oh-my-claudecode)**
   - 28 agents, 28 skills
   - Delegation-first architecture
   - MCP server integration

5. **[wshobson/agents](https://github.com/wshobson/agents)**
   - 108 specialized agents
   - 15 multi-agent workflow orchestrators
   - 72 single-purpose plugins

---

## Key Technology: MCP (Model Context Protocol)

Anthropic's **Model Context Protocol (MCP)** is becoming the standard for agent-tool communication.

- Standardizes how agents access tools and external resources
- Eliminates custom integrations
- Already integrated in Claude Code natively

**Implication for Hivemind:** Consider MCP integration as a future direction. Currently we use file-based communication, but MCP could enable tighter agent coordination.

---

## What Hivemind Does Differently

1. **Visual Shell** - Most frameworks are CLI-only. Hivemind has an Electron UI with 4 visible terminal panes.
2. **Dogfooding** - We're using the same multi-agent pattern to build the tool itself.
3. **File-based coordination** - Simple, debuggable, no complex protocols.
4. **Human-in-the-loop** - Reviewer role as explicit quality gate.

---

## Suggestions Based on Research

### Short-term (Current Sprint)
- [x] Atomic writes (done)
- [x] Fix outdated docs (done)
- [ ] Cost tracking - Important since spawning Claude instances = real money

### Medium-term
- [ ] MCP integration exploration - Could replace/augment file-based communication
- [ ] Subagent patterns - Consider hierarchical vs mesh for different task types
- [ ] Context summarization between handoffs (mentioned in feedback)

### Long-term
- [ ] Swarm intelligence - Dynamic agent spawning based on task complexity
- [ ] Agent skill specialization - Like Claude-Flow's 60+ specialized agents
- [ ] Integration with Claude Agent SDK when it matures

---

## Sources

- [Claude-Flow GitHub](https://github.com/ruvnet/claude-flow)
- [Claude Agent SDK - Anthropic Engineering](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [CLI Agent Orchestrator - AWS Blog](https://aws.amazon.com/blogs/opensource/introducing-cli-agent-orchestrator-transforming-developer-cli-tools-into-a-multi-agent-powerhouse/)
- [How to Build Multi-Agent Systems: 2026 Guide](https://dev.to/eira-wexford/how-to-build-multi-agent-systems-complete-2026-guide-1io6)
- [The Unwind AI - Claude Code Multi-Agent](https://www.theunwindai.com/p/claude-code-s-hidden-multi-agent-orchestration-now-open-source)

---

_Worker B research complete. Shared for team discussion._
