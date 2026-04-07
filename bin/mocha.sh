#!/usr/bin/env sh
set -eu

./bin/build.sh
ZING_MP3_LIVE=1 bun run --bun mocha