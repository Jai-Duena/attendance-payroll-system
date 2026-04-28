"""
ZKTeco sync engine — device → local MySQL.
Ported and refactored from bio_sync.py; accepts a Config and an optional
progress callback so the GUI can display live log lines.
"""
from __future__ import annotations

import logging
import traceback
from datetime import datetime
from typing import Callable

from zk import ZK

from core.config import Config, LOG_PATH
from core.db import get_local_db

# ── File logger ──────────────────────────────────────────────────────────────
_logger = logging.getLogger('bio_sync')
if not _logger.handlers:
    _handler = logging.FileHandler(str(LOG_PATH), encoding='utf-8')
    _handler.setFormatter(
        logging.Formatter('[%(asctime)s] %(levelname)s: %(message)s', '%Y-%m-%d %H:%M:%S')
    )
    _logger.setLevel(logging.INFO)
    _logger.addHandler(_handler)

# ── ZKTeco code maps ─────────────────────────────────────────────────────────
PUNCH_LABELS  = {0: 'Time In', 1: 'Time Out', 2: 'Break Out', 3: 'Break In', 4: 'OT In',  5: 'OT Out'}
VERIFY_LABELS = {0: 'Fingerprint', 1: 'Fingerprint', 2: 'Face', 4: 'Card', 6: 'Password', 15: 'Face'}


def _log(msg: str, level: str = 'info', cb: Callable | None = None) -> None:
    getattr(_logger, level)(msg)
    if cb:
        ts = datetime.now().strftime('%H:%M:%S')
        cb(f'[{ts}] {msg}')


def _write_log(db, status: str, msg: str, users: int = 0, punches: int = 0) -> None:
    try:
        cur = db.cursor()
        cur.execute(
            "INSERT INTO fch_bio_sync_log "
            "(status, message, users_synced, punches_synced, created_at) "
            "VALUES (%s, %s, %s, %s, NOW())",
            (status, msg[:1000], users, punches),
        )
        # Trim to 500 most-recent rows
        cur.execute("""
            DELETE FROM fch_bio_sync_log
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM fch_bio_sync_log ORDER BY id DESC LIMIT 500
                ) _t
            )
        """)
        db.commit()
        cur.close()
    except Exception as exc:
        _logger.error(f'write_log error: {exc}')


def _sync_users(db, conn, cb: Callable | None) -> tuple[int, dict]:
    _log('Fetching users from device…', cb=cb)
    users = conn.get_users()
    _log(f'  {len(users)} user(s) on device.', cb=cb)

    cur = db.cursor()
    for u in users:
        cur.execute(
            """
            INSERT INTO fch_bio_users
                (uid, device_user_id, name, privilege, card, last_synced_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                uid=VALUES(uid), name=VALUES(name),
                privilege=VALUES(privilege), card=VALUES(card),
                last_synced_at=NOW()
            """,
            (u.uid, str(u.user_id), u.name or '', u.privilege, u.card or ''),
        )

    # Auto-map device users whose ID is a plain number matching an employee ID
    cur.execute("""
        UPDATE fch_bio_users
        SET employee_id = CAST(device_user_id AS UNSIGNED)
        WHERE device_user_id REGEXP '^[0-9]+$'
          AND CAST(device_user_id AS UNSIGNED) > 0
          AND employee_id IS NULL
    """)
    mapped = cur.rowcount
    if mapped > 0:
        _log(f'  Auto-mapped {mapped} user(s) by numeric ID.', cb=cb)

    db.commit()
    cur.close()

    cur2 = db.cursor()
    cur2.execute("SELECT device_user_id, employee_id FROM fch_bio_users WHERE employee_id IS NOT NULL")
    user_map = {row[0]: row[1] for row in cur2.fetchall()}
    cur2.close()
    _log(f'  {len(user_map)} user(s) mapped to employees.', cb=cb)
    return len(users), user_map


def _sync_attendance(db, conn, user_map: dict, cb: Callable | None) -> int:
    _log('Fetching attendance from device…', cb=cb)
    records = conn.get_attendance()
    _log(f'  {len(records)} attendance record(s) on device.', cb=cb)

    cur = db.cursor()
    inserted = 0
    for att in records:
        dev_uid    = str(att.user_id)
        emp_id     = user_map.get(dev_uid)
        punch_type = PUNCH_LABELS.get(att.punch,  str(att.punch))
        verifycode = VERIFY_LABELS.get(att.status, str(att.status))
        try:
            cur.execute(
                "INSERT IGNORE INTO fch_punches "
                "(employee_id, punch_time, device_user_id, punch_type, verifycode, processed) "
                "VALUES (%s, %s, %s, %s, %s, 0)",
                (emp_id, att.timestamp, dev_uid, punch_type, verifycode),
            )
            if cur.rowcount > 0:
                inserted += 1
        except Exception as exc:
            _logger.warning(f'Skipped punch ({dev_uid} @ {att.timestamp}): {exc}')

    db.commit()
    cur.close()
    _log(f'  {inserted} new punch(es) inserted.', cb=cb)

    # Backfill employee_id on punches that were stored before the user was mapped
    if user_map:
        cur2 = db.cursor()
        total_bf = 0
        for dev_uid, emp_id in user_map.items():
            cur2.execute(
                "UPDATE fch_punches SET employee_id=%s WHERE device_user_id=%s AND employee_id IS NULL",
                (emp_id, dev_uid),
            )
            total_bf += cur2.rowcount
        db.commit()
        cur2.close()
        if total_bf > 0:
            _log(f'  Backfilled employee_id on {total_bf} punch(es).', cb=cb)

    return inserted


def test_device_connection(config: Config) -> tuple[bool, str]:
    """Try to ping/connect to the ZKTeco device. Returns (success, message)."""
    ip      = config.get('device_ip')
    port    = int(config.get('device_port'))
    timeout = int(config.get('device_timeout'))
    zk = ZK(ip, port=port, timeout=timeout, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        conn.enable_device()
        return True, f"Connected to {ip}:{port} successfully."
    except Exception as exc:
        return False, str(exc)
    finally:
        try:
            if conn:
                conn.disconnect()
        except Exception:
            pass


def run_sync(config: Config, log_callback: Callable | None = None) -> dict:
    """
    Full sync cycle: device → local MySQL, then optionally chain web sync.
    Returns:
        { status: 'success'|'warning'|'error',
          message: str,
          users_synced: int,
          punches_synced: int }
    """
    cb = log_callback
    _log('=' * 55, cb=cb)
    _log('Sync starting…', cb=cb)

    try:
        db = get_local_db(config)
    except Exception as exc:
        msg = f'DB connection failed: {exc}'
        _log(msg, 'error', cb)
        return {'status': 'error', 'message': msg, 'users_synced': 0, 'punches_synced': 0}

    ip      = config.get('device_ip')
    port    = int(config.get('device_port'))
    timeout = int(config.get('device_timeout'))
    do_web  = config.get('chain_web_sync', True)
    _log(f'Device: {ip}:{port}  timeout={timeout}s', cb=cb)

    zk   = ZK(ip, port=port, timeout=timeout, password=0, force_udp=False, ommit_ping=False)
    conn = None

    try:
        _log(f'Connecting to ZKTeco at {ip}:{port}…', cb=cb)
        conn = zk.connect()
        conn.disable_device()
        _log('Connected.', cb=cb)

        users_synced, user_map = _sync_users(db, conn, cb)
        punches_synced = _sync_attendance(db, conn, user_map, cb)

        msg = f'OK — {users_synced} user(s), {punches_synced} new punch(es).'
        _log(msg, cb=cb)
        _write_log(db, 'success', msg, users_synced, punches_synced)
        result = {'status': 'success', 'message': msg,
                  'users_synced': users_synced, 'punches_synced': punches_synced}

    except Exception as exc:
        msg = f'Sync failed: {exc}'
        _log(msg, 'error', cb)
        _log(traceback.format_exc(), 'error', cb)
        try:
            _write_log(db, 'error', msg[:1000])
        except Exception:
            pass
        result = {'status': 'error', 'message': msg, 'users_synced': 0, 'punches_synced': 0}

    finally:
        try:
            if conn:
                conn.enable_device()
                conn.disconnect()
        except Exception:
            pass
        try:
            db.close()
        except Exception:
            pass

    if result['status'] == 'success' and do_web:
        if punches_synced == 0:
            _log('No new punches from device — web sync skipped.', cb=cb)
        else:
            _log('Chaining web sync…', cb=cb)
            from core.web_sync import run_web_sync
            web = run_web_sync(config, cb)
            if web['status'] != 'success':
                result['status'] = 'warning'
                result['message'] += f"  |  Web sync: {web['message']}"

    return result
