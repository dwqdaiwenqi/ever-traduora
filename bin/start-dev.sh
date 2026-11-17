#!/bin/sh

set -e

bin/install-deps.sh

pnpm exec concurrently "cd api && pnpm start" "cd webapp && pnpm start"
