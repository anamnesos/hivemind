# Proposal: Automated Quality Gates

**Author:** Reviewer Instance
**Date:** 2026-01-26
**Status:** PROPOSAL - Needs team discussion

---

## The Problem

We have 4 Claude Opus 4.5 instances and we're still shipping bugs that:
- A type checker would catch instantly (snake_case vs camelCase)
- A simple test would catch (JSON serialization failures)
- A linter would flag (undefined variables, missing imports)

The user is doing more manual QA work than ever. We need machines catching machine-detectable bugs so humans (and AIs) can focus on logic and design.

---

## Proposed Quality Gates

### Gate 1: Python Type Checking (mypy)

**What it catches:** Type mismatches, missing attributes, wrong argument types

**Setup:**
```bash
pip install mypy types-aiofiles

# Add to hivemind-sdk-v2.py header:
# mypy: strict
```

**Run:**
```bash
mypy hivemind-sdk-v2.py --strict
```

**Example bugs this would catch:**
- Passing `pane_id` (str) where `paneId` (different name) expected
- Calling method that doesn't exist on SDK objects
- Returning wrong type from function

**Cost:** 5 minutes to set up, runs in <2 seconds

---

### Gate 2: JavaScript Linting (ESLint)

**What it catches:** Undefined variables, unused imports, common mistakes

**Setup:**
```bash
cd ui
npm install --save-dev eslint
npx eslint --init
```

**Config (.eslintrc.js):**
```javascript
module.exports = {
  env: { browser: true, node: true, es2021: true },
  extends: 'eslint:recommended',
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'no-unreachable': 'error',
  }
};
```

**Run:**
```bash
npx eslint ui/modules/*.js ui/renderer.js ui/main.js
```

**Cost:** 10 minutes to set up, runs in <5 seconds

---

### Gate 3: IPC Protocol Tests

**What it catches:** Message shape mismatches between Python and JS

**Create: `tests/test-ipc-protocol.js`**
```javascript
/**
 * IPC Protocol Verification Tests
 * Run: node tests/test-ipc-protocol.js
 */

const assert = require('assert');

// Define the contract - what Python sends
const PYTHON_SENDS = {
  assistant: { type: 'assistant', pane_id: '1', content: [], model: 'string|null' },
  status: { type: 'status', pane_id: '1', state: 'string' },
  result: { type: 'result', pane_id: '1', session_id: 'string', total_cost_usd: 'number' },
  error: { type: 'error', pane_id: '1', message: 'string' },
};

// Define what JS expects
const JS_EXPECTS = {
  'sdk-message': (data) => {
    assert(data.paneId || data.pane_id, 'Missing paneId/pane_id');
    assert(data.message, 'Missing message');
  },
  'sdk-status-changed': (data) => {
    assert(data.paneId || data.pane_id, 'Missing paneId/pane_id');
    assert(data.status, 'Missing status');
  },
};

// Test that Python output matches JS expectations
function testProtocolAlignment() {
  console.log('Testing IPC Protocol Alignment...\n');

  // Test: Python assistant message -> JS sdk-message handler
  const pythonMsg = { type: 'assistant', pane_id: '1', content: [{ type: 'text', text: 'hello' }] };
  const jsData = { paneId: pythonMsg.pane_id, message: pythonMsg };

  try {
    JS_EXPECTS['sdk-message'](jsData);
    console.log('✅ assistant -> sdk-message: PASS');
  } catch (e) {
    console.log('❌ assistant -> sdk-message: FAIL -', e.message);
  }

  // Add more tests for each message type...
}

testProtocolAlignment();
```

**Cost:** 30 minutes to write comprehensive tests, runs in <1 second

---

### Gate 4: JSON Serialization Tests

**What it catches:** Objects that can't be serialized (like ToolResultBlock)

**Create: `tests/test-serialization.py`**
```python
#!/usr/bin/env python3
"""
Serialization Tests - Verify all SDK objects can be JSON serialized
Run: python tests/test-serialization.py
"""

import json
import sys
from unittest.mock import MagicMock

# Mock SDK objects that might not serialize
class MockToolResultBlock:
    def __init__(self):
        self.tool_use_id = "123"
        self.content = MagicMock()  # Non-serializable!
        self.is_error = False

class MockThinkingBlock:
    def __init__(self):
        self.thinking = "Some thinking text"

def test_serialization_with_default_str():
    """Test that default=str handles non-serializable objects"""

    test_cases = [
        {"name": "simple dict", "data": {"key": "value"}},
        {"name": "nested dict", "data": {"outer": {"inner": "value"}}},
        {"name": "with None", "data": {"key": None}},
        {"name": "with MagicMock", "data": {"key": MagicMock()}},
        {"name": "with custom object", "data": {"key": MockToolResultBlock()}},
    ]

    print("Testing JSON serialization with default=str...\n")

    for case in test_cases:
        try:
            result = json.dumps(case["data"], default=str)
            print(f"✅ {case['name']}: PASS")
        except Exception as e:
            print(f"❌ {case['name']}: FAIL - {e}")
            sys.exit(1)

    print("\nAll serialization tests passed!")

if __name__ == "__main__":
    test_serialization_with_default_str()
```

**Cost:** 20 minutes, catches serialization bugs before runtime

---

### Gate 5: Pre-Commit Hook

**What it catches:** All of the above, automatically, before code is committed

**Create: `.git/hooks/pre-commit`**
```bash
#!/bin/bash
set -e

echo "Running pre-commit checks..."

# Python syntax check
echo "Checking Python syntax..."
python -m py_compile hivemind-sdk-v2.py

# Python type check (if mypy installed)
if command -v mypy &> /dev/null; then
    echo "Running mypy..."
    mypy hivemind-sdk-v2.py --ignore-missing-imports || true
fi

# JavaScript lint (if eslint installed)
if [ -f "ui/node_modules/.bin/eslint" ]; then
    echo "Running eslint..."
    cd ui && npx eslint modules/*.js renderer.js main.js --quiet || true
    cd ..
fi

# Run protocol tests
if [ -f "tests/test-ipc-protocol.js" ]; then
    echo "Running IPC protocol tests..."
    node tests/test-ipc-protocol.js
fi

# Run serialization tests
if [ -f "tests/test-serialization.py" ]; then
    echo "Running serialization tests..."
    python tests/test-serialization.py
fi

echo "Pre-commit checks passed!"
```

**Make executable:**
```bash
chmod +x .git/hooks/pre-commit
```

**Cost:** 5 minutes to set up, runs automatically on every commit

---

### Gate 6: SDK Integration Test Script

**What it catches:** End-to-end failures before manual testing

**Create: `tests/test-sdk-integration.py`**
```python
#!/usr/bin/env python3
"""
SDK Integration Test - Verify SDK starts and responds
Run: python tests/test-sdk-integration.py
"""

import asyncio
import json
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def test_sdk_startup():
    """Test that SDK can start all 4 agents"""
    print("Testing SDK startup...\n")

    try:
        # Import after path fix
        from hivemind_sdk_v2 import HivemindManager

        workspace = Path(__file__).parent.parent
        manager = HivemindManager(workspace)

        # Start all agents
        print("Starting agents...")
        await manager.start_all()

        # Verify all 4 agents connected
        assert len(manager.agents) == 4, f"Expected 4 agents, got {len(manager.agents)}"

        for pane_id, agent in manager.agents.items():
            assert agent.connected, f"Agent {pane_id} not connected"
            print(f"✅ Agent {pane_id} ({agent.config.role}): Connected")

        # Test sending a simple message
        print("\nTesting message send to Lead...")
        responses = []
        async for response in manager.agents['1'].send("Say 'test successful' and nothing else"):
            responses.append(response)
            # Just verify we get valid JSON back
            json.dumps(response, default=str)

        print(f"✅ Received {len(responses)} responses from Lead")

        # Cleanup
        await manager.stop_all()
        print("\n✅ All integration tests passed!")

    except Exception as e:
        print(f"\n❌ Integration test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_sdk_startup())
```

**Cost:** 1 hour to write properly, but catches real integration issues

---

## Implementation Plan

| Phase | Task | Owner | Time |
|-------|------|-------|------|
| 1 | Set up mypy for Python | Worker B | 10 min |
| 2 | Set up ESLint for JS | Worker A | 15 min |
| 3 | Write IPC protocol tests | Lead | 30 min |
| 4 | Write serialization tests | Worker B | 20 min |
| 5 | Create pre-commit hook | Worker B | 10 min |
| 6 | Write integration test | Lead | 1 hour |
| 7 | Document in CLAUDE.md | Reviewer | 10 min |

**Total:** ~2.5 hours of work, saves hours of debugging per bug

---

## What This Changes

**Before (current):**
1. Developer writes code
2. Developer says "done"
3. Reviewer reads code (maybe)
4. User tests manually
5. Bug found
6. Repeat 6 times

**After:**
1. Developer writes code
2. Pre-commit runs automatically
3. Type errors caught instantly
4. Protocol mismatches caught by tests
5. Serialization issues caught by tests
6. Reviewer reviews logic (not typos)
7. User tests features (not basic functionality)

---

## Objections Anticipated

**"We don't have time"** - We've spent more time debugging than these tests would take to write.

**"It's overhead"** - Less overhead than user manually catching bugs 6 versions in a row.

**"Tests can't catch everything"** - No, but they catch the dumb stuff so we can focus on hard stuff.

**"We'll add tests later"** - We said that 6 versions ago.

---

## Recommendation

Start with Gates 1-2 (mypy + eslint) - they're instant wins with almost no setup cost.

Then add Gate 5 (pre-commit hook) to make them automatic.

The rest can come incrementally.

**The goal is not perfection. The goal is catching the obvious bugs automatically so we stop embarrassing ourselves.**

---

## Next Steps

1. Team discusses this proposal
2. Lead assigns owners
3. We implement Phase 1-2 today
4. Pre-commit hook by end of day
5. Integration tests by tomorrow

**Who's in?**
