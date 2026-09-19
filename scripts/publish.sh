#!/usr/bin/env bash
# Push this app to the public rotmg-dungeon-timer repo (triggers Pages deploy).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git fetch origin main
git subtree split -P apps/rotmg-dungeon-timer -b rotmg-timer-only
git push https://github.com/AndreNeubauer/rotmg-dungeon-timer.git rotmg-timer-only:main
echo "Done — check https://github.com/AndreNeubauer/rotmg-dungeon-timer/actions"
