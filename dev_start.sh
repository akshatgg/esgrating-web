#!/usr/bin/env bash
# dev_start.sh — start the web app on :3000 in the background
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .dev
if [ -f .dev/web.pid ] && kill -0 "$(cat .dev/web.pid)" 2>/dev/null; then
  echo "Web already running (pid $(cat .dev/web.pid))"; exit 0
fi
[ -d node_modules ] || npm install
nohup npx next dev -p 3000 > .dev/web.log 2>&1 &
echo $! > .dev/web.pid
for _ in $(seq 1 120); do
  curl -sf http://localhost:3000 >/dev/null && { echo "Web ready → http://localhost:3000  (log: .dev/web.log)"; exit 0; }
  sleep 0.5
done
echo "Web did not become healthy — see .dev/web.log"; exit 1
