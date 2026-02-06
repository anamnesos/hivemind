const fs = require('fs');
const path = require('path');

const EVENT = process.argv[2];
const INTENT_FILE = path.join('D:/projects/hivemind/workspace/intent/5.json');
const HANDOFF_FILE = path.join('D:/projects/hivemind/workspace/session-handoff.json');

function readIntent() {
  try {
    return JSON.parse(fs.readFileSync(INTENT_FILE, 'utf8'));
  } catch (e) {
    return {
      pane: "5",
      role: "Analyst",
      session: 0,
      intent: "Idle",
      active_files: [],
      teammates: null,
      last_findings: "",
      blockers: "none",
      last_update: new Date().toISOString()
    };
  }
}

function writeIntent(intent) {
  intent.last_update = new Date().toISOString();
  fs.writeFileSync(INTENT_FILE, JSON.stringify(intent, null, 2));
}

function getSessionNumber() {
  try {
    const handoff = JSON.parse(fs.readFileSync(HANDOFF_FILE, 'utf8'));
    return handoff.session;
  } catch (e) {
    return 0;
  }
}

async function handleEvent() {
  const intent = readIntent();

  switch (EVENT) {
    case 'SessionStart':
      intent.session = getSessionNumber() || intent.session;
      intent.intent = "Initializing session...";
      writeIntent(intent);
      break;

    case 'SessionEnd':
      intent.intent = "Idle";
      intent.active_files = [];
      writeIntent(intent);
      break;

    case 'AfterTool':
      // AfterTool receives tool results on stdin
      let input = '';
      process.stdin.on('data', chunk => { input += chunk; });
      process.stdin.on('end', () => {
        try {
          const data = JSON.parse(input);
          // data structure: { toolName: string, arguments: object, result: any }
          const { toolName, arguments: args } = data;
          
          let fileAffected = null;
          if (args.file_path) fileAffected = args.file_path;
          else if (args.path) fileAffected = args.path;
          
          if (fileAffected) {
            // Normalize path relative to workspace or absolute
            const normalized = path.relative('D:/projects/hivemind/workspace', path.resolve(fileAffected)).replace(/\\/g, '/');
            if (!intent.active_files.includes(normalized)) {
              intent.active_files.push(normalized);
              if (intent.active_files.length > 3) intent.active_files.shift(); // Cap at 3 per spec
              writeIntent(intent);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
      break;
  }
}

handleEvent();