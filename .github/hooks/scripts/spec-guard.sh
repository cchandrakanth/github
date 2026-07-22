#!/bin/bash
# PostToolUse hook: guard the AC Checkbox Policy on spec.md edits.
#
# Policy: AC checkboxes track IMPLEMENTATION, not test results.
#   - Coder checks `- [ ]` -> `- [x]` as soon as the AC's code is implemented
#   - status: implemented (and beyond) requires every AC checkbox to be [x]
#   - draft/review/approved specs must have no checked ACs
#   - QA/test/review agents never modify checkboxes; tests gate implemented -> verified

INPUT=$(cat)

# Accept both filePath (Copilot) and file_path (Claude Code) tool-input keys.
FILE_PATH=$(echo "$INPUT" | grep -oE '"(filePath|file_path)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/"(filePath|file_path)"[[:space:]]*:[[:space:]]*"//;s/"$//')

[ -z "$FILE_PATH" ] && exit 0

# Only guard spec.md files under a specs/ directory.
case "$FILE_PATH" in
  */specs/*/spec.md|specs/*/spec.md) ;;
  *) exit 0 ;;
esac

[ -f "$FILE_PATH" ] || exit 0

STATUS=$(grep -m1 -E '^status:' "$FILE_PATH" | sed -E 's/^status:[[:space:]]*//;s/[[:space:]]*$//')
[ -z "$STATUS" ] && exit 0

UNCHECKED=$(grep -cE '^[[:space:]]*- \[ \] \*{0,2}AC-' "$FILE_PATH" 2>/dev/null || true)
CHECKED=$(grep -cE '^[[:space:]]*- \[[xX]\] \*{0,2}AC-' "$FILE_PATH" 2>/dev/null || true)
UNCHECKED=${UNCHECKED:-0}
CHECKED=${CHECKED:-0}

WARNINGS=""

case "$STATUS" in
  implemented|verified|completed)
    if [ "$UNCHECKED" -gt 0 ]; then
      WARNINGS="${WARNINGS}\n🚧 spec-guard: $FILE_PATH is \`status: $STATUS\` but has $UNCHECKED unchecked AC checkbox(es). ACs must be checked (\`- [x]\`) at implementation time — a spec cannot be \`implemented\` (or beyond) with unchecked ACs. Either the implementation is incomplete (revert status to in-progress) or the Coder forgot to check the boxes when the code was written."
    fi
    ;;
  draft|review|approved)
    if [ "$CHECKED" -gt 0 ]; then
      WARNINGS="${WARNINGS}\n🚧 spec-guard: $FILE_PATH is \`status: $STATUS\` but already has $CHECKED checked AC checkbox(es). Boxes are checked only when the implementing code is written (status in-progress or later) — uncheck them or fix the status."
    fi
    ;;
esac

if [ -n "$WARNINGS" ]; then
  WARNINGS="${WARNINGS}\n📌 Policy: AC checkboxes track implementation (Coder-owned, checked when code lands — never gated on tests). Tests gate the implemented → verified status transition only. QA/review agents must not modify checkboxes."
  ESCAPED=$(printf '%b' "$WARNINGS" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null)
  if [ -n "$ESCAPED" ]; then
    echo "{\"systemMessage\": ${ESCAPED}}"
  fi
fi

exit 0
