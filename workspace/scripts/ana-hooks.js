const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'D:/projects/hivemind';
const COORD_ROOT = path.join(PROJECT_ROOT, '.hivemind');
const LEGACY_WORKSPACE_ROOT = path.join(PROJECT_ROOT, 'workspace');
const EVENT = process.argv[2];
const PANE_IDS = ['1', '2', '5'];

function resolveCoordFile(relPath, options = {}) {
  const normalizedRelPath = String(relPath || '').replace(/^[\\/]+/, '').replace(/[\\/]+/g, path.sep);
  const preferred = path.join(COORD_ROOT, normalizedRelPath);
  const legacy = path.join(LEGACY_WORKSPACE_ROOT, normalizedRelPath);

  if (options.forWrite !== true) {
    if (fs.existsSync(preferred)) return preferred;
    if (fs.existsSync(legacy)) return legacy;
  }

  return preferred;
}

function getIntentFile() {
  return resolveCoordFile(path.join('intent', '5.json'), { forWrite: true });
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readIntent() {
  try {
    return JSON.parse(fs.readFileSync(getIntentFile(), 'utf8'));
  } catch (e) {
    return {
      pane: '5',
      role: 'Analyst',
      session: 0,
      intent: 'Idle',
      active_files: [],
      teammates: null,
      last_findings: '',
      blockers: 'none',
      last_update: new Date().toISOString()
    };
  }
}

function writeIntent(intent) {
  const filePath = getIntentFile();
  ensureParentDir(filePath);
  intent.last_update = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(intent, null, 2));
}

function parseSessionNumberFromText(content) {
  const text = String(content || '');
  const patterns = [
    /Session:\s*(\d+)/i,
    /\|\s*Session\s+(\d+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  return 0;
}

function getSessionNumberFromSnapshot() {
  try {
    const content = fs.readFileSync(resolveCoordFile(path.join('context-snapshots', '1.md')), 'utf8');
    return parseSessionNumberFromText(content);
  } catch {
    return 0;
  }
}

function getSessionNumber() {
  const intentDir = resolveCoordFile('intent', { forWrite: true });
  let maxIntentSession = 0;

  for (const paneId of PANE_IDS) {
    try {
      const intent = JSON.parse(fs.readFileSync(path.join(intentDir, `${paneId}.json`), 'utf8'));
      const parsed = Number.parseInt(intent?.session, 10);
      if (Number.isInteger(parsed) && parsed > maxIntentSession) {
        maxIntentSession = parsed;
      }
    } catch {
      // Missing or invalid intent file
    }
  }

  return Math.max(maxIntentSession, getSessionNumberFromSnapshot(), 0);
}

async function handleEvent() {
  const intent = readIntent();

  switch (EVENT) {
    case 'SessionStart':
      intent.session = getSessionNumber() || intent.session;
      intent.intent = 'Initializing session...';
      writeIntent(intent);
      break;

    case 'SessionEnd':
      intent.intent = 'Idle';
      intent.active_files = [];
      writeIntent(intent);
      break;

    case 'AfterTool': {
      let input = '';
      process.stdin.on('data', chunk => { input += chunk; });
      process.stdin.on('end', () => {
        try {
          const data = JSON.parse(input);
          const args = data.arguments || {};

          let fileAffected = null;
          if (args.file_path) fileAffected = args.file_path;
          else if (args.path) fileAffected = args.path;

          if (fileAffected) {
            const normalized = path.relative(PROJECT_ROOT, path.resolve(fileAffected)).replace(/\\/g, '/');
            if (!intent.active_files.includes(normalized)) {
              intent.active_files.push(normalized);
              if (intent.active_files.length > 3) intent.active_files.shift();
              writeIntent(intent);
            }
          }
        } catch {
          // Ignore parse errors
        }
      });
      break;
    }
  }
}

handleEvent();
