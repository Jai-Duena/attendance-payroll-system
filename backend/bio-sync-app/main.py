"""
FCH Bio Sync — Entry point
"""
import sys
import os
import ctypes

# Force UTF-8 stdio (important for ZK device output)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon


def _single_instance_check() -> bool:
    """Returns True if this is the only running instance."""
    mutex = ctypes.windll.kernel32.CreateMutexW(None, False, "Global\\FCHBioSync_Mutex_v1")
    return ctypes.windll.kernel32.GetLastError() != 183  # 183 = ERROR_ALREADY_EXISTS


def _resource(rel: str) -> str:
    if getattr(sys, '_MEIPASS', None):
        return os.path.join(sys._MEIPASS, rel)
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), rel)


def main() -> None:
    start_minimized = '--minimized' in sys.argv or '--tray' in sys.argv

    app = QApplication(sys.argv)
    app.setApplicationName("FCH Bio Sync")
    app.setApplicationVersion("1.0")
    app.setOrganizationName("Family Care Hospital")
    app.setQuitOnLastWindowClosed(False)   # Stay alive when window is hidden

    if not _single_instance_check():
        QMessageBox.information(
            None,
            "Already Running",
            "FCH Bio Sync is already running.\n"
            "Check the system tray (bottom-right corner of the taskbar).",
        )
        sys.exit(0)

    icon_path = _resource('assets/icon.ico')
    if os.path.exists(icon_path):
        app.setWindowIcon(QIcon(icon_path))

    from ui.styles import STYLESHEET
    app.setStyleSheet(STYLESHEET)

    # ── Login ────────────────────────────────────────────────────────────────
    from ui.login_window import LoginWindow
    login = LoginWindow()
    if login.exec() != LoginWindow.DialogCode.Accepted:
        sys.exit(0)

    # ── Main window + tray ───────────────────────────────────────────────────
    from ui.main_window import MainWindow
    from ui.tray import TrayManager

    window = MainWindow()
    tray = TrayManager(window, app)
    tray.setup()
    window.set_tray(tray)

    if start_minimized:
        tray.show_message("FCH Bio Sync started", "Running in the background — sync is active.")
    else:
        window.show()
        window.raise_()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
