#!/usr/bin/env bash
set -euo pipefail

# Claude Code Testing Environment - Install Script

NVM_VERSION="v0.40.4"
NODE_VERSION="24"
CLAUDE_AI_INSTALL_URL="https://claude.ai/install.sh"

echo "Setting up Claude Code Testing Environment..."

# Install nvm
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing nvm ${NVM_VERSION}..."
  curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
fi

# Load nvm
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
\. "$NVM_DIR/nvm.sh"

# Install Node.js
echo "Installing Node.js ${NODE_VERSION}..."
nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install Claude Code CLI
if ! command -v claude &>/dev/null; then
  echo "Installing Claude Code..."
  curl -fsSL "$CLAUDE_AI_INSTALL_URL" | bash
else
  echo "Claude Code already installed: $(claude --version 2>/dev/null || true)"
fi

echo "Done. Run 'claude' to get started."
