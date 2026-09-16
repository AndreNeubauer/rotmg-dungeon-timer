#!/usr/bin/env python3
"""Serve the RotMG dungeon timer on localhost."""

import http.server
import socketserver
import webbrowser
from pathlib import Path

PORT = 8765
DIR = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIR), **kwargs)


def main() -> None:
    url = f"http://127.0.0.1:{PORT}"
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"RotMG Dungeon Timer → {url}")
        print("Ctrl+C to stop")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        httpd.serve_forever()


if __name__ == "__main__":
    main()
