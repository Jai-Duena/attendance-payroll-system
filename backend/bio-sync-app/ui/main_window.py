"""
Main application window.
"""
from __future__ import annotations

import os

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QTabWidget, QStatusBar, QFrame,
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, pyqtSlot
from PyQt6.QtGui import QPixmap, QIcon, QFont, QCloseEvent

from core.config import CONFIG, resource_path
from core.scheduler import SyncScheduler
from ui.tabs.dashboard import DashboardTab
from ui.tabs.users import UsersTab
from ui.tabs.settings import SettingsTab


class _SyncWorker(QThread):
    """Runs run_sync() in a background thread so the UI stays responsive."""
    log_signal    = pyqtSignal(str)
    result_signal = pyqtSignal(dict)

    def run(self) -> None:
        from core.sync_engine import run_sync
        result = run_sync(CONFIG, self.log_signal.emit)
        self.result_signal.emit(result)


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self._tray    = None
        self._worker: _SyncWorker | None = None
        self._syncing = False

        self.setWindowTitle('FCH Bio Sync')
        self.setMinimumSize(960, 640)
        self.resize(1120, 720)

        icon_path = resource_path('assets', 'icon.ico')
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))

        self._build_ui()
        self._setup_scheduler()

    def set_tray(self, tray) -> None:
        self._tray = tray

    # ── UI construction ───────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        root.addWidget(self._make_header())

        # Tabs
        self._tabs = QTabWidget()
        self._tabs.setDocumentMode(True)
        root.addWidget(self._tabs)

        self._tab_dash     = DashboardTab(self)
        self._tab_users    = UsersTab(self)
        self._tab_settings = SettingsTab(self)

        self._tabs.addTab(self._tab_dash,     '  Dashboard  ')
        self._tabs.addTab(self._tab_users,    '  Users  ')
        self._tabs.addTab(self._tab_settings, '  Settings  ')

        # Status bar
        sb = QStatusBar()
        self.setStatusBar(sb)
        self._lbl_countdown = QLabel('Starting scheduler…')
        self._lbl_last_sync = QLabel('')
        sb.addWidget(self._lbl_countdown)
        sb.addPermanentWidget(self._lbl_last_sync)

        # Wire signals
        self._tab_dash.sync_requested.connect(self.trigger_sync)
        self._tab_settings.interval_changed.connect(self._on_interval_changed)

    def _make_header(self) -> QFrame:
        header = QFrame()
        header.setFixedHeight(60)
        header.setStyleSheet('QFrame { background: #1565C0; border: none; }')

        hl = QHBoxLayout(header)
        hl.setContentsMargins(18, 8, 18, 8)
        hl.setSpacing(12)

        logo_path = resource_path('assets', 'logo.png')
        if os.path.exists(logo_path):
            pix = QPixmap(logo_path).scaledToHeight(
                40, Qt.TransformationMode.SmoothTransformation
            )
            lbl_logo = QLabel()
            lbl_logo.setPixmap(pix)
            hl.addWidget(lbl_logo)

        lbl_title = QLabel('FCH Bio Sync')
        lbl_title.setFont(QFont('Segoe UI', 14, QFont.Weight.Bold))
        lbl_title.setStyleSheet('color: white;')
        hl.addWidget(lbl_title)

        lbl_sub = QLabel('Biometric Synchronization Manager')
        lbl_sub.setStyleSheet('color: rgba(255,255,255,0.65); font-size: 11px; padding-top: 2px;')
        hl.addWidget(lbl_sub)

        hl.addStretch()

        self._lbl_dot = QLabel('●')
        self._lbl_dot.setStyleSheet('color: #69F0AE; font-size: 18px;')
        hl.addWidget(self._lbl_dot)

        self._lbl_status_text = QLabel('Ready')
        self._lbl_status_text.setStyleSheet('color: rgba(255,255,255,0.85); font-size: 12px;')
        hl.addWidget(self._lbl_status_text)

        return header

    # ── Scheduler ─────────────────────────────────────────────────────────────
    def _setup_scheduler(self) -> None:
        self._scheduler = SyncScheduler(CONFIG, self)
        self._scheduler.sync_requested.connect(self.trigger_sync)
        self._scheduler.countdown_tick.connect(self._on_countdown)
        self._scheduler.paused_changed.connect(self._on_paused_changed)
        self._scheduler.start()

    @pyqtSlot(int)
    def _on_countdown(self, remaining: int) -> None:
        m, s = divmod(remaining, 60)
        self._lbl_countdown.setText(f'Next sync in {m}m {s:02d}s')

    @pyqtSlot(bool)
    def _on_paused_changed(self, paused: bool) -> None:
        if self._tray:
            self._tray.update_pause_action(paused)
        if paused:
            self._lbl_countdown.setText('Auto-sync paused')
            self._set_status('paused', 'Paused')
        else:
            self._set_status('ok', 'Ready')

    def _on_interval_changed(self) -> None:
        self._scheduler.restart_with_new_interval()

    # ── Sync ──────────────────────────────────────────────────────────────────
    def trigger_sync(self) -> None:
        if self._syncing:
            return
        self._syncing = True
        self._set_status('syncing', 'Syncing…')
        self._tab_dash.on_sync_started()
        if self._tray:
            self._tray.set_status('syncing')

        self._worker = _SyncWorker()
        self._worker.log_signal.connect(self._tab_dash.append_live_log)
        self._worker.result_signal.connect(self._on_sync_done)
        self._worker.start()

    @pyqtSlot(dict)
    def _on_sync_done(self, result: dict) -> None:
        self._syncing = False
        self._scheduler.reset_countdown()
        self._tab_dash.on_sync_finished(result)
        self._tab_dash.refresh()

        status = result.get('status', 'error')
        msg    = result.get('message', '')
        self._set_status(status, msg[:60])
        self._lbl_last_sync.setText(
            f"Last sync: {status.upper()}  {result.get('users_synced', 0)} users  "
            f"{result.get('punches_synced', 0)} punches"
        )
        if self._tray:
            self._tray.set_status(status)
            if status == 'error':
                self._tray.show_message('Sync Failed', msg[:120])

    def _set_status(self, status: str, text: str = '') -> None:
        colors = {
            'ok': '#69F0AE', 'success': '#69F0AE',
            'warning': '#FFD740', 'error': '#FF5252',
            'syncing': '#40C4FF',  'paused': '#B0BEC5',
        }
        dot_color = colors.get(status, '#B0BEC5')
        self._lbl_dot.setStyleSheet(f'color: {dot_color}; font-size: 18px;')
        if text:
            self._lbl_status_text.setText(text[:50])

    # ── Tray bridge ───────────────────────────────────────────────────────────
    def toggle_pause(self) -> None:
        self._scheduler.toggle_pause()

    # ── Close → minimize to tray ──────────────────────────────────────────────
    def closeEvent(self, event: QCloseEvent) -> None:
        event.ignore()
        self.hide()
        if self._tray:
            self._tray.show_message(
                'FCH Bio Sync',
                'Still running in the background. Right-click the tray icon to exit.',
            )
