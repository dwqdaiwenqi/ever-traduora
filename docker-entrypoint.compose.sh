#!/bin/sh
set -ex

# This Entrypoint used inside Docker Compose only

# Wait for the database server to accept connections
export WAIT_HOSTS=$TR_DB_HOST:$TR_DB_PORT
./wait

exec node src/main.js
