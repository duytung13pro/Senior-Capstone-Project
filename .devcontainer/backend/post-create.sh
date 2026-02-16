#! /bin/bash

sh .devcontainer/post-create.sh

# Copy the default configuration file to the backend resources directory
cp .devcontainer/backend/senior-config.secret.yml.default backend/src/main/resources/senior-config.secret.yml
