#!/usr/bin/env bash
# This is what the Ubuntu keyboard shortcut runs.
cd "$(dirname "$(readlink -f "$0")")" || exit 1
exec .venv/bin/python main.py "$@"
