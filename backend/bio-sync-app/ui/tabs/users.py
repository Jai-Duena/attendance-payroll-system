"""
Users tab — view and manually map/unmap device users to employees.
"""
from __future__ import annotations

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QTableWidget, QTableWidgetItem, QHeaderView,
    QDialog, QLineEdit, QMessageBox,
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QFont

from core.config import CONFIG
from core.db import get_local_db

_PRIV = {0: 'User', 2: 'Enroller', 6: 'Manager', 14: 'Admin'}


def _fmt(dt) -> str:
    s = str(dt) if dt else ''
    return s.replace('T', ' ')[:16] if s else '—'


class UsersTab(QWidget):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._users: list[dict] = []
        self._build_ui()
        self._load()

    # ── UI ────────────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        # Info banner
        banner = QLabel(
            '<b>User Mapping:</b> Device users are automatically linked to employees when the '
            'device User ID matches the employee ID number. '
            'Use this table to manually set or override mappings. '
            'Punches from unmapped users are stored but excluded from attendance calculations.'
        )
        banner.setWordWrap(True)
        banner.setStyleSheet(
            'background: #E3F2FD; border: 1px solid #90CAF9; border-radius: 7px; '
            'padding: 10px 14px; color: #1565C0; font-size: 12px;'
        )
        layout.addWidget(banner)

        self._lbl_err = QLabel('')
        self._lbl_err.setStyleSheet('color: #C62828;')
        self._lbl_ok  = QLabel('')
        self._lbl_ok.setStyleSheet('color: #2E7D32;')
        layout.addWidget(self._lbl_err)
        layout.addWidget(self._lbl_ok)

        # Toolbar
        tbar = QHBoxLayout()
        btn_ref = QPushButton('↻  Refresh')
        btn_ref.setObjectName('btn_secondary')
        btn_ref.setFixedWidth(108)
        btn_ref.clicked.connect(self._load)
        tbar.addWidget(btn_ref)
        tbar.addStretch()
        layout.addLayout(tbar)

        # Table card
        card = QFrame()
        card.setObjectName('card')
        card.setStyleSheet(
            'QFrame#card { background: white; border: 1px solid #DCE3ED; border-radius: 10px; }'
        )
        cl = QVBoxLayout(card)
        cl.setContentsMargins(0, 0, 0, 0)

        self._tbl = QTableWidget(0, 7)
        self._tbl.setHorizontalHeaderLabels(
            ['UID', 'Device User ID', 'Name on Device', 'Privilege',
             'Mapped Employee', 'Last Synced', 'Action']
        )
        hh = self._tbl.horizontalHeader()
        hh.setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        hh.setSectionResizeMode(4, QHeaderView.ResizeMode.Stretch)
        self._tbl.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self._tbl.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self._tbl.setAlternatingRowColors(True)
        self._tbl.verticalHeader().setVisible(False)
        self._tbl.setMinimumHeight(300)
        cl.addWidget(self._tbl)
        layout.addWidget(card)

    # ── Data ──────────────────────────────────────────────────────────────────
    def _load(self) -> None:
        self._lbl_err.setText('')
        self._lbl_ok.setText('')
        try:
            db  = get_local_db(CONFIG)
            cur = db.cursor(dictionary=True)
            cur.execute("""
                SELECT b.*,
                       CONCAT(COALESCE(e.first_name,''), ' ', COALESCE(e.last_name,'')) AS emp_fullname
                FROM fch_bio_users b
                LEFT JOIN fch_employees e ON b.employee_id = e.employee_id
                ORDER BY b.uid ASC
            """)
            self._users = cur.fetchall()
            cur.close()
            db.close()
            self._fill_table()
        except Exception as exc:
            self._lbl_err.setText(f'Error loading users: {exc}')

    def _fill_table(self) -> None:
        self._tbl.setRowCount(len(self._users))
        for i, u in enumerate(self._users):
            self._tbl.setItem(i, 0, QTableWidgetItem(str(u.get('uid') or '')))
            self._tbl.setItem(i, 1, QTableWidgetItem(str(u.get('device_user_id') or '')))
            self._tbl.setItem(i, 2, QTableWidgetItem(u.get('name') or ''))

            priv_lbl = _PRIV.get(int(u.get('privilege') or 0), f"Level {u.get('privilege')}")
            pi = QTableWidgetItem(priv_lbl)
            pi.setForeground(QColor('#6B7A99'))
            self._tbl.setItem(i, 3, pi)

            if u.get('employee_id'):
                emp_text = f"#{u['employee_id']}"
                name = (u.get('emp_fullname') or '').strip()
                if name:
                    emp_text += f'  {name}'
                ei = QTableWidgetItem(emp_text)
                ei.setForeground(QColor('#2E7D32'))
            else:
                ei = QTableWidgetItem('Not mapped')
                ei.setForeground(QColor('#E65100'))
            self._tbl.setItem(i, 4, ei)

            self._tbl.setItem(i, 5, QTableWidgetItem(_fmt(u.get('last_synced_at'))))

            # Action button
            btn = QPushButton('Edit' if u.get('employee_id') else 'Map')
            btn.setObjectName('btn_small')
            btn.setFixedWidth(60)
            btn.clicked.connect(lambda _checked, idx=i: self._edit(idx))
            wrap = QWidget()
            wl   = QHBoxLayout(wrap)
            wl.setContentsMargins(4, 2, 4, 2)
            wl.addWidget(btn)
            self._tbl.setCellWidget(i, 6, wrap)

        self._tbl.resizeColumnToContents(0)
        self._tbl.resizeColumnToContents(1)

    # ── Mapping dialog ────────────────────────────────────────────────────────
    def _edit(self, idx: int) -> None:
        if idx >= len(self._users):
            return
        u   = self._users[idx]
        dlg = _MapDialog(u, parent=self)
        if dlg.exec() != QDialog.DialogCode.Accepted:
            return
        new_id = dlg.employee_id
        try:
            db  = get_local_db(CONFIG)
            cur = db.cursor()
            cur.execute(
                'UPDATE fch_bio_users SET employee_id = %s WHERE id = %s',
                (new_id, u['id']),
            )
            if new_id:
                cur.execute(
                    'UPDATE fch_punches SET employee_id = %s '
                    'WHERE device_user_id = %s AND employee_id IS NULL',
                    (new_id, u['device_user_id']),
                )
            else:
                cur.execute(
                    'UPDATE fch_punches SET employee_id = NULL '
                    'WHERE device_user_id = %s AND operator IS NULL',
                    (u['device_user_id'],),
                )
            db.commit()
            cur.close()
            db.close()
            self._lbl_ok.setText('Mapping updated.')
            QTimer.singleShot(3000, lambda: self._lbl_ok.setText(''))
            self._load()
        except Exception as exc:
            self._lbl_err.setText(f'Save error: {exc}')


class _MapDialog(QDialog):
    def __init__(self, user: dict, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle('Edit Employee Mapping')
        self.setFixedSize(340, 220)
        self.setModal(True)
        self.employee_id: int | None = None
        self._build_ui(user)

    def _build_ui(self, u: dict) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(22, 18, 22, 18)
        layout.setSpacing(10)

        info = QLabel(
            f'Device User: <b>{u.get("name") or "(no name)"}</b>  '
            f'(ID: {u.get("device_user_id")})'
        )
        info.setWordWrap(True)
        layout.addWidget(info)

        layout.addWidget(QLabel('Employee ID (leave blank to unmap):'))
        self._inp = QLineEdit()
        self._inp.setFixedHeight(38)
        cur_id = u.get('employee_id')
        if cur_id:
            self._inp.setText(str(cur_id))
        self._inp.setPlaceholderText('e.g. 42')
        self._inp.returnPressed.connect(self._save)
        layout.addWidget(self._inp)

        self._lbl_err = QLabel('')
        self._lbl_err.setStyleSheet('color: #C62828; font-size: 12px;')
        layout.addWidget(self._lbl_err)

        btns = QHBoxLayout()
        btn_save = QPushButton('Save')
        btn_save.setFixedHeight(36)
        btn_save.clicked.connect(self._save)
        btn_cancel = QPushButton('Cancel')
        btn_cancel.setObjectName('btn_secondary')
        btn_cancel.setFixedHeight(36)
        btn_cancel.clicked.connect(self.reject)
        btns.addWidget(btn_save)
        btns.addWidget(btn_cancel)
        layout.addLayout(btns)

    def _save(self) -> None:
        val = self._inp.text().strip()
        if val == '':
            self.employee_id = None
            self.accept()
            return
        try:
            n = int(val)
            if n <= 0:
                raise ValueError
            self.employee_id = n
            self.accept()
        except ValueError:
            self._lbl_err.setText('Enter a positive integer, or leave blank to unmap.')
