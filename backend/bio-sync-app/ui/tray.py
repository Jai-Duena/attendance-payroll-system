"""
System tray icon manager.
"""
from __future__ import annotations

import os

from PyQt6.QtWidgets import QSystemTrayIcon, QMenu, QApplication
from PyQt6.QtGui import QIcon, QPixmap, QColor, QPainter, QBrush
from PyQt6.QtCore import Qt

from core.config import resource_path


def _dot_icon(color: str, size: int = 22) -> QIcon:
    """Generate a simple coloured-circle icon for tray status indicators."""
    pix = QPixmap(size, size)
    pix.fill(Qt.GlobalColor.transparent)
    p = QPainter(pix)
    p.setRenderHint(QPainter.RenderHint.Antialiasing)
    p.setBrush(QBrush(QColor(color)))
    p.setPen(Qt.PenStyle.NoPen)
    p.drawEllipse(2, 2, size - 4, size - 4)
    p.end()
    return QIcon(pix)


_STATUS_COLORS = {
    'ok':      '#2E7D32',
    'success': '#2E7D32',
    'warning': '#F57F17',
    'error':   '#C62828',
    'syncing': '#1565C0',
    'paused':  '#6B7A99',
}

_STATUS_LABELS = {
    'ok':      '✓ Sync active',
    'success': '✓ Sync active',
    'warning': '⚠ Last sync had warnings',
    'error':   '✕ Last sync failed',
    'syncing': '⟳ Syncing…',
    'paused':  '⏸ Auto-sync paused',
}


class TrayManager:
    def __init__(self, window, app: QApplication) -> None:
        self._window = window
        self._app    = app
        self._tray   = QSystemTrayIcon()

    def setup(self) -> None:
        icon_path = resource_path('assets', 'icon.ico')
        if os.path.exists(icon_path):
            self._tray.setIcon(QIcon(icon_path))
        else:
            self._tray.setIcon(_dot_icon(_STATUS_COLORS['ok']))

        self._tray.setToolTip('FCH Bio Sync — ✓ Sync active')
        self._build_menu()
        self._tray.activated.connect(self._on_activated)
        self._tray.show()

    def _build_menu(self) -> None:
        menu = QMenu()

        act_open = menu.addAction('Open FCH Bio Sync')
        act_open.triggered.connect(self._show_window)

        menu.addSeparator()

        self._act_sync = menu.addAction('⚡  Sync Now')
        self._act_sync.triggered.connect(self._request_sync)

        self._act_pause = menu.addAction('⏸  Pause Auto-Sync')
        self._act_pause.triggered.connect(self._toggle_pause)

        menu.addSeparator()

        act_exit = menu.addAction('✕  Exit')
        act_exit.triggered.connect(self._quit)

        self._tray.setContextMenu(menu)

    # ── Slot handlers ─────────────────────────────────────────────────────────
    def _on_activated(self, reason: QSystemTrayIcon.ActivationReason) -> None:
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            self._show_window()

    def _show_window(self) -> None:
        self._window.show()
        self._window.raise_()
        self._window.activateWindow()

    def _request_sync(self) -> None:
        if hasattr(self._window, 'trigger_sync'):
            self._window.trigger_sync()

    def _toggle_pause(self) -> None:
        if hasattr(self._window, 'toggle_pause'):
            self._window.toggle_pause()

    def _quit(self) -> None:
        self._tray.hide()
        self._app.quit()

    # ── Public API ────────────────────────────────────────────────────────────
    def set_status(self, status: str) -> None:
        label = _STATUS_LABELS.get(status, status)
        self._tray.setToolTip(f'FCH Bio Sync — {label}')
        icon_path = resource_path('assets', 'icon.ico')
        if not os.path.exists(icon_path):
            self._tray.setIcon(_dot_icon(_STATUS_COLORS.get(status, '#6B7A99')))

    def update_pause_action(self, paused: bool) -> None:
        self._act_pause.setText('▶  Resume Auto-Sync' if paused else '⏸  Pause Auto-Sync')

    def show_message(self, title: str, body: str) -> None:
        self._tray.showMessage(
            title, body, QSystemTrayIcon.MessageIcon.Information, 3500
        )
