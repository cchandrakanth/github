#!/bin/bash
# Installer: copies this Gemini / Antigravity starter kit into a target project.
#
# Usage:
#   ./.gemini/scripts/install.sh <target-project-dir> [--force]
#
# Effects in the target project:
#   <target>/.gemini/            <- this kit (agents, commands, instructions, skills, scripts, README)
#   <target>/GEMINI.md           <- always-on workspace rule file at the PROJECT ROOT
#   <target>/project-config.json <- shared config, lives at the PROJECT ROOT (not inside .gemini/)
#   <target>/knowledge-base/     <- project-specific knowledge at the PROJECT ROOT (repo-knowledge, fix-history, automation-test-fixes)
#   <target>/specs/README.md     <- spec framework README (from .gemini/skills/spec-management/assets/)
#
# Existing files are NOT overwritten unless --force is passed.

set -euo pipefail

usage() {
  echo "Usage: $0 <target-project-dir> [--force]" >&2
  exit 2
}

[ $# -ge 1 ] || usage
TARGET="$1"
FORCE=0
if [ "${2:-}" = "--force" ]; then FORCE=1; fi

if [ ! -d "$TARGET" ]; then
  echo "❌ Target directory does not exist: $TARGET" >&2
  exit 1
fi

KIT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KIT_ROOT="$(cd "$KIT_DIR/.." && pwd)"   # repo root of the kit: holds GEMINI.md, project-config.json, and knowledge-base/
TARGET="$(cd "$TARGET" && pwd)"

if [ "$KIT_DIR" = "$TARGET" ] || [ "$KIT_ROOT" = "$TARGET" ]; then
  echo "❌ Target must be a different directory than the kit itself." >&2
  exit 1
fi

copy_tree() {
  local src="$1" dst="$2"
  if [ -e "$dst" ] && [ "$FORCE" -ne 1 ]; then
    echo "⏭  Skipping existing: $dst (use --force to overwrite)"
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  if [ "$FORCE" -eq 1 ] && [ -e "$dst" ]; then
    rm -rf "$dst"
  fi
  cp -R "$src" "$dst"
  echo "✅ Installed: $dst"
}

# 1. Copy kit -> <target>/.gemini
GEMINI_DST="$TARGET/.gemini"
if [ -e "$GEMINI_DST" ] && [ "$FORCE" -ne 1 ]; then
  echo "⏭  Skipping existing: $GEMINI_DST (use --force to overwrite)"
else
  [ "$FORCE" -eq 1 ] && [ -e "$GEMINI_DST" ] && rm -rf "$GEMINI_DST"
  mkdir -p "$GEMINI_DST"
  (cd "$KIT_DIR" && find . -mindepth 1 -maxdepth 1 \
    ! -name knowledge-base \
    ! -name '.git' \
    ! -name '.gitignore' \
    ! -name '.DS_Store' \
    ! -name 'node_modules' \
    -exec cp -R {} "$GEMINI_DST"/ \;)
  find "$GEMINI_DST" -name '.DS_Store' -delete 2>/dev/null || true
  echo "✅ Installed: $GEMINI_DST"
fi

# 2. Copy GEMINI.md -> <target>/GEMINI.md (project root, auto-loaded by Antigravity)
if [ -f "$KIT_ROOT/GEMINI.md" ]; then
  copy_tree "$KIT_ROOT/GEMINI.md" "$TARGET/GEMINI.md"
else
  echo "⚠️  GEMINI.md not found at kit root: $KIT_ROOT" >&2
fi

# 3. Copy project-config.json -> <target>/project-config.json (project root)
if [ -f "$KIT_ROOT/project-config.json" ]; then
  copy_tree "$KIT_ROOT/project-config.json" "$TARGET/project-config.json"
else
  echo "⚠️  project-config.json not found at kit root: $KIT_ROOT" >&2
fi

# 4. Copy knowledge-base -> <target>/knowledge-base (project root)
if [ -d "$KIT_ROOT/knowledge-base" ]; then
  copy_tree "$KIT_ROOT/knowledge-base" "$TARGET/knowledge-base"
  find "$TARGET/knowledge-base" -name '.DS_Store' -delete 2>/dev/null || true
else
  echo "⚠️  knowledge-base/ not found at kit root: $KIT_ROOT" >&2
fi

# 5. Scaffold <target>/specs from the spec-management skill's README template
copy_tree "$KIT_DIR/skills/spec-management/assets/specs-readme.template.md" "$TARGET/specs/README.md"

# 6. Make helper scripts executable in the destination
if [ -d "$GEMINI_DST/scripts" ]; then
  chmod +x "$GEMINI_DST"/scripts/*.sh 2>/dev/null || true
fi
if [ -d "$GEMINI_DST/skills/spec-management/scripts" ]; then
  chmod +x "$GEMINI_DST"/skills/spec-management/scripts/*.sh 2>/dev/null || true
fi

cat <<EOF

🎉 Gemini / Antigravity Kit installed into: $TARGET

Next steps:
  1. Configure the GitHub MCP server in ~/.gemini/config/mcp_config.json (using $GEMINI_DST/mcp_config.json.example).
  2. Open the project in Google Antigravity and run: /onboard (or @onboard)
     (or edit $TARGET/project-config.json directly)
  3. Validate config any time:
     $GEMINI_DST/scripts/validate-config.sh

EOF
