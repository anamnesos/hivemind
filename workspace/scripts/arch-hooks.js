const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = 'D:/projects/hivemind/workspace';
const INTENT_DIR = path.join(WORKSPACE_ROOT, 'intent');
const INTENT_FILE = path.join(INTENT_DIR, '1.json');
const HANDOFF_FILE = path.join(WORKSPACE_ROOT, 'session-handoff.json');
const HANDOFF_LOCK = HANDOFF_FILE + '.lock';
const HM_MEMORY_SCRIPT = 'D:/projects/hivemind/ui/scripts/hm-memory.js';

function acquireLock(maxRetries = 10, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      fs.mkdirSync(HANDOFF_LOCK);
      return true;
    } catch (e) {
      if (e.code === 'EEXIST') {
        try {
          const stats = fs.statSync(HANDOFF_LOCK);
          if (Date.now() - stats.mtimeMs > 30000) {
            try { fs.rmdirSync(HANDOFF_LOCK); } catch (rmErr) {}
          }
        } catch (stErr) {}
        const start = Date.now();
        while (Date.now() - start < delay) {}
        continue;
      }
      throw e;
    }
  }
  return false;
}

function releaseLock() {
  try { fs.rmdirSync(HANDOFF_LOCK); } catch (e) {}
}

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
  if (!acquireLock()) return 0;
  try {
    const handoff = JSON.parse(fs.readFileSync(HANDOFF_FILE, 'utf8'));
    releaseLock();
    return handoff.session || 0;
  } catch (e) {
    releaseLock();
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

  // Team status from intent files (real-time)
  if (teamState) {
    lines.push('### Team Status');
    lines.push(teamState);
    lines.push('');
  }

  // Recent completions
  const completions = Array.isArray(ctx.completed) ? ctx.completed : [];
  if (completions.length > 0) {
    lines.push('### Recent Completions');
    for (const c of completions.slice(0, 10)) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  // Active issues
  const issues = ctx.known_issues && typeof ctx.known_issues === 'object' ? ctx.known_issues : {};
  const issueEntries = Object.entries(issues);
  if (issueEntries.length > 0) {
    lines.push('### Known Issues');
    for (const [k, v] of issueEntries.slice(0, 8)) {
      lines.push(`- ${k}: ${v}`);
    }
    lines.push('');
  }

  // Roadmap / not yet done
  const roadmap = Array.isArray(ctx.not_yet_done) ? ctx.not_yet_done : [];
  if (roadmap.length > 0) {
    lines.push('### Roadmap');
    for (const r of roadmap.slice(0, 5)) {
      lines.push(`- ${r}`);
    }
    lines.push('');
  }

  // Key directives
  const directives = Array.isArray(ctx.important_notes) ? ctx.important_notes : [];
  if (directives.length > 0) {
    lines.push('### Key Directives');
    for (const d of directives.slice(0, 8)) {
      lines.push(`- ${d}`);
    }
    lines.push('');
  }

  // Stats
  const stats = ctx.stats && typeof ctx.stats === 'object' ? ctx.stats : {};
  if (stats.test_suites || stats.tests_passed) {
    lines.push('### Stats');
    lines.push(`Tests: ${stats.test_suites || '?'} suites, ${stats.tests_passed || '?'} passed`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Snapshot session-handoff.json to the Evidence Ledger.
 * Ensures the session exists first, then saves a context snapshot.
 */
function syncSessionToLedger(sessionNum) {
  if (!acquireLock()) return;
  try {
    const handoff = JSON.parse(fs.readFileSync(HANDOFF_FILE, 'utf8'));
    releaseLock();
    
    const num = sessionNum || handoff.session || 0;
    if (num <= 0) return;
    const sessionId = `s_${num}`;

    // Ensure session exists in ledger (ignore conflict if already registered)
    queryLedger('session-start', [
      '--number', String(num),
      '--mode', String(handoff.mode || 'PTY'),
      '--session', sessionId,
    ]);

    // Snapshot the full session state
    queryLedger('snapshot', [
      '--session', sessionId,
      '--trigger', 'session_end',
      '--content-json', JSON.stringify(handoff),
    ]);
  } catch (e) {
    releaseLock();
    // Non-critical — don't block session lifecycle
  }
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
      intent.intent = "Initializing session...";
      writeIntent(intent);

      const teamState = readAllIntents();
      let additionalContext = null;

      // Priority 1: Evidence Ledger (persistent cross-session memory)
      const ledgerCtx = queryLedger('context', ['--prefer-snapshot', '--timeout', '3000']);
      if (ledgerCtx && typeof ledgerCtx === 'object' && ledgerCtx.ok !== false) {
        // Check ledger has meaningful data (session number present)
        if (ledgerCtx.session && ledgerCtx.session >= sessionNum - 1) {
          additionalContext = formatLedgerContext(ledgerCtx, teamState);
        }
      }

      // Priority 2: Electron-generated context snapshot
      if (!additionalContext) {
        const snapshotPath = path.join(WORKSPACE_ROOT, 'context-snapshots', '1.md');
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
        additionalContext = `[INTENT BOARD — Team State]\n${teamState}`;
      }

      const output = {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext,
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

      // Sync session state to Evidence Ledger for next startup
      syncSessionToLedger(getSessionNumber());
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

      // Snapshot to ledger before compaction (preserves state if session doesn't end cleanly)
      syncSessionToLedger(getSessionNumber());

      // Write compaction marker so the compressor can prioritize recent context
      const markerPath = path.join(WORKSPACE_ROOT, 'context-snapshots', '1.compacted');
      try {
        const markerDir = path.dirname(markerPath);
        if (!fs.existsSync(markerDir)) {
          fs.mkdirSync(markerDir, { recursive: true });
        }
        fs.writeFileSync(markerPath, JSON.stringify({
          timestamp: new Date().toISOString(),
          messageCount: data.transcript?.length || 0,
        }));
      } catch {
        // Non-critical — ignore marker write failures
      }
      break;
    }
  }
}

main();
