"""
Sync scheduler — fires sync_requested every N minutes using 1-second QTimer ticks.
Runs entirely in the main thread; no threading needed.
"""
from __future__ import annotations

from PyQt6.QtCore import QObject, QTimer, pyqtSignal

from core.config import Config


class SyncScheduler(QObject):
    sync_requested = pyqtSignal()     # time to run a sync
    countdown_tick = pyqtSignal(int)  # remaining seconds
    paused_changed = pyqtSignal(bool) # paused / resumed

    def __init__(self, config: Config, parent=None) -> None:
        super().__init__(parent)
        self._config    = config
        self._interval  = 0
        self._remaining = 0
        self._paused    = False
        self._timer     = QTimer(self)
        self._timer.setInterval(1000)
        self._timer.timeout.connect(self._tick)

    # ── Public interface ─────────────────────────────────────────────────────
    @property
    def paused(self) -> bool:
        return self._paused

    @property
    def remaining(self) -> int:
        return self._remaining

    def start(self) -> None:
        self._interval  = int(self._config.get('sync_interval_minutes', 2)) * 60
        self._remaining = self._interval
        self._timer.start()

    def restart_with_new_interval(self) -> None:
        """Call after the user saves a new sync_interval_minutes in Settings."""
        self._interval  = int(self._config.get('sync_interval_minutes', 2)) * 60
        self._remaining = self._interval
        self.countdown_tick.emit(self._remaining)

    def reset_countdown(self) -> None:
        """Reset after a sync finishes so next cycle starts fresh."""
        self._remaining = self._interval
        self.countdown_tick.emit(self._remaining)

    def pause(self) -> None:
        if not self._paused:
            self._paused = True
            self.paused_changed.emit(True)

    def resume(self) -> None:
        if self._paused:
            self._paused = False
            self.paused_changed.emit(False)

    def toggle_pause(self) -> None:
        self.pause() if not self._paused else self.resume()

    def stop(self) -> None:
        self._timer.stop()

    # ── Internal ─────────────────────────────────────────────────────────────
    def _tick(self) -> None:
        if self._paused:
            return
        self._remaining -= 1
        self.countdown_tick.emit(self._remaining)
        if self._remaining <= 0:
            self._remaining = self._interval
            self.sync_requested.emit()
