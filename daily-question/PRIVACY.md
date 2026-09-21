# Privacy & anonymity

This app is built so **nobody reading the site or the answer file can tell who wrote what**.

## What the app does NOT store

| Data | Stored? |
|------|---------|
| IP address | No |
| Browser / device | No |
| Username or email | No |
| Exact time of submission | No |
| Which question number it was | No |
| Location | No |

Each line in `answers.txt` is **only the answer text**. Nothing else.

The server also writes **no access logs** (no record of who visited).

## What visitors see

- Today's question only (not the full question list)
- Past answers only after submitting today's answer
- Past answers shown **without names or timestamps**

## What you still need to know (honest limits)

True "impossible to trace" does not exist on the normal internet. These layers can still see visitors **outside** this app:

| Layer | Risk | Fix |
|-------|------|-----|
| **Your home IP** | ISP knows you run a server | Use Tor hidden service (below) or a VPS paid with crypto |
| **Cloudflare Tunnel** | Cloudflare sees visitor IPs | Skip Cloudflare; use Tor instead |
| **Your VPS provider** | Sees server IP traffic | Njalla, BitLaunch, or pay VPS with Monero |
| **Disk access** | Anyone with SSH can read files | Lock down server access; encrypt disk |
| **Writing style** | Someone might guess from text | Don't put identifying details in answers |

The app itself is anonymous. **How you host it** decides whether the outside world can trace visitors.

## Recommended anonymous hosting

### Best: Tor hidden service (.onion)

Visitors and you stay anonymous. No domain registration needed.

1. Install Tor on your server or home PC
2. Run the app on `127.0.0.1:8080`
3. Point a Tor hidden service at it (see `deploy/torrc.example`)
4. Share only the `.onion` URL (e.g. `http://abc123...onion`)

Cost: **$0**. Access via **Tor Browser**.

### Also good: crypto VPS + no middleman

1. Rent VPS from [Njalla](https://njal.la) or [BitLaunch](https://bitlaunch.io) — pay in Bitcoin/Monero
2. Do **not** put Cloudflare in front
3. Use HTTPS with a self-signed cert or a domain bought with crypto via Njalla
4. Bind app to localhost; put Caddy/nginx in front with **no access logs**:

```nginx
access_log off;
```

## Checklist before going public

- [ ] App bound to `127.0.0.1` (not `0.0.0.0`) with a reverse proxy, or firewalled
- [ ] No Cloudflare (unless you accept they see IPs)
- [ ] Web server access logs disabled
- [ ] HTTPS enabled (Let's Encrypt or Tor)
- [ ] Don't run from your home IP if anonymity matters — use Tor or offshore VPS
- [ ] Set `DAILY_QUESTION_SECRET` so unlock cookies stay valid across restarts

## Local-only = maximum privacy

If only you use it on your PC:

```bash
HOST=127.0.0.1 python3 server.py
```

Open `http://localhost:8080`. Nothing leaves your machine.
