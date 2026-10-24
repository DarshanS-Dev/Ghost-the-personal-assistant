"""Root CLI redirect to backend/main.py"""
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent

if __name__ == "__main__":
    py_exec = BASE / ".venv" / "bin" / "python"
    backend_script = BASE / "backend" / "main.py"
    cmd = [str(py_exec) if py_exec.exists() else sys.executable, str(backend_script)] + sys.argv[1:]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)
