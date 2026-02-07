#! /bin/bash

sh .devcontainer/post-create.sh

# Copy the default configuration file to the backend resources directory
cp .devcontainer/backend/little-config.secret.yml.default backend/src/main/resources/little-config.secret.yml
