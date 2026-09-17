#!/usr/bin/env python3
"""Serve the RotMG dungeon timer on localhost."""

import http.server
import json
import socketserver
import webbrowser
from pathlib import Path

PORT = 8765
DIR = Path(__file__).resolve().parent
RUNS_FILE = DIR / "runs.json"


def ensure_runs_file() -> None:
    if not RUNS_FILE.exists():
        RUNS_FILE.write_text("[]\n", encoding="utf-8")


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIR), **kwargs)

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/runs":
            self._send_runs()
            return
        super().do_GET()

    def do_PUT(self) -> None:
        if self.path.split("?", 1)[0] == "/api/runs":
            self._save_runs()
            return
        self.send_error(404)

    def _send_runs(self) -> None:
        ensure_runs_file()
        body = RUNS_FILE.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _save_runs(self) -> None:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_error(400, "Invalid JSON")
            return
        if not isinstance(data, list):
            self.send_error(400, "Expected a JSON array")
            return

        ensure_runs_file()
        RUNS_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        body = b'{"ok":true}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        if args and isinstance(args[0], str) and args[0].startswith("GET /api/runs"):
            return
        super().log_message(format, *args)


def main() -> None:
    ensure_runs_file()
    url = f"http://127.0.0.1:{PORT}"
    with ReuseTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"RotMG Dungeon Timer → {url}")
        print(f"Run data file → {RUNS_FILE}")
        print("Ctrl+C to stop")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        httpd.serve_forever()


if __name__ == "__main__":
    main()
