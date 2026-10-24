#!/usr/bin/env bash
# Ghost launcher: runs Electron GUI or CLI prompt
DIR="$(dirname "$(readlink -f "$0")")"
cd "$DIR" || exit 1

export PATH="$DIR/node_modules/.bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Auto-clean stale Electron singleton lock if the previous process died
LOCK_FILE="$HOME/.config/ghost/SingletonLock"
if [ -L "$LOCK_FILE" ]; then
  LOCK_TARGET="$(readlink "$LOCK_FILE")"
  LOCK_PID="${LOCK_TARGET##*-}"
  if ! kill -0 "$LOCK_PID" 2>/dev/null; then
    rm -f "$HOME/.config/ghost/Singleton"*
  fi
fi

if [ $# -gt 0 ]; then
  exec .venv/bin/python backend/main.py "$@"
else
  exec "$DIR/node_modules/.bin/electron" "$DIR"
fi
