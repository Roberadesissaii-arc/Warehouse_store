"""In-process login throttle with escalating backoff.

The store API runs as a single waitress instance bound to 127.0.0.1 and is only
reached through the Next.js proxy, so the client IP is always 127.0.0.1. That
makes per-IP limiting useless here — we throttle per account (email) instead,
which is what stops online password guessing.

Backoff is escalating: a few mistakes by a real user cost only a short cooldown,
while a sustained attacker is quickly capped. The lock is measured from the most
recent failed attempt, and failures older than DECAY_SECONDS are forgotten, so
the counter self-resets once guessing stops.
"""
import threading
import time

# Failures before any cooldown applies (a real user can fat-finger this many).
THRESHOLD = 5
# Cooldown after hitting THRESHOLD, doubling for each further failure.
BASE_LOCK_SECONDS = 30
MAX_LOCK_SECONDS = 15 * 60
# Forget failures older than this with no new attempts.
DECAY_SECONDS = 30 * 60

_lock = threading.Lock()
_failures: dict[str, list[float]] = {}


def _recent(timestamps: list[float], now: float) -> list[float]:
    cutoff = now - DECAY_SECONDS
    return [t for t in timestamps if t > cutoff]


def _lock_duration(fail_count: int) -> int:
    if fail_count < THRESHOLD:
        return 0
    return min(BASE_LOCK_SECONDS * (2 ** (fail_count - THRESHOLD)), MAX_LOCK_SECONDS)


def seconds_until_unlocked(key: str) -> int:
    """Return seconds the caller must wait, or 0 if not currently locked."""
    now = time.time()
    with _lock:
        times = _recent(_failures.get(key, []), now)
        _failures[key] = times
        if not times:
            return 0
        duration = _lock_duration(len(times))
        if not duration:
            return 0
        remaining = int(duration - (now - times[-1])) + 1
    return remaining if remaining > 0 else 0


def record_failure(key: str) -> None:
    now = time.time()
    with _lock:
        times = _recent(_failures.get(key, []), now)
        times.append(now)
        _failures[key] = times


def reset(key: str) -> None:
    with _lock:
        _failures.pop(key, None)
