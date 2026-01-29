# Distributed Hivemind: Synology NAS Setup Guide

**Status:** Concept / Untested
**Created:** Jan 26, 2026
**Author:** Lead

---

## Overview

Run Hivemind agents across multiple machines (Windows + Mac) using a Synology NAS as the central hub. The NAS serves the shared `workspace/` folder, enabling cross-machine agent communication via the existing trigger file system.

```
┌─────────────────┐         ┌─────────────────┐
│  Windows PC     │         │    MacBook      │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ Lead      │  │         │  │ Agent 5   │  │
│  │ Worker A  │  │         │  │ Agent 6   │  │
│  │ Worker B  │  │         │  │ ...       │  │
│  │ Reviewer  │  │         │  └───────────┘  │
│  └───────────┘  │         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │      LAN (~1-5ms)         │
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────┴──────┐
              │ Synology NAS │
              │ ┌──────────┐ │
              │ │workspace/│ │
              │ │ triggers/│ │
              │ │ build/   │ │
              │ │ state/   │ │
              │ └──────────┘ │
              └──────────────┘
```

---

## Prerequisites

- Synology NAS on same LAN as all machines
- SMB/CIFS enabled on NAS (default)
- Network discovery enabled on Windows/Mac
- Hivemind installed on each machine

---

## Step 1: Create Shared Folder on NAS

### Via Synology DSM Web UI:

1. Open **Control Panel** → **Shared Folder**
2. Click **Create**
3. Configure:
   - Name: `hivemind`
   - Description: "Hivemind distributed workspace"
   - Enable Recycle Bin: Optional
4. Click **Next** → **Apply**

### Set Permissions:

1. Select `hivemind` folder → **Edit** → **Permissions**
2. Add your user account with **Read/Write** access
3. Apply to all machines' user accounts

---

## Step 2: Mount on Windows

### Option A: Map Network Drive (GUI)

1. Open **File Explorer**
2. Right-click **This PC** → **Map network drive**
3. Configure:
   - Drive: `H:` (or any available letter)
   - Folder: `\\YOUR-NAS-NAME\hivemind`
   - Check "Reconnect at sign-in"
   - Check "Connect using different credentials" if needed
4. Enter NAS credentials when prompted
5. Click **Finish**

### Option B: Command Line

```cmd
net use H: \\YOUR-NAS-NAME\hivemind /persistent:yes /user:YOUR-NAS-USER
```

### Verify:

```cmd
dir H:\
```

Should show empty folder (or existing workspace contents).

---

## Step 3: Mount on Mac

### Option A: Finder (GUI)

1. Open **Finder**
2. Press `Cmd+K` (Connect to Server)
3. Enter: `smb://YOUR-NAS-IP/hivemind`
4. Click **Connect**
5. Enter NAS credentials
6. Mount point will be `/Volumes/hivemind`

### Option B: Terminal

```bash
# Create mount point
mkdir -p /Volumes/hivemind

# Mount
mount_smbfs //YOUR-NAS-USER@YOUR-NAS-IP/hivemind /Volumes/hivemind
```

### Auto-mount on login:

1. **System Preferences** → **Users & Groups**
2. Select your user → **Login Items**
3. Add the mounted volume

### Verify:

```bash
ls /Volumes/hivemind
```

---

## Step 4: Initialize Workspace on NAS

From either machine, create the workspace structure:

```bash
# From Windows (H: drive)
mkdir H:\workspace
mkdir H:\workspace\triggers
mkdir H:\workspace\build
mkdir H:\workspace\instances
mkdir H:\workspace\instances\lead
mkdir H:\workspace\instances\worker-a
mkdir H:\workspace\instances\worker-b
mkdir H:\workspace\instances\reviewer

# Or from Mac
mkdir -p /Volumes/hivemind/workspace/{triggers,build,instances/{lead,worker-a,worker-b,reviewer}}
```

Copy required files:
- `shared_context.md`
- `app-status.json`
- `message-state.json`
- Instance CLAUDE.md files

---

## Step 5: Configure Hivemind

### Option A: Symlink workspace (Recommended)

Replace local workspace with symlink to NAS:

**Windows:**
```cmd
cd D:\projects\hivemind
rmdir /s /q workspace
mklink /D workspace H:\workspace
```

**Mac:**
```bash
cd ~/projects/hivemind
rm -rf workspace
ln -s /Volumes/hivemind/workspace workspace
```

### Option B: Configurable workspace path (Future feature)

Add to settings:
```json
{
  "workspacePath": "H:\\workspace"
}
```

This requires code changes to make workspace path configurable.

---

## Step 6: Test Cross-Machine Communication

### Test 1: Trigger File

On Windows:
```cmd
echo "(WINDOWS-LEAD #1): Hello from Windows" > H:\workspace\triggers\all.txt
```

On Mac, verify file watcher picks it up:
- Check Hivemind console for trigger detection
- Agent should receive the message

### Test 2: Reverse Direction

On Mac:
```bash
echo "(MAC-AGENT #1): Hello from Mac" > /Volumes/hivemind/workspace/triggers/lead.txt
```

On Windows:
- Lead agent should receive the message

### Test 3: Shared Context

1. Update `shared_context.md` on Windows
2. Verify Mac agents see the change
3. Update `status.md` on Mac
4. Verify Windows agents see the change

---

## Latency Expectations

| Operation | Expected Latency |
|-----------|------------------|
| File write to NAS | 1-5ms |
| File watcher detection | 100-1000ms (polling interval) |
| End-to-end trigger | ~1-2 seconds |

Compare to cloud sync: 5-30 seconds minimum.

---

## Troubleshooting

### "Path not found" errors

- Verify NAS is accessible: `ping YOUR-NAS-IP`
- Check mount is active: `net use` (Windows) or `mount` (Mac)
- Remount if disconnected

### Permission denied

- Verify user has Read/Write on NAS shared folder
- Check file isn't locked by another process

### File watcher not detecting changes

- SMB might not trigger inotify/FSEvents properly
- Solution: Use polling mode in chokidar (already enabled)
```javascript
usePolling: true,
interval: 1000
```

### Stale mounts after sleep/wake

- Windows: May need to reconnect mapped drive
- Mac: May need to remount after wake from sleep
- Solution: Auto-remount scripts on wake

---

## Security Considerations

- NAS should be on trusted LAN only
- Use strong credentials for SMB access
- Consider VPN if accessing NAS remotely
- Don't expose SMB port (445) to internet

---

## Advanced: Docker Relay Server (Alternative)

If file-based communication proves unreliable, run a WebSocket relay on the NAS:

1. Enable Docker on Synology (Package Center → Docker)
2. Create simple Node.js relay server
3. Agents connect via WebSocket instead of file watching
4. Lower latency, more reliable

This is a future enhancement if the file-based approach has issues.

---

## Future Enhancements

- [ ] Make workspace path configurable in settings
- [ ] Auto-reconnect logic for dropped NAS mounts
- [ ] Agent discovery across machines
- [ ] Role assignment across machines (Windows = Lead/Workers, Mac = Reviewers)
- [ ] Bandwidth optimization (don't sync large files)

---

## Related Files

- `workspace/shared_context.md` - Shared context (must be on NAS)
- `workspace/triggers/*.txt` - Cross-machine messaging
- `workspace/app-status.json` - Per-machine (NOT shared)
- `ui/modules/watcher.js` - File watcher with polling mode

---

*Document created as concept guide. Test and update as implementation progresses.*
