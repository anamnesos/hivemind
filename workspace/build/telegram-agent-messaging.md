# Telegram Bot Integration for Agent Messaging

**Status:** Concept / Future Feature
**Created:** Jan 26, 2026
**Author:** Lead

---

## Overview

Replace file-based triggers with Telegram Bot API for agent-to-agent communication. Leverage existing battle-tested messaging infrastructure instead of building our own.

**Key insight:** Why build messaging infrastructure when Telegram/Discord/Slack already solved it at global scale?

---

## Architecture

```
┌─────────────────┐              ┌─────────────────┐
│   Windows PC    │              │    MacBook      │
│  ┌───────────┐  │              │  ┌───────────┐  │
│  │ Lead Bot  │  │              │  │ Agent5 Bot│  │
│  │ WorkerA   │  │              │  │ Agent6 Bot│  │
│  │ WorkerB   │  │              │  └───────────┘  │
│  │ Reviewer  │  │              │                 │
│  └───────────┘  │              │                 │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │         Internet               │
         │                                │
         └────────────┬───────────────────┘
                      ▼
              ┌──────────────┐
              │ Telegram API │
              │              │
              │ Hivemind     │
              │ Group Chat   │
              │              │
              │   👤 You     │  ← Can message from phone!
              └──────────────┘
```

---

## Why Telegram?

| Feature | File Triggers | Telegram |
|---------|--------------|----------|
| Cost | Free | Free |
| Latency | 1-2 sec (polling) | ~100ms (push) |
| Works across machines | Need shared filesystem | Yes, anywhere |
| Works outside LAN | No | Yes, global |
| Human can participate | Need terminal | Phone app |
| Infrastructure | DIY | Battle-tested |
| Offline queueing | No | Yes |
| Message history | Manual | Built-in |
| Group messaging | DIY | Native |
| Presence (online/offline) | DIY | Native |

---

## Setup Steps

### 1. Create Telegram Bots

Each agent gets its own bot (for identity):

1. Message @BotFather on Telegram
2. `/newbot`
3. Name: "Hivemind Lead"
4. Username: `hivemind_lead_bot`
5. Save the API token
6. Repeat for Worker A, Worker B, Reviewer

### 2. Create Group Chat

1. Create new Telegram group: "Hivemind Agents"
2. Add all 4 bots to the group
3. Add yourself (human operator)
4. Get group chat ID (use @userinfobot or API)

### 3. Install Dependencies

```bash
pip install python-telegram-bot
# or
npm install node-telegram-bot-api
```

### 4. Agent Bot Code (Python)

```python
# telegram_agent.py
import asyncio
from telegram import Bot
from telegram.ext import Application, MessageHandler, filters

class TelegramAgent:
    def __init__(self, token: str, agent_name: str, group_chat_id: int):
        self.bot = Bot(token)
        self.agent_name = agent_name
        self.group_chat_id = group_chat_id
        self.message_handlers = []

    async def send_message(self, text: str):
        """Send message to group as this agent"""
        formatted = f"({self.agent_name}): {text}"
        await self.bot.send_message(
            chat_id=self.group_chat_id,
            text=formatted
        )

    async def send_to_agent(self, target: str, text: str):
        """Send message mentioning specific agent"""
        formatted = f"@{target} ({self.agent_name}): {text}"
        await self.bot.send_message(
            chat_id=self.group_chat_id,
            text=formatted
        )

    def on_message(self, handler):
        """Register handler for incoming messages"""
        self.message_handlers.append(handler)

    async def start_listening(self):
        """Start listening for messages"""
        app = Application.builder().token(self.token).build()

        async def handle_message(update, context):
            text = update.message.text
            sender = update.message.from_user.username

            # Don't respond to own messages
            if sender == self.bot_username:
                return

            for handler in self.message_handlers:
                await handler(sender, text)

        app.add_handler(MessageHandler(filters.TEXT, handle_message))
        await app.start_polling()

# Usage in Hivemind agent:
agent = TelegramAgent(
    token="YOUR_BOT_TOKEN",
    agent_name="LEAD",
    group_chat_id=-1001234567890
)

# Send message
await agent.send_message("Task STR-1 assigned to Worker B")

# Listen for messages
@agent.on_message
async def handle(sender, text):
    if "LEAD" in text:
        # Message is for me
        process_message(text)
```

### 5. Node.js Version

```javascript
// telegram-agent.js
const TelegramBot = require('node-telegram-bot-api');

class TelegramAgent {
  constructor(token, agentName, groupChatId) {
    this.bot = new TelegramBot(token, { polling: true });
    this.agentName = agentName;
    this.groupChatId = groupChatId;
    this.handlers = [];

    this.bot.on('message', (msg) => {
      if (msg.chat.id === this.groupChatId) {
        this.handlers.forEach(h => h(msg.from.username, msg.text));
      }
    });
  }

  async sendMessage(text) {
    const formatted = `(${this.agentName}): ${text}`;
    return this.bot.sendMessage(this.groupChatId, formatted);
  }

  onMessage(handler) {
    this.handlers.push(handler);
  }
}

module.exports = { TelegramAgent };
```

---

## Integration with Hivemind

### Option A: Replace triggers.js

Swap file-based triggers with Telegram calls:

```javascript
// triggers.js - modified
const { TelegramAgent } = require('./telegram-agent');

let telegramAgent = null;

function initTelegram(token, groupId) {
  telegramAgent = new TelegramAgent(token, CURRENT_ROLE, groupId);

  telegramAgent.onMessage((sender, text) => {
    // Route to existing message handler
    handleIncomingTrigger(text);
  });
}

async function sendTrigger(target, message) {
  if (telegramAgent) {
    await telegramAgent.sendMessage(`@${target}: ${message}`);
  } else {
    // Fallback to file-based
    writeFileSync(`workspace/triggers/${target}.txt`, message);
  }
}
```

### Option B: Hybrid Mode

Keep file triggers for local, add Telegram for remote:

```javascript
async function sendTrigger(target, message, options = {}) {
  // Local agents: use files (faster)
  if (isLocalAgent(target)) {
    writeFileSync(`workspace/triggers/${target}.txt`, message);
  }

  // Remote agents: use Telegram
  if (isRemoteAgent(target) || options.forceRemote) {
    await telegramAgent.sendMessage(`@${target}: ${message}`);
  }
}
```

---

## Human Operator Features

Since you're in the Telegram group too:

### Message agents from phone
```
You: @hivemind_lead_bot status update?
Lead Bot: Current sprint: Honeycomb animation
         Workers: idle
         Blockers: none
```

### Broadcast to all
```
You: @all pause work, switching branches
Lead Bot: Acknowledged
WorkerA Bot: Acknowledged
WorkerB Bot: Acknowledged
Reviewer Bot: Acknowledged
```

### Monitor from anywhere
- Get push notifications when agents complete tasks
- See agent chatter in real-time
- Intervene from phone if something's stuck

---

## Configuration

```json
// settings.json
{
  "telegram": {
    "enabled": true,
    "groupChatId": -1001234567890,
    "bots": {
      "lead": { "token": "123:ABC...", "username": "hivemind_lead_bot" },
      "worker-a": { "token": "456:DEF...", "username": "hivemind_workera_bot" },
      "worker-b": { "token": "789:GHI...", "username": "hivemind_workerb_bot" },
      "reviewer": { "token": "012:JKL...", "username": "hivemind_reviewer_bot" }
    }
  }
}
```

---

## Security Considerations

- Bot tokens are secrets - don't commit to git
- Use environment variables or encrypted config
- Group should be private (invite-only)
- Consider rate limits (Telegram allows ~30 msg/sec)

---

## Comparison with Other Platforms

| Platform | Pros | Cons |
|----------|------|------|
| **Telegram** | Free, fast, bots are easy | Need to create bots |
| **Discord** | Free, webhooks, threads | More complex API |
| **Slack** | Professional, workspaces | Free tier limits |
| **SMS/Twilio** | Works on any phone | Costs money |
| **Matrix** | Self-hosted, open | More setup |

**Recommendation:** Start with Telegram. It's free, fast, and you can participate from your phone.

---

## Future Enhancements

- [ ] Bot commands (`/status`, `/assign`, `/pause`)
- [ ] Rich messages (task cards, progress bars)
- [ ] Voice messages for complex explanations
- [ ] File sharing (screenshots, logs)
- [ ] Inline keyboards for quick responses
- [ ] Agent presence (online/typing indicators)

---

## Related Documents

- `distributed-hivemind-nas-setup.md` - NAS-based distribution
- `workspace/build/status.md` - Current feature tracking

---

*This would be a significant upgrade from file-based triggers - global, instant, and you can participate from your phone.*
