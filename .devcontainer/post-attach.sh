#! /bin/bash

# to add WSL's launch changes:
# - git update-index --no-skip-worktree .vscode/launch.json
# - git add .vscode/launch.json
# - git update-index --skip-worktree .vscode/launch.json
git update-index --skip-worktree .vscode/launch.json

# to add WSL's settings changes:
# - git update-index --no-skip-worktree .vscode/settings.json
# - git add .vscode/settings.json
# - git update-index --skip-worktree .vscode/settings.json
git update-index --skip-worktree .vscode/settings.json

# to add WSL's tasks changes:
# - git update-index --no-skip-worktree .vscode/tasks.json
# - git add .vscode/tasks.json
# - git update-index --skip-worktree .vscode/tasks.json
git update-index --skip-worktree .vscode/tasks.json
