#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:-admin}"
MONGO_DB="${MONGO_DB:-senior_database}"
AUTH_SOURCE="${AUTH_SOURCE:-admin}"

TARGETS=("localhost" "mongo" "host.docker.internal")

if [[ $# -gt 0 ]]; then
  TARGETS+=("$1")
fi

echo "MongoDB reachability diagnostic"
echo "Workspace: ${ROOT_DIR}"
echo "Port: ${MONGO_PORT}"
echo

python3 - "${MONGO_PORT}" "${TARGETS[@]}" <<'PY'
import socket
import sys

port = int(sys.argv[1])
targets = sys.argv[2:]

seen = set()
ordered = []
for target in targets:
    if target and target not in seen:
        seen.add(target)
        ordered.append(target)

print("Connectivity checks (TCP):")
results = []
for host in ordered:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2.5)
    status = "UNREACHABLE"
    detail = ""
    try:
        sock.connect((host, port))
        status = "OPEN"
        detail = "reachable"
    except Exception as exc:
        detail = f"{type(exc).__name__}: {exc}"
    finally:
        sock.close()

    results.append((host, status, detail))
    print(f"- {host}:{port:<5} -> {status:11} ({detail})")

print("\nReachable targets:")
open_hosts = [host for host, status, _ in results if status == "OPEN"]
if open_hosts:
    for host in open_hosts:
        print(f"- {host}")
else:
    print("- none")
PY

echo
HOST_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}/${MONGO_DB}?authSource=${AUTH_SOURCE}&directConnection=true"
DOCKER_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongo:${MONGO_PORT}/${MONGO_DB}?authSource=${AUTH_SOURCE}"
HOST_FROM_CONTAINER_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@host.docker.internal:${MONGO_PORT}/${MONGO_DB}?authSource=${AUTH_SOURCE}&directConnection=true"

echo "Recommended connection strings:"
echo "- Host tools (Compass on your machine):"
echo "  ${HOST_URI}"
echo "- Docker/devcontainer services (Mongo is a compose service named 'mongo'):"
echo "  ${DOCKER_URI}"
echo "- Docker/devcontainer services (MongoDB installed on host machine):"
echo "  ${HOST_FROM_CONTAINER_URI}"
echo

echo "Tip: if host URI fails with ConnectionRefused, start MongoDB on your laptop host."
echo "     If using Docker Mongo instead, start it with: docker compose up -d mongo"


# ./scripts/check_mongo_reachability.sh