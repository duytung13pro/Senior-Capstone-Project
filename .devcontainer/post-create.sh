#! /bin/bash

# Configure git to use GitHub CLI as credential helper
echo "Configuring git credentials..."
gh auth setup-git 2>/dev/null || echo "GitHub CLI not authenticated yet. Run 'gh auth login' after container starts."

# Configure git user if not already set (will use global git config from host if mounted)
if [ -z "$(git config --global user.name)" ]; then
  # Try to use environment variables if set, else show instructions
  if [ -n "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
    echo "✓ Git user.name set to: $GIT_USER_NAME"
  else
    echo "Git user.name not set. You can configure it with:"
    echo "  git config --global user.name 'Your Name'"
    echo "  git config --global user.email 'your.email@example.com'"
    echo ""
    echo "Or set environment variables before running container:"
    echo "  export GIT_USER_NAME='Your Name'"
    echo "  export GIT_USER_EMAIL='your.email@example.com'"
  fi
fi

if [ -z "$(git config --global user.email)" ] && [ -n "$GIT_USER_EMAIL" ]; then
  git config --global user.email "$GIT_USER_EMAIL"
  echo "✓ Git user.email set to: $GIT_USER_EMAIL"
fi

# Set SSH permissions if .ssh directory exists
if [ -d "$HOME/.ssh" ]; then
  chmod 700 "$HOME/.ssh" 2>/dev/null || true
  chmod 600 "$HOME/.ssh/"* 2>/dev/null || true
  echo "✓ SSH permissions configured"
fi

# Configure git to use SSH instead of HTTPS for GitHub (optional)
# Uncomment the following lines if you prefer SSH over HTTPS
# git config --global url."git@github.com:".insteadOf "https://github.com/"
