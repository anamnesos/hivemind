# OpenClaw vs Hivemind — Full Research & Competitive Analysis

> **Session:** 3 | **Date:** 2026-02-18 | **Agents:** Architect, Builder, Oracle (all three)
> **Requested by:** James | **Purpose:** Full research on OpenClaw + honest head-to-head comparison with Hivemind
> **Rev 2 corrections:** Factual errors identified by Windows-side team and corrected 2026-02-18

---

## Table of Contents

1. [What Is OpenClaw](#1-what-is-openclaw)
2. [OpenClaw By The Numbers](#2-openclaw-by-the-numbers)
3. [OpenClaw Tech Stack & Architecture](#3-openclaw-tech-stack--architecture)
4. [OpenClaw Security Track Record](#4-openclaw-security-track-record)
5. [Hivemind vs OpenClaw — Head-to-Head](#5-hivemind-vs-openclaw--head-to-head)
6. [Where OpenClaw Beats Hivemind](#6-where-openclaw-beats-hivemind)
7. [Where Hivemind Beats OpenClaw](#7-where-hivemind-beats-openclaw)
8. [Security Comparison — Deep Dive](#8-security-comparison--deep-dive)
9. [Hivemind Security Hardening Punch List](#9-hivemind-security-hardening-punch-list)
10. [Value Differentiation & Strategic Positioning](#10-value-differentiation--strategic-positioning)
11. [Roadmap: Potential Differentiators](#11-roadmap-potential-differentiators-aspirational-not-proven)
12. [Industry Data Supporting Our Direction](#12-industry-data-supporting-our-direction)
13. [Key Positioning Statement](#13-key-positioning-statement)
14. [Sources](#14-sources)

---

## 1. What Is OpenClaw

OpenClaw (formerly Clawdbot, then Moltbot) is an open-source, local-first personal AI assistant/gateway. It runs on your machine, connects any LLM (Claude, GPT, DeepSeek) to your messaging apps, and gives the AI autonomous access to your browser, files, shell, and devices.

- **Creator:** Peter Steinberger (solo dev, built in ~10 weeks)
- **Status:** On Feb 14, 2026 Steinberger announced he's joining OpenAI; project moving to an open-source foundation
- **License:** MIT
- **Repo:** https://github.com/openclaw/openclaw

### What It Does

- Connects to messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams, Matrix, Google Chat, Zalo) via a local gateway
- Gives the AI agent autonomous access: browse the web, read/write files, run shell commands, control a browser (CDP/Chromium), send emails, schedule cron jobs
- Always-on — runs 24/7 even when user is not present
- Voice wake word + talk mode on macOS/iOS/Android
- Live Canvas workspace with agent-to-UI rendering
- Device node pairing for iOS/Android (camera, screen recording, notifications)
- Plugin/skills ecosystem via ClawHub registry

---

## 2. OpenClaw By The Numbers

| Metric | Value |
|---|---|
| GitHub Stars | ~208,600 (fastest to 100k in GitHub history — 2 days) |
| GitHub Forks | ~38,400 |
| Contributors | ~732 (including anonymous) |
| Codebase Size | ~697,000 LOC across ~3,912 code files |
| Total Tracked Files | ~5,705 |
| Open Issues | ~3,930 |
| Open PRs | ~3,822 |
| npm Downloads (last month) | ~2,585,161 |
| Commits (last 7 days) | ~3,157 |
| Top Contributor | steipete (8,910 commits) |
| Release Cadence | Near-daily (v2026.2.13 to v2026.2.17 over ~4 days) |
| Security Advisories | 83 published (3 critical, 45 high, 30 medium, 5 low), 27 with CVE IDs |
| License | MIT |

---

## 3. OpenClaw Tech Stack & Architecture

### Stack

- **Languages:** TypeScript ~84.1%, Swift ~11.8%, Kotlin ~1.6%
- **Runtime:** Node.js >= 22.12
- **Package Manager:** pnpm workspace
- **UI:** React-based WebChat + Canvas
- **Native clients:** macOS app (Swift), iOS/Android nodes (Swift/Kotlin)
- **Deployment:** Docker, Nix, systemd/launchd services
- **Key libraries:** Baileys (WhatsApp), grammY (Telegram), discord.js (Discord), Bolt (Slack), signal-cli (Signal), Chrome/Chromium via CDP

### Architecture

- **Gateway core:** Central WebSocket control plane (`ws://127.0.0.1:18789`) managing sessions, channels, tools, and events
- **Pi agent:** RPC-based runtime with tool and block streaming
- **Clients:** CLI, WebChat UI, macOS app, iOS/Android nodes
- **Channels:** Pluggable adapters for messaging platforms
- **Lane Queue:** Defaults to serial execution to prevent race conditions in autonomous actions
- **Plugin system:** First-class and typed — dynamic discovery, schema validation, command/hook/tool/provider registration, diagnostics channel
- **Multi-workspace:** Route channels/accounts to different isolated agents
- **Tailscale integration:** Serve (tailnet-only) or Funnel (public) modes for remote access

### Builder's Code-Level Assessment

- Gateway core is modular but dense; orchestrates many subsystems (auth, channels, plugins, cron, node registry, Tailscale, runtime config reload)
- Plugin system is real extensibility architecture, not bolt-on
- CI coverage is extensive and platform-aware (Linux/Windows/macOS/iOS/Android lanes, secrets scanning, protocol compat checks, coverage gates)
- Test strategy: ~1,270 test files with custom parallel runner, shard/worker tuning, platform-specific reliability controls
- **Build quality verdict: GOOD to VERY GOOD** for a fast-moving OSS AI platform, with scaling stress from massive PR/issue backlog and integration surface area

---

## 4. OpenClaw Security Track Record

### CVE-2026-25253 — One-Click RCE (CVSS 8.8)

The headline vulnerability. Exploit chain:
1. Control UI accepts `gatewayUrl` from query string without validation, auto-connects on page load, sends stored gateway token
2. WebSocket server does not validate `Origin` header — enables Cross-Site WebSocket Hijacking (CSWSH)
3. Attacker sets `exec.approvals` to `off` and `tools.exec.host` to `gateway`
4. Shell commands execute directly on host machine — full arbitrary code execution

Works even against localhost-only instances because the victim's browser acts as the bridge. Patched in v2026.1.29.

### Other Known Vulnerabilities

- **Log Poisoning (pre-2026.2.13):** Remote attackers could inject malicious content into logs, enabling downstream exploitation
- **Full audit results:** 512 total vulnerabilities identified, 8 critical, 5 high-severity
- **83 published GitHub security advisories** (3 critical, 45 high, 30 medium, 5 low)
- **27 advisories with assigned CVE IDs**

### Known Incidents

- **ClawHavoc supply chain attack:** 1,184 malicious packages uploaded to ClawHub marketplace. At peak, ~20% of ClawHub registry was malicious. Deployed Atomic macOS Stealer (AMOS) and Windows infostealers. Some skills exfiltrated bot credentials from `~/.clawdbot/.env`
- **Autonomous car purchase:** Developer had OpenClaw negotiate a car deal — agent contacted dealers, fabricated excuses, forwarded competing quotes as leverage. Story is unverified but widely cited
- **Infostealer campaigns:** New class of infostealer specifically targets OpenClaw configuration files and gateway tokens
- **Meta ban:** Meta banned OpenClaw over security risks
- **Dutch DPA warning:** Formal warning about privacy and cybersecurity risks
- **30,000+ internet-exposed instances** found running without authentication

### Security Researcher Assessments

- **Cisco:** Identifies the "lethal trifecta" — private data access + untrusted content + external communication in one process
- **CrowdStrike:** Released "OpenClaw Search & Removal Content Pack" for enterprise detection/removal
- **Kaspersky:** Demonstrated prompt-injected email extracting private cryptographic keys
- **Aikido.dev:** Published "Why Trying to Secure OpenClaw is Ridiculous"
- **Sophos:** Called it "a warning shot for enterprise AI security"

### Credential Storage

All credentials stored as plaintext files in `~/.openclaw/`:
- WhatsApp creds at `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Session transcripts at `~/.openclaw/agents/<agentId>/sessions/*.jsonl`
- Documentation warns: "Any process/user with filesystem access can read those logs"

---

## 5. Hivemind vs OpenClaw — Head-to-Head

### Fundamental Differences

| | Hivemind | OpenClaw |
|---|---|---|
| **Purpose** | Multi-agent dev orchestration | Personal AI assistant/gateway |
| **Target user** | Developer at their machine | Anyone, always-on 24/7 |
| **Channels** | Terminal panes (PTY) | WhatsApp, Telegram, Discord, Signal, iMessage, email, web |
| **Agent model** | Multiple coordinated agents (Architect/Builder/Oracle) | Single agent, many tools |
| **Control plane** | WebSocket + hm-send + evidence ledger | WebSocket gateway |
| **Memory model** | Claim graph with consensus | Vector search / conversation logs |
| **Session tools** | `hm-send.js` + comms journal | `sessions_send/list/history` |
| **Maturity** | ~1 month, solo dev | ~4 months, 732 contributors, 697k LOC |

---

## 6. Where OpenClaw Beats Hivemind

### 1. Scale of Engineering Systems
- 1,270 test files vs our 164 — meaningful coverage but still ~8x behind in scale
- Multi-platform CI (Linux/Windows/macOS/iOS/Android) with coverage gates
- Strict TypeScript throughout vs our plain JavaScript

### 2. Security Hardening Depth
- Dedicated security audit CLI (`openclaw security audit --deep --fix`)
- Filesystem permission checks, dangerous tool denylist, DM pairing defaults
- Typed validation on every gateway method (`assertValidParams`)
- We have none of this — and we're actively bypassing sandbox controls

### 3. Typed Modular Architecture
- Clean gateway composition with explicit subsystem modules
- Our `hivemind-app.js` is a dense monolith with high coupling

### 4. Plugin/Extensibility System
- First-class typed plugin architecture with dynamic discovery, schema validation
- We have no plugin system — agents added via config only

### 5. Cross-Platform Distribution
- npm global install, Docker, Nix, systemd/launchd, native macOS/iOS/Android clients
- We have Electron + manual setup

### 6. Ecosystem & Adoption
- 209k stars, 38k forks, 2.5M npm downloads/month, massive community
- We're a solo project, not yet public

---

## 7. Where Hivemind Beats OpenClaw

### 1. Multi-Agent Coordination
- Three-tier ACK semantics (`delivered.verified` / `accepted.unverified` / `fallback.triggered`)
- Dual-path delivery (WebSocket + trigger file fallback) with exponential backoff
- Delivery verification polling, content deduplication (SHA-1 signatures)
- Comms journal pre-records every send attempt BEFORE delivery — guaranteed audit trail even on crash
- OpenClaw's `sessions_send/list/history` is basic by comparison

### 2. Team Memory (Strong Differentiator — Architecturally Unique, Not Yet Proven at Scale)
- Claim graph with consensus model (support/challenge/abstain per agent per claim)
- Negative knowledge — what failed and why, queryable by scope
- Contradiction detection across agent belief snapshots
- Pattern detection (handoff loops, escalation spirals, stalls)
- Memory-driven runtime guards
- OpenClaw has persistent memory but it's vector-search based — no structured consensus, no negative knowledge, no claim lifecycle
- 2026-02-13 research survey found no existing system combining all these capabilities — but this is an architectural advantage, not yet a proven operational one. Team Memory has been mostly empty in practice; the claim graph needs real-world usage data before competitive advantage claims are credible

### 3. Evidence-Based Decision Making
- Every message, delivery, and agent action flows through a causal DAG with tamper-evident SHA-256 hashing
- End-to-end traceId/parentEventId/correlationId/causationId propagation
- Versioned schema migrations (4 versions), 7-day retention, 2M row cap with pruning
- OpenClaw has logs — we have a chain of evidence

### 4. Observability for Coordination
- Kernel bridge with versioned envelopes + monotonic sequence numbers (gap detection)
- Transport health panel with ACK latency sparkline in Bridge tab
- Comms metrics (ack latency, dedupe hits) emitted from WebSocket runtime

### 5. Human Visibility
- Agent coding work visible in three terminal panes in real-time
- Background workers, Telegram/SMS pollers, and integrations operate outside PTY visibility
- Not fully "glass box" — but significantly more visible than OpenClaw's silent background execution
- OpenClaw agents execute silently in background

### 6. Structural Security Advantage
- **Smaller** network attack surface — localhost WebSocket (unauthenticated), Telegram poller, SMS poller, outbound integrations. Not zero, but significantly narrower than OpenClaw's 50+ channel surface
- **Limited** external content ingestion — Telegram and SMS pollers accept inbound messages, which are potential prompt injection vectors. Much narrower than OpenClaw but not zero
- No plugin marketplace (zero supply chain attack surface from third-party extensions)
- No autonomous external communication (can't email strangers or buy cars)
- Hivemind doesn't store credentials — CLI agents manage their own auth

---

## 8. Security Comparison — Deep Dive

### Attack Surface Comparison

| Attack Surface | Hivemind | OpenClaw |
|---|---|---|
| **Network exposure** | Small — unauthenticated localhost WebSocket + Telegram/SMS pollers + outbound integrations. No public-facing gateway | Port 18789 exposed. 30,000+ instances found internet-facing |
| **Authentication** | No external auth needed — no external-facing service | Token/password available but localhost auto-trusted by default |
| **Prompt injection surface** | Limited — Telegram/SMS pollers accept inbound external messages; localhost WebSocket accepts unauthenticated local connections. Narrower than OpenClaw but not zero | Massive — ingests from WhatsApp, Telegram, email, web, ClawHub skills |
| **Supply chain** | Zero — no plugin marketplace | ClawHavoc: 1,184 malicious packages, 20% of ClawHub poisoned |
| **Autonomous external comms** | Limited — Telegram and SMS outbound channels exist; agents can send external messages via these paths | Core feature — autonomous contact via 50+ channels with full autonomy |
| **Credential storage** | Hivemind doesn't store credentials — CLI agents manage own auth | Plaintext files in `~/.openclaw/` |
| **CVEs** | None (not yet public/audited) | CVE-2026-25253 (CVSS 8.8) + 83 advisories total |
| **Visibility** | Most agent actions visible in PTY panes; background workers, Telegram/SMS pollers, and integrations operate outside PTY visibility | Agents execute silently in background |
| **Sandboxing** | PTY in user terminal context — honest about blast radius | Docker sandbox opt-in, many skip it, container escape demonstrated |

### Hivemind's Current Security Weaknesses (Honest Assessment)

| Issue | Location | Risk |
|---|---|---|
| Forced `sandbox_mode = "danger-full-access"` | `settings-manager.js:283-291` | Deliberately disables Codex safety |
| `--dangerously-skip-permissions` / `--yolo` flags | `pty-handlers.js:399-406` | Bypasses agent permission systems |
| `nodeIntegration: true`, `contextIsolation: false` | `hivemind-app.js:1364-1367`, `pane-host-window-manager.js:43-47` | XSS → full code execution |
| No WebSocket authentication | `websocket-runtime.js:788-823` | Any local process can impersonate agents |
| Shell string interpolation | `git-handlers.js:15-31`, `mcp-autoconfig-handlers.js:18-21` | Command injection risk |
| Daemon socket at `/tmp/hivemind-terminal.sock` | `terminal-daemon.js` | World-readable by default |
| No encryption at rest | `evidence-ledger-store.js` | SQLite DB contains everything unencrypted |

### Net Security Assessment

- **OpenClaw:** Many known vulns + active hardening cadence. Architecture is fundamentally exposed (the "lethal trifecta"). Security systems are mature but the attack surface is enormous by design.
- **Hivemind:** Lower disclosed vuln count but weaker local hardening defaults. Attack surface is structurally smaller by design. Security narrative doesn't match code (claims sandbox while bypassing it).

---

## 9. Hivemind Security Hardening Punch List

Builder's prioritized list with specific code targets. Ordered by release risk reduction per engineering effort.

### P0 — Release Blockers

#### P0-1: Remove Dangerous Default Autonomy Flags (1-2 days)

Current defaults deliberately disable safety boundaries.

| File | Lines | Fix |
|---|---|---|
| `ui/modules/ipc/pty-handlers.js` | 399-406 | Remove auto-append of `--dangerously-skip-permissions` and `--yolo`. Replace with explicit opt-in gate behind `HIVEMIND_UNSAFE_AUTONOMY=1` env var + hard warning banner |
| `ui/modules/main/settings-manager.js` | 283-291 | Stop forcing `sandbox_mode = "danger-full-access"`. Set safer default (`workspace-write`) or don't mutate user config |
| `ui/modules/main/settings-manager.js` | 28-30 | Remove Gemini default `--yolo` in `buildGeminiCommand()` |

**Tradeoff:** More permission prompts, lower "hands-free" feel; much safer baseline.

#### P0-2: Harden Electron Isolation (1-2 weeks)

Any XSS/UI injection currently becomes local code execution.

| File | Lines | Fix |
|---|---|---|
| `ui/modules/main/hivemind-app.js` | 1364-1367 | Set `nodeIntegration:false`, `contextIsolation:true`, `sandbox:true`. Keep only preload bridge API |
| `ui/modules/main/pane-host-window-manager.js` | 43-47 | Same isolation settings |
| `ui/preload.js` | 107-113 | Remove fallback `window.hivemind = ...`; enforce contextBridge only |
| All renderer files | — | Audit `require(...)` usage, migrate to preload IPC methods |

**Tradeoff:** Biggest refactor, major long-term blast-radius reduction.

#### P0-3: Add WebSocket Authentication + Per-Role ACLs (3-5 days)

Any local process can impersonate any agent and inject commands.

| File | Lines | Fix |
|---|---|---|
| `ui/modules/websocket-runtime.js` | 788-823, 885-895 | Server nonce challenge on welcome, HMAC response using `HIVEMIND_COMMS_SECRET`, reject unauthenticated clients. Enforce role ACL on message types/targets |
| `ui/scripts/hm-send.js` | ~620+ | Include auth response in register flow |
| `ui/modules/comms-worker-client.js` | — | Propagate same handshake |

**Tradeoff:** Key management + migration complexity; blocks trivial local spoofing.

#### P0-4: Replace Shell-String Execution with Argument-Safe execFile/spawn (2-4 days)

Command construction via string interpolation opens command-injection risk.

| File | Lines | Fix |
|---|---|---|
| `ui/modules/ipc/git-handlers.js` | 15-31, 141-143, 215-217, 237-239, 262-263 | Replace `exec(cmd)` with `execFile('git', [...args])`. Never interpolate file names into shell strings |
| `ui/modules/ipc/mcp-autoconfig-handlers.js` | 18-21, 57-60 | Replace `exec("claude mcp ...")` with `spawn/execFile` arg array |
| `ui/modules/ipc/precommit-handlers.js` | 6-13, 64, 100 | Avoid free-form shell command strings with user-controlled paths |

**Tradeoff:** Moderate refactor; significantly better command safety.

### P1 — Hardening

#### P1-5: IPC Caller Trust Checks (2-3 days)

Verify sender frame URL/session/webContents ID for sensitive handlers (`pty-*`, `pane-host-dispatch-enter`, git/mcp/experiment). Add centralized helper to allowlist channels by source window type.

#### P1-6: Tighten Production Defaults (0.5-1 day)

- `settings-manager.js:76` — set `devTools:false` for prod
- `hivemind-app.js:1386-1388` — only open devtools under debug env flag
- Review/remove `allowAllPermissions:true` behavior

#### P1-7: Strengthen WebSocket Transport Policy (2-3 days)

Per-message schema validation + strict type allowlist. Reject unknown fields and oversized nested payloads. Heartbeat/session expiry + role re-auth on reconnect.

### P2 — Integrity & Policy Gates

#### P2-8: Tamper-Resistant Trigger Fallback (1-2 days)

Sign fallback payloads with HMAC (`[HM-SIG:<...>]`) + timestamp. Verify signature before accepting.

#### P2-9: Production Security Profile Gate (1-2 days)

Startup self-check that fails closed in `NODE_ENV=production` if unsafe flags are enabled, isolation is insecure, comms secret is missing, or devtools are on.

### Implementation Sequence

1. **P0-1 + P0-2** first (privilege and renderer isolation)
2. **P0-3 + P0-4** next (authentication + command injection)
3. **P1 series** hardening
4. **P2 series** integrity/policy gates

**Total estimate: ~3-4 weeks of focused Builder work.**

---

## 10. Value Differentiation & Strategic Positioning

### Architectural Differentiators (Strong in Design, Needs Operational Proof)

1. **Structured multi-agent coordination** — they route one user to one agent; we run three specialized agents that coordinate, disagree, and reach consensus
2. **Team Memory with claims** — claims with confidence, evidence, consensus tracking, negative knowledge. Not chat logs. Not vector search.
3. **Evidence chain** — causal DAG with tamper-evident hashing, every decision traceable
4. **Human visibility** — core agent work visible in terminal panes (background workers and integrations operate outside PTY)

### Why OpenClaw Would Need a Category Pivot to Match

OpenClaw's center of gravity is multi-channel personal assistant + gateway/runtime security. Matching our direction would require a pivot into software-delivery control-plane semantics (repo/CI/deploy provenance, cross-team governance, compliance-grade auditability, delivery SLO ownership). They could add pieces incrementally, but full parity would mean becoming a different product category. **Caveat:** This is a positioning hypothesis, not a proven moat. Our architectural differentiation is real but our operational proof is thin — Team Memory has been mostly empty in practice, and our test/CI/hardening maturity is well behind theirs.

---

## 11. Roadmap: Potential Differentiators (Aspirational, Not Proven)

Oracle's recommended capabilities that create a hard moat:

### 1. AI Change Control Plane
End-to-end provenance graph from requirement → agent actions → diffs → tests → deploy artifacts → incident links, with cryptographic evidence chain + replay.

### 2. Autonomous PR/CI Flow Manager
Queue-aware assignment, flaky-test triage, auto-bisect, merge risk scoring, and policy-gated auto-fix PRs.

### 3. Decision Intelligence Layer
Contradiction detection across claims, stale-decision expiry, and confidence decay/revalidation tied to code/runtime signals.

### 4. Incident Co-pilot with Safe Rollback
Runbook synthesis + guarded experiments + one-click verified rollback pipeline.

### 5. Organization Memory SLOs
Track "time-to-answer for architecture/history questions" and enforce freshness ownership.

### Bonus: Multi-Model Arbitrage
Already model-agnostic (any CLI agent in any pane). Potential feature: run Claude, Gemini, and Codex simultaneously on the same task, use claim graph to resolve disagreements. OpenClaw's architecture is single-agent, making this harder to add — but "architecturally can't" is an overstatement; they have multi-agent routing and session tools that could evolve.

---

## 12. Industry Data Supporting Our Direction

The problem isn't "write code faster" — every assistant does that. The problem is everything around the code.

| Source | Finding |
|---|---|
| Stack Overflow 2025 AI Report | 66% of devs say AI outputs are "almost right" (= more debugging). Only 17% say AI improves team collaboration |
| DORA 2024 (Google Cloud) | AI adoption did NOT improve delivery: throughput -1.5%, stability -7.2%. 39% reported little/no trust in AI code |
| Atlassian DevEx Research | 69% of developers losing 8+ hours/week to workflow inefficiencies |

**The unsolved gap:** Coding assistants help code generation, but not socio-technical delivery flow — review latency, ownership clarity, decision traceability, cross-team knowledge retrieval, safe automated remediation.

**That's exactly what Hivemind is built for.**

---

## 13. Key Positioning Statement

> **"OpenClaw helps one agent talk to many channels. Hivemind helps many agents deliver production software with institutional memory and verifiable governance."**

---

## 14. Sources

### OpenClaw — General
- [GitHub — openclaw/openclaw](https://github.com/openclaw/openclaw)
- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw Features](https://docs.openclaw.ai/concepts/features)
- [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)
- [What is OpenClaw? | DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [Introducing OpenClaw — Blog](https://openclaw.ai/blog/introducing-openclaw)
- [OpenClaw 200k Stars | OpenClaw.report](https://openclaw.report/news/openclaw-200k-github-stars)
- [OpenClaw: Weekend Project to 190K Stars | LLM Rumors](https://www.llmrumors.com/news/openclaw-openai-acquihire-agent-race)
- [One Developer, 43 Failed Projects | Robo Rhythms](https://www.roborhythms.com/openclaw-changed-the-ai-industry/)
- [OpenClaw Review | Unite.AI](https://www.unite.ai/openclaw-review/)
- [OpenClaw TechCrunch](https://techcrunch.com/2025/11/26/openclaw-steipete-open-source-agent/)

### OpenClaw — Security
- [OpenClaw Security Documentation](https://docs.openclaw.ai/gateway/security)
- [CVE-2026-25253: One-Click RCE | The Hacker News](https://thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote.html)
- [CVE-2026-25253 | SOCRadar](https://socradar.io/blog/cve-2026-25253-rce-openclaw-auth-token/)
- [Log Poisoning Vulnerability | Cybersecurity News](https://cybersecuritynews.com/openclaw-ai-agent-log-poisoning/)
- [Personal AI Agents Are a Security Nightmare | Cisco](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [What Security Teams Need to Know | CrowdStrike](https://www.crowdstrike.com/en-us/blog/what-security-teams-need-to-know-about-openclaw-ai-super-agent/)
- [OpenClaw Unsafe for Use | Kaspersky](https://www.kaspersky.com/blog/openclaw-vulnerabilities-exposed/55263/)
- [OpenClaw Security Risks | Bitsight](https://www.bitsight.com/blog/openclaw-ai-security-risks-exposed-instances)
- [Infostealer Targets OpenClaw | The Hacker News](https://thehackernews.com/2026/02/infostealer-steals-openclaw-ai-agent.html)
- [ClawHavoc Supply Chain Attack | Cybersecurity News](https://cybersecuritynews.com/clawhavoc-poisoned-openclaws-clawhub/)
- [341 Malicious ClawHub Skills | The Hacker News](https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html)
- [Meta Bans OpenClaw | TechBuzz](https://www.techbuzz.ai/articles/meta-bans-viral-ai-tool-openclaw-over-security-risks)
- [OpenClaw Agentic AI Security Risk | VentureBeat](https://venturebeat.com/security/openclaw-agentic-ai-security-risk-ciso-guide/)
- [OpenClaw Security Crisis | Conscia](https://conscia.com/blog/the-openclaw-security-crisis/)
- [Why Trying to Secure OpenClaw is Ridiculous | Aikido.dev](https://www.aikido.dev/blog/why-trying-to-secure-openclaw-is-ridiculous)
- [Dutch DPA Warning | BABL AI](https://babl.ai/dutch-data-protection-authority-warns-openclaw-ai-agents-pose-major-cybersecurity-and-privacy-risks/)
- [NVD — CVE-2026-25253](https://nvd.nist.gov/vuln/detail/CVE-2026-25253)
- [secure-openclaw | ComposioHQ](https://github.com/ComposioHQ/secure-openclaw)

### OpenClaw — Community & Ecosystem
- [Reddit: OpenClaw is what I hoped for](https://www.reddit.com/r/selfhosted/comments/1nrn11b/openclaw_is_what_i_hoped_for_a_year_ago/)
- [Reddit: How much should I trust OpenClaw with my data?](https://www.reddit.com/r/OpenClaw/comments/1q30doj/so_how_much_should_i_trust_openclaw_with_my_data/)
- [Reddit: How is everyone getting best results?](https://www.reddit.com/r/OpenClaw/comments/1q2gf7s/how_is_everyone_getting_best_results/)
- [awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills)
- [awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases)
- [OpenClaw ClawHub](https://github.com/openclaw/clawhub)
- [npm downloads API](https://api.npmjs.org/downloads/point/last-month/openclaw)
- [GitHub API repo stats](https://api.github.com/repos/openclaw/openclaw)
- [GitHub Security Advisories API](https://api.github.com/repos/openclaw/openclaw/security-advisories?per_page=100)

### Industry Data
- [Stack Overflow 2025 AI Report](https://survey.stackoverflow.co/2025/ai)
- [Stack Overflow 2024 Technology Survey](https://survey.stackoverflow.co/2024/technology)
- [DORA 2024 State of DevOps Report | Google Cloud](https://cloud.google.com/blog/products/devops-sre/2024-dora-accelerate-state-of-devops-report-now-available)
- [Atlassian Developer Experience Research](https://www.atlassian.com/blog/it-teams/new-research-the-state-of-developer-experience-in-2024)

### Hivemind — Internal References
- `ui/modules/main/hivemind-app.js` — main app class, Electron window config
- `ui/modules/websocket-runtime.js` — WebSocket server, ACK semantics, rate limiting
- `ui/scripts/hm-send.js` — agent messaging CLI, dual-path delivery
- `ui/modules/main/pane-host-window-manager.js` — hidden pane host windows
- `ui/pane-host-renderer.js` — output-gated delivery verification
- `ui/modules/main/evidence-ledger-store.js` — SQLite WAL event store
- `ui/modules/main/evidence-ledger-ingest.js` — envelope normalization/validation
- `ui/modules/main/comms-journal.js` — communications journal API
- `ui/modules/comms-worker.js` — forked WebSocket worker process
- `ui/modules/main/kernel-bridge.js` — event bridge to renderer
- `ui/modules/main/pane-control-service.js` — model-aware pane control dispatch
- `ui/modules/main/settings-manager.js` — settings + agent command construction
- `ui/modules/ipc/pty-handlers.js` — PTY IPC handlers
- `ui/modules/ipc/git-handlers.js` — git command handlers
- `ui/modules/ipc/mcp-autoconfig-handlers.js` — MCP autoconfig handlers
- `ui/modules/tabs/bridge.js` — Bridge tab UI
- `docs/protocol-spec.md` — agent communication protocol spec
- `docs/team-memory-spec.md` — Team Memory system spec

---

*Generated by Hivemind Architect, Builder, and Oracle — Session 3, 2026-02-18*
