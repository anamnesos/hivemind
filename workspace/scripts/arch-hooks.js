const fs = require('fs');
const path = require('path');

const INTENT_DIR = 'D:/projects/hivemind/workspace/intent';
const INTENT_FILE = path.join(INTENT_DIR, '1.json');
const HANDOFF_FILE = 'D:/projects/hivemind/workspace/session-handoff.json';

function readIntent(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function readOwnIntent() {
  const intent = readIntent(INTENT_FILE);
  if (intent) return intent;
  return {
    pane: "1",
    role: "Architect",
    session: 0,
    intent: "Idle",
    active_files: [],
    teammates: "Frontend not spawned, Reviewer not spawned",
    last_findings: "",
    blockers: "none",
    last_update: new Date().toISOString()
  };
}

function writeIntent(intent) {
  intent.last_update = new Date().toISOString();
  fs.writeFileSync(INTENT_FILE, JSON.stringify(intent, null, 2));
}

function getSessionNumber() {
  try {
    const handoff = JSON.parse(fs.readFileSync(HANDOFF_FILE, 'utf8'));
    return handoff.session || 0;
  } catch (e) {
    return 0;
  }
}

function readAllIntents() {
  const panes = ['1', '2', '5'];
  const roles = { '1': 'Architect', '2': 'DevOps', '5': 'Analyst' };
  const lines = [];
  for (const p of panes) {
    const intent = readIntent(path.join(INTENT_DIR, `${p}.json`));
    if (intent) {
      const stale = intent.session < getSessionNumber() ? ' [STALE]' : '';
      lines.push(`Pane ${p} (${intent.role}${stale}): ${intent.intent} | Files: ${intent.active_files.length > 0 ? intent.active_files.join(', ') : 'none'} | Blockers: ${intent.blockers}`);
      if (intent.teammates) lines.push(`  Teammates: ${intent.teammates}`);
      if (intent.last_findings) lines.push(`  Findings: ${intent.last_findings}`);
    } else {
      lines.push(`Pane ${p} (${roles[p]}): No intent file found`);
    }
  }
  return lines.join('\n');
}

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    // Timeout after 2s in case stdin doesn't close
    setTimeout(() => resolve(input), 2000);
  });
}

async function main() {
  const input = await readStdin();
  let data = {};
  try { data = JSON.parse(input); } catch (e) { /* no stdin data */ }

  const event = data.hook_event_name || process.argv[2];
  const intent = readOwnIntent();

  switch (event) {
    case 'SessionStart': {
      const sessionNum = getSessionNumber();
      intent.session = sessionNum || intent.session;
      intent.intent = "Initializing session...";
      writeIntent(intent);

      // Return team state as additionalContext — injected into Claude's context
      const teamState = readAllIntents();
      const output = {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: `[INTENT BOARD — Team State]\n${teamState}`
        }
      };
      process.stdout.write(JSON.stringify(output));
      break;
    }

    case 'SessionEnd': {
      intent.intent = "Idle";
      intent.active_files = [];
      intent.teammates = "Frontend not spawned, Reviewer not spawned";
      writeIntent(intent);
      break;
    }

    case 'PostToolUse': {
      const toolInput = data.tool_input || {};
      let fileAffected = toolInput.file_path || null;

      if (fileAffected) {
        const normalized = path.relative('D:/projects/hivemind', path.resolve(fileAffected)).replace(/\\/g, '/');
        if (!intent.active_files.includes(normalized)) {
          intent.active_files.push(normalized);
          if (intent.active_files.length > 3) intent.active_files.shift();
          writeIntent(intent);
        }
      }
      break;
    }

    case 'PreCompact': {
      // Save current state before context compression
      intent.last_findings = `Pre-compaction snapshot at ${new Date().toISOString()}`;
      writeIntent(intent);
      break;
    }
  }
}

main();
