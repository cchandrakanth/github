#!/bin/bash
# Spec status management script
# Usage: ./scripts/spec-status.sh [list|get|set] [spec-name] [new-status]

set -e

SPECS_DIR="specs"

case "${1:-list}" in
  list)
    echo "## All Specs"
    echo ""
    if [ -d "$SPECS_DIR" ]; then
      for spec_dir in "$SPECS_DIR"/*/; do
        [ -d "$spec_dir" ] || continue
        name=$(basename "$spec_dir")
        [ "$name" = "templates" ] && continue
        [ "$name" = ".gitkeep" ] && continue
        spec_file="$spec_dir/spec.md"
        if [ -f "$spec_file" ]; then
          status=$(grep -m1 '^\| \*\*Status\*\*' "$spec_file" | sed 's/.*| //;s/ |$//' | tr -d '[:space:]')
          if [ -z "$status" ]; then
            status=$(grep -m1 'Status.*|' "$spec_file" | grep -oE 'draft|review|approved|in-progress|implemented|verified|completed|disabled' | head -1)
          fi
          echo "- **$name**: ${status:-unknown}"
        else
          echo "- **$name**: ⚠ missing spec.md"
        fi
      done
    else
      echo "No specs directory found."
    fi
    ;;

  get)
    if [ -z "$2" ]; then
      echo "Usage: $0 get <spec-name>"
      exit 1
    fi
    spec_file="$SPECS_DIR/$2/spec.md"
    if [ ! -f "$spec_file" ]; then
      echo "Spec not found: $2"
      exit 1
    fi
    grep -oE 'draft|review|approved|in-progress|implemented|verified|completed|disabled' "$spec_file" | head -1
    ;;

  set)
    if [ -z "$2" ] || [ -z "$3" ]; then
      echo "Usage: $0 set <spec-name> <new-status>"
      exit 1
    fi
    VALID_STATUSES="draft review approved in-progress implemented verified completed disabled"
    if ! echo "$VALID_STATUSES" | grep -qw "$3"; then
      echo "Invalid status: $3"
      echo "Valid: $VALID_STATUSES"
      exit 1
    fi
    spec_file="$SPECS_DIR/$2/spec.md"
    if [ ! -f "$spec_file" ]; then
      echo "Spec not found: $2"
      exit 1
    fi
    # Update the status in the metadata table
    sed -i '' "s/| \*\*Status\*\* | [a-z-]* |/| **Status** | $3 |/" "$spec_file"
    # Also update the Updated date
    TODAY=$(date '+%Y-%m-%d')
    sed -i '' "s/| \*\*Updated\*\* | [0-9-]* |/| **Updated** | $TODAY |/" "$spec_file"
    echo "Updated $2 status to: $3"
    ;;

  *)
    echo "Usage: $0 [list|get|set] [spec-name] [new-status]"
    exit 1
    ;;
esac
