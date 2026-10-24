#!/usr/bin/env bash
# Ghost launcher: runs Electron GUI or CLI prompt
cd "$(dirname "$(readlink -f "$0")")" || exit 1

if [ $# -gt 0 ]; then
  exec .venv/bin/python backend/main.py "$@"
else
  exec npm start --silent
fi
