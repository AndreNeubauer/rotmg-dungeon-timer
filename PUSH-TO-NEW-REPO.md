# Push to AndreNeubauer/rotmg-dungeon-timer

The export branch may already exist on a Cloud Agent VM. On **your machine**, from the `test` repo:

```bash
git fetch origin main
git subtree split -P apps/rotmg-dungeon-timer -b rotmg-timer-only
git push https://github.com/AndreNeubauer/rotmg-dungeon-timer.git rotmg-timer-only:main
```

Then on GitHub:

1. **rotmg-dungeon-timer** → **Settings → Pages** → Source: **GitHub Actions**
2. **Actions** → **Deploy RotMG Timer** → re-run if needed

**Live URL:** https://andreneubauer.github.io/rotmg-dungeon-timer/
