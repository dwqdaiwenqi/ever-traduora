#!/bin/sh

set -e

bin/install-deps.sh

# Cleanup
[ -e dist ] && rm -r dist

# Build webapp
cd webapp && pnpm build:prod

# Build api
cd ../api && pnpm build:prod
cp -r node_modules ../dist/
