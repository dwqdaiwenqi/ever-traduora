#!/bin/sh

set -e

cd api && pnpm test:ci
