#! /bin/bash

sudo chown -R 1000:1000 .
docker compose up --build backend-test
if [ "$(docker wait little-backend-test-1)" == "0" ]; then
  exit 0
else
  exit 1
fi
