#!/usr/bin/env bash
# dev_stop.sh — stop the web app started by dev_start.sh
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .dev/web.pid ]; then
  pid=$(cat .dev/web.pid)
  pkill -P "$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null || true
  rm -f .dev/web.pid
  echo "Web stopped"
else
  echo "Web not running"
fi
