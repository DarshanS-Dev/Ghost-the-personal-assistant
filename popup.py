"""Tiny one-shot popup: type, Enter, see result, auto-close. Esc closes anytime."""
import queue
import subprocess
import threading
import tkinter as tk

import llm

BG, FG, ACCENT = "#16181d", "#e8e8ea", "#7aa2f7"
W, H = 640, 120


def _notify(msg: str) -> None:
    try:
        subprocess.run(["notify-send", "Jarvis-lite", msg], check=False)
    except FileNotFoundError:
        pass  # libnotify-bin not installed, popup text is enough


def launch() -> None:
    root = tk.Tk()
    root.title("Jarvis-lite")
    root.configure(bg=BG)
    sw, sh = root.winfo_screenwidth(), root.winfo_screenheight()
    root.geometry(f"{W}x{H}+{(sw - W) // 2}+{sh // 4}")
    root.attributes("-topmost", True)

    entry = tk.Entry(
        root, font=("Ubuntu", 15), bg="#20232b", fg=FG, insertbackground=FG,
        relief="flat", highlightthickness=2, highlightbackground="#2c3038",
        highlightcolor=ACCENT,
    )
    entry.pack(fill="x", padx=18, pady=(22, 8), ipady=8)
    status = tk.Label(
        root, text="Type a task or reminder, press Enter", font=("Ubuntu", 10),
        bg=BG, fg="#8b8f98", wraplength=W - 36, justify="left", anchor="w",
    )
    status.pack(fill="x", padx=20)

    results: "queue.Queue[str]" = queue.Queue()
    state = {"busy": False}

    def poll() -> None:
        try:
            out = results.get_nowait()
        except queue.Empty:
            root.after(100, poll)
            return
        status.config(text=out, fg=FG)
        _notify(out)
        root.after(2500, root.destroy)

    def submit(_event=None) -> None:
        text = entry.get().strip()
        if state["busy"] or not text:
            return
        state["busy"] = True
        entry.config(state="disabled")
        status.config(text="thinking...", fg=ACCENT)
        threading.Thread(target=lambda: results.put(llm.run(text)), daemon=True).start()
        root.after(100, poll)

    entry.bind("<Return>", submit)
    root.bind("<Escape>", lambda _e: root.destroy())
    root.after(50, lambda: (root.focus_force(), entry.focus_set()))
    root.mainloop()
