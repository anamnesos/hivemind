# Agent CLI Capabilities Reference

**Purpose:** Know what each agent's CLI can do so we use every tool available.
**Last Updated:** Session 83 (2026-02-06)

---

## Quick Comparison

| Capability | Claude Code (Arch) | Codex CLI (DevOps) | Gemini CLI (Analyst) |
|------------|-------------------|-------------------|---------------------|
| Lifecycle Hooks | 12 events | No (use Skills) | 11 events |
| MCP Support | Client | Client + Server | Client |
| Skills/Commands | Skills + Plugins | Skills (SKILL.md) + Slash commands | Agent Skills + Extensions |
| Sub-agents | Task tool (5 types) | Not documented | Sub-agents (custom) |
| Session Resume | --resume, --continue | resume, fork, /resume | Not documented |
| Settings Layers | User/Project/Local | User/Project/Profile | User/Workspace |
| Non-interactive | Yes (SDK) | codex exec | Not documented |

---

## Claude Code (Architect — Pane 1)

### Hooks (12 events)
Configured in `.claude/settings.local.json`. Scripts receive JSON on stdin, return JSON on stdout.

| Event | When | Hivemind Use |
|-------|------|-------------|
| **SessionStart** | Session begins/resumes | **ACTIVE** — Reads intent board, injects team state as additionalContext |
| **SessionEnd** | Session terminates | **ACTIVE** — Sets intent to idle |
| **PostToolUse** | After tool succeeds | **ACTIVE** — Tracks active_files on Edit/Write |
| **PreCompact** | Before context compression | **ACTIVE** — Saves intent snapshot |
| PreToolUse | Before tool executes | Could block dangerous ops, validate inputs |
| PostToolUseFailure | After tool fails | Could log failures to errors.md automatically |
| UserPromptSubmit | User submits prompt | Could inject context per-prompt |
| Stop | Agent finishes responding | Could auto-update intent after every response |
| Notification | System notification | Could forward to other agents |
| PermissionRequest | Permission dialog shown | Could auto-approve known-safe operations |
| SubagentStart/Stop | Subagent lifecycle | Could track teammate spawning in intent |

### MCP Servers (Client)
- Connect to external tool servers via `mcp__server__tool` pattern
- Could connect to Hivemind daemon for live process queries
- Config in `.claude/settings.json` or via `/mcp` command

### Skills & Plugins
- **Skills:** Slash commands with YAML frontmatter, can define scoped hooks
- **Plugins:** Bundled extensions with their own hooks, scripts, and tools
- Could create Hivemind-specific skills for common workflows (e.g., `/sync-team`, `/delegate`)

### Sub-agents (Task Tool)
- 5 built-in types: Bash, Explore, Plan, general-purpose, claude-code-guide
- Custom agents via `.claude/agents/` directory
- **Used for:** Frontend and Reviewer internal teammates (via Agent Teams)

### Settings
- **User:** `~/.claude/settings.json` (all projects)
- **Project:** `.claude/settings.json` (committed)
- **Local:** `.claude/settings.local.json` (gitignored)
- Key: permissions, hooks, model config, MCP servers

### Other
- `--resume` / `--continue` for session persistence
- `additionalContext` injection from SessionStart hooks (key differentiator)
- `CLAUDE_ENV_FILE` for persisting env vars across Bash calls

---

## Codex CLI (DevOps — Pane 2)

### Hooks
**Codex does NOT have lifecycle hooks like Claude Code or Gemini CLI.**
Use Skills (SKILL.md) and slash commands for automation instead.

### Session Management
| Feature | Command | Hivemind Use |
|---------|---------|-------------|
| Resume session | `codex resume --last` or `SESSION_ID` | Restore context without re-prompting |
| Fork session | `codex fork` | Branch a conversation for experiments |
| List sessions | `/resume` in TUI | See session history |
| Non-interactive | `codex exec` | CI/CD automation, scripted tasks |

- Sessions stored in `~/.codex/sessions/`
- State DB uses SQLite (source of the "missing rollout path" errors)

### MCP Support (Client + Server)
- **Client:** Connect to external MCP servers via `codex mcp add` or `config.toml`
- **Server:** `codex mcp-server` exposes `codex()` and `codex-reply()` tools
- **Hivemind use:** Could orchestrate Codex FROM Hivemind via MCP server mode

### Skills & Commands
| Type | How | Hivemind Use |
|------|-----|-------------|
| Built-in slash commands | `/permissions`, `/diff`, `/review`, `/model`, `/status`, `/mcp`, `/ps` | In-session control |
| Custom slash commands | User-defined | Team shortcuts |
| Skills | `SKILL.md` + scripts/resources | Standardized workflows |
| Rules | `~/.codex/rules` — allow/prompt/forbid command prefixes | Safety governance |

### Config
- **User:** `~/.codex/config.toml`
- **Project:** `.codex/config.toml`
- **Profiles:** `[profiles.<name>]` + `--profile` (experimental)
- **Admin:** `requirements.toml` for enforced policies
- Key settings: `approval_policy`, `sandbox`, `model`, `web_search`, `review_model`

### Other
- `AGENTS.md` layering (global + project-scoped instructions)
- Image inputs via `-i/--image`
- Cloud execution: `codex cloud exec` for remote tasks
- Feature flags: `codex features enable/disable`

---

## Gemini CLI (Analyst — Pane 5)

### Hooks (11 events)
Configured in `.gemini/settings.json`. Scripts receive JSON on stdin, return JSON on stdout.

| Event | When | Hivemind Use |
|-------|------|-------------|
| **SessionStart** | Session begins | **ACTIVE** — Updates intent with session number |
| **SessionEnd** | Session ends | **ACTIVE** — Sets intent to idle |
| **AfterTool** | After tool executes | **ACTIVE** — Tracks active_files from tool args |
| BeforeAgent | Before planning | Could inject context |
| AfterAgent | Agent loop completes | Could auto-update intent |
| BeforeModel | Before LLM request | Could modify prompts |
| AfterModel | After LLM response | Could filter/redact |
| BeforeToolSelection | Before tool selection | Could filter tools |
| BeforeTool | Before tool executes | Could validate/block ops |
| PreCompress | Before context compression | Could save state |
| Notification | System notification | Could forward alerts |

### Sub-agents (Custom)
- Specialized agents with independent contexts
- Could create `codebase_investigator` for deep code tracing
- Offloads deep analysis to save Analyst's main context window

### Agent Skills
- On-demand expertise via `activate_skill`
- Could create `hivemind-debug` skill with project-specific debugging procedures
- Only loaded when needed — doesn't bloat default context

### Extensions
- Bundles agents, skills, and MCP servers into one installable package
- Could package Hivemind protocols as a Gemini extension
- Distributable and version-controlled

### MCP Support (Client)
- Connect to external tool/data providers
- Could connect to Hivemind daemon for live process stats
- Config in `.gemini/settings.json`

### Settings
- **User:** `~/.gemini/settings.json`
- **Workspace:** `.gemini/settings.json` in project dir
- Key: `folderTrust`, `modelConfigs`, hooks enable/disable
- Management: `/hooks panel`, `/hooks enable/disable`

---

## Opportunities (Not Yet Used)

### High Priority
1. **Codex MCP Server mode** — Hivemind could orchestrate Codex directly via MCP instead of WebSocket injection
2. **PostToolUseFailure hook (Claude)** — Auto-log failures to errors.md
3. **Stop hook (Claude)** — Auto-update intent after every Architect response
4. **Gemini Sub-agents** — Deep code traces without filling Ana's context
5. **Codex Session Resume** — Restore DevOps context across Hivemind restarts

### Medium Priority
6. **Custom Skills (all 3)** — `/hivemind-sync`, `/delegate`, `/investigate` shortcuts
7. **Gemini Extensions** — Package Hivemind protocols for easy setup
8. **PermissionRequest hook (Claude)** — Auto-approve known-safe operations
9. **PreToolUse hook (Claude)** — Block destructive ops automatically

### Low Priority / Watch
10. **Codex Cloud exec** — Remote task execution
11. **Gemini BeforeModel/AfterModel** — Prompt modification (risky)
12. **Codex Profiles** — Experimental, not stable yet

---

## Sources
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Codex CLI Features](https://developers.openai.com/codex/cli/features/)
- [Codex CLI Reference](https://developers.openai.com/codex/cli/reference/)
- [Gemini CLI Hooks](https://geminicli.com/docs/hooks/)
- [Gemini CLI Docs](https://geminicli.com/docs/)
