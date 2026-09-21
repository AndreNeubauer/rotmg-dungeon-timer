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
