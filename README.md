# Ghost

Minimal AI personal assistant command palette.

Hotkey -> Modern Spotlight Command Palette -> Gemini decides -> Task lands in TickTick (or other tools).

---

## Architecture

- **`ui/`**: Electron frontend matching the command palette design (HTML/CSS/JS).
- **`backend/`**: 100% Python AI logic (`llm.py`, `tools.py`, `ticktick.py`).

```
Ghost/
├── ui/                 # Frontend: Electron window, styles, HTML
├── backend/            # Backend: Python tools & LLM logic
│   ├── tools.py        # <--- Add all your custom tools here!
│   ├── llm.py          # Gemini AI runner
│   └── ticktick.py     # TickTick integration
├── run.sh              # Hotkey launcher
└── .env                # API keys and settings
```

---

## Setup (Ubuntu)

```bash
cd Ghost
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm install
chmod +x run.sh
cp .env.example .env     # then edit .env with your keys
```

### 1. Launching Ghost
- Run `./run.sh` or `npm start` to open the command palette.
- Press `Enter` to create a task, or `Esc` to close.

### 2. Hotkey Shortcut
Go to **Settings -> Keyboard -> Keyboard Shortcuts -> Custom Shortcuts -> Add**:
- **Name**: `Ghost`
- **Command**: `/full/path/to/Ghost/run.sh`
- **Shortcut**: `Super+Space` or `Super+G`

---

## Adding More Tools (100% Python)
To add a new tool (e.g. Gmail unread check, Google Calendar, web search), simply open `backend/tools.py`, write a Python function with type hints and a docstring, and add it to `TOOLS`:

```python
def check_unread_emails(limit: int = 5) -> dict:
    """Check recent unread emails in Gmail inbox."""
    # your python logic here
    return {"status": "ok", "emails": [...]}

TOOLS = [add_task, check_unread_emails]
```
Gemini automatically learns how and when to call your tool.
