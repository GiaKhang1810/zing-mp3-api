#!/usr/bin/env sh
set -eu

rm -rf dist
bun run build:esm
bun run build:cjs
rm -rf dist/esm/types dist/cjs/types

bun run --bun mocha