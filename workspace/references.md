# Verified References

**Purpose:** Persistent library of documentation URLs found during research. Check here before searching. Add links when you find useful docs.

**Last Updated:** Jan 29, 2026

---

## Electron

| Topic | URL | Notes |
|-------|-----|-------|
| webContents.sendInputEvent | https://www.electronjs.org/docs/latest/api/web-contents#contentssend-inputevent-inputevent | Used for sendTrustedEnter - native keyboard events |
| contextBridge | https://www.electronjs.org/docs/latest/api/context-bridge | Secure preload ↔ renderer communication |
| ipcMain/ipcRenderer | https://www.electronjs.org/docs/latest/api/ipc-main | IPC between main and renderer |
| BrowserWindow | https://www.electronjs.org/docs/latest/api/browser-window | Window creation, webPreferences |

## xterm.js

| Topic | URL | Notes |
|-------|-----|-------|
| Terminal Class | https://xtermjs.org/docs/api/terminal/classes/Terminal/ | Core terminal methods |
| Addons | https://xtermjs.org/docs/api/addons/ | FitAddon, WebLinksAddon |

## node-pty

| Topic | URL | Notes |
|-------|-----|-------|
| GitHub Repo | https://github.com/microsoft/node-pty | PTY spawn, write, onData |
| API Reference | https://github.com/microsoft/node-pty#api | spawn(), write(), onData(), kill() |

## Node.js

| Topic | URL | Notes |
|-------|-----|-------|
| Child Process | https://nodejs.org/api/child_process.html | spawn, exec, fork |
| File System | https://nodejs.org/api/fs.html | fs.watch, readFile, writeFile |
| Path | https://nodejs.org/api/path.html | path.join, resolve, dirname |

## Web Platform

| Topic | URL | Notes |
|-------|-----|-------|
| Page Visibility API | https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API | visibilitychange, document.hidden for pausing work |
| animation-play-state | https://developer.mozilla.org/docs/Web/CSS/animation-play-state | Pause/resume CSS animations |
| offset-path | https://developer.mozilla.org/en-US/docs/Web/CSS/offset-path | CSS motion path for particle streams |
| offset-distance | https://developer.mozilla.org/en-US/docs/Web/CSS/offset-distance | Animating distance along motion path |

## chokidar (File Watcher)

| Topic | URL | Notes |
|-------|-----|-------|
| GitHub Repo | https://github.com/paulmillr/chokidar | File watcher used for triggers |

## Stack Overflow Solutions

| Problem | URL | Resolution |
|---------|-----|------------|
| (Add when found) | | |

## Claude Code / Anthropic

| Topic | URL | Notes |
|-------|-----|-------|
| Claude Code Docs | https://docs.anthropic.com/en/docs/claude-code | Official CLI docs |

---

## How to Use

**Before searching:** Check if the topic is already listed here.

**After finding useful docs:** Add a row to the appropriate table:
```markdown
| Topic | URL | Notes |
```

**Format:** Keep URLs clean (no tracking params), add brief notes on why it's useful.
