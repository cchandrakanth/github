#!/bin/bash
# Installer: copies this Copilot starter kit into a target project.
#
# Usage:
#   ./scripts/install.sh <target-project-dir> [--force]
#
# Effects in the target project:
#   <target>/.github/            <- this kit (agents, instructions, prompts, skills, README)
#   <target>/project-config.json <- shared config, lives at the PROJECT ROOT (not inside .github/)
#   <target>/knowledge-base/     <- project-specific knowledge at the PROJECT ROOT (repo-knowledge, fix-history, automation-test-fixes)
#   <target>/specs/              <- spec framework README (from skills/spec-management/assets/)
#   <target>/.vscode/mcp.json    <- GitHub MCP server config (from mcp.json.example)
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
KIT_ROOT="$(cd "$KIT_DIR/.." && pwd)"   # repo root of the kit: holds project-config.json and knowledge-base/
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

# 1. Copy kit -> <target>/.github
GITHUB_DST="$TARGET/.github"
if [ -e "$GITHUB_DST" ] && [ "$FORCE" -ne 1 ]; then
  echo "⏭  Skipping existing: $GITHUB_DST (use --force to overwrite)"
else
  [ "$FORCE" -eq 1 ] && [ -e "$GITHUB_DST" ] && rm -rf "$GITHUB_DST"
  mkdir -p "$GITHUB_DST"
  # Copy everything except knowledge-base, VCS metadata, and OS junk
  (cd "$KIT_DIR" && find . -mindepth 1 -maxdepth 1 \
    ! -name knowledge-base \
    ! -name '.git' \
    ! -name '.gitignore' \
    ! -name '.DS_Store' \
    ! -name 'node_modules' \
    -exec cp -R {} "$GITHUB_DST"/ \;)
  # Strip any nested .DS_Store files that snuck in
  find "$GITHUB_DST" -name '.DS_Store' -delete 2>/dev/null || true
  echo "✅ Installed: $GITHUB_DST"
fi

# 2. Copy project-config.json -> <target>/project-config.json (project root, not inside .github)
if [ -f "$KIT_ROOT/project-config.json" ]; then
  copy_tree "$KIT_ROOT/project-config.json" "$TARGET/project-config.json"
else
  echo "⚠️  project-config.json not found at kit root: $KIT_ROOT" >&2
fi

# 3. Copy knowledge-base -> <target>/knowledge-base (project root, not inside .github)
if [ -d "$KIT_ROOT/knowledge-base" ]; then
  copy_tree "$KIT_ROOT/knowledge-base" "$TARGET/knowledge-base"
  find "$TARGET/knowledge-base" -name '.DS_Store' -delete 2>/dev/null || true
else
  echo "⚠️  knowledge-base/ not found at kit root: $KIT_ROOT" >&2
fi

# 4. Scaffold <target>/specs from the spec-management skill's README template
# (the 4 spec-file templates stay in the skill's assets/ — they are not copied into specs/)
copy_tree "$KIT_DIR/skills/spec-management/assets/specs-readme.template.md" "$TARGET/specs/README.md"

# 5. Copy MCP config -> <target>/.vscode/mcp.json
copy_tree "$KIT_DIR/mcp.json.example" "$TARGET/.vscode/mcp.json"

# 6. Make helper scripts executable in the destination
if [ -d "$GITHUB_DST/scripts" ]; then
  chmod +x "$GITHUB_DST"/scripts/*.sh 2>/dev/null || true
fi
if [ -d "$GITHUB_DST/skills/spec-management/scripts" ]; then
  chmod +x "$GITHUB_DST"/skills/spec-management/scripts/*.sh 2>/dev/null || true
fi

cat <<EOF

🎉 Kit installed into: $TARGET

Next steps:
  1. Create a GitHub PAT (repo, project, read:org) — VS Code will prompt on first MCP use.
  2. Open the project in VS Code and run: @onboard
     (or edit $TARGET/project-config.json directly)
  3. Validate config any time:
     $GITHUB_DST/scripts/validate-config.sh

EOF
