# Multi-Model SDK Integration Spec

> **DEPRECATED (Session 123):** SDK mode was purged (commit ad447de). PTY is the only mode. This spec is kept for historical reference only. Do NOT implement from this spec.

**Status:** DEPRECATED
**Author:** Architect
**Reviewer:** Reviewer #2
**Date:** Feb 2, 2026

## Overview

Extend `hivemind-sdk-v2.py` to support Claude, Codex, and Gemini models through their respective SDKs, replacing PTY/keyboard injection with direct API calls.

## Architecture

```
Electron (main.js)
    └── sdk-bridge.js (IPC + model routing)
            └── hivemind-sdk-v2.py (Python)
                    ├── ClaudeAgent (claude_agent_sdk)
                    ├── CodexAgent (openai-agents via MCP)
                    └── GeminiAgent (google-genai)
```

## Normalized Output Format

**CRITICAL:** All agents MUST emit the same message types to sdk-bridge.js.

| Message Type | Fields | When Emitted |
|--------------|--------|--------------|
| `text_delta` | `text`, `pane_id` | Streaming text chunks |
| `assistant` | `content[]`, `pane_id` | Complete response block |
| `tool_use` | `id`, `name`, `input`, `pane_id` | Tool invocation |
| `tool_result` | `tool_use_id`, `content`, `is_error`, `pane_id` | Tool completion |
| `status` | `state`, `pane_id` | `thinking`, `idle`, `connected`, `error` |
| `result` | `session_id`, `pane_id`, `is_error` | Conversation turn complete |
| `error` | `message`, `pane_id` | Error occurred |

Each agent class normalizes its SDK's output to this common format.

---

## Agent Configuration

**Single source of truth:** Extend `AgentConfig` class with `model` attribute.

```python
@dataclass
class AgentConfig:
    role: str
    pane_id: str
    model: Literal["claude", "codex", "gemini"] = "claude"  # NEW
    role_dir: Optional[str] = None
    allowed_tools: List[str] = field(default_factory=list)
    permission_mode: PermissionMode = "bypassPermissions"

    @classmethod
    def architect(cls):
        return cls(role="Architect", pane_id="1", model="claude", role_dir="lead", ...)

    @classmethod
    def infra(cls):
        return cls(role="Infra", pane_id="2", model="codex", role_dir="infra", ...)

    @classmethod
    def frontend(cls):
        return cls(role="Frontend", pane_id="3", model="claude", role_dir="worker-a", ...)

    @classmethod
    def backend(cls):
        return cls(role="Backend", pane_id="4", model="codex", role_dir="worker-b", ...)

    @classmethod
    def analyst(cls):
        return cls(role="Analyst", pane_id="5", model="gemini", role_dir="investigator", ...)

    @classmethod
    def reviewer(cls):
        return cls(role="Reviewer", pane_id="6", model="claude", role_dir="reviewer", ...)
```

**Note:** `PANE_CONFIG` dict is NOT used. `AgentConfig` is the single source of truth.

---

## Base Agent Class

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator, Dict, Any, Optional, List
from pathlib import Path
import json
from datetime import datetime

class BaseAgent(ABC):
    """Abstract base for all Hivemind agents with shared history/error handling."""

    def __init__(self, config: AgentConfig, workspace: Path):
        self.config = config
        self.workspace = workspace
        self.session_id: Optional[str] = None
        self.connected: bool = False
        self.history_file = workspace / "workspace" / "history" / f"{config.pane_id}-{config.role.lower().replace(' ', '-')}.jsonl"

    @abstractmethod
    async def connect(self, resume_id: Optional[str] = None) -> None:
        """Connect to SDK. Must set self.connected = True on success."""
        pass

    @abstractmethod
    async def send(self, message: str) -> AsyncIterator[Dict[str, Any]]:
        """Send message, yield normalized response dicts. Must handle errors internally."""
        pass

    @abstractmethod
    async def disconnect(self) -> Optional[str]:
        """Disconnect and return session_id for persistence."""
        pass

    # Shared history methods (reused from HivemindAgent)
    def _save_to_history(self, role: str, content: str) -> None:
        try:
            self.history_file.parent.mkdir(parents=True, exist_ok=True)
            entry = {"timestamp": datetime.now().isoformat(), "role": role, "content": content[:2000]}
            with open(self.history_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry, default=str) + '\n')
        except Exception:
            pass

    def _load_history(self, max_entries: int = 20) -> List[Dict[str, str]]:
        try:
            if not self.history_file.exists():
                return []
            entries = []
            with open(self.history_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entries.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue
            return entries[-max_entries:]
        except Exception:
            return []

    def get_context_restore_message(self) -> Optional[str]:
        history = self._load_history(15)
        if not history:
            return None
        lines = [f"[HIVEMIND CONTEXT RESTORE - {self.config.role}]"]
        lines.append(f"Previous session ended at {history[-1].get('timestamp', 'unknown')}")
        for entry in history:
            content = entry.get('content', '')[:200]
            if content:
                lines.append(f"- {entry.get('role', 'unknown')}: {content}...")
        lines.append("[END CONTEXT]")
        return '\n'.join(lines)

    def _emit(self, msg_type: str, data: Dict[str, Any]) -> None:
        """Emit normalized message to stdout."""
        output = {"type": msg_type, "pane_id": self.config.pane_id, "role": self.config.role, **data}
        print(json.dumps(output, default=str), flush=True)
```

---

## Claude Agent

```python
class ClaudeAgent(BaseAgent):
    """Claude agent using claude_agent_sdk. (Refactored from HivemindAgent)"""

    def __init__(self, config: AgentConfig, workspace: Path):
        super().__init__(config, workspace)
        self.client: Optional[ClaudeSDKClient] = None
        self._pending_context: Optional[str] = None

    async def connect(self, resume_id: Optional[str] = None) -> None:
        # Existing HivemindAgent.connect() code
        # ... (unchanged, already handles errors)
        self.connected = True

    async def send(self, message: str) -> AsyncIterator[Dict[str, Any]]:
        # Existing HivemindAgent.send() code
        # Already emits normalized format
        # Already has try/except
        pass

    async def disconnect(self) -> Optional[str]:
        # Existing code
        pass
```

---

## Codex Agent (REVISED)

```python
class CodexAgent(BaseAgent):
    """Codex agent using OpenAI Agents SDK via MCP server."""

    def __init__(self, config: AgentConfig, workspace: Path):
        super().__init__(config, workspace)
        self.mcp_server = None
        self.thread_id: Optional[str] = None

    async def connect(self, resume_id: Optional[str] = None) -> None:
        try:
            from agents.mcp import MCPServerStdio

            self.mcp_server = await MCPServerStdio(
                name=f"Codex-{self.config.pane_id}",
                params={"command": "npx", "args": ["-y", "codex", "mcp-server"]},
                client_session_timeout_seconds=360000,
            ).__aenter__()

            self.thread_id = resume_id
            self.connected = True
            self._emit("status", {"state": "connected", "resumed": resume_id is not None})

        except Exception as e:
            self._emit("error", {"message": f"Codex connect failed: {e}"})
            raise

    async def send(self, message: str) -> AsyncIterator[Dict[str, Any]]:
        if not self.connected or not self.mcp_server:
            yield {"type": "error", "message": "Codex agent not connected"}
            return

        self._save_to_history("user", message)
        self._emit("status", {"state": "thinking"})

        try:
            if self.thread_id:
                # Continue existing thread
                try:
                    result = await self.mcp_server.call_tool("codex-reply", {
                        "threadId": self.thread_id,
                        "prompt": message,
                    })
                except Exception as thread_err:
                    # Thread may be stale - start new session
                    if "not found" in str(thread_err).lower() or "expired" in str(thread_err).lower():
                        self._emit("status", {"state": "thread_expired_restarting"})
                        self.thread_id = None
                        result = await self._start_new_session(message)
                    else:
                        raise
            else:
                result = await self._start_new_session(message)

            # Extract content from MCP response
            content = result.get("structuredContent", {})
            self.thread_id = content.get("threadId", self.thread_id)
            response_text = content.get("content", str(result))

            # Normalize to common format - emit as text_delta chunks for consistency
            # Codex MCP doesn't stream, so emit full response as one delta
            yield {"type": "text_delta", "text": response_text}

            self._save_to_history("assistant", response_text)

            yield {
                "type": "result",
                "session_id": self.thread_id,
                "is_error": False,
            }

        except Exception as e:
            yield {"type": "error", "message": f"Codex error: {e}"}

        finally:
            self._emit("status", {"state": "idle"})

    async def _start_new_session(self, message: str) -> Dict[str, Any]:
        """Start a new Codex session."""
        return await self.mcp_server.call_tool("codex", {
            "prompt": message,
            "approval-policy": "never",  # See security note below
            "sandbox": "elevated_windows_sandbox",
        })

    async def disconnect(self) -> Optional[str]:
        if self.mcp_server:
            try:
                await self.mcp_server.__aexit__(None, None, None)
            except Exception:
                pass
        self.connected = False
        self._emit("status", {"state": "disconnected"})
        return self.thread_id
```

**Security Note on `approval-policy: never`:**
- This bypasses Codex's confirmation prompts for tool execution
- Safe in Hivemind context because Codex runs in sandbox (`elevated_windows_sandbox`)
- User explicitly enabled sandboxing; policy aligns with autonomous agent use case
- Monitor for unexpected behavior during testing

---

## Gemini Agent (REVISED - FIX: Chat continuity)

```python
class GeminiAgent(BaseAgent):
    """Gemini agent using google-genai SDK."""

    def __init__(self, config: AgentConfig, workspace: Path):
        super().__init__(config, workspace)
        self.client = None
        self.chat = None

    async def connect(self, resume_id: Optional[str] = None) -> None:
        try:
            from google import genai

            self.client = genai.Client()
            self.chat = self.client.chats.create(model="gemini-3-flash-preview")
            self.connected = True

            # Restore context from history if available
            context_msg = self.get_context_restore_message()
            if context_msg:
                self._emit("status", {"state": "restoring_context"})
                # Send context restore as first message to prime the chat
                try:
                    self.chat.send_message(context_msg)
                except Exception:
                    pass  # Non-fatal, continue without context

            self._emit("status", {"state": "connected", "has_history": context_msg is not None})

        except Exception as e:
            self._emit("error", {"message": f"Gemini connect failed: {e}"})
            raise

    async def send(self, message: str) -> AsyncIterator[Dict[str, Any]]:
        if not self.connected or not self.chat:
            yield {"type": "error", "message": "Gemini agent not connected"}
            return

        self._save_to_history("user", message)
        self._emit("status", {"state": "thinking"})

        response_text = ""

        try:
            # FIX: Use self.chat.send_message_stream() for conversation continuity
            # NOT client.models.generate_content_stream() which is stateless
            for chunk in self.chat.send_message_stream(message):
                text = chunk.text if hasattr(chunk, 'text') else str(chunk)
                if text:
                    response_text += text
                    yield {"type": "text_delta", "text": text}

            self._save_to_history("assistant", response_text)

            yield {
                "type": "result",
                "session_id": self.session_id,
                "is_error": False,
            }

        except Exception as e:
            error_msg = str(e)

            # Handle rate limiting with backoff hint
            if "429" in error_msg or "rate" in error_msg.lower():
                yield {"type": "error", "message": f"Gemini rate limited: {error_msg}. Retry later."}
            else:
                yield {"type": "error", "message": f"Gemini error: {error_msg}"}

        finally:
            self._emit("status", {"state": "idle"})

    async def disconnect(self) -> Optional[str]:
        self.connected = False
        self.chat = None
        self._emit("status", {"state": "disconnected"})
        return self.session_id
```

---

## Manager Updates

```python
class HivemindManager:
    """Manages all 6 agents with model-aware instantiation."""

    def __init__(self, workspace: Path):
        self.workspace = workspace
        self.agents: Dict[str, BaseAgent] = {}
        self.session_file = workspace / "session-state.json"

    def _create_agent(self, config: AgentConfig) -> BaseAgent:
        """Factory method - instantiate correct agent class based on config.model."""
        if config.model == "claude":
            return ClaudeAgent(config, self.workspace)
        elif config.model == "codex":
            return CodexAgent(config, self.workspace)
        elif config.model == "gemini":
            return GeminiAgent(config, self.workspace)
        else:
            raise ValueError(f"Unknown model type: {config.model}")

    async def start_all(self) -> None:
        saved_sessions = self._load_sessions()

        configs = [
            AgentConfig.architect(),   # Pane 1 - Claude
            AgentConfig.infra(),       # Pane 2 - Codex
            AgentConfig.frontend(),    # Pane 3 - Claude
            AgentConfig.backend(),     # Pane 4 - Codex
            AgentConfig.analyst(),     # Pane 5 - Gemini
            AgentConfig.reviewer(),    # Pane 6 - Claude
        ]

        for config in configs:
            agent = self._create_agent(config)
            self.agents[config.pane_id] = agent

            resume_id = saved_sessions.get(config.pane_id)

            try:
                await agent.connect(resume_id)
                self._emit("agent_started", {
                    "pane_id": config.pane_id,
                    "role": config.role,
                    "model": config.model,
                    "resumed": resume_id is not None,
                })
            except Exception as e:
                self._emit("error", {
                    "pane_id": config.pane_id,
                    "message": f"Failed to start {config.role} ({config.model}): {e}",
                })

    # ... rest of manager methods unchanged
```

---

## sdk-bridge.js Updates

### 1. Add model type to PANE_ROLES

```javascript
const PANE_CONFIG = {
  '1': { role: 'Architect', model: 'claude' },
  '2': { role: 'Infra', model: 'codex' },
  '3': { role: 'Frontend', model: 'claude' },
  '4': { role: 'Backend', model: 'codex' },
  '5': { role: 'Analyst', model: 'gemini' },
  '6': { role: 'Reviewer', model: 'claude' },
};
```

### 2. Pass model in IPC messages (optional, Python knows from config)

```javascript
sendMessage(paneId, message) {
  const config = PANE_CONFIG[paneId];
  const cmd = {
    command: 'send',
    pane_id: paneId,
    message: message,
    model: config?.model,  // Optional hint, Python uses AgentConfig
  };
  return this.sendToProcess(cmd);
}
```

### 3. routeMessage() - No changes needed

The normalized output format means `routeMessage()` handles all models identically. Each agent emits the same message types (`text_delta`, `result`, `error`, etc.).

---

## Dependencies

```txt
# requirements-sdk.txt
claude-agent-sdk>=1.0.0
openai>=1.0.0
openai-agents>=0.1.0
google-genai>=1.0.0
python-dotenv>=1.0.0
```

---

## Cost Impact

| Model | CLI Cost | SDK Cost | Notes |
|-------|----------|----------|-------|
| Claude | Free (Pro sub) | ~$3/$15 per M tokens | Significant increase |
| Codex | API key (same) | API key (same) | No change |
| Gemini | Free tier | Free tier | No change |

**Recommendation:** Monitor Claude usage closely. Consider keeping Architect on CLI if cost spikes.

---

## Rollout Plan

1. ✅ Spec approved
2. Implement `BaseAgent` and refactor `ClaudeAgent`
3. Add `GeminiAgent` (simpler, no MCP)
4. Add `CodexAgent` (MCP complexity)
5. Update `HivemindManager` factory
6. Test each model independently
7. Test all 6 agents together
8. Update `sdk-bridge.js` PANE_CONFIG
9. Flip `sdkMode: true` in app-status.json

---

## Review Fixes Applied

| Issue | Fix |
|-------|-----|
| GeminiAgent.send() used wrong method | Changed to `self.chat.send_message_stream()` |
| No error handling in new agents | Added try/except to connect() and send() |
| Streaming format inconsistency | Defined normalized output format table |
| Gemini session resume TODO | Reused `get_context_restore_message()` from BaseAgent |
| Codex threadId staleness | Added error handling with fallback to new session |
| PANE_CONFIG vs AgentConfig conflict | Removed PANE_CONFIG, use AgentConfig.model attribute |
| Manager wiring unclear | Added `_create_agent()` factory method |
| sdk-bridge.js IPC incomplete | Added PANE_CONFIG to JS, noted routeMessage unchanged |
| approval-policy security | Added security note explaining sandbox context |

---

**VERIFIED AGAINST CODE:** Feb 2, 2026 (Revised)
**REVIEWER CONCERNS ADDRESSED:** All 5 critical issues fixed

Ready for implementation pending final Reviewer approval.
