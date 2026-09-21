#!/usr/bin/env python3
"""Minimal daily-question server. Data lives in plain text files only."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
QUESTIONS_FILE = ROOT / "questions.txt"
ANSWERS_FILE = ROOT / "answers.txt"
SECRET_FILE = ROOT / ".secret"
PUBLIC = ROOT / "public"
EPOCH = date(2020, 1, 1)
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))
UNLOCK_COOKIE = "dq_unlock"


def get_secret() -> bytes:
    env = os.environ.get("DAILY_QUESTION_SECRET")
    if env:
        return env.encode("utf-8")
    if SECRET_FILE.exists():
        return SECRET_FILE.read_bytes().strip()
    secret = secrets.token_hex(32).encode("ascii")
    SECRET_FILE.write_bytes(secret)
    return secret


def unlock_token(day: str | None = None) -> str:
    day = day or date.today().isoformat()
    digest = hmac.new(get_secret(), day.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{day}.{digest}"


def token_is_valid(token: str | None) -> bool:
    if not token or "." not in token:
        return False
    day, digest = token.rsplit(".", 1)
    if day != date.today().isoformat():
        return False
    expected = hmac.new(get_secret(), day.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, expected)


def load_questions() -> list[str]:
    if not QUESTIONS_FILE.exists():
        return ["What made you smile today?"]
    lines = QUESTIONS_FILE.read_text(encoding="utf-8").splitlines()
    return [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]


def question_for_today() -> tuple[str, int]:
    questions = load_questions()
    index = (date.today() - EPOCH).days % len(questions)
    return questions[index], index


def append_answer(text: str) -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    day = date.today().isoformat()
    _, index = question_for_today()
    line = f"{stamp}\t{day}\tq{index + 1}\t{text.replace(chr(9), ' ').replace(chr(10), ' ')}\n"
    with ANSWERS_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line)


def read_answers() -> str:
    if not ANSWERS_FILE.exists():
        return ""
    return ANSWERS_FILE.read_text(encoding="utf-8")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} - {fmt % args}")

    def _cookie_value(self, name: str) -> str | None:
        raw = self.headers.get("Cookie", "")
        for part in raw.split(";"):
            part = part.strip()
            if part.startswith(f"{name}="):
                return part.split("=", 1)[1]
        return None

    def _is_unlocked(self) -> bool:
        return token_is_valid(self._cookie_value(UNLOCK_COOKIE))

    def _set_unlock_cookie(self) -> None:
        token = unlock_token()
        self.send_header(
            "Set-Cookie",
            f"{UNLOCK_COOKIE}={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400",
        )

    def _send_bytes(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, status: int, body: str, content_type: str = "text/plain; charset=utf-8") -> None:
        self._send_bytes(status, body.encode("utf-8"), content_type)

    def _send_json(self, status: int, payload: dict, *, set_unlock: bool = False) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        if set_unlock:
            self._set_unlock_cookie()
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", "0"))
        return self.rfile.read(length) if length else b""

    def _deny_private(self) -> None:
        self._send_json(403, {"ok": False, "error": "Answer today's question first."})

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        if path in ("/questions.txt", "/answers.txt"):
            self._send_json(403, {"ok": False, "error": "Not available."})
            return

        if path == "/api/status":
            self._send_json(
                200,
                {
                    "date": date.today().isoformat(),
                    "unlocked": self._is_unlocked(),
                },
            )
            return

        if path == "/api/today":
            question, _ = question_for_today()
            self._send_json(
                200,
                {
                    "date": date.today().isoformat(),
                    "question": question,
                },
            )
            return

        if path == "/api/answers":
            if not self._is_unlocked():
                self._deny_private()
                return
            self._send_json(200, {"ok": True, "content": read_answers()})
            return

        if path in ("/", "/index.html"):
            index_path = PUBLIC / "index.html"
            self._send_text(200, index_path.read_text(encoding="utf-8"), "text/html; charset=utf-8")
            return

        asset_path = PUBLIC / path.lstrip("/")
        if asset_path.is_file():
            content_type = "text/css; charset=utf-8" if path.endswith(".css") else "application/octet-stream"
            self._send_bytes(200, asset_path.read_bytes(), content_type)
            return

        self._send_text(404, "Not found")

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/answer":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return

        raw = self._read_body()
        answer = ""

        content_type = self.headers.get("Content-Type", "")
        if "application/json" in content_type:
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
                answer = str(payload.get("answer", "")).strip()
            except json.JSONDecodeError:
                self._send_json(400, {"ok": False, "error": "Invalid JSON"})
                return
        else:
            answer = parse_qs(raw.decode("utf-8")).get("answer", [""])[0].strip()

        if not answer:
            self._send_json(400, {"ok": False, "error": "Answer cannot be empty"})
            return
        if len(answer) > 2000:
            self._send_json(400, {"ok": False, "error": "Answer is too long"})
            return

        append_answer(answer)
        self._send_json(200, {"ok": True, "unlocked": True}, set_unlock=True)


def main() -> None:
    if not ANSWERS_FILE.exists():
        ANSWERS_FILE.write_text(
            "# timestamp\tdate\tquestion#\tanswer\n",
            encoding="utf-8",
        )
    server = HTTPServer((HOST, PORT), Handler)
    print(f"Daily question app running on http://{HOST}:{PORT}")
    print(f"Questions: {QUESTIONS_FILE}")
    print(f"Answers:   {ANSWERS_FILE}")
    server.serve_forever()


if __name__ == "__main__":
    main()
