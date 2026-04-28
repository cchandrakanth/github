#!/bin/bash
# Installer: copies this Copilot starter kit into a target project.
#
# Usage:
#   ./setup/install.sh <target-project-dir> [--force]
#
# Effects in the target project:
#   <target>/.github/         <- this kit (agents, instructions, prompts, skills, hooks, knowledge-base, project-config.json, README)
#   <target>/specs/           <- spec framework + templates (from specs-starter/)
#   <target>/.vscode/mcp.json <- GitHub MCP server config (from setup/mcp.json)
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
TARGET="$(cd "$TARGET" && pwd)"

if [ "$KIT_DIR" = "$TARGET" ]; then
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

# 1. Copy kit -> <target>/.github (excluding specs-starter/ which goes elsewhere)
GITHUB_DST="$TARGET/.github"
if [ -e "$GITHUB_DST" ] && [ "$FORCE" -ne 1 ]; then
  echo "⏭  Skipping existing: $GITHUB_DST (use --force to overwrite)"
else
  [ "$FORCE" -eq 1 ] && [ -e "$GITHUB_DST" ] && rm -rf "$GITHUB_DST"
  mkdir -p "$GITHUB_DST"
  # Copy everything except specs-starter, VCS metadata, and OS junk
  (cd "$KIT_DIR" && find . -mindepth 1 -maxdepth 1 \
    ! -name specs-starter \
    ! -name '.git' \
    ! -name '.gitignore' \
    ! -name '.DS_Store' \
    ! -name 'node_modules' \
    -exec cp -R {} "$GITHUB_DST"/ \;)
  # Strip any nested .DS_Store files that snuck in
  find "$GITHUB_DST" -name '.DS_Store' -delete 2>/dev/null || true
  echo "✅ Installed: $GITHUB_DST"
fi

# 2. Copy specs-starter -> <target>/specs
copy_tree "$KIT_DIR/specs-starter" "$TARGET/specs"
find "$TARGET/specs" -name '.DS_Store' -delete 2>/dev/null || true

# 3. Copy MCP config -> <target>/.vscode/mcp.json
copy_tree "$KIT_DIR/setup/mcp.json" "$TARGET/.vscode/mcp.json"

# 4. Make hook scripts executable in the destination
if [ -d "$GITHUB_DST/hooks/scripts" ]; then
  chmod +x "$GITHUB_DST"/hooks/scripts/*.sh 2>/dev/null || true
fi
if [ -d "$GITHUB_DST/skills/spec-management/scripts" ]; then
  chmod +x "$GITHUB_DST"/skills/spec-management/scripts/*.sh 2>/dev/null || true
fi

cat <<EOF

🎉 Kit installed into: $TARGET

Next steps:
  1. Create a GitHub PAT (repo, project, read:org) — VS Code will prompt on first MCP use.
  2. Open the project in VS Code and run: @onboard
     (or edit $GITHUB_DST/project-config.json directly)
  3. Validate config any time:
     $GITHUB_DST/scripts/validate-config.sh

EOF
