# Task #20: Knowledge Base Integration (RAG) — Investigation + Implementation Plan

> Role: Investigator (analysis + design; no code changes). This doc maps the architecture, integration points, and risks for a production-grade RAG system in the Hivemind Electron app.

## Goals (per Architect)
- Document ingestion (PDF, docs, code files)
- Vector embeddings storage
- Semantic search across knowledge
- Auto-context injection for agents
- Knowledge versioning
- Source attribution in responses

## Current Codebase Touchpoints (observed)
- **Workspace root:** `ui/config.js` exports `WORKSPACE_PATH` used everywhere.
- **Message injection:** `ui/modules/terminal.js` + `ui/modules/terminal/injection.js` handle PTY send + Codex exec prompt build.
- **Triggers:** `ui/modules/triggers.js` handles file trigger ? inject message.
- **IPC pattern:** `ui/modules/ipc/*.js` registers handlers; renderer uses `window.hivemind.*` API via `ipcRenderer.invoke`.

## Proposed Architecture (high-level)

### A) Knowledge Base service (main process)
Create `ui/modules/knowledge-base.js` (or similar) and register IPC handlers in `ui/modules/ipc/knowledge-handlers.js`.
Responsibilities:
- **Ingestion pipeline** (file parsing + chunking + metadata)
- **Embedding generation** (local or remote model)
- **Vector store** (persisted index + metadata)
- **Search API** returning top-k chunks + provenance
- **Versioning** via doc hash + chunk version

### B) Storage layout (in workspace)
```
workspace/
  knowledge/
    index.sqlite   # or index.json + vectors
    blobs/         # optional raw doc snapshots
    versions/      # optional manifest per doc hash
```
Metadata fields per chunk:
- `doc_id` (stable per file path)
- `doc_version` (content hash / incremental)
- `chunk_id`, `chunk_index`
- `source_path`, `source_type`, `line_start`, `line_end` (for code/docs)
- `created_at`, `updated_at`
- `embedding` (vector) or reference to vector store

### C) Embeddings + Vector store options
Choose one path and document tradeoffs:
1) **Remote embeddings API** (OpenAI/Anthropic/etc.) + **SQLite JSON** for vectors; cosine similarity computed in JS. Easy MVP, fewer native deps, but slower at scale.
2) **Local embeddings** via `@xenova/transformers` + **HNSW** index using `hnswlib-node`. Fast search, no external API cost, but heavier deps.
3) **SQLite vector extension** (`sqlite-vec` or `sqlite-vss`) for persistence + indexed search. Clean, but native build complexity on Windows.

Given current dependency set is minimal, MVP path (1) is simplest; production likely needs (2) or (3).

### D) Ingestion pipeline
- **Supported sources**: project folders, `shared_context.md`, manual uploads (PDF, markdown, text, code).
- **Change detection**: `chokidar` watcher on configured roots ? enqueue re-ingestion on file change.
- **PDF parsing**: `pdf-parse` or `pdfjs-dist` (new dependency).
- **Chunking**: size ~400-800 tokens with overlap (e.g., 10–20%). For code, chunk by function/class or 200–400 lines with overlap.
- **Normalization**: store raw + cleaned text; keep line ranges for code files.

### E) Semantic search
- Search API accepts: `query`, `topK`, optional `filters` (project, file type, tags).
- Returns list of `{ text, score, source }`, where `source` includes path + line range + version.

### F) Auto-context injection
**Primary hook:** `ui/modules/terminal/injection.js` before sending message.
Workflow:
1. Intercept outgoing message.
2. Call `knowledge.search(query)` via IPC.
3. Inject block prepended to user message:
```
[KNOWLEDGE_CONTEXT]
- source: <path>#Lx-Ly (v3, score=0.82)
  <snippet>
- source: ...
[/KNOWLEDGE_CONTEXT]

<User prompt>
```
4. For Codex panes: integrate via `buildCodexExecPrompt()` in `terminal.js`.
5. For SDK mode: inject in `sdk-bridge` before dispatch.

### G) Source attribution in responses
- Add **instruction prefix** to context block: “When using any snippet, cite as [source: path#Lx-Ly].”
- For code responses, encourage inline citations or a “Sources used” footer.

### H) Versioning model
- Compute SHA-256 hash per document; store as `doc_version`.
- When file changes, mark old version inactive; keep history for retrieval and auditing.
- Optional: keep version manifest at `workspace/knowledge/versions/<doc_id>.json`.

## Integration Points (code files)
- **IPC Registration:** `ui/modules/ipc/handler-registry.js` ? add `registerKnowledgeHandlers`.
- **Main process:** `ui/main.js` to instantiate KB service and route IPC.
- **Renderer:** `ui/renderer.js` expose `window.hivemind.knowledge.*`.
- **Terminal injection:** `ui/modules/terminal/injection.js` to call KB search.
- **SDK path:** `ui/modules/sdk-bridge.js` or message pipeline to inject context.
- **Settings:** `ui/modules/settings.js` for toggle (enable/disable RAG) + config (topK, max chars).

## Risks / Complexity
- **Latency**: embedding per prompt adds delay; should cache results per prompt hash.
- **Cost**: external embeddings cost; require throttling + batching.
- **Index size**: need pruning strategy for large workspaces.
- **Native deps**: vector DB native modules can be painful on Windows.
- **Prompt inflation**: must bound injected context size.

## Suggested MVP Scope
- Ingest markdown + txt + code files in project directories only.
- Simple cosine similarity search with embeddings stored in JSON or SQLite table.
- Manual “Rebuild Index” + background watcher for changes.
- Auto-context injection behind toggle + topK=3 + maxChars=1500.

## Next Steps (handoff to Implementer)
1. Decide embedding strategy (remote vs local) and vector store.
2. Implement KB service + IPC handlers.
3. Add injection into PTY + Codex exec path.
4. Add attribution guidance in context blocks.
5. Add settings toggles + UI (optional in Task #8).

---

Prepared by: Investigator
Date: 2026-01-30
