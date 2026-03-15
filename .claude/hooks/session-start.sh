#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

GSTACK_DIR="$CLAUDE_PROJECT_DIR/.claude/skills/gstack"

# Run gstack setup if it exists
if [ -f "$GSTACK_DIR/setup" ]; then
  cd "$GSTACK_DIR"
  ./setup
fi
