#! /bin/bash

sh .devcontainer/post-create.sh
# python
(
  cd automation || return

  # shellcheck source=/dev/null
  . "$HOME/.local/bin/env" && uv sync
) &>.logs/automation_init.log &
wait
