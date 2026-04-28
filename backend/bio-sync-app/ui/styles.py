"""
Global QSS stylesheet — clean professional light theme.
"""

PRIMARY   = '#1565C0'
PRIMARY_H = '#1976D2'
PRIMARY_P = '#0D47A1'
BG        = '#F3F6FB'
CARD      = '#FFFFFF'
BORDER    = '#DCE3ED'
TEXT      = '#1A2340'
MUTED     = '#6B7A99'
SUCCESS   = '#2E7D32'
ERROR_C   = '#C62828'
WARNING_C = '#E65100'

STYLESHEET = f"""
/* ── Global ──────────────────────────────────────────────────────────────── */
QWidget {{
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 13px;
    color: {TEXT};
    background-color: {BG};
}}
QMainWindow, QDialog {{
    background-color: {BG};
}}

/* ── QTabWidget ──────────────────────────────────────────────────────────── */
QTabWidget::pane {{
    border: 1px solid {BORDER};
    border-top: none;
    background: {BG};
}}
QTabBar::tab {{
    background: transparent;
    color: {MUTED};
    padding: 10px 22px;
    border: none;
    border-bottom: 2px solid transparent;
    margin-right: 2px;
    font-weight: 500;
    font-size: 13px;
}}
QTabBar::tab:selected {{
    color: {PRIMARY};
    border-bottom: 2px solid {PRIMARY};
    background: transparent;
}}
QTabBar::tab:hover:!selected {{
    color: {TEXT};
    background: rgba(21,101,192,0.06);
    border-radius: 4px 4px 0 0;
}}
QTabWidget > QWidget > QTabBar {{
    background: {CARD};
    border-bottom: 1px solid {BORDER};
}}

/* ── QPushButton ─────────────────────────────────────────────────────────── */
QPushButton {{
    background-color: {PRIMARY};
    color: white;
    border: none;
    padding: 7px 18px;
    border-radius: 6px;
    font-weight: 600;
    min-height: 30px;
}}
QPushButton:hover   {{ background-color: {PRIMARY_H}; }}
QPushButton:pressed {{ background-color: {PRIMARY_P}; }}
QPushButton:disabled {{ background-color: #B0BEC5; color: #ECEFF1; }}

QPushButton#btn_secondary {{
    background-color: transparent;
    color: {PRIMARY};
    border: 1.5px solid {PRIMARY};
}}
QPushButton#btn_secondary:hover {{ background-color: rgba(21,101,192,0.07); }}
QPushButton#btn_secondary:disabled {{ border-color: #B0BEC5; color: #B0BEC5; }}

QPushButton#btn_danger {{
    background-color: {ERROR_C};
}}
QPushButton#btn_danger:hover {{ background-color: #D32F2F; }}

QPushButton#btn_small {{
    padding: 4px 12px;
    font-size: 12px;
    min-height: 24px;
}}

/* ── QLineEdit ───────────────────────────────────────────────────────────── */
QLineEdit {{
    background: {CARD};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 13px;
    color: {TEXT};
}}
QLineEdit:focus {{
    border: 1.5px solid {PRIMARY};
}}
QLineEdit:disabled {{
    background: #ECEFF1;
    color: {MUTED};
}}

/* ── QSpinBox ────────────────────────────────────────────────────────────── */
QSpinBox {{
    background: {CARD};
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 6px 10px;
}}
QSpinBox:focus {{ border: 1.5px solid {PRIMARY}; }}

/* ── QCheckBox ───────────────────────────────────────────────────────────── */
QCheckBox {{
    spacing: 8px;
    color: {TEXT};
}}
QCheckBox::indicator {{
    width: 17px;
    height: 17px;
    border: 1.5px solid {BORDER};
    border-radius: 4px;
    background: white;
}}
QCheckBox::indicator:checked {{
    background-color: {PRIMARY};
    border-color: {PRIMARY};
}}
QCheckBox::indicator:hover {{
    border-color: {PRIMARY};
}}

/* ── QTableWidget ────────────────────────────────────────────────────────── */
QTableWidget {{
    background: {CARD};
    border: none;
    gridline-color: {BORDER};
    selection-background-color: rgba(21,101,192,0.09);
    selection-color: {TEXT};
    alternate-background-color: #F8F9FC;
}}
QTableWidget::item {{
    padding: 6px 10px;
    border: none;
}}
QTableWidget::item:selected {{
    background: rgba(21,101,192,0.09);
    color: {TEXT};
}}
QHeaderView::section {{
    background: #EDF0F7;
    color: {MUTED};
    font-weight: 700;
    font-size: 11px;
    padding: 7px 10px;
    border: none;
    border-bottom: 1px solid {BORDER};
    text-transform: uppercase;
    letter-spacing: 0.3px;
}}

/* ── QScrollBar ──────────────────────────────────────────────────────────── */
QScrollBar:vertical {{
    background: transparent;
    width: 8px;
    margin: 0;
}}
QScrollBar::handle:vertical {{
    background: #CBD5E0;
    border-radius: 4px;
    min-height: 30px;
}}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
QScrollBar:horizontal {{
    background: transparent;
    height: 8px;
}}
QScrollBar::handle:horizontal {{
    background: #CBD5E0;
    border-radius: 4px;
    min-width: 30px;
}}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{ width: 0; }}

/* ── QGroupBox ───────────────────────────────────────────────────────────── */
QGroupBox {{
    font-weight: 700;
    font-size: 12px;
    border: 1px solid {BORDER};
    border-radius: 9px;
    margin-top: 14px;
    padding: 14px 14px 10px 14px;
    background: {CARD};
}}
QGroupBox::title {{
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 14px;
    padding: 0 4px;
    color: {PRIMARY};
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

/* ── QLabel ──────────────────────────────────────────────────────────────── */
QLabel#lbl_stat_value {{
    font-size: 28px;
    font-weight: 700;
    color: {TEXT};
}}
QLabel#card_title {{
    font-weight: 700;
    font-size: 13px;
    color: {TEXT};
}}

/* ── QStatusBar ──────────────────────────────────────────────────────────── */
QStatusBar {{
    background: #EDF0F7;
    color: {MUTED};
    border-top: 1px solid {BORDER};
    font-size: 12px;
    padding: 2px 10px;
}}
QStatusBar::item {{ border: none; }}

/* ── QTextEdit (live log console) ────────────────────────────────────────── */
QTextEdit {{
    background: #0F1926;
    color: #A8FF78;
    font-family: "Consolas", "Lucida Console", monospace;
    font-size: 11px;
    border: 1px solid {BORDER};
    border-radius: 6px;
    padding: 8px;
}}

/* ── QSlider ─────────────────────────────────────────────────────────────── */
QSlider::groove:horizontal {{
    height: 4px;
    background: {BORDER};
    border-radius: 2px;
}}
QSlider::handle:horizontal {{
    background: {PRIMARY};
    width: 16px;
    height: 16px;
    border-radius: 8px;
    margin: -6px 0;
}}
QSlider::sub-page:horizontal {{
    background: {PRIMARY};
    border-radius: 2px;
}}

/* ── QScrollArea ─────────────────────────────────────────────────────────── */
QScrollArea {{ border: none; background: transparent; }}
QScrollArea > QWidget > QWidget {{ background: transparent; }}

/* ── QFrame card ─────────────────────────────────────────────────────────── */
QFrame#card {{
    background: {CARD};
    border: 1px solid {BORDER};
    border-radius: 10px;
}}

/* ── Login dialog ────────────────────────────────────────────────────────── */
QDialog#login_dialog {{
    background: {CARD};
}}

/* ── QSplitter ───────────────────────────────────────────────────────────── */
QSplitter::handle {{ background: {BORDER}; }}

/* ── QToolTip ────────────────────────────────────────────────────────────── */
QToolTip {{
    background: #1A2340;
    color: white;
    border: 1px solid #1565C0;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
}}
"""
