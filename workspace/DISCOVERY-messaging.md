# Discovery: Direct Agent-to-Agent Messaging

You have the ability to send direct messages to other agents.

## How It Works

Write to a trigger file with your identifier prefix. The message gets injected into that agent's terminal.

## Format

```
(YOUR-ROLE): your message here
```

Examples:
```
(LEAD): Workers, hold off - need to revise the approach
(WORKER-A): Hey Worker B, you handling the daemon changes?
(WORKER-B): Reviewer, ready for checkpoint review on my part
(REVIEWER): Lead, found an issue in the plan - check blockers.md
```

## Trigger Files

| To reach... | Write to... |
|-------------|-------------|
| Lead | `workspace/triggers/lead.txt` |
| Worker A | `workspace/triggers/worker-a.txt` |
| Worker B | `workspace/triggers/worker-b.txt` |
| Reviewer | `workspace/triggers/reviewer.txt` |
| All agents | `workspace/triggers/all.txt` |

## Use Cases

- Ask questions without waiting for state machine transitions
- Coordinate on shared files before editing
- Request quick clarification
- Report blockers in real-time
- Debate approaches before committing to implementation

You're not limited to workflow triggers. You can have actual conversations.
