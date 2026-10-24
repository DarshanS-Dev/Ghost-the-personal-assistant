"""Tools the LLM can call. To add a new ability later (calendar, gmail, web...),
write one function here with type hints + a docstring and add it to TOOLS."""
from datetime import datetime
from zoneinfo import ZoneInfo

import config
import ticktick

PRIORITY = {"none": 0, "low": 1, "medium": 3, "high": 5}


def add_task(
    title: str,
    due: str = "",
    priority: str = "none",
    repeat: str = "",
    notes: str = "",
) -> dict:
    """Create a task or reminder in TickTick.

    Args:
        title: Short task title, e.g. "Call the vendor".
        due: Due date/time in the user's local timezone. Use "YYYY-MM-DDTHH:MM"
            (24h) when a time is given, "YYYY-MM-DD" when only a day is given,
            or empty string if no date was mentioned.
        priority: One of "none", "low", "medium", "high".
        repeat: iCalendar RRULE for repeating tasks, e.g. "RRULE:FREQ=DAILY;INTERVAL=1"
            or "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO". Empty string if not repeating.
            A repeating task must also have a due date.
        notes: Optional extra detail for the task description.

    Returns:
        A dict with status "ok" or "error" and a message.
    """
    tz = ZoneInfo(config.TZ_NAME)
    payload: dict = {"title": title.strip(), "priority": PRIORITY.get(priority.lower(), 0)}
    if not payload["title"]:
        return {"status": "error", "message": "Title is empty."}
    if notes:
        payload["content"] = notes
    if config.TICKTICK_PROJECT_ID:
        payload["projectId"] = config.TICKTICK_PROJECT_ID

    if due:
        try:
            if "T" in due:
                dt = datetime.strptime(due, "%Y-%m-%dT%H:%M").replace(tzinfo=tz)
                payload["isAllDay"] = False
                payload["reminders"] = ["TRIGGER:PT0S"]  # notify at the due time
            else:
                dt = datetime.strptime(due, "%Y-%m-%d").replace(tzinfo=tz)
                payload["isAllDay"] = True
                payload["reminders"] = ["TRIGGER:P0DT9H0M0S"]  # 9am that day
        except ValueError:
            return {"status": "error", "message": f"Bad due format '{due}'. Use YYYY-MM-DDTHH:MM or YYYY-MM-DD."}
        stamp = dt.strftime("%Y-%m-%dT%H:%M:%S%z")  # e.g. 2026-10-24T17:00:00+0530
        payload["startDate"] = stamp
        payload["dueDate"] = stamp
        payload["timeZone"] = config.TZ_NAME

    if repeat:
        if not repeat.startswith("RRULE:"):
            return {"status": "error", "message": "repeat must start with 'RRULE:'."}
        if not due:
            return {"status": "error", "message": "A repeating task needs a due date."}
        payload["repeatFlag"] = repeat

    try:
        ticktick.create_task(payload)
    except Exception as exc:  # return the error to the model so it can tell the user
        return {"status": "error", "message": str(exc)}
    return {"status": "ok", "message": f"Created '{payload['title']}'", "due": due or "no date"}


TOOLS = [add_task]
