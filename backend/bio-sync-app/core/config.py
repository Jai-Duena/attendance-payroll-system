"""
Configuration — JSON-backed settings stored in %APPDATA%\\FamilyCareBioSync\\
"""
from __future__ import annotations

import sys
import os
import json
import hashlib
import logging
from pathlib import Path
from typing import Any


# ── App-data directory  (survives updates, no admin needed) ─────────────────
APP_DATA_DIR: Path = Path(os.getenv('APPDATA', '')) / 'FamilyCareBioSync'
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

CONFIG_PATH: Path = APP_DATA_DIR / 'config.json'
LOG_PATH:    Path = APP_DATA_DIR / 'bio_sync.log'


# ── Resource-path helper (works in dev and bundled .exe) ─────────────────────
def resource_path(*parts: str) -> str:
    base = getattr(sys, '_MEIPASS', None) or os.path.dirname(os.path.abspath(__file__))
    # If running from core/, go up one level to reach assets/
    if not getattr(sys, '_MEIPASS', None):
        base = os.path.dirname(base)
    return os.path.join(base, *parts)


# ── Defaults ─────────────────────────────────────────────────────────────────
_DEFAULT_PW_HASH = hashlib.sha256(b'admin123').hexdigest()

DEFAULTS: dict[str, Any] = {
    # Auth
    'password_hash':        _DEFAULT_PW_HASH,
    'first_run':            True,

    # Local XAMPP MySQL
    'db_host':              'localhost',
    'db_port':              3306,
    'db_name':              'family_care',
    'db_user':              'zkteco',
    'db_pass':              'Family Care',

    # ZKTeco device
    'device_ip':            '192.168.1.201',
    'device_port':          4370,
    'device_timeout':       10,

    # Sync scheduler
    'sync_interval_minutes': 2,
    'chain_web_sync':        True,

    # FTP / web host
    'ftp_host':    'ftpupload.net',
    'ftp_user':    'if0_40965702',
    'ftp_pass':    'clRx4wLpE8gM',
    'ftp_remote':  '/htdocs/backend/sync/punches.sql',
    'trigger_url': 'https://familycarehospital.ct.ws/backend/sync/trigger.php',
    'trigger_key': 'FCHsync2026xK9mP',

    # Web-sync cursor (last fch_punches.id successfully pushed)
    'last_synced_id': 0,

    # App behaviour
    'auto_start':      False,
    'start_minimized': False,
}


# ── Config class ─────────────────────────────────────────────────────────────
class Config:
    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self.load()

    def load(self) -> None:
        if CONFIG_PATH.exists():
            try:
                with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                    self._data = json.load(f)
            except Exception:
                self._data = {}
        for k, v in DEFAULTS.items():
            if k not in self._data:
                self._data[k] = v
        self.save()

    def save(self) -> None:
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(self._data, f, indent=2)

    def get(self, key: str, fallback: Any = None) -> Any:
        return self._data.get(key, fallback if fallback is not None else DEFAULTS.get(key))

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value
        self.save()

    def update(self, updates: dict[str, Any]) -> None:
        self._data.update(updates)
        self.save()

    # ── Password helpers ─────────────────────────────────────────────────────
    @staticmethod
    def _hash(pw: str) -> str:
        return hashlib.sha256(pw.encode()).hexdigest()

    def verify_password(self, pw: str) -> bool:
        return self._hash(pw) == self._data.get('password_hash', '')

    def change_password(self, new_pw: str) -> None:
        self._data['password_hash'] = self._hash(new_pw)
        self._data['first_run'] = False
        self.save()


CONFIG = Config()
