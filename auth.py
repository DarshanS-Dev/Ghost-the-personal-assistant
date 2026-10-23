"""One-time TickTick OAuth login. Saves token.json next to this file.

Before running: register an app at https://developer.ticktick.com , set its
redirect URI to  http://localhost:8765/callback  and put the client id/secret in .env.
"""
import json
import os
import secrets
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse

import requests

import config

PORT = 8765
REDIRECT = f"http://localhost:{PORT}/callback"
SCOPE = "tasks:write tasks:read"
AUTH_URL = "https://ticktick.com/oauth/authorize"
TOKEN_URL = "https://ticktick.com/oauth/token"

_result: dict = {}


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        _result["code"] = q.get("code", [""])[0]
        _result["state"] = q.get("state", [""])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"Done. You can close this tab and go back to the terminal.")

    def log_message(self, *args):  # keep terminal quiet
        pass


def main() -> None:
    if not (config.TICKTICK_CLIENT_ID and config.TICKTICK_CLIENT_SECRET):
        raise SystemExit("Set TICKTICK_CLIENT_ID and TICKTICK_CLIENT_SECRET in .env first.")

    state = secrets.token_urlsafe(16)
    url = AUTH_URL + "?" + urlencode({
        "client_id": config.TICKTICK_CLIENT_ID,
        "scope": SCOPE,
        "state": state,
        "redirect_uri": REDIRECT,
        "response_type": "code",
    })
    print("Opening browser to log in to TickTick...\nIf it doesn't open, visit:\n" + url)
    webbrowser.open(url)

    server = HTTPServer(("127.0.0.1", PORT), _Handler)
    server.handle_request()  # waits for exactly one redirect
    server.server_close()

    if _result.get("state") != state or not _result.get("code"):
        raise SystemExit("Login failed: missing code or state mismatch.")

    resp = requests.post(
        TOKEN_URL,
        data={
            "code": _result["code"],
            "grant_type": "authorization_code",
            "scope": SCOPE,
            "redirect_uri": REDIRECT,
        },
        auth=(config.TICKTICK_CLIENT_ID, config.TICKTICK_CLIENT_SECRET),
        timeout=15,
    )
    if not resp.ok:
        raise SystemExit(f"Token exchange failed {resp.status_code}: {resp.text[:300]}")

    config.TOKEN_FILE.write_text(json.dumps(resp.json(), indent=2))
    os.chmod(config.TOKEN_FILE, 0o600)
    print(f"Saved {config.TOKEN_FILE}. You're set.")


if __name__ == "__main__":
    main()
