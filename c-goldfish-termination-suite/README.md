# C-Goldfish-Termination-Suite
**ProjectForge v1.3** — State Persistence & Multi-System Integration

Solves the "goldfish problem": every AI conversation starts fresh. This suite persists project state across sessions and syncs it to all connected systems automatically.

---

## Integration Status

| System | Status | Method |
|---|---|---|
| GitHub | ✅ Live | Auto-commit `STATE.json` to `goatpants24/truelister-docs` |
| Google Drive | ✅ Live | `rclone copy` to `manus_google_drive:ProjectForge/` |
| Gmail | ✅ Live | MCP `gmail_send_messages` to `goatking38@gmail.com` |
| LINE | ⚠️ Pending | Requires `LINE_USER_ID` in MCP server env vars |

---

## Scripts

| Script | Purpose | Run by |
|---|---|---|
| `scripts/forge_watcher.py` | Clipboard daemon — monitors for `[STATE_JSON]` trigger | User (local machine) |
| `scripts/state_sync.py` | Agent-side sync — updates STATE.json and pushes to all integrations | Manus (agent) |
| `scripts/archive_parser.py` | History scrubber — extracts state from conversation logs | Manus or User |

---

## Quick Start

### Agent-side sync (Manus runs this)
```bash
python3 scripts/state_sync.py \
  --milestone "Completed feature X" \
  --pending "Deploy to production" \
  --status "Feature Complete"
```

### Clipboard daemon (run on your local machine)
```bash
# Install clipboard dependency (Linux)
sudo apt install xclip

# Start daemon (polls every 5 seconds)
python3 scripts/forge_watcher.py

# One-shot sync (no watch loop)
python3 scripts/forge_watcher.py --once
```
Then copy `[STATE_JSON]` to your clipboard to trigger a sync.

### Archive parser (scrub a conversation log)
```bash
python3 scripts/archive_parser.py --input history.txt --merge STATE.json
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
GITHUB_REPO=goatpants24/truelister-docs
GITHUB_BRANCH=main
GMAIL_TO=goatking38@gmail.com
LINE_USER_ID=Uxxxxxxxxxxxxxxxxx   # from LINE Developers Console
GDRIVE_FOLDER=manus_google_drive:ProjectForge
RCLONE_CONFIG=/home/ubuntu/.gdrive-rclone.ini
```

---

## STATE.json Protocol

- **Sync trigger**: Every 10 messages, or when `[STATE_JSON]` appears in clipboard
- **Visual cue**: 💾 confirms sync occurred
- **Silent-Mode**: Syncs without notification when active
- **Checkpoint**: ISO-8601 UTC timestamp updated on every sync

---

## LINE Setup (to complete)

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a Messaging API channel
3. Get your **User ID** from the console
4. Set `LINE_USER_ID` in your MCP server environment variables
5. LINE push messages will activate automatically on next sync

---

## Logic Tombstones

- **Browser extension rejected**: No evergreen cross-platform support
- **Hashing paused**: Slowed iteration during development; re-enable for production
- **LINE broadcast 401**: Channel token not configured in MCP server env — use push with userId instead
