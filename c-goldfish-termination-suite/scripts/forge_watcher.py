#!/usr/bin/env python3
"""
forge_watcher.py — C-Goldfish-Termination-Suite Clipboard Daemon
ProjectForge v1.3

Monitors clipboard for [STATE_JSON] trigger header.
On detection, reads STATE.json and dispatches sync to all configured integrations:
  - GitHub  : commits STATE.json to configured repo
  - Gmail   : sends state summary email
  - LINE    : pushes state summary message
  - GDrive  : uploads STATE.json to Drive folder

Usage:
  python3 forge_watcher.py [--state /path/to/STATE.json] [--interval 5]

Environment variables (set in .env or shell):
  GITHUB_REPO       e.g. goatpants24/truelister-docs
  GITHUB_BRANCH     default: main
  GMAIL_TO          recipient email address
  LINE_USER_ID      LINE user ID to push to
  GDRIVE_FOLDER     rclone remote path e.g. manus_google_drive:ProjectForge
  RCLONE_CONFIG     path to rclone config, default ~/.gdrive-rclone.ini
"""

import os
import sys
import json
import time
import argparse
import subprocess
import logging
from datetime import datetime, timezone
from pathlib import Path

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "forge_watcher.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("forge_watcher")

# ── Config ────────────────────────────────────────────────────────────────────
DEFAULT_STATE_PATH = Path(__file__).parent.parent / "STATE.json"
TRIGGER_HEADER = "[STATE_JSON]"
VISUAL_CUE = "💾"

# ── Clipboard helpers ─────────────────────────────────────────────────────────

def read_clipboard() -> str:
    """Read clipboard content cross-platform."""
    try:
        if sys.platform == "darwin":
            return subprocess.check_output(["pbpaste"], text=True)
        elif sys.platform.startswith("linux"):
            # Try xclip then xsel
            for cmd in [["xclip", "-selection", "clipboard", "-o"],
                        ["xsel", "--clipboard", "--output"]]:
                try:
                    return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)
                except FileNotFoundError:
                    continue
        elif sys.platform == "win32":
            import ctypes
            ctypes.windll.user32.OpenClipboard(0)
            handle = ctypes.windll.user32.GetClipboardData(13)  # CF_UNICODETEXT
            data = ctypes.c_wchar_p(handle).value or ""
            ctypes.windll.user32.CloseClipboard()
            return data
    except Exception as e:
        log.debug(f"Clipboard read failed: {e}")
    return ""


def clipboard_has_trigger(content: str) -> bool:
    return TRIGGER_HEADER in content

# ── STATE.json helpers ────────────────────────────────────────────────────────

def load_state(state_path: Path) -> dict:
    if not state_path.exists():
        log.warning(f"STATE.json not found at {state_path}")
        return {}
    with open(state_path) as f:
        return json.load(f)


def save_state(state: dict, state_path: Path):
    state["checkpoint"] = datetime.now(timezone.utc).isoformat()
    with open(state_path, "w") as f:
        json.dump(state, f, indent=2)
    log.info(f"{VISUAL_CUE} State saved → {state_path}")

# ── Integration: GitHub ───────────────────────────────────────────────────────

def sync_github(state: dict, state_path: Path):
    repo = os.environ.get("GITHUB_REPO")
    branch = os.environ.get("GITHUB_BRANCH", "main")
    if not repo:
        log.info("GITHUB_REPO not set — skipping GitHub sync")
        return
    try:
        project = state.get("project", "unknown")
        msg = f"{VISUAL_CUE} [forge_watcher] State sync: {project} @ {state.get('checkpoint', 'now')}"
        # Ensure we're in the repo directory
        repo_dir = Path.home() / repo.split("/")[-1]
        if not repo_dir.exists():
            log.warning(f"Repo dir {repo_dir} not found — cloning")
            subprocess.run(["gh", "repo", "clone", repo, str(repo_dir)], check=True)
        # Copy STATE.json into repo
        dest = repo_dir / "STATE.json"
        import shutil
        shutil.copy2(state_path, dest)
        subprocess.run(["git", "-C", str(repo_dir), "add", "STATE.json"], check=True)
        subprocess.run(["git", "-C", str(repo_dir), "commit", "-m", msg], check=True)
        subprocess.run(["git", "-C", str(repo_dir), "push", "origin", branch], check=True)
        log.info(f"✅ GitHub sync complete → {repo}:{branch}")
    except subprocess.CalledProcessError as e:
        log.error(f"GitHub sync failed: {e}")

# ── Integration: Gmail ────────────────────────────────────────────────────────

def sync_gmail(state: dict):
    to_addr = os.environ.get("GMAIL_TO")
    if not to_addr:
        log.info("GMAIL_TO not set — skipping Gmail sync")
        return
    try:
        project = state.get("project", "unknown")
        status = state.get("status", "unknown")
        milestones = "\n".join(f"  ✅ {m}" for m in state.get("milestones", []))
        pending = "\n".join(f"  🔄 {t}" for t in state.get("pending_tasks", []))
        body = (
            f"💾 ProjectForge State Sync\n"
            f"Project : {project}\n"
            f"Status  : {status}\n"
            f"Time    : {state.get('checkpoint', 'now')}\n\n"
            f"Milestones:\n{milestones}\n\n"
            f"Pending:\n{pending}"
        )
        payload = json.dumps({
            "to": to_addr,
            "subject": f"[ProjectForge] {project} — {status}",
            "body": body
        })
        result = subprocess.run(
            ["manus-mcp-cli", "tool", "call", "gmail_send_messages",
             "--server", "gmail",
             "--input", json.dumps({"messages": [{"to": to_addr,
                                                   "subject": f"[ProjectForge] {project} — {status}",
                                                   "body": body}]})],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            log.info(f"✅ Gmail sync complete → {to_addr}")
        else:
            log.error(f"Gmail sync failed: {result.stderr}")
    except Exception as e:
        log.error(f"Gmail sync error: {e}")

# ── Integration: LINE ─────────────────────────────────────────────────────────

def sync_line(state: dict):
    user_id = os.environ.get("LINE_USER_ID")
    if not user_id:
        log.info("LINE_USER_ID not set — skipping LINE sync")
        return
    try:
        project = state.get("project", "unknown")
        status = state.get("status", "unknown")
        text = (
            f"💾 ProjectForge Sync\n"
            f"Project: {project}\n"
            f"Status: {status}\n"
            f"Time: {state.get('checkpoint', 'now')}\n"
            f"Pending: {len(state.get('pending_tasks', []))} tasks"
        )
        result = subprocess.run(
            ["manus-mcp-cli", "tool", "call", "push_text_message",
             "--server", "line",
             "--input", json.dumps({"userId": user_id, "message": text})],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            log.info(f"✅ LINE sync complete → {user_id}")
        else:
            log.error(f"LINE sync failed: {result.stderr}")
    except Exception as e:
        log.error(f"LINE sync error: {e}")

# ── Integration: Google Drive ─────────────────────────────────────────────────

def sync_gdrive(state_path: Path):
    folder = os.environ.get("GDRIVE_FOLDER", "manus_google_drive:ProjectForge")
    rclone_cfg = os.environ.get("RCLONE_CONFIG", str(Path.home() / ".gdrive-rclone.ini"))
    try:
        result = subprocess.run(
            ["rclone", "copy", str(state_path), folder,
             "--config", rclone_cfg],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            log.info(f"✅ Google Drive sync complete → {folder}")
        else:
            log.error(f"Drive sync failed: {result.stderr}")
    except Exception as e:
        log.error(f"Drive sync error: {e}")

# ── Main sync dispatcher ──────────────────────────────────────────────────────

def run_sync(state_path: Path):
    log.info(f"🔄 Sync triggered by {TRIGGER_HEADER}")
    state = load_state(state_path)
    if not state:
        log.warning("Empty state — aborting sync")
        return
    # Update checkpoint
    save_state(state, state_path)
    # Dispatch all integrations
    sync_github(state, state_path)
    sync_gmail(state)
    sync_line(state)
    sync_gdrive(state_path)
    log.info(f"{VISUAL_CUE} All integrations dispatched for project: {state.get('project', 'unknown')}")

# ── Watch loop ────────────────────────────────────────────────────────────────

def watch(state_path: Path, interval: int):
    log.info(f"forge_watcher started — polling clipboard every {interval}s")
    log.info(f"STATE.json: {state_path}")
    last_trigger = ""
    while True:
        try:
            clip = read_clipboard()
            # Only trigger once per unique clipboard content containing the header
            if clipboard_has_trigger(clip) and clip != last_trigger:
                last_trigger = clip
                run_sync(state_path)
            time.sleep(interval)
        except KeyboardInterrupt:
            log.info("forge_watcher stopped by user")
            break
        except Exception as e:
            log.error(f"Watch loop error: {e}")
            time.sleep(interval)

# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="forge_watcher — ProjectForge clipboard daemon")
    parser.add_argument("--state", default=str(DEFAULT_STATE_PATH),
                        help="Path to STATE.json (default: ../STATE.json)")
    parser.add_argument("--interval", type=int, default=5,
                        help="Clipboard poll interval in seconds (default: 5)")
    parser.add_argument("--once", action="store_true",
                        help="Run sync once immediately and exit (no watch loop)")
    args = parser.parse_args()

    state_path = Path(args.state)
    if args.once:
        run_sync(state_path)
    else:
        watch(state_path, args.interval)

if __name__ == "__main__":
    main()
