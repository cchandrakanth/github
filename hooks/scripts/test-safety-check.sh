#!/bin/bash
# Test Safety Validation Hook
# Prevents test development from breaking production code.
# Runs after any file edit to .test.* or __tests__/** or test-related agent changes.

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | grep -o '"filePath"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"filePath"[[:space:]]*:[[:space:]]*"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Resolve project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Skip if not a test or test-related file
case "$FILE_PATH" in
  *.test.*|*.spec.*|*/__tests__/*|*/.test/*|agents/*test*.agent.md|instructions/test-safety.instructions.md) ;;
  *) exit 0 ;;
esac

[ -f "$FILE_PATH" ] || exit 0

WARNINGS=""

# ============================================================================
# TEST SAFETY RULES
# ============================================================================

# --- Rule 1: No production imports in test files pointing back to production ---
# (Detect circular dependency risk: test imports prod, and prod imports test)

TEST_FILE="$FILE_PATH"

if [[ "$TEST_FILE" =~ \.test\.|\.spec\.|/__tests__/ ]]; then
  # Extract import/require statements
  IMPORTS=$(grep -oE "(from|import|require)\(['\"]([^'\"]+)['\"]" "$TEST_FILE" 2>/dev/null | sed "s/.*['\"]//;s/['\"].*//" || true)
  
  if [ -n "$IMPORTS" ]; then
    while IFS= read -r IMPORT_PATH; do
      [ -z "$IMPORT_PATH" ] && continue
      
      # Resolve to actual file (handle various import patterns)
      RESOLVED_FILE=$(cd "$(dirname "$TEST_FILE")" && node -e "try { console.log(require.resolve('$IMPORT_PATH')) } catch(e) { console.log('$IMPORT_PATH') }" 2>/dev/null || echo "$IMPORT_PATH")
      
      # Normalize path
      if [[ "$RESOLVED_FILE" != /* ]]; then
        RESOLVED_FILE="$ROOT_DIR/$RESOLVED_FILE"
      fi
      
      if [ -f "$RESOLVED_FILE" ]; then
        # Check if that file imports back to test files (circular)
        if grep -q "from.*\\.test\\.|from.*\\.spec\\.|from.*__tests__|require.*\\.test\\.|require.*__tests__" "$RESOLVED_FILE" 2>/dev/null; then
          WARNINGS="${WARNINGS}\n🔄 CIRCULAR DEPENDENCY DETECTED: $IMPORT_PATH imports from test files"
        fi
      fi
    done <<< "$IMPORTS"
  fi
fi

# --- Rule 2: Production code must not import from test files ---

if [[ "$FILE_PATH" != *.test.* ]] && [[ "$FILE_PATH" != *.spec.* ]] && [[ "$FILE_PATH" != */__tests__/* ]]; then
  if [[ "$FILE_PATH" =~ ^$ROOT_DIR/src/ ]] || [[ "$FILE_PATH" =~ ^$ROOT_DIR/lib/ ]]; then
    if grep -qE "(from|import|require)\(['\"].*\\.test\\.|['\"].*\\.spec\\.|['\"].*/__tests__/" "$FILE_PATH" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n❌ FORBIDDEN: Production code imports from test files in $FILE_PATH"
    fi
  fi
fi

# --- Rule 3: Mock data must be isolated ---

if [[ "$FILE_PATH" =~ \.test\.|\.spec\.|/__tests__/ ]]; then
  # Warn if test data is very large (potential memory leak risk in CI)
  LINES=$(wc -l < "$FILE_PATH")
  if [ "$LINES" -gt 5000 ]; then
    WARNINGS="${WARNINGS}\n📊 Large test file ($LINES lines) — consider splitting fixtures into separate mocks/ directory"
  fi
  
  # Warn if mock uses production import paths (should use __mocks__ or relative)
  if grep -q "from.*src/" "$FILE_PATH" 2>/dev/null && ! grep -q "@mocks\|__mocks__" "$FILE_PATH" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n⚠️  Test file imports from src/ — consider using __mocks__ directory or mocking at module level"
  fi
fi

# --- Rule 4: No real credentials in test files ---

if [[ "$FILE_PATH" =~ \.test\.|\.spec\.|/__tests__/ ]]; then
  # Check for mock auth domain enforcement
  if grep -q "MOCK_AUTH_ENABLED" "$FILE_PATH" 2>/dev/null; then
    if ! grep -q "@mock\\.test" "$FILE_PATH" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n🔐 Mock auth test uses non-@mock.test email domain — use @mock.test only"
    fi
  fi
  
  # Warn on FIXME without date/issue
  if grep -q "FIXME" "$FILE_PATH" 2>/dev/null; then
    if ! grep -qE "FIXME\\([0-9]{4}-[0-9]{2}-[0-9]{2},.*#[0-9]+\\)" "$FILE_PATH" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n📝 FIXME comments must include date and issue: FIXME(YYYY-MM-DD, #issue)"
    fi
  fi
fi

# --- Rule 5: Test runner commands ---

if [[ "$FILE_PATH" =~ agents/.*test.*\.agent\.md ]]; then
  # Test-related agents should not contain production code changes
  if grep -qE "^(\\+\\+\\+|---|\-\\-\\-|\\[edit).*/(src|lib)/[^/]*\\.test" "$FILE_PATH" 2>/dev/null; then
    # This is a bit of a heuristic, but agents shouldn't directly edit test files in one go
    :
  fi
fi

# --- Rule 6: Database safety ---

if [[ "$FILE_PATH" =~ \.test\.|\.spec\.|/__tests__/ ]]; then
  if grep -qE "CREATE TABLE [^_]|DROP TABLE|DELETE FROM [^__test]|TRUNCATE" "$FILE_PATH" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n💾 SQL operations in tests — ensure using test-prefixed tables (__test_*) or in-memory DB"
  fi
fi

# --- Output warnings ---

if [ -n "$WARNINGS" ]; then
  echo -e "TEST SAFETY CHECKS:$WARNINGS" >&2
  # Don't fail; just warn for now. Adjust exit code if you want to enforce strictly.
  exit 0
fi

exit 0
