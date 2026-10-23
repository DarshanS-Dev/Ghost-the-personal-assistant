# ghost (V1)

Hotkey -> tiny text box -> Gemini decides -> task lands in TickTick.
Nothing runs in the background. Popup closes itself after replying.

## Setup (Ubuntu)

```bash
sudo apt install python3-tk python3-venv libnotify-bin
cd jarvis-lite
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
chmod +x run.sh
cp .env.example .env     # then edit .env
```

### 1. Gemini key
Get a free key at https://aistudio.google.com/apikey and put it in `.env` as `GEMINI_API_KEY`.
If you get a "model not found" error, pick a current Flash model name in AI Studio and set `GEMINI_MODEL`.

### 2. TickTick access (pick one)
- **Personal token**: TickTick's developer docs mention a personal API token you can create
  without OAuth. If you can find it on https://developer.ticktick.com , paste it as `TICKTICK_TOKEN`.
- **OAuth**: register an app at https://developer.ticktick.com , set redirect URI to
  `http://localhost:8765/callback`, put the id/secret in `.env`, then run `.venv/bin/python auth.py`.

### 3. Test without the GUI
```bash
.venv/bin/python main.py "remind me to call the vendor tomorrow 5pm, high priority"
```
Check TickTick. If it shows up with the right time, the hard part is done.

### 4. Hotkey
Settings -> Keyboard -> Keyboard Shortcuts -> Custom Shortcuts -> Add:
- Name: Jarvis-lite
- Command: `/full/path/to/jarvis-lite/run.sh`
- Shortcut: e.g. `Super+J`

## Adding more tools later
Write a function in `tools.py` (type hints + docstring with Args), add it to `TOOLS`.
That is all. Calendar, Gmail, web search all plug in the same way.

## Known unverified bits
I couldn't load TickTick's full docs page while writing this, so these come from
secondary sources and should be checked on your first run:
- priority values (0/1/3/5), the `repeatFlag` RRULE format, and the `reminders`
  trigger strings (`TRIGGER:PT0S`)
- whether OAuth tokens expire and need refresh (if you get 401 later, re-run `auth.py`)
If a task is created but the reminder or repeat is missing, those fields are the first suspects.
