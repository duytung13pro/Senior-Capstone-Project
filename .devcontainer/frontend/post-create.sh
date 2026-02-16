#! /bin/bash

sh .devcontainer/post-create.sh

(
  cd frontend || return
  npm install --legacy-peer-deps
)
