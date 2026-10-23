"""Thin TickTick Open API client. Only what V1 needs: create a task."""
import json

import requests

import config

API = "https://api.ticktick.com/open/v1"


def _token() -> str:
    if config.TICKTICK_TOKEN:
        return config.TICKTICK_TOKEN
    if config.TOKEN_FILE.exists():
        return json.loads(config.TOKEN_FILE.read_text()).get("access_token", "")
    return ""


def create_task(payload: dict) -> dict:
    token = _token()
    if not token:
        raise RuntimeError(
            "No TickTick token. Put TICKTICK_TOKEN in .env or run: python auth.py"
        )
    resp = requests.post(
        f"{API}/task",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if resp.status_code == 401:
        raise RuntimeError("TickTick rejected the token (401). Re-run auth.py or make a new token.")
    if not resp.ok:
        raise RuntimeError(f"TickTick error {resp.status_code}: {resp.text[:200]}")
    return resp.json()
