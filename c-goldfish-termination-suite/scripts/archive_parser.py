#!/usr/bin/env python3
"""
archive_parser.py — C-Goldfish-Termination-Suite Archive Parser
ProjectForge v1.3

Scrubs conversation/log history to produce a compressed STATE.json-compatible
summary. Eliminates redundant context while preserving critical state.

Usage:
  python3 archive_parser.py --input history.txt --output STATE.json
  python3 archive_parser.py --input history.txt --merge existing_STATE.json
"""

import re
import json
import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

VISUAL_CUE = "💾"

# ── Patterns ──────────────────────────────────────────────────────────────────
MILESTONE_PATTERNS = [
    r"✅\s+(.+)",
    r"completed?[:\s]+(.+)",
    r"implemented?[:\s]+(.+)",
    r"created?[:\s]+(.+)",
    r"deployed?[:\s]+(.+)",
    r"milestone[:\s]+(.+)",
]

PENDING_PATTERNS = [
    r"🔄\s+(.+)",
    r"pending[:\s]+(.+)",
    r"todo[:\s]+(.+)",
    r"next step[s]?[:\s]+(.+)",
    r"\[ \]\s+(.+)",
]

TOMBSTONE_PATTERNS = [
    r"rejected?[:\s]+(.+)",
    r"paused?[:\s]+(.+)",
    r"abandoned?[:\s]+(.+)",
    r"tombstone[:\s]+(.+)",
    r"logic_tombstone[:\s]+(.+)",
]

STATUS_PATTERNS = [
    r"status[:\s]+(.+)",
    r"phase[:\s]+(.+)",
    r"current stage[:\s]+(.+)",
]


def extract_items(text: str, patterns: list) -> list:
    items = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE | re.MULTILINE):
            item = m.group(1).strip().rstrip(".,;")
            if item and item not in items:
                items.append(item)
    return items


def parse_history(text: str) -> dict:
    milestones = extract_items(text, MILESTONE_PATTERNS)
    pending = extract_items(text, PENDING_PATTERNS)
    tombstones = extract_items(text, TOMBSTONE_PATTERNS)

    # Best-effort status extraction (last match wins)
    status = "Parsed from history"
    for pat in STATUS_PATTERNS:
        matches = re.findall(pat, text, re.IGNORECASE)
        if matches:
            status = matches[-1].strip()

    # Project name: look for "project: X" or "project_name: X"
    project = "unknown"
    pm = re.search(r'"?project"?\s*[:\=]\s*"?([a-zA-Z0-9_\-]+)"?', text, re.IGNORECASE)
    if pm:
        project = pm.group(1).strip().lower().replace(" ", "-")

    return {
        "project": project,
        "checkpoint": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "milestones": milestones,
        "active_variables": {
            "sync_interval": "10 messages",
            "trigger_header": "[STATE_JSON]",
            "visual_cue": VISUAL_CUE,
        },
        "pending_tasks": pending,
        "logic_tombstones": tombstones,
    }


def merge_states(existing: dict, parsed: dict) -> dict:
    """Merge parsed state into existing, deduplicating lists."""
    merged = dict(existing)
    merged["checkpoint"] = parsed["checkpoint"]
    if parsed["status"] != "Parsed from history":
        merged["status"] = parsed["status"]
    for key in ("milestones", "pending_tasks", "logic_tombstones"):
        existing_list = merged.get(key, [])
        for item in parsed.get(key, []):
            if item not in existing_list:
                existing_list.append(item)
        merged[key] = existing_list
    return merged


def main():
    parser = argparse.ArgumentParser(description="archive_parser — ProjectForge history scrubber")
    parser.add_argument("--input", required=True, help="Input history text file")
    parser.add_argument("--output", default=None, help="Output STATE.json path")
    parser.add_argument("--merge", default=None,
                        help="Existing STATE.json to merge parsed results into")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    text = input_path.read_text(encoding="utf-8", errors="ignore")
    parsed = parse_history(text)

    if args.merge:
        merge_path = Path(args.merge)
        if merge_path.exists():
            with open(merge_path) as f:
                existing = json.load(f)
            result = merge_states(existing, parsed)
            print(f"{VISUAL_CUE} Merged into existing STATE.json")
        else:
            result = parsed
            print(f"{VISUAL_CUE} No existing state found — using parsed result")
    else:
        result = parsed

    output_path = Path(args.output) if args.output else Path(args.input).parent / "STATE.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"✅ Archive parsed → {output_path}")
    print(f"   Milestones  : {len(result['milestones'])}")
    print(f"   Pending     : {len(result['pending_tasks'])}")
    print(f"   Tombstones  : {len(result['logic_tombstones'])}")


if __name__ == "__main__":
    main()
