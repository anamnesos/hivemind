# Analyst Report: AGENT_MESSAGE_PREFIX Hazard

**Date:** 2026-02-08
**Session:** 87
**Status:** INVESTIGATED - Root Cause Confirmed

## Issue
The `AGENT_MESSAGE_PREFIX` (`[AGENT MSG - reply via hm-send.js] `) added to WebSocket messages by `HivemindApp` breaks the sequence parsing in `sequencing.parseMessageSequence`.

## Root Cause
The regex in `ui/modules/triggers/sequencing.js` uses a `^` anchor which expects the message to start directly with the role parentheses:
```javascript
const seqMatch = message.match(/^\((\w+(?:-\w+)?)\s*#(\d+)\):\s*(.*)$/s);
```

When a message is prefixed, e.g.:
`[AGENT MSG - reply via hm-send.js] (ARCH #1): hello`
The regex fails to match, resulting in `seq: null` and `sender: null`.

## Impact
- **Duplicate Detection:** Broken for WebSocket messages (they won't be recorded in `message-state.json`).
- **Delivery Tracking:** Broken for WebSocket messages (no `deliveryId` generated, so no ACKs from terminals).
- **War Room Display:** Sequence numbers are not stripped from the message content, leading to double-role display in some contexts.

## Verification
Confirmed via reproduction test `ui/__tests__/hazard-prefix.test.js`:
- Standard message: parses `seq: 123`
- Prefixed message: parses `seq: null`

## Suggested Fix
Update `parseMessageSequence` to strip the known prefix before matching, or update the regex to allow an optional prefix:

```javascript
const AGENT_MESSAGE_PREFIX = '[AGENT MSG - reply via hm-send.js] ';

function parseMessageSequence(message) {
  let cleanMessage = message;
  if (message.startsWith(AGENT_MESSAGE_PREFIX)) {
    cleanMessage = message.substring(AGENT_MESSAGE_PREFIX.length);
  }
  
  const seqMatch = cleanMessage.match(/^\((\w+(?:-\w+)?)\s*#(\d+)\):\s*(.*)$/s);
  // ... proceed with cleanMessage ...
}
```

## Assignment
- **Owner:** Architect or DevOps
- **Priority:** MEDIUM (Inert today but blocks reliable WebSocket messaging features)
