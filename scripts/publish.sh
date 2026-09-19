#!/usr/bin/env bash
# Push this app to the public rotmg-dungeon-timer repo (triggers Pages deploy).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git fetch origin main
git subtree split -P apps/rotmg-dungeon-timer -b rotmg-timer-only
REMOTE="https://github.com/AndreNeubauer/rotmg-dungeon-timer.git"
if [ -n "${ROTMG_TIMER_PUSH_TOKEN:-}" ]; then
  REMOTE="https://x-access-token:${ROTMG_TIMER_PUSH_TOKEN}@github.com/AndreNeubauer/rotmg-dungeon-timer.git"
fi
git push "$REMOTE" rotmg-timer-only:main
echo "Done — check https://github.com/AndreNeubauer/rotmg-dungeon-timer/actions"
