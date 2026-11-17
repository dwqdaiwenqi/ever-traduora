#!/bin/sh

set -e

pnpm install
cd webapp && pnpm install
cd ../api && pnpm install
