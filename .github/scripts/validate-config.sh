#!/bin/bash
# Standalone validator for project-config.json. Suitable for CI.
#
# Usage:
#   ./scripts/validate-config.sh [path/to/project-config.json]
#
# Exit codes:
#   0 = config is complete
#   1 = required fields missing or file invalid
#   2 = bad usage / dependencies missing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="${1:-$ROOT_DIR/project-config.json}"

if ! command -v python3 &>/dev/null; then
  echo "❌ python3 is required" >&2
  exit 2
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

python3 - "$CONFIG_FILE" <<'PY'
import json, sys

path = sys.argv[1]
try:
    cfg = json.load(open(path))
except Exception as e:
    print(f"❌ Failed to parse {path}: {e}")
    sys.exit(1)

def get(d, dotted):
    cur = d
    for part in dotted.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur

required = [
    "project.name",
    "project.description",
    "techStack.language",
    "github.repository",
    "github.projectNumber",
]
recommended = [
    "github.repositoryLabel",
    "conventions.fileExtensions",
    "testing.unitFramework",
    "hosting.platform",
]

missing = [k for k in required if not get(cfg, k)]
weak    = [k for k in recommended if not get(cfg, k)]

if missing:
    print("❌ Missing required fields:")
    for k in missing:
        print(f"   - {k}")
if weak:
    print("⚠️  Recommended fields not set:")
    for k in weak:
        print(f"   - {k}")

if not missing and not weak:
    print("✅ project-config.json is complete.")
elif not missing:
    print("✅ All required fields present.")

sys.exit(1 if missing else 0)
PY
