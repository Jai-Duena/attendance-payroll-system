"""
Database helpers — local XAMPP MySQL only.
"""
from __future__ import annotations

import mysql.connector
from mysql.connector import MySQLConnection

from core.config import Config


def get_local_db(config: Config) -> MySQLConnection:
    """Return a new connection to the local XAMPP MySQL database."""
    return mysql.connector.connect(
        host=config.get('db_host'),
        port=int(config.get('db_port')),
        database=config.get('db_name'),
        user=config.get('db_user'),
        password=config.get('db_pass'),
        charset='utf8mb4',
        collation='utf8mb4_general_ci',
        autocommit=False,
        connection_timeout=10,
        use_pure=True,   # avoid C-extension issues with PyInstaller
    )


def test_db_connection(config: Config) -> tuple[bool, str]:
    """Try to connect; return (success, message)."""
    try:
        db = get_local_db(config)
        db.close()
        return True, "Connection successful."
    except Exception as exc:
        return False, str(exc)
