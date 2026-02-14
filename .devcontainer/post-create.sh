#! /bin/bash

# Configure git to use GitHub CLI as credential helper
echo "Configuring git credentials..."
gh auth setup-git 2>/dev/null || echo "GitHub CLI not authenticated yet. Run 'gh auth login' after container starts."

# Configure git user if not already set (will use global git config from host if mounted)
if [ -z "$(git config --global user.name)" ]; then
  echo "Git user.name not set. You can configure it with:"
  echo "  git config --global user.name 'Your Name'"
  echo "  git config --global user.email 'your.email@example.com'"
fi

# Set SSH permissions if .ssh directory exists
if [ -d "$HOME/.ssh" ]; then
  chmod 700 "$HOME/.ssh" 2>/dev/null || true
  chmod 600 "$HOME/.ssh/"* 2>/dev/null || true
fi

# Configure git to use SSH instead of HTTPS for GitHub (optional)
# Uncomment the following lines if you prefer SSH over HTTPS
# git config --global url."git@github.com:".insteadOf "https://github.com/"