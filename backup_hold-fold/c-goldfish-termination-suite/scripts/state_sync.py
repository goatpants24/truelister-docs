#!/usr/bin/env python3
"""
state_sync.py — C-Goldfish-Termination-Suite Agent-Side Sync Utility
ProjectForge v1.3

Called by Manus (the agent) at sync points to:
  1. Update STATE.json with new milestone/pending/tombstone data
  2. Commit STATE.json to GitHub (truelister-docs repo)
  3. Upload STATE.json to Google Drive
  4. (Optional) Send Gmail/LINE notification

Usage:
  python3 state_sync.py --milestone "Completed X" --pending "Do Y" --tombstone "Rejected Z"
  python3 state_sync.py --status "New Status"
  python3 state_sync.py  # just refresh checkpoint and sync
"""

import os
import sys
import json
import argparse
import subprocess
import logging
from datetime import datetime, timezone
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_DIR = Path(__file__).parent.parent
STATE_PATH = PROJECT_DIR / "STATE.json"
LOG_DIR = PROJECT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
GITHUB_REPO = "goatpants24/truelister-docs"
GITHUB_BRANCH = "main"
GDRIVE_FOLDER = "manus_google_drive:ProjectForge"
RCLONE_CONFIG = str(Path.home() / ".gdrive-rclone.ini")  # override via env RCLONE_CONFIG
VISUAL_CUE = "💾"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "state_sync.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("state_sync")

# ── State helpers ─────────────────────────────────────────────────────────────

def load_state() -> dict:
    if not STATE_PATH.exists():
        log.error(f"STATE.json not found at {STATE_PATH}")
        sys.exit(1)
    with open(STATE_PATH) as f:
        return json.load(f)


def save_state(state: dict):
    state["checkpoint"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)
    log.info(f"{VISUAL_CUE} STATE.json updated — checkpoint: {state['checkpoint']}")

# ── GitHub sync ───────────────────────────────────────────────────────────────

def github_sync(state: dict):
    repo_dir = Path.home() / "truelister-docs"
    if not repo_dir.exists():
        log.info("Cloning truelister-docs...")
        r = subprocess.run(["gh", "repo", "clone", GITHUB_REPO, str(repo_dir)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            log.error(f"Clone failed: {r.stderr}")
            return

    import shutil
    dest = repo_dir / "STATE.json"
    shutil.copy2(STATE_PATH, dest)

    project = state.get("project", "unknown")
    checkpoint = state.get("checkpoint", "now")
    msg = f"{VISUAL_CUE} [state_sync] {project} @ {checkpoint}"

    cmds = [
        ["git", "-C", str(repo_dir), "add", "STATE.json"],
        ["git", "-C", str(repo_dir), "commit", "-m", msg],
        ["git", "-C", str(repo_dir), "push", "origin", GITHUB_BRANCH],
    ]
    for cmd in cmds:
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            # "nothing to commit" is acceptable
            if "nothing to commit" in r.stdout + r.stderr:
                log.info("GitHub: nothing to commit (state unchanged)")
                return
            log.error(f"GitHub cmd failed: {' '.join(cmd)}\n{r.stderr}")
            return
    log.info(f"✅ GitHub sync → {GITHUB_REPO}:{GITHUB_BRANCH}")


# ── Google Drive sync ─────────────────────────────────────────────────────────

def gdrive_sync():
    r = subprocess.run(
        ["rclone", "copy", str(STATE_PATH), GDRIVE_FOLDER, "--config", RCLONE_CONFIG],
        capture_output=True, text=True
    )
    if r.returncode == 0:
        log.info(f"✅ Drive sync → {GDRIVE_FOLDER}")
    else:
        log.error(f"Drive sync failed: {r.stderr}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="state_sync — ProjectForge agent-side sync")
    parser.add_argument("--milestone", action="append", default=[],
                        help="Add a completed milestone (repeatable)")
    parser.add_argument("--pending", action="append", default=[],
                        help="Add a pending task (repeatable)")
    parser.add_argument("--tombstone", action="append", default=[],
                        help="Add a logic tombstone (repeatable)")
    parser.add_argument("--status", default=None,
                        help="Update project status string")
    parser.add_argument("--no-github", action="store_true",
                        help="Skip GitHub sync")
    parser.add_argument("--no-drive", action="store_true",
                        help="Skip Google Drive sync")
    args = parser.parse_args()

    state = load_state()

    # Apply mutations
    if args.status:
        state["status"] = args.status
        log.info(f"Status → {args.status}")

    for m in args.milestone:
        if m not in state.get("milestones", []):
            state.setdefault("milestones", []).append(m)
            log.info(f"✅ Milestone: {m}")

    for p in args.pending:
        if p not in state.get("pending_tasks", []):
            state.setdefault("pending_tasks", []).append(p)
            log.info(f"🔄 Pending: {p}")

    for t in args.tombstone:
        if t not in state.get("logic_tombstones", []):
            state.setdefault("logic_tombstones", []).append(t)
            log.info(f"🪦 Tombstone: {t}")

    save_state(state)

    if not args.no_github:
        github_sync(state)

    if not args.no_drive:
        gdrive_sync()

    log.info(f"{VISUAL_CUE} Sync complete — project: {state.get('project')}")


if __name__ == "__main__":
    main()
