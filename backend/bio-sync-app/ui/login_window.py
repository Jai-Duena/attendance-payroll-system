"""
Login window.  Shown at startup before the main window.
On first run a forced password-change dialog is presented before access is granted.
"""
from __future__ import annotations

import os

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QLineEdit, QPushButton,
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QPixmap, QFont

from core.config import CONFIG, resource_path


class LoginWindow(QDialog):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setObjectName('login_dialog')
        self.setWindowTitle('FCH Bio Sync — Login')
        self.setWindowFlags(Qt.WindowType.Dialog | Qt.WindowType.WindowCloseButtonHint)
        self.setFixedSize(360, 470)
        self.setModal(True)
        self._build_ui()

    # ── UI ────────────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(44, 32, 44, 28)
        layout.setSpacing(0)
        layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        # Logo
        logo_path = resource_path('assets', 'logo.png')
        lbl_logo  = QLabel()
        if os.path.exists(logo_path):
            pix = QPixmap(logo_path).scaledToHeight(
                90, Qt.TransformationMode.SmoothTransformation
            )
            lbl_logo.setPixmap(pix)
        else:
            lbl_logo.setText('FCH')
            lbl_logo.setFont(QFont('Segoe UI', 24, QFont.Weight.Bold))
        lbl_logo.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(lbl_logo)
        layout.addSpacing(18)

        # Title
        lbl_title = QLabel('Biometric Sync Manager')
        lbl_title.setFont(QFont('Segoe UI', 15, QFont.Weight.Bold))
        lbl_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_title.setStyleSheet('color: #1A2340;')
        layout.addWidget(lbl_title)

        lbl_sub = QLabel('Family Care Hospital')
        lbl_sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_sub.setStyleSheet('color: #6B7A99; font-size: 12px;')
        layout.addWidget(lbl_sub)
        layout.addSpacing(28)

        # Username
        self.inp_user = QLineEdit()
        self.inp_user.setPlaceholderText('Username')
        self.inp_user.setText('admin')
        self.inp_user.setFixedHeight(40)
        layout.addWidget(self.inp_user)
        layout.addSpacing(10)

        # Password
        self.inp_pass = QLineEdit()
        self.inp_pass.setPlaceholderText('Password')
        self.inp_pass.setEchoMode(QLineEdit.EchoMode.Password)
        self.inp_pass.setFixedHeight(40)
        self.inp_pass.returnPressed.connect(self._on_login)
        layout.addWidget(self.inp_pass)
        layout.addSpacing(8)

        # Error label
        self.lbl_error = QLabel('')
        self.lbl_error.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_error.setStyleSheet('color: #C62828; font-size: 12px;')
        self.lbl_error.setFixedHeight(16)
        layout.addWidget(self.lbl_error)
        layout.addSpacing(12)

        # Login button
        btn = QPushButton('Login')
        btn.setFixedHeight(42)
        btn.clicked.connect(self._on_login)
        layout.addWidget(btn)

        layout.addStretch()

        # Version
        lbl_ver = QLabel('v1.0')
        lbl_ver.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_ver.setStyleSheet('color: #B0BEC5; font-size: 11px;')
        layout.addWidget(lbl_ver)

    # ── Logic ─────────────────────────────────────────────────────────────────
    def _on_login(self) -> None:
        username = self.inp_user.text().strip()
        password = self.inp_pass.text()

        if username != 'admin' or not CONFIG.verify_password(password):
            self.lbl_error.setText('Invalid username or password.')
            self.inp_pass.clear()
            self.inp_pass.setFocus()
            return

        self.lbl_error.setText('')

        if CONFIG.get('first_run', True):
            dlg = ChangePasswordDialog(forced=True, parent=self)
            if dlg.exec() != QDialog.DialogCode.Accepted:
                return

        self.accept()


class ChangePasswordDialog(QDialog):
    """Standalone change-password dialog.  forced=True shows a warning banner."""

    def __init__(self, forced: bool = False, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle('Change Password')
        self.setFixedSize(320, 270)
        self.setModal(True)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(10)

        if forced:
            notice = QLabel(
                '⚠  First-run detected.\n'
                'Please set a new password before continuing.'
            )
            notice.setWordWrap(True)
            notice.setStyleSheet(
                'color: #E65100; font-weight: 600; font-size: 12px; '
                'background: #FFF3E0; border: 1px solid #FFAB40; '
                'border-radius: 6px; padding: 8px;'
            )
            layout.addWidget(notice)
            layout.addSpacing(6)

        layout.addWidget(QLabel('New Password:'))
        self.inp_new = QLineEdit()
        self.inp_new.setEchoMode(QLineEdit.EchoMode.Password)
        self.inp_new.setFixedHeight(38)
        layout.addWidget(self.inp_new)

        layout.addWidget(QLabel('Confirm Password:'))
        self.inp_confirm = QLineEdit()
        self.inp_confirm.setEchoMode(QLineEdit.EchoMode.Password)
        self.inp_confirm.setFixedHeight(38)
        self.inp_confirm.returnPressed.connect(self._save)
        layout.addWidget(self.inp_confirm)

        self.lbl_err = QLabel('')
        self.lbl_err.setStyleSheet('color: #C62828; font-size: 12px;')
        layout.addWidget(self.lbl_err)

        btn = QPushButton('Save Password')
        btn.setFixedHeight(38)
        btn.clicked.connect(self._save)
        layout.addWidget(btn)

    def _save(self) -> None:
        pw  = self.inp_new.text()
        pw2 = self.inp_confirm.text()
        if len(pw) < 6:
            self.lbl_err.setText('Password must be at least 6 characters.')
            return
        if pw != pw2:
            self.lbl_err.setText('Passwords do not match.')
            return
        CONFIG.change_password(pw)
        self.accept()
