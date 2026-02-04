#! /bin/bash

# Prevent running this script from inside the container itself
if [ -z "$USER" ]; then
  printf "You should not run this script inside a devcontainer! Bye bye!\n"
  exit
fi

exe_aloud() {
  echo "\$ $*"
  "$@"
}

print_help() {
  printf "Usage: ./ops.sh <command> [<environment> [<service>]]\n"
  printf "  - commands: up | start, stop, down, build | prebuild, rebuild | test, clean, init\n"
  printf "  - environments (omit: all):\n"
  printf "    + prod | production\n"
  printf "    + code | vscode <service>\n"
  printf "  - services:\n"
  printf "    + ai | aiservice\n"
  printf "    + be | backend\n"
  printf "    + fe | frontend\n"
  printf "    + at | automation\n"
  printf "    + ex | example\n"
}

print_vscode() {
  printf "\n"
  printf "Because VS Code CLI for devcontainer is not refined, we cannot\n"
  printf "  launch you directly into devcontainer.\n"
  printf "We just have built the containers and set-up the general\n"
  printf "  development environment for you.\n"
  
  if [ "$TERM_PROGRAM" == "vscode" ]; then
    printf "Look like you're already in VS Code,\n"
    printf "  Hit [Ctrl + Shift + P]\n"
    printf "  Select \"Dev Containers: Reopen in Container\"\n"
    printf "  Then select '%s'.\n" "$CONTEXT"
    exit
  else
    printf "We will launch VS Code inside WSL for you, once you're there,\n"
    printf "  Hit [Ctrl + Shift + P]\n"
    printf "  Select \"Dev Containers: Reopen in Container\"\n"
    printf "  Then select '%s'.\n" "$CONTEXT"
    read -r -p "Press [Enter] to continue or [Ctrl + C] to start later... "
  fi
}

initialize() {
  cp .devcontainer/pre-commit .git/hooks/pre-commit
  git config --local core.autocrlf false
  # Default to standard vim for git operations
  git config --local core.editor "vim"
}

build_containers() {
  initialize
  printf 'Building containers...\n'
  exe_aloud docker compose --progress plain build --parallel "${SERVICES[@]}" \
    &>.logs/compose_build.log &&
    exe_aloud docker compose up -d --remove-orphans "${SERVICES[@]}" \
      &>>.logs/compose_build.log
  if [ $? != 0 ]; then
    printf "Building containers failed!\n"
    exe_aloud less .logs/compose_build.log
    exit
  fi
  printf "Building containers done!\n"
}

post_create() {
  context="$1"
  service="$context-dev"
  # Updated prefix to match your Senior Project naming convention
  container="senior-$service-1"
  printf "Running post-create script for %s...\n" "$service"
  if ! exe_aloud docker exec \
    --workdir /workspaces/senior-project \
    "$container" \
    sh -c ".devcontainer/$context/post-create.sh; exit \$?" \
    &>".logs/post_create_$service.log"; then
    printf "Warning: post-create script for %s failed! For more info:\n" "$service"
    printf "  less .logs/post_create_%s.log\n" "$service"
  else
    printf "Running post-create script for %s done!\n" "$service"
  fi
}

post_attach() {
  context="$1"
  service="$context-dev"
  container="senior-$service-1"
  printf "Running post-attach script for %s...\n" "$service"
  if ! exe_aloud docker exec \
    --workdir /workspaces/senior-project \
    "$container" \
    sh -c ".devcontainer/$context/post-attach.sh; exit \$?" \
    &>".logs/post_attach_$service.log"; then
    printf "Warning: post-attach script for %s failed! For more info:\n" "$service"
    printf "  less .logs/post_attach_%s.log\n" "$service"
  else
    printf "Running post-attach script for %s done!\n" "$service"
  fi
}

init_container() {
  context="$1"
  service="$context-dev"

  printf "Initiating %s...\n" "$service"
  post_create "$context"
  post_attach "$context"
}

clean() {
  sudo true
  git clean -n -d -x -e ".db-*" -e ".logs/*" -e ".zsh_history"
  printf "CAUTION: This action is destructive!\n"
  read -r -p "Are you sure you want to delete all files listed above? [y/N] " \
    response
  if [[ "$response" =~ ^[yY]$ ]]; then
    printf "Bringing down containers...\n"
    docker compose down 2>&1 | tee .logs/compose_down.log | true
    printf "Cleaning...\n"
    sudo git clean -f -d -x -e ".db-*" -e ".logs/*" -e ".zsh_history"
  else
    printf "Cleaning aborted!\n"
    exit 1
  fi
}

rebuild() {
  clean
  initialize

  printf 'Testing...\n'
  docker compose build --parallel "${SERVICES[@]}" &&
    docker compose up -d --remove-orphans "${SERVICES[@]}" &&
    if [ $? != 0 ]; then
      printf "Testing... Failed. You suck!\n"
      exit 1
    else
      printf "Testing... Done. You're awesome!\n"
      exit 0
    fi
}

# --- Service Selection Logic ---
case $2 in
code | vscode)
  case $3 in
  ai | aiservice)
    CONTEXT='ai'
    ;;
  be | backend)
    CONTEXT='backend'
    ;;
  fe | frontend)
    CONTEXT='frontend'
    ;;
  at | automation)
    CONTEXT='automation'
    ;;
  ex | example)
    CONTEXT='example'
    ;;
  *)
    print_help
    exit
    ;;
  esac
  declare -a SERVICES="$CONTEXT-dev"
  declare -a CONTAINERS="senior-${SERVICES[0]}-1"
  ;;
prod | production)
  # Launches all core services: Frontend (unified), Backend, and AI
  declare -a SERVICES=(
    "frontend"
    "backend"
    "ai"
  )
  declare -a CONTAINERS=(
    "senior-frontend-1"
    "senior-backend-1"
    "senior-ai-1"
  )
  ;;
*)
  declare -a SERVICES=()
  declare -a CONTAINERS=()
  ;;
esac

# --- Command Execution Logic ---
case $1 in
up | start)
  build_containers
  case $2 in
  code | vscode)
    init_container "$CONTEXT"
    print_vscode
    code .
    ;;
  prod | production) ;;
  *)
    # Automatically initializes all core dev services
    for context in 'ai' 'backend' 'frontend' 'automation'; do
      init_container "$context" &
    done
    wait
    ;;
  esac
  ;;
stop)
  exe_aloud docker compose stop "${SERVICES[@]}"
  ;;
down)
  exe_aloud docker compose down "${SERVICES[@]}"
  ;;
build | prebuild)
  build_containers
  ;;
rebuild | test)
  rebuild
  ;;
clean)
  clean
  ;;
init)
  initialize
  ;;
*)
  print_help
  exit
  ;;
esac