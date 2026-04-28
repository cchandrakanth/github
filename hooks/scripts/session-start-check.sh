#!/bin/bash
# SessionStart hook: warn when project-config.json is missing required values
# so agents and prompts that read it don't silently produce wrong output.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/project-config.json"

[ -f "$CONFIG_FILE" ] || exit 0
command -v python3 &>/dev/null || exit 0

MISSING=$(python3 <<PY 2>/dev/null
import json
try:
    c = json.load(open("$CONFIG_FILE"))
except Exception:
    print("project-config.json could not be parsed")
    raise SystemExit
required = [
    ("project.name", c.get("project",{}).get("name")),
    ("project.description", c.get("project",{}).get("description")),
    ("techStack.language", c.get("techStack",{}).get("language")),
    ("github.repository", c.get("github",{}).get("repository")),
    ("github.projectNumber", c.get("github",{}).get("projectNumber")),
]
missing = [k for k, v in required if not v]
if missing:
    print(", ".join(missing))
PY
)

[ -z "$MISSING" ] && exit 0

MSG="⚙️  project-config.json is missing required values: ${MISSING}. Run @onboard or edit the file before delegating to spec/coder/github-sync agents."
python3 -c "import json; print(json.dumps({'systemMessage': '$MSG'}))" 2>/dev/null || echo "{\"systemMessage\": \"$MSG\"}"
exit 0
