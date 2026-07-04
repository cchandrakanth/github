#!/bin/bash
# Post-edit hook: validate that edited files don't contain common security
# issues, hardcoded secrets, or obvious spec drift.
# Runs after any file edit tool use.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | grep -o '"filePath"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"filePath"[[:space:]]*:[[:space:]]*"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Resolve project root from this script's location: <root>/hooks/scripts/post-edit-check.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/project-config.json"

# Restrict checks to source files declared in project-config.json (with safe fallback).
EXTENSIONS=""
if [ -f "$CONFIG_FILE" ] && command -v python3 &>/dev/null; then
  EXTENSIONS=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); exts=c.get('conventions',{}).get('fileExtensions',[]); print('|'.join(exts) if exts else '')" 2>/dev/null)
fi

if [ -n "$EXTENSIONS" ]; then
  echo "$FILE_PATH" | grep -qE "\.(${EXTENSIONS})$" || exit 0
else
  case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.rs) ;;
    *) exit 0 ;;
  esac
fi

[ -f "$FILE_PATH" ] || exit 0

WARNINGS=""

# --- Security anti-patterns -------------------------------------------------

if grep -qn 'eval(' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  eval() detected in $FILE_PATH — potential injection risk"
fi

if grep -qn 'dangerouslySetInnerHTML' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  dangerouslySetInnerHTML in $FILE_PATH — XSS risk, verify input is sanitized"
fi

if grep -qn '\.innerHTML[[:space:]]*=' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  innerHTML assignment in $FILE_PATH — XSS risk"
fi

if grep -qnE '\bexec\(|\bspawn\(|child_process' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  Process execution in $FILE_PATH — verify inputs are not user-controlled"
fi

# --- Hardcoded secret patterns ---------------------------------------------

if grep -qnE '(password|secret|api_key|apikey|token)[[:space:]]*=[[:space:]]*["\x27][^"\x27]{8,}' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  Possible hardcoded secret in $FILE_PATH — use environment variables"
fi

if grep -qnE 'AKIA[0-9A-Z]{16}' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  AWS Access Key ID detected in $FILE_PATH"
fi

if grep -qnE '(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  GitHub token detected in $FILE_PATH"
fi

if grep -qnE 'sk-[A-Za-z0-9]{20,}' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  OpenAI-style API key detected in $FILE_PATH"
fi

if grep -qn -- '-----BEGIN [A-Z ]*PRIVATE KEY-----' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  Private key material detected in $FILE_PATH"
fi

if grep -qnE 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' "$FILE_PATH" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️  JWT-shaped string detected in $FILE_PATH — verify it isn't a real token"
fi

# --- Spec drift check ------------------------------------------------------
# Best-effort: if no spec under specs/ mentions this file, nudge the agent.

SPECS_DIR=""
if [ -d "$ROOT_DIR/specs" ]; then SPECS_DIR="$ROOT_DIR/specs"; fi
if [ -z "$SPECS_DIR" ] && [ -d "$ROOT_DIR/../specs" ]; then SPECS_DIR="$(cd "$ROOT_DIR/../specs" && pwd)"; fi

if [ -n "$SPECS_DIR" ]; then
  REL_PATH="${FILE_PATH#$ROOT_DIR/}"
  BASENAME="$(basename "$FILE_PATH")"
  STEM="${BASENAME%.*}"

  case "$REL_PATH" in
    *test*|*spec*|*.test.*|*.spec.*|node_modules/*|dist/*|build/*) ;;
    *)
      if ! grep -rqlE "(${STEM}|${REL_PATH})" "$SPECS_DIR" 2>/dev/null; then
        WARNINGS="${WARNINGS}\n📋 No spec references $REL_PATH — consider creating/updating a spec under specs/"
      fi
      ;;
  esac
fi

if [ -n "$WARNINGS" ]; then
  ESCAPED=$(printf '%b' "$WARNINGS" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" 2>/dev/null)
  if [ -n "$ESCAPED" ]; then
    echo "{\"systemMessage\": ${ESCAPED}}"
  else
    echo "{\"systemMessage\": \"Standards check:${WARNINGS}\"}"
  fi
fi

exit 0
