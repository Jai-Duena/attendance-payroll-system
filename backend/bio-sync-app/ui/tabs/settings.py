"""
Settings tab — device, sync, database, web sync, auto-start, change password.
All settings are stored in config.json (no DB needed to read them).
"""
from __future__ import annotations

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGroupBox, QLabel, QLineEdit,
    QPushButton, QCheckBox, QSpinBox, QScrollArea, QFrame, QSlider,
    QDialog,
)
from PyQt6.QtCore import Qt, pyqtSignal

from core.config import CONFIG
from core.startup import set_auto_start, is_auto_start_enabled


class SettingsTab(QWidget):
    """All save operations write to CONFIG (config.json).  No DB required."""

    interval_changed = pyqtSignal()   # emitted when sync_interval_minutes is saved

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._build_ui()
        self._load_values()

    # ── UI ────────────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        outer.addWidget(scroll)

        content = QWidget()
        scroll.setWidget(content)
        main = QVBoxLayout(content)
        main.setContentsMargins(20, 20, 20, 20)
        main.setSpacing(16)

        main.addWidget(self._build_device_group())
        main.addWidget(self._build_sync_group())
        main.addWidget(self._build_db_group())
        main.addWidget(self._build_websync_group())
        main.addWidget(self._build_app_group())
        main.addWidget(self._build_security_group())
        main.addStretch()

    # ── Section builders ──────────────────────────────────────────────────────
    def _build_device_group(self) -> QGroupBox:
        g = QGroupBox('Device Connection (ZKTeco)')
        l = QVBoxLayout(g)
        l.setSpacing(10)

        row1 = QHBoxLayout()
        row1.addWidget(QLabel('IP Address:'), 1)
        self._inp_ip = QLineEdit()
        self._inp_ip.setFixedWidth(180)
        row1.addWidget(self._inp_ip, 2)
        row1.addWidget(QLabel('Port:'), 0)
        self._sp_port = QSpinBox()
        self._sp_port.setRange(1, 65535)
        self._sp_port.setFixedWidth(90)
        row1.addWidget(self._sp_port)
        row1.addStretch()
        l.addLayout(row1)

        row2 = QHBoxLayout()
        row2.addWidget(QLabel('Timeout (seconds):'), 1)
        self._sp_timeout = QSpinBox()
        self._sp_timeout.setRange(1, 120)
        self._sp_timeout.setFixedWidth(90)
        row2.addWidget(self._sp_timeout)
        row2.addStretch()
        l.addLayout(row2)

        row3 = QHBoxLayout()
        btn_test_dev = QPushButton('Test Device Connection')
        btn_test_dev.setObjectName('btn_secondary')
        btn_test_dev.setFixedWidth(200)
        btn_test_dev.clicked.connect(self._test_device)
        row3.addWidget(btn_test_dev)
        self._lbl_dev_result = QLabel('')
        row3.addWidget(self._lbl_dev_result)
        row3.addStretch()
        l.addLayout(row3)

        btn_save_dev = QPushButton('Save Device Settings')
        btn_save_dev.setFixedWidth(190)
        btn_save_dev.clicked.connect(self._save_device)
        l.addWidget(btn_save_dev)
        return g

    def _build_sync_group(self) -> QGroupBox:
        g = QGroupBox('Sync Scheduler')
        l = QVBoxLayout(g)
        l.setSpacing(10)

        row1 = QHBoxLayout()
        row1.addWidget(QLabel('Sync Interval:'), 0)
        self._sl_interval = QSlider(Qt.Orientation.Horizontal)
        self._sl_interval.setRange(1, 60)
        self._sl_interval.setFixedWidth(220)
        self._sl_interval.valueChanged.connect(
            lambda v: self._sp_interval.setValue(v)
        )
        row1.addWidget(self._sl_interval)
        self._sp_interval = QSpinBox()
        self._sp_interval.setRange(1, 60)
        self._sp_interval.setSuffix(' min')
        self._sp_interval.setFixedWidth(80)
        self._sp_interval.valueChanged.connect(self._sl_interval.setValue)
        row1.addWidget(self._sp_interval)
        row1.addStretch()
        l.addLayout(row1)

        self._chk_websync = QCheckBox('Chain web sync after device sync')
        self._chk_websync.setToolTip(
            'After pulling from the ZKTeco device, automatically push new punch rows '
            'to the remote web host via FTP.'
        )
        l.addWidget(self._chk_websync)

        btn_save_sync = QPushButton('Save Sync Settings')
        btn_save_sync.setFixedWidth(190)
        btn_save_sync.clicked.connect(self._save_sync)
        l.addWidget(btn_save_sync)
        self._lbl_sync_save = QLabel('')
        l.addWidget(self._lbl_sync_save)
        return g

    def _build_db_group(self) -> QGroupBox:
        g = QGroupBox('Local Database (XAMPP MySQL)')
        l = QVBoxLayout(g)
        l.setSpacing(10)

        fields = [
            ('Host:',     '_inp_db_host',  280),
            ('Database:', '_inp_db_name',  280),
            ('Username:', '_inp_db_user',  220),
        ]
        for lbl_text, attr, width in fields:
            rl = QHBoxLayout()
            rl.addWidget(QLabel(lbl_text), 1)
            inp = QLineEdit()
            inp.setFixedWidth(width)
            rl.addWidget(inp, 2)
            rl.addStretch()
            l.addLayout(rl)
            setattr(self, attr, inp)

        row_pass = QHBoxLayout()
        row_pass.addWidget(QLabel('Password:'), 1)
        self._inp_db_pass = QLineEdit()
        self._inp_db_pass.setEchoMode(QLineEdit.EchoMode.Password)
        self._inp_db_pass.setFixedWidth(220)
        row_pass.addWidget(self._inp_db_pass, 2)
        row_pass.addStretch()
        l.addLayout(row_pass)

        row_port = QHBoxLayout()
        row_port.addWidget(QLabel('Port:'), 1)
        self._sp_db_port = QSpinBox()
        self._sp_db_port.setRange(1, 65535)
        self._sp_db_port.setFixedWidth(90)
        row_port.addWidget(self._sp_db_port)
        row_port.addStretch()
        l.addLayout(row_port)

        row_btns = QHBoxLayout()
        btn_test_db = QPushButton('Test DB Connection')
        btn_test_db.setObjectName('btn_secondary')
        btn_test_db.setFixedWidth(180)
        btn_test_db.clicked.connect(self._test_db)
        row_btns.addWidget(btn_test_db)
        self._lbl_db_result = QLabel('')
        row_btns.addWidget(self._lbl_db_result)
        row_btns.addStretch()
        l.addLayout(row_btns)

        btn_save_db = QPushButton('Save Database Settings')
        btn_save_db.setFixedWidth(200)
        btn_save_db.clicked.connect(self._save_db)
        l.addWidget(btn_save_db)
        return g

    def _build_websync_group(self) -> QGroupBox:
        g = QGroupBox('Web Sync (FTP → Remote Host)')
        l = QVBoxLayout(g)
        l.setSpacing(10)
        note = QLabel(
            'These settings are used when "Chain web sync" is enabled. '
            'Punch records are FTP-uploaded as SQL then triggered via HTTP.'
        )
        note.setWordWrap(True)
        note.setStyleSheet('color: #6B7A99; font-size: 12px;')
        l.addWidget(note)

        ftp_fields = [
            ('FTP Host:',        '_inp_ftp_host',    250),
            ('FTP Username:',    '_inp_ftp_user',    220),
            ('FTP Remote Path:', '_inp_ftp_remote',  300),
            ('Trigger URL:',     '_inp_trigger_url', 340),
            ('Trigger Key:',     '_inp_trigger_key', 260),
        ]
        for lbl_text, attr, width in ftp_fields:
            rl = QHBoxLayout()
            rl.addWidget(QLabel(lbl_text), 1)
            inp = QLineEdit()
            inp.setFixedWidth(width)
            rl.addWidget(inp, 2)
            rl.addStretch()
            l.addLayout(rl)
            setattr(self, attr, inp)

        row_fpass = QHBoxLayout()
        row_fpass.addWidget(QLabel('FTP Password:'), 1)
        self._inp_ftp_pass = QLineEdit()
        self._inp_ftp_pass.setEchoMode(QLineEdit.EchoMode.Password)
        self._inp_ftp_pass.setFixedWidth(220)
        row_fpass.addWidget(self._inp_ftp_pass, 2)
        row_fpass.addStretch()
        l.addLayout(row_fpass)

        btn_save_ftp = QPushButton('Save Web Sync Settings')
        btn_save_ftp.setFixedWidth(200)
        btn_save_ftp.clicked.connect(self._save_websync)
        l.addWidget(btn_save_ftp)
        self._lbl_ftp_save = QLabel('')
        l.addWidget(self._lbl_ftp_save)
        return g

    def _build_app_group(self) -> QGroupBox:
        g = QGroupBox('Application Behaviour')
        l = QVBoxLayout(g)
        l.setSpacing(10)

        self._chk_autostart = QCheckBox('Start with Windows (recommended for servers)')
        self._chk_autostart.setToolTip(
            'Adds a registry key under HKCU\\...\\Run so the app auto-launches on login, '
            'minimized to the system tray.'
        )
        l.addWidget(self._chk_autostart)

        btn_save_app = QPushButton('Apply App Settings')
        btn_save_app.setFixedWidth(180)
        btn_save_app.clicked.connect(self._save_app)
        l.addWidget(btn_save_app)
        self._lbl_app_save = QLabel('')
        l.addWidget(self._lbl_app_save)
        return g

    def _build_security_group(self) -> QGroupBox:
        g = QGroupBox('Security')
        l = QVBoxLayout(g)
        btn_chpw = QPushButton('Change Password…')
        btn_chpw.setObjectName('btn_secondary')
        btn_chpw.setFixedWidth(180)
        btn_chpw.clicked.connect(self._change_password)
        l.addWidget(btn_chpw)
        return g

    # ── Load current values ───────────────────────────────────────────────────
    def _load_values(self) -> None:
        self._inp_ip.setText(CONFIG.get('device_ip'))
        self._sp_port.setValue(int(CONFIG.get('device_port')))
        self._sp_timeout.setValue(int(CONFIG.get('device_timeout')))

        iv = int(CONFIG.get('sync_interval_minutes', 2))
        self._sp_interval.setValue(iv)
        self._sl_interval.setValue(iv)
        self._chk_websync.setChecked(bool(CONFIG.get('chain_web_sync', True)))

        self._inp_db_host.setText(CONFIG.get('db_host'))
        self._inp_db_name.setText(CONFIG.get('db_name'))
        self._inp_db_user.setText(CONFIG.get('db_user'))
        self._inp_db_pass.setText(CONFIG.get('db_pass'))
        self._sp_db_port.setValue(int(CONFIG.get('db_port')))

        self._inp_ftp_host.setText(CONFIG.get('ftp_host'))
        self._inp_ftp_user.setText(CONFIG.get('ftp_user'))
        self._inp_ftp_pass.setText(CONFIG.get('ftp_pass'))
        self._inp_ftp_remote.setText(CONFIG.get('ftp_remote'))
        self._inp_trigger_url.setText(CONFIG.get('trigger_url'))
        self._inp_trigger_key.setText(CONFIG.get('trigger_key'))

        self._chk_autostart.setChecked(is_auto_start_enabled())

    # ── Save handlers ─────────────────────────────────────────────────────────
    def _save_device(self) -> None:
        CONFIG.update({
            'device_ip':      self._inp_ip.text().strip(),
            'device_port':    self._sp_port.value(),
            'device_timeout': self._sp_timeout.value(),
        })
        self._lbl_dev_result.setText('✔ Saved')
        self._lbl_dev_result.setStyleSheet('color: #2E7D32;')

    def _save_sync(self) -> None:
        old_iv = int(CONFIG.get('sync_interval_minutes', 2))
        new_iv = self._sp_interval.value()
        CONFIG.update({
            'sync_interval_minutes': new_iv,
            'chain_web_sync':        self._chk_websync.isChecked(),
        })
        self._lbl_sync_save.setText('✔ Saved')
        self._lbl_sync_save.setStyleSheet('color: #2E7D32;')
        if new_iv != old_iv:
            self.interval_changed.emit()

    def _save_db(self) -> None:
        CONFIG.update({
            'db_host': self._inp_db_host.text().strip(),
            'db_name': self._inp_db_name.text().strip(),
            'db_user': self._inp_db_user.text().strip(),
            'db_pass': self._inp_db_pass.text(),
            'db_port': self._sp_db_port.value(),
        })
        self._lbl_db_result.setText('✔ Saved')
        self._lbl_db_result.setStyleSheet('color: #2E7D32;')

    def _save_websync(self) -> None:
        CONFIG.update({
            'ftp_host':    self._inp_ftp_host.text().strip(),
            'ftp_user':    self._inp_ftp_user.text().strip(),
            'ftp_pass':    self._inp_ftp_pass.text(),
            'ftp_remote':  self._inp_ftp_remote.text().strip(),
            'trigger_url': self._inp_trigger_url.text().strip(),
            'trigger_key': self._inp_trigger_key.text().strip(),
        })
        self._lbl_ftp_save.setText('✔ Saved')
        self._lbl_ftp_save.setStyleSheet('color: #2E7D32;')

    def _save_app(self) -> None:
        enabled = self._chk_autostart.isChecked()
        ok, msg = set_auto_start(enabled)
        CONFIG.set('auto_start', enabled)
        self._lbl_app_save.setText(msg)
        self._lbl_app_save.setStyleSheet(
            'color: #2E7D32;' if ok else 'color: #C62828;'
        )

    # ── Test connections ──────────────────────────────────────────────────────
    def _test_db(self) -> None:
        self._lbl_db_result.setText('Testing…')
        from core.db import test_db_connection
        # Temporarily build a config-like snapshot for testing the entered values
        class _TmpCfg:
            def get(self, k, d=None):
                m = {
                    'db_host': self._inp_db_host.text().strip(),
                    'db_port': self._sp_db_port.value(),
                    'db_name': self._inp_db_name.text().strip(),
                    'db_user': self._inp_db_user.text().strip(),
                    'db_pass': self._inp_db_pass.text(),
                }
                return m.get(k, d)
        ok, msg = test_db_connection(_TmpCfg())
        self._lbl_db_result.setText(msg[:60])
        self._lbl_db_result.setStyleSheet('color: #2E7D32;' if ok else 'color: #C62828;')

    def _test_device(self) -> None:
        self._lbl_dev_result.setText('Testing…')
        from core.sync_engine import test_device_connection
        class _TmpCfg:
            def get(self, k, d=None):
                m = {
                    'device_ip':      self._inp_ip.text().strip(),
                    'device_port':    self._sp_port.value(),
                    'device_timeout': self._sp_timeout.value(),
                }
                return m.get(k, d)
        ok, msg = test_device_connection(_TmpCfg())
        self._lbl_dev_result.setText(msg[:70])
        self._lbl_dev_result.setStyleSheet('color: #2E7D32;' if ok else 'color: #C62828;')

    def _change_password(self) -> None:
        from ui.login_window import ChangePasswordDialog
        dlg = ChangePasswordDialog(forced=False, parent=self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self._lbl_app_save.setText('✔ Password changed.')
            self._lbl_app_save.setStyleSheet('color: #2E7D32;')
