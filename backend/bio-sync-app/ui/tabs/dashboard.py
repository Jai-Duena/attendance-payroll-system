"""
Dashboard tab — stats cards, last sync summary, live log console, history table.
"""
from __future__ import annotations

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QFrame, QTableWidget, QTableWidgetItem, QTextEdit,
    QHeaderView, QScrollArea, QSizePolicy,
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, pyqtSlot
from PyQt6.QtGui import QFont, QColor

from core.config import CONFIG
from core.db import get_local_db


def _fmt(dt) -> str:
    s = str(dt) if dt else ''
    return s.replace('T', ' ')[:19] if s else '—'


def _make_card() -> QFrame:
    f = QFrame()
    f.setObjectName('card')
    f.setStyleSheet(
        'QFrame#card { background: white; border: 1px solid #DCE3ED; border-radius: 10px; }'
    )
    return f


class DashboardTab(QWidget):
    sync_requested = pyqtSignal()

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self._build_ui()
        # Auto-refresh every 30 s
        self._refresh_timer = QTimer(self)
        self._refresh_timer.setInterval(30_000)
        self._refresh_timer.timeout.connect(self.refresh)
        self._refresh_timer.start()
        self.refresh()

    # ── Build UI ──────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        outer.addWidget(scroll)

        content = QWidget()
        scroll.setWidget(content)
        layout = QVBoxLayout(content)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        # ── Stat cards ───────────────────────────────────────────────────────
        row = QHBoxLayout()
        row.setSpacing(12)
        self._c_punches  = _StatCard('Total Punches',  '—', '#1565C0')
        self._c_users    = _StatCard('Device Users',   '—', '#2E7D32')
        self._c_unmapped = _StatCard('Unmapped Users', '—', '#6B7A99')
        self._c_status   = _StatCard('Last Status',    '—', '#6B7A99')
        for c in (self._c_punches, self._c_users, self._c_unmapped, self._c_status):
            row.addWidget(c)
        layout.addLayout(row)

        # ── Last sync summary card ────────────────────────────────────────────
        self._last_card = _LastSyncCard()
        layout.addWidget(self._last_card)

        # ── Manual sync & live log ────────────────────────────────────────────
        ctrl = _make_card()
        cl = QVBoxLayout(ctrl)
        cl.setContentsMargins(16, 14, 16, 14)
        cl.setSpacing(10)

        hdr = QHBoxLayout()
        t = QLabel('Manual Sync')
        t.setObjectName('card_title')
        hdr.addWidget(t)
        hdr.addStretch()
        cl.addLayout(hdr)

        btn_row = QHBoxLayout()
        btn_row.setSpacing(12)
        self._btn_sync = QPushButton('⚡  Sync Now')
        self._btn_sync.setFixedWidth(148)
        self._btn_sync.clicked.connect(self.sync_requested)
        btn_row.addWidget(self._btn_sync)

        self._lbl_sync_st = QLabel('Idle')
        self._lbl_sync_st.setStyleSheet('color: #6B7A99; font-size: 12px;')
        btn_row.addWidget(self._lbl_sync_st)
        btn_row.addStretch()
        cl.addLayout(btn_row)

        self._live_log = QTextEdit()
        self._live_log.setReadOnly(True)
        self._live_log.setFixedHeight(130)
        self._live_log.setPlaceholderText('Sync output will appear here…')
        cl.addWidget(self._live_log)
        layout.addWidget(ctrl)

        # ── Recent logs table ─────────────────────────────────────────────────
        log_card = _make_card()
        ll = QVBoxLayout(log_card)
        ll.setContentsMargins(0, 0, 0, 0)
        ll.setSpacing(0)

        log_hdr = QHBoxLayout()
        log_hdr.setContentsMargins(16, 12, 12, 8)
        lh_title = QLabel('Recent Sync History  (last 20)')
        lh_title.setObjectName('card_title')
        log_hdr.addWidget(lh_title)
        log_hdr.addStretch()
        btn_ref = QPushButton('↻')
        btn_ref.setFixedSize(28, 28)
        btn_ref.setObjectName('btn_secondary')
        btn_ref.clicked.connect(self.refresh)
        log_hdr.addWidget(btn_ref)
        ll.addLayout(log_hdr)

        self._tbl = QTableWidget(0, 5)
        self._tbl.setHorizontalHeaderLabels(['Status', 'Time', 'Users', 'Punches', 'Message'])
        self._tbl.horizontalHeader().setStretchLastSection(True)
        for col in range(4):
            self._tbl.horizontalHeader().setSectionResizeMode(
                col, QHeaderView.ResizeMode.ResizeToContents
            )
        self._tbl.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self._tbl.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self._tbl.setAlternatingRowColors(True)
        self._tbl.verticalHeader().setVisible(False)
        self._tbl.setMinimumHeight(220)
        ll.addWidget(self._tbl)
        layout.addWidget(log_card)

    # ── Data loading ──────────────────────────────────────────────────────────
    def refresh(self) -> None:
        try:
            db  = get_local_db(CONFIG)
            cur = db.cursor(dictionary=True)

            cur.execute('SELECT COUNT(*) AS n FROM fch_punches')
            r = cur.fetchone()
            self._c_punches.set_value(f"{r['n']:,}" if r else '—')

            cur.execute('SELECT COUNT(*) AS n FROM fch_bio_users')
            r = cur.fetchone()
            self._c_users.set_value(str(r['n']) if r else '—')

            cur.execute('SELECT COUNT(*) AS n FROM fch_bio_users WHERE employee_id IS NULL')
            r = cur.fetchone()
            unmapped = r['n'] if r else 0
            self._c_unmapped.set_value(str(unmapped))
            self._c_unmapped.set_color('#C62828' if unmapped > 0 else '#2E7D32')

            cur.execute('SELECT * FROM fch_bio_sync_log ORDER BY id DESC LIMIT 1')
            last = cur.fetchone()
            if last:
                sc = {'success': '#2E7D32', 'error': '#C62828', 'warning': '#E65100'}
                self._c_status.set_value(last['status'].capitalize())
                self._c_status.set_color(sc.get(last['status'], '#6B7A99'))
                self._last_card.update_row(last)
            else:
                self._c_status.set_value('—')

            cur.execute('SELECT * FROM fch_bio_sync_log ORDER BY id DESC LIMIT 20')
            logs = cur.fetchall()
            cur.close()
            db.close()
            self._fill_table(logs)
        except Exception as exc:
            self._c_status.set_value('DB Error')
            self._c_status.set_color('#C62828')

    def _fill_table(self, logs: list) -> None:
        sc = {'success': '#2E7D32', 'error': '#C62828', 'warning': '#E65100'}
        self._tbl.setRowCount(len(logs))
        for i, row in enumerate(logs):
            si = QTableWidgetItem(row['status'].capitalize())
            si.setForeground(QColor(sc.get(row['status'], '#6B7A99')))
            si.setFont(QFont('Segoe UI', 9, QFont.Weight.Bold))
            self._tbl.setItem(i, 0, si)
            self._tbl.setItem(i, 1, QTableWidgetItem(_fmt(row['created_at'])))
            self._tbl.setItem(i, 2, QTableWidgetItem(str(row['users_synced'])))
            self._tbl.setItem(i, 3, QTableWidgetItem(str(row['punches_synced'])))
            mi = QTableWidgetItem(row['message'] or '—')
            mi.setToolTip(row['message'] or '')
            self._tbl.setItem(i, 4, mi)

    # ── Sync lifecycle ────────────────────────────────────────────────────────
    def on_sync_started(self) -> None:
        self._btn_sync.setEnabled(False)
        self._btn_sync.setText('Syncing…')
        self._lbl_sync_st.setText('Running…')
        self._lbl_sync_st.setStyleSheet('color: #1565C0; font-size: 12px;')
        self._live_log.clear()

    def on_sync_finished(self, result: dict) -> None:
        self._btn_sync.setEnabled(True)
        self._btn_sync.setText('⚡  Sync Now')
        status = result.get('status', 'error')
        msg    = result.get('message', '')
        sc     = {'success': '#2E7D32', 'error': '#C62828', 'warning': '#E65100'}
        color  = sc.get(status, '#6B7A99')
        self._lbl_sync_st.setStyleSheet(f'color: {color}; font-size: 12px; font-weight: 600;')
        self._lbl_sync_st.setText(f'{status.capitalize()}: {msg[:80]}')

    @pyqtSlot(str)
    def append_live_log(self, msg: str) -> None:
        self._live_log.append(msg)
        sb = self._live_log.verticalScrollBar()
        sb.setValue(sb.maximum())


# ── Helper widgets ────────────────────────────────────────────────────────────
class _StatCard(QFrame):
    def __init__(self, label: str, value: str, color: str) -> None:
        super().__init__()
        self.setObjectName('card')
        self.setStyleSheet(
            'QFrame#card { background: white; border: 1px solid #DCE3ED; border-radius: 10px; }'
        )
        self.setMinimumHeight(90)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 14, 16, 14)
        layout.setSpacing(6)

        self._lbl_lbl = QLabel(label.upper())
        self._lbl_lbl.setStyleSheet(
            'color: #6B7A99; font-size: 10px; font-weight: 700; letter-spacing: 0.6px;'
        )
        layout.addWidget(self._lbl_lbl)

        self._lbl_val = QLabel(value)
        self._lbl_val.setStyleSheet(
            f'color: {color}; font-size: 28px; font-weight: 700;'
        )
        layout.addWidget(self._lbl_val)

    def set_value(self, v: str) -> None:
        self._lbl_val.setText(v)

    def set_color(self, c: str) -> None:
        self._lbl_val.setStyleSheet(f'color: {c}; font-size: 28px; font-weight: 700;')


class _LastSyncCard(QFrame):
    def __init__(self) -> None:
        super().__init__()
        self.setObjectName('card')
        self.setStyleSheet(
            'QFrame#card { background: white; border: 1px solid #DCE3ED; border-radius: 10px; }'
        )
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 14, 16, 14)
        layout.setSpacing(10)

        t = QLabel('Last Sync Summary')
        t.setObjectName('card_title')
        layout.addWidget(t)

        row = QHBoxLayout()
        row.setSpacing(0)
        self._cells: dict[str, QLabel] = {}
        for field in ('Status', 'Time', 'Users Synced', 'New Punches', 'Message'):
            cell = QWidget()
            cl = QVBoxLayout(cell)
            cl.setContentsMargins(0, 0, 24, 0)
            cl.setSpacing(3)
            lf = QLabel(field)
            lf.setStyleSheet('color: #6B7A99; font-size: 11px;')
            lv = QLabel('—')
            lv.setWordWrap(True)
            cl.addWidget(lf)
            cl.addWidget(lv)
            self._cells[field] = lv
            row.addWidget(cell)
        layout.addLayout(row)

    def update_row(self, row: dict) -> None:
        sc = {'success': '#2E7D32', 'error': '#C62828', 'warning': '#E65100'}
        st = row.get('status', '')
        self._cells['Status'].setText(st.capitalize())
        self._cells['Status'].setStyleSheet(
            f"color: {sc.get(st, '#6B7A99')}; font-weight: 700;"
        )
        self._cells['Time'].setText(_fmt(row.get('created_at')))
        self._cells['Users Synced'].setText(str(row.get('users_synced', '—')))
        self._cells['New Punches'].setText(str(row.get('punches_synced', '—')))
        self._cells['Message'].setText((row.get('message') or '—')[:100])
