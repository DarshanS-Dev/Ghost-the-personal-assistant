#!/usr/bin/env bash
# Ghost launcher: runs Electron GUI or CLI prompt
DIR="$(dirname "$(readlink -f "$0")")"
cd "$DIR" || exit 1

export PATH="$DIR/node_modules/.bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if [ $# -gt 0 ]; then
  exec .venv/bin/python backend/main.py "$@"
else
  exec "$DIR/node_modules/.bin/electron" "$DIR"
fi
