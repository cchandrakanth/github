#!/bin/bash
# UserPromptSubmit hook: when the user prompt mentions fixing a bug, a flaky
# test, or a regression, remind the agent to consult the knowledge base first.
# Honors knowledgeBase.enabled in project-config.json.

INPUT=$(cat)

PROMPT=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null)
[ -z "$PROMPT" ] && exit 0

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/project-config.json"

ENABLED="true"
KB_ROOT="knowledge-base"
if [ -f "$CONFIG_FILE" ] && command -v python3 &>/dev/null; then
  ENABLED=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(str(c.get('knowledgeBase',{}).get('enabled',True)).lower())" 2>/dev/null)
  KB_ROOT=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('knowledgeBase',{}).get('rootPath','knowledge-base'))" 2>/dev/null)
fi

[ "$ENABLED" = "true" ] || exit 0

LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')
case "$LOWER" in
  *fix*|*bug*|*flaky*|*regression*|*broken*|*failing*|*error*|*crash*) ;;
  *) exit 0 ;;
esac

MSG="📚 Knowledge-base reminder: before diagnosing, search ${KB_ROOT}/fix-history/ and ${KB_ROOT}/automation-test-fixes/ for prior occurrences. Record any non-trivial fix afterward (project-config.json → knowledgeBase.rules)."

python3 -c "import json; print(json.dumps({'systemMessage': '$MSG'}))" 2>/dev/null || echo "{\"systemMessage\": \"$MSG\"}"
exit 0
