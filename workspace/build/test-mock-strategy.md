# Test Mock Strategy - Hivemind UI

Date: 2026-01-29
Owner: Investigator (analysis)
Scope: Mock requirements for Electron IPC, node-pty, chokidar, fs, child_process.

## Overview
The UI codebase is split across Electron main-process modules (`ui/main.js`, `ui/modules/ipc/*.js`, `ui/modules/triggers.js`, `ui/modules/watcher.js`) and renderer-side modules (`ui/renderer.js`, `ui/modules/terminal.js`, `ui/modules/daemon-handlers.js`, `ui/modules/tabs.js`). Most logic is testable in Node/Jest by mocking side-effectful dependencies. The critical dependency groups and their expected mock surface are listed below.

## 1) Electron IPC (ipcMain / ipcRenderer / BrowserWindow)
### Where it is used
- Main process:
  - `ui/main.js` (creates BrowserWindow, forwards IPC, sends events)
  - `ui/modules/ipc/*.js` (registers handlers with `ipcMain.handle`)
  - `ui/modules/triggers.js`, `ui/modules/watcher.js` (send events via `mainWindow.webContents.send`)
- Renderer:
  - `ui/renderer.js` (invokes handlers, subscribes to events)
  - `ui/modules/terminal.js`, `ui/modules/daemon-handlers.js`, `ui/modules/tabs.js` (invokes + listens)
- Preload:
  - `ui/preload.js` (exposes `window.hivemind.*` via `contextBridge`)

### Mock surface required
Main-process tests typically need:
- `ipcMain.handle(channel, handler)`
- `ipcMain.on(channel, listener)`
- `BrowserWindow` with:
  - `webContents.send(channel, payload)`
  - `webContents.sendInputEvent(evt)`
  - `webContents.on(eventName, handler)`
  - `webContents.openDevTools()` (noop)
  - `isDestroyed()` (return false)
- `app` methods used by `main.js` (`whenReady`, `on`, `quit`, etc.)
- `dialog.showOpenDialog` (for project picker tests)

Renderer-side tests typically need:
- `ipcRenderer.invoke(channel, ...args)` -> returns Promise
- `ipcRenderer.on(channel, handler)` -> register listener
- `ipcRenderer.send(channel, payload)`
- Optional: `contextBridge.exposeInMainWorld` (preload tests)

### Recommended mock pattern
- Jest manual mock: `jest.mock('electron', () => ({ ... }))`
- Create a small IPC harness:
  - `handlers` map for `ipcMain.handle`
  - `invoke()` calls the registered handler with `(event, ...args)`
  - `webContents.send` pushes events into a list or fires registered renderer listeners
- For unit tests in `ui/modules/ipc/*.js`, pass a fake `ctx` with mocked `ipcMain` and `mainWindow` rather than loading full `main.js`.

## 2) node-pty
### Where it is used
- `ui/terminal-daemon.js` (daemon process; spawns PTYs and wires `onData` / `onExit`)

### Mock surface required
`pty.spawn()` returns an object with:
- `pid` (number)
- `onData(fn)` -> register data callback
- `onExit(fn)` -> register exit callback
- `write(data)`
- `resize(cols, rows)`
- Optional: `kill()` if tests cover kill paths

### Recommended mock pattern
- Mock module `node-pty` with `spawn: jest.fn(() => mockPty)`
- Implement `mockPty` as a lightweight EventEmitter wrapper:
  - store callbacks for `onData`/`onExit`
  - expose helper methods like `emitData(data)` and `emitExit(code)` for tests

## 3) chokidar
### Where it is used
- `ui/modules/watcher.js`
  - `workspaceWatcher = chokidar.watch(...)`
  - `triggerWatcher = chokidar.watch(...)`
  - `messageWatcher = chokidar.watch(...)`

### Mock surface required
`chokidar.watch()` returns a watcher with:
- `on(eventName, handler)` for `add`, `change`, `error`
- `close()`

### Recommended mock pattern
- Mock `chokidar.watch` to return an EventEmitter with a `.close` method
- Tests should call `watcher.emit('add', filePath)` / `watcher.emit('change', filePath)` to simulate file events

## 4) fs (sync-heavy IO)
### Where it is used
- Main process: `ui/main.js`, `ui/modules/triggers.js`, `ui/modules/watcher.js`
- Daemon: `ui/terminal-daemon.js`
- IPC handlers: `ui/modules/ipc/*` (many)
- SDK bridge: `ui/modules/sdk-bridge.js`
- MCP server: `ui/mcp-server.js`

### Mock surface required (most common)
- `existsSync`, `readFileSync`, `writeFileSync`, `appendFileSync`
- `renameSync`, `mkdirSync`, `readdirSync`, `statSync`
- `unlinkSync`, `rmSync`

### Recommended mock pattern
- For unit tests, mock `fs` with an in-memory map:
  - `files = new Map(path -> content)`
  - implement `readFileSync`, `writeFileSync`, `existsSync`, `renameSync`, `unlinkSync`
- For integration tests, consider using real temp dirs (`fs.mkdtempSync`) to avoid complex mocks.
- If using mocked fs, be mindful of code that uses `statSync` (should return `{ size, mtimeMs }`).

## 5) child_process
### Where it is used
- `ui/daemon-client.js` -> `spawn('node', [terminal-daemon.js])`
- `ui/modules/codex-exec.js` -> `spawn('codex', [...])`
- `ui/modules/sdk-bridge.js` -> `spawn('py', ['-3.12', ...])`
- `ui/modules/ipc-handlers.js`, `ui/modules/ipc/process-handlers.js` -> `spawn`, `execSync`
- `ui/modules/ipc/precommit-handlers.js` -> `execSync`
- `ui/modules/ipc/mcp-autoconfig-handlers.js` -> `exec`

### Mock surface required
`spawn()` should return an object with:
- `pid`, `unref()` (daemon-client)
- `stdin.write`, `stdin.end` (codex-exec)
- `stdout.on('data', fn)`, `stderr.on('data', fn)`
- `on('close', fn)`, `on('error', fn)`

`execSync()` should return a string/Buffer and be configurable to throw
`exec()` should accept callback `(err, stdout, stderr)`

### Recommended mock pattern
- Jest mock for `child_process` with `spawn`, `execSync`, `exec` stubs
- For codex-exec/sdk-bridge tests, supply a spawn mock that returns EventEmitter-like streams:
  - `stdout = new EventEmitter()` / `stderr = new EventEmitter()`
  - tests can call `stdout.emit('data', Buffer.from('...'))`

## Testability notes and risks
- Many modules are stateful singletons (e.g., `triggers.js`, `sdk-bridge.js`, `daemon-client.js`). Tests should reset module cache (`jest.resetModules()`) between cases when state matters.
- `watcher.js` and `triggers.js` rely on timers (`setTimeout`) and async operations. Prefer Jest fake timers for deterministic tests.
- Renderer-side modules (`renderer.js`, `terminal.js`, `tabs.js`) depend on DOM APIs. For unit tests, prefer testing submodules that can run with a minimal `window`/`document` stub or run Jest with `testEnvironment: jsdom`.
- Daemon tests should avoid real `node-pty` and OS signals; mock all PTY and process interactions.

## Minimal mock scaffolds (example shapes)
### Electron (main-process)
- `ipcMain.handle = (channel, fn) => { handlers[channel] = fn; }`
- `ipcMain.on = (channel, fn) => { listeners[channel] = fn; }`
- `webContents.send = jest.fn()`
- `webContents.sendInputEvent = jest.fn()`

### Electron (renderer)
- `ipcRenderer.invoke = jest.fn(async (channel, ...args) => handlers[channel]?.({}, ...args))`
- `ipcRenderer.on = (channel, fn) => { rendererListeners[channel] = fn; }`
- `ipcRenderer.send = (channel, payload) => { if (rendererListeners[channel]) rendererListeners[channel]({}, payload); }`

### node-pty
- `spawn` returns `{ pid: 123, onData(fn){...}, onExit(fn){...}, write: jest.fn(), resize: jest.fn() }`

### chokidar
- `watch` returns `EventEmitter` with `.close = jest.fn()`

### fs
- `existsSync(path)` -> `files.has(path)`
- `readFileSync(path)` -> `files.get(path)`
- `writeFileSync(path, data)` -> `files.set(path, data)`

### child_process
- `spawn` returns `{ pid, stdout: EventEmitter, stderr: EventEmitter, stdin: { write: jest.fn(), end: jest.fn() }, on: jest.fn(), unref: jest.fn() }`
- `execSync` returns string/Buffer
- `exec` invokes callback with stdout/stderr

## Modules most impacted by mocks (for test planning)
- Electron IPC: `ui/main.js`, `ui/modules/ipc/*.js`, `ui/renderer.js`, `ui/modules/daemon-handlers.js`, `ui/modules/tabs.js`
- node-pty: `ui/terminal-daemon.js`
- chokidar: `ui/modules/watcher.js`
- fs: `ui/modules/triggers.js`, `ui/modules/watcher.js`, `ui/main.js`, `ui/mcp-server.js`, `ui/terminal-daemon.js`, `ui/modules/ipc/*`
- child_process: `ui/daemon-client.js`, `ui/modules/codex-exec.js`, `ui/modules/sdk-bridge.js`, `ui/modules/ipc/*`

## Suggested next actions
- Implement shared jest mocks/helpers for `electron`, `fs`, `child_process`, `node-pty`, and `chokidar` to reduce duplication.
- Use dependency injection (where already supported, e.g., IPC handler modules taking `ctx`) to avoid loading `main.js` in tests.
- Establish a small test harness for IPC that can be reused across main/renderer tests.
