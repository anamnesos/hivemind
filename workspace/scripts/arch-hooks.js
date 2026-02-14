const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = 'D:/projects/hivemind';
const COORD_ROOT = path.join(PROJECT_ROOT, '.hivemind');
const LEGACY_WORKSPACE_ROOT = path.join(PROJECT_ROOT, 'workspace');
const HM_MEMORY_SCRIPT = 'D:/projects/hivemind/ui/scripts/hm-memory.js';
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

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getIntentDir() {
  return resolveCoordFile('intent', { forWrite: true });
}

function getOwnIntentPath() {
  return path.join(getIntentDir(), '1.json');
}

function readOwnIntent() {
  const intent = readJsonFile(getOwnIntentPath());
  if (intent) return intent;
  return {
    pane: '1',
    role: 'Architect',
    session: 0,
    intent: 'Idle',
    active_files: [],
    teammates: 'Frontend not spawned, Reviewer not spawned',
    last_findings: '',
    blockers: 'none',
    last_update: new Date().toISOString(),
  };
}

function writeIntent(intent) {
  const filePath = getOwnIntentPath();
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
  const snapshotPath = resolveCoordFile(path.join('context-snapshots', '1.md'));
  try {
    const content = fs.readFileSync(snapshotPath, 'utf8');
    return parseSessionNumberFromText(content);
  } catch {
    return 0;
  }
}

function getSessionNumber() {
  const intentDir = getIntentDir();
  let maxIntentSession = 0;

  for (const paneId of PANE_IDS) {
    const intent = readJsonFile(path.join(intentDir, `${paneId}.json`));
    const parsed = Number.parseInt(intent?.session, 10);
    if (Number.isInteger(parsed) && parsed > maxIntentSession) {
      maxIntentSession = parsed;
    }
  }

  const snapshotSession = getSessionNumberFromSnapshot();
  return Math.max(maxIntentSession, snapshotSession, 0);
}

function readAllIntents() {
  const roles = { '1': 'Architect', '2': 'DevOps', '5': 'Analyst' };
  const lines = [];
  const intentDir = getIntentDir();
  const currentSession = getSessionNumber();

  for (const paneId of PANE_IDS) {
    const intent = readJsonFile(path.join(intentDir, `${paneId}.json`));
    if (!intent) {
      lines.push(`Pane ${paneId} (${roles[paneId]}): No intent file found`);
      continue;
    }

    const stale = Number(intent.session || 0) < currentSession ? ' [STALE]' : '';
    const files = Array.isArray(intent.active_files) && intent.active_files.length > 0
      ? intent.active_files.join(', ')
      : 'none';

    lines.push(`Pane ${paneId} (${intent.role || roles[paneId]}${stale}): ${intent.intent || 'unknown'} | Files: ${files} | Blockers: ${intent.blockers || 'none'}`);
    if (intent.teammates) lines.push(`  Teammates: ${intent.teammates}`);
    if (intent.last_findings || intent.last_action) lines.push(`  Findings: ${intent.last_findings || intent.last_action}`);
  }

  return lines.join('\n');
}

/**
 * Query the Evidence Ledger via hm-memory.js CLI.
 * Uses execFileSync to avoid shell quoting issues on Windows.
 * Returns parsed JSON or null on failure.
 */
function queryLedger(command, args = []) {
  try {
    const result = execFileSync('node', [HM_MEMORY_SCRIPT, command, '--timeout', '3000', ...args], {
      timeout: 5000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    return JSON.parse(result);
  } catch (e) {
    // hm-memory.js exits with code 1 for {ok: false} results (e.g., conflict on session-start).
    // Try to parse stdout — the JSON result may still be useful.
    const stdout = e.stdout ? e.stdout.toString().trim() : '';
    if (stdout) {
      try {
        return JSON.parse(stdout);
      } catch {}
    }
    process.stderr.write(`[arch-hooks] queryLedger(${command}) FAILED: ${e.message.slice(0, 100)}\n`);
    return null;
  }
}

/**
 * Format ledger context JSON as markdown for Claude's additionalContext.
 * Combines ledger data (persistent) with intent board (real-time team state).
 */
function formatLedgerContext(ctx, teamState) {
  const lines = [];
  lines.push('## Context Restoration (auto-generated)');
  lines.push(`Generated: ${new Date().toISOString()} | Session ${ctx.session || '?'} | Source: evidence-ledger`);
  lines.push('');

  if (teamState) {
    lines.push('### Team Status');
    lines.push(teamState);
    lines.push('');
  }

  const completions = Array.isArray(ctx.completed) ? ctx.completed : [];
  if (completions.length > 0) {
    lines.push('### Recent Completions');
    for (const c of completions.slice(0, 10)) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  const issues = ctx.known_issues && typeof ctx.known_issues === 'object' ? ctx.known_issues : {};
  const issueEntries = Object.entries(issues);
  if (issueEntries.length > 0) {
    lines.push('### Known Issues');
    for (const [k, v] of issueEntries.slice(0, 8)) {
      lines.push(`- ${k}: ${v}`);
    }
    lines.push('');
  }

  const roadmap = Array.isArray(ctx.not_yet_done) ? ctx.not_yet_done : [];
  if (roadmap.length > 0) {
    lines.push('### Roadmap');
    for (const r of roadmap.slice(0, 5)) {
      lines.push(`- ${r}`);
    }
    lines.push('');
  }

  const directives = Array.isArray(ctx.important_notes) ? ctx.important_notes : [];
  if (directives.length > 0) {
    lines.push('### Key Directives');
    for (const d of directives.slice(0, 8)) {
      lines.push(`- ${d}`);
    }
    lines.push('');
  }

  const stats = ctx.stats && typeof ctx.stats === 'object' ? ctx.stats : {};
  if (stats.test_suites || stats.tests_passed) {
    lines.push('### Stats');
    lines.push(`Tests: ${stats.test_suites || '?'} suites, ${stats.tests_passed || '?'} passed`);
    lines.push('');
  }

  return lines.join('\n');
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildLedgerSnapshotContext(sessionNum = 0) {
  const snapshotPath = resolveCoordFile(path.join('context-snapshots', '1.md'));
  const fallbackSession = Number.isInteger(sessionNum) && sessionNum > 0 ? sessionNum : getSessionNumber();

  try {
    const raw = fs.readFileSync(snapshotPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const completedLine = lines.find((line) => /^Completed:\s*/i.test(line));
    const nextLine = lines.find((line) => /^Next:\s*/i.test(line));
    const testsLine = lines.find((line) => /^Tests:\s*/i.test(line));
    const parsedSession = parseSessionNumberFromText(raw);
    const testMatch = testsLine ? testsLine.match(/(\d+)\s+suites,\s*(\d+)\s+tests/i) : null;

    return {
      session: parsedSession || fallbackSession || 0,
      mode: 'PTY',
      completed: completedLine ? parseList(completedLine.replace(/^Completed:\s*/i, '')) : [],
      roadmap: nextLine ? parseList(nextLine.replace(/^Next:\s*/i, '')) : [],
      not_yet_done: nextLine ? parseList(nextLine.replace(/^Next:\s*/i, '')) : [],
      stats: testMatch
        ? {
            test_suites: Number.parseInt(testMatch[1], 10) || 0,
            tests_passed: Number.parseInt(testMatch[2], 10) || 0,
          }
        : {},
      source: 'context-snapshot',
      source_path: snapshotPath,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      session: fallbackSession || 0,
      mode: 'PTY',
      completed: [],
      roadmap: [],
      not_yet_done: [],
      stats: {},
      source: 'intent-session',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Snapshot context state to the Evidence Ledger.
 * Ensures the session exists first, then saves a context snapshot payload.
 */
function syncSessionToLedger(sessionNum) {
  const snapshotContext = buildLedgerSnapshotContext(Number.parseInt(sessionNum, 10));
  const num = Number.parseInt(snapshotContext.session, 10);

  if (!Number.isInteger(num) || num <= 0) {
    process.stderr.write('[arch-hooks] syncSessionToLedger: invalid session number\n');
    return;
  }

  const sessionId = `s_${num}`;

  const startResult = queryLedger('session-start', [
    '--number', String(num),
    '--mode', String(snapshotContext.mode || 'PTY'),
    '--session', sessionId,
  ]);
  process.stderr.write(`[arch-hooks] session-start(${sessionId}): ${JSON.stringify(startResult)}\n`);

  const contentJson = JSON.stringify(snapshotContext);
  process.stderr.write(`[arch-hooks] snapshot content length: ${contentJson.length}\n`);
  const snapResult = queryLedger('snapshot', [
    '--session', sessionId,
    '--trigger', 'session_end',
    '--content-json', contentJson,
  ]);
  process.stderr.write(`[arch-hooks] snapshot(${sessionId}): ${JSON.stringify(snapResult)}\n`);
}

function readStdin() {
  return new Promise((resolve) => {
    let input = '';
    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };
    const timer = setTimeout(() => { process.stdin.destroy(); done(input); }, 2000);
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => { clearTimeout(timer); done(input); });
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
      intent.intent = 'Initializing session...';
      writeIntent(intent);

      const teamState = readAllIntents();
      let additionalContext = null;

      // Priority 1: Evidence Ledger (persistent cross-session memory)
      const ledgerCtx = queryLedger('context', ['--prefer-snapshot', '--timeout', '3000']);
      if (ledgerCtx && typeof ledgerCtx === 'object' && ledgerCtx.ok !== false) {
        if (ledgerCtx.session && ledgerCtx.session >= sessionNum - 1) {
          additionalContext = formatLedgerContext(ledgerCtx, teamState);
        }
      }

      // Priority 2: context snapshot markdown
      if (!additionalContext) {
        const snapshotPath = resolveCoordFile(path.join('context-snapshots', '1.md'));
        try {
          const snapshot = fs.readFileSync(snapshotPath, 'utf8');
          if (snapshot.trim()) {
            additionalContext = snapshot;
          }
        } catch {
          // Snapshot not available
        }
      }

      // Priority 3: Intent files only
      if (!additionalContext) {
        additionalContext = `[INTENT BOARD - Team State]\n${teamState}`;
      }

      const output = {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext,
        }
      };
      process.stdout.write(JSON.stringify(output));
      break;
    }

    case 'SessionEnd': {
      intent.intent = 'Idle';
      intent.active_files = [];
      intent.teammates = 'Frontend not spawned, Reviewer not spawned';
      writeIntent(intent);

      syncSessionToLedger(getSessionNumber());
      break;
    }

    case 'PostToolUse': {
      const toolInput = data.tool_input || {};
      const fileAffected = toolInput.file_path || null;

      if (fileAffected) {
        const normalized = path.relative(PROJECT_ROOT, path.resolve(fileAffected)).replace(/\\/g, '/');
        if (!intent.active_files.includes(normalized)) {
          intent.active_files.push(normalized);
          if (intent.active_files.length > 3) intent.active_files.shift();
          writeIntent(intent);
        }
      }
      break;
    }

    case 'PreCompact': {
      intent.last_findings = `Pre-compaction snapshot at ${new Date().toISOString()}`;
      writeIntent(intent);

      syncSessionToLedger(getSessionNumber());

      const markerPath = resolveCoordFile(path.join('context-snapshots', '1.compacted'), { forWrite: true });
      try {
        ensureParentDir(markerPath);
        fs.writeFileSync(markerPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          messageCount: data.transcript?.length || 0,
        }));
      } catch {
        // Non-critical - ignore marker write failures
      }
      break;
    }
  }
}

main();
