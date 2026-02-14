#! /bin/bash

sh .devcontainer/post-create.sh

# Set zsh as the default shell if not already set
if [ "$SHELL" != "$(which zsh)" ]; then
  echo "Setting zsh as default shell..."
  sudo chsh -s "$(which zsh)" "$(whoami)" 2>/dev/null || true
fi

# Create a basic .zshrc if it doesn't exist
if [ ! -f "$HOME/.zshrc" ]; then
  echo "Creating basic .zshrc..."
  cat > "$HOME/.zshrc" << 'EOF'
# Basic zsh configuration
autoload -Uz compinit
compinit

# History settings
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY

# Basic prompt
PROMPT='%F{green}%n@%m%f:%F{blue}%~%f$ '

# Aliases
alias ll='ls -lah'
alias la='ls -A'
alias l='ls -CF'
EOF
fi

(
  cd frontend || return
  npm install --legacy-peer-deps
)
