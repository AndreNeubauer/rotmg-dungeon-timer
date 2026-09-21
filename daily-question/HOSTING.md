# Daily Question — cheap hosting

This app is intentionally tiny:

- `questions.txt` — your question bank (one per line)
- `answers.txt` — every submitted answer, appended as plain text
- `server.py` — one Python file, no dependencies

## Fastest local test

```bash
cd daily-question
python3 server.py
```

Open `http://localhost:8080`

Raw files:

- `http://localhost:8080/questions.txt`
- `http://localhost:8080/answers.txt`

## Cheapest real hosting (~$4/month)

### 1) Rent a tiny VM

Good options:

| Provider | Smallest plan | Rough cost |
|----------|---------------|------------|
| Hetzner Cloud | CX23 | ~€3.5/mo |
| DigitalOcean | Basic droplet | ~$4/mo |
| Vultr | Cloud compute | ~$5/mo |

Pick Ubuntu 24.04. You only need 1 vCPU and 1 GB RAM.

### 2) Copy the app to the VM

```bash
scp -r daily-question/ user@YOUR_VM_IP:~/
```

Or clone your repo on the VM and `cd daily-question`.

### 3) Run it as a service

On the VM:

```bash
sudo cp ~/daily-question/deploy/daily-question.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now daily-question
sudo systemctl status daily-question
```

The app listens on port `8080`.

### 4) Put a simple URL in front of it

#### Option A — free URL with Cloudflare Tunnel (easiest)

1. Create a free Cloudflare account
2. Install `cloudflared` on the VM
3. Run:

```bash
cloudflared tunnel --url http://localhost:8080
```

Cloudflare gives you a random `*.trycloudflare.com` URL immediately. For a fixed name, create a named tunnel in the Cloudflare dashboard.

Cost: **$0/month** for the URL. You still pay for the VM if you use one, or run it on a machine you already have.

#### Option B — cheap custom domain + Caddy

1. Buy a domain from Porkbun, Namecheap, or Cloudflare (~$2–12/year for `.xyz`, `.site`, etc.)
2. Point DNS `A` record to your VM IP
3. Install Caddy and use `deploy/Caddyfile`

```bash
sudo apt install -y caddy
sudo cp ~/daily-question/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy gets free HTTPS automatically.

Total: **~$4/mo VM + ~$3–10/year domain**.

#### Option C — no domain at all

Use the VM IP directly:

`http://YOUR_VM_IP:8080`

Cheapest, but not pretty. Fine for personal use.

## Editing questions

SSH into the VM and edit:

```bash
nano ~/daily-question/questions.txt
```

No restart needed. The server reads the file on each request.

## Backing up answers

Answers are just text:

```bash
scp user@YOUR_VM_IP:~/daily-question/answers.txt ./answers-backup.txt
```

## Security notes

This is a personal journal app, not a public multi-user product.

- Anyone who can open the URL can submit answers and read `answers.txt`
- If you want it private, use Cloudflare Access, HTTP basic auth in Caddy, or firewall the VM to your IP only

## Even cheaper: skip the VM

If you already have any always-on computer (home PC, Raspberry Pi, old laptop), run `python3 server.py` there and use Cloudflare Tunnel for the URL. Total cost can be **$0/month**.

## Crypto payments + “lifetime” URL

### The honest truth about “lifetime” domains

Real `.com` / `.xyz` / `.site` domains (the kind that work in every browser) **must be renewed**. There is no true forever registration from ICANN registrars anymore. Epik’s “Forever” product is effectively discontinued.

Your practical “lifetime” options:

| Approach | How long it lasts | Crypto? | Rough cost |
|----------|-------------------|---------|------------|
| **Prepay 10 years** on a cheap TLD | 10 years, one payment | Yes | ~$25–40 total |
| **Cloudflare Tunnel** free subdomain | Free as long as Cloudflare exists | N/A (hosting only) | $0 for URL |
| **Web3 domains** (`.crypto`, etc.) | One-time purchase | Yes | $5–50 one-time |

For this app, **prepay 10 years + pay hosting with BTC** is the closest thing to “lifetime” with a normal URL.

### Recommended stack (crypto, cheap, normal URL)

**Domain — NameSilo (accepts BTC, ETH, LTC, BCH, USDC)**

1. Go to [namesilo.com](https://www.namesilo.com)
2. Search for something like `yourname.xyz` (often ~$2–3/year)
3. At checkout, set registration length to **10 years**
4. Pay with crypto (fund account with Bitcoin, or pay at checkout via BitPay/Nicky)
5. Point an `A` record at your VPS IP

One crypto payment ≈ **10 years of domain** (~$25–40 for a `.xyz`).

**Hosting — Cloudzy or BitLaunch (accept Bitcoin directly)**

| Provider | Crypto | Smallest plan | Notes |
|----------|--------|---------------|-------|
| [Cloudzy](https://cloudzy.com/bitcoin-vps) | BTC, ETH, USDT | ~$2.50/mo | Simple checkout, Linux VPS |
| [BitLaunch](https://bitlaunch.io) | BTC + others | ~$5/mo | Privacy-focused, hourly billing |
| [Bacloud](https://www.bacloud.com/bitcoin-vps) | BTC, ETH, LTC | ~$5/mo | Instant deploy after confirmation |

Pick Ubuntu 24.04, 1 GB RAM. Deploy the app the same way as above.

**HTTPS — Caddy** (free, auto SSL once DNS points to the VM)

```bash
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile   # set your domain
sudo systemctl reload caddy
```

**Total:** ~$25–40 once (domain for 10 years) + ~$3/mo in BTC for the VM.

### Cheapest crypto option (no custom domain)

If you only care about a working URL, not a branded name:

1. Rent a VPS from **Cloudzy** or **BitLaunch** — pay in BTC
2. Run the app + **Cloudflare Tunnel** for a free `*.trycloudflare.com` URL
3. **No domain purchase at all**

Cost: **~$3/mo in crypto only**.

The tunnel URL is free forever; you just keep paying the tiny VPS bill.

### All-crypto + privacy (more expensive)

**Njalla** ([njal.la](https://njal.la)) accepts Bitcoin, Monero, Ethereum, Litecoin:

- Domains from ~€15/year (Njalla holds legal ownership; you control it)
- VPS from ~€15/month
- No real name required

Good if privacy matters more than price. Everything in one place, all crypto.

### Web3 “lifetime” domains (usually not worth it here)

Services like Unstoppable Domains, Freename, or `.crypto` names sell **one-time** domains paid in crypto. Catch: they do not behave like normal websites out of the box. You would need IPFS or special browser extensions. Skip these unless you specifically want a Web3 identity.

### Step-by-step: crypto deploy checklist

```bash
# 1. On your laptop — copy app to the VPS
scp -r daily-question/ user@YOUR_VM_IP:~/

# 2. On the VPS — install and start
cd ~/daily-question
python3 server.py &   # or use the systemd service from deploy/

# 3. Point your NameSilo domain A record → VPS IP

# 4. Install Caddy for HTTPS (after DNS propagates)
sudo apt install -y caddy
echo 'yourname.xyz { reverse_proxy 127.0.0.1:8080 }' | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Done. You now have `https://yourname.xyz` paid mostly upfront in crypto.
