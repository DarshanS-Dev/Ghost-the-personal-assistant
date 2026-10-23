"""Entry point.
  python main.py                      -> opens the popup (this is what the hotkey runs)
  python main.py remind me to X at 5pm -> no GUI, prints the reply 
"""
import sys


def main() -> None:
    if len(sys.argv) > 1:
        import llm
        print(llm.run(" ".join(sys.argv[1:])))
    else:
        import popup
        popup.launch()


if __name__ == "__main__":
    main()
