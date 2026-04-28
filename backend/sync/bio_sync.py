#!/usr/bin/env python3
"""
bio_sync.py — ZKTeco Biometric Device → MySQL Sync
====================================================
1. Reads device settings (IP, port, timeout) from fch_bio_settings in MySQL.
2. Connects to the ZKTeco device via the ZK protocol (pyzk).
3. Syncs device users into fch_bio_users (upsert).
4. Auto-maps any bio user whose device_user_id matches an fch_employees.employee_id.
5. Fetches all attendance records and inserts new ones into fch_punches (INSERT IGNORE).
6. Logs the run result to fch_bio_sync_log.
7. Optionally chains to zkteco-sync.php (web sync) on success.

Run via Windows Task Scheduler every 2 minutes (see register-bio-sync-task.ps1).
"""

import sys
import os
import subprocess
import logging
import traceback
from datetime import datetime

# Force UTF-8 output so PHP's exec() captures valid UTF-8 bytes
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import mysql.connector
from zk import ZK

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
LOG_FILE     = os.path.join(SCRIPT_DIR, 'bio_sync.log')
PHP_EXE      = r'C:\xampp\php\php.exe'
WEB_SYNC_PHP = r'C:\xampp\htdocs\backend\api\attendance\zkteco-sync.php'
PYTHON_EXE   = r'C:\Python314\python.exe'

# ── Local MySQL credentials (same as .env) ────────────────────────────────────
DB_HOST    = 'localhost'
DB_PORT    = 3306
DB_NAME    = 'family_care'
DB_USER    = 'zkteco'
DB_PASS    = 'Family Care'

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)

# Punch type labels from ZKTeco numeric codes
PUNCH_LABELS = {
    0: 'Time In',
    1: 'Time Out',
    2: 'Break Out',
    3: 'Break In',
    4: 'OT In',
    5: 'OT Out',
}

# Verify method labels from ZKTeco numeric codes
VERIFY_LABELS = {
    0:  'Fingerprint',
    1:  'Fingerprint',
    2:  'Face',
    4:  'Card',
    6:  'Password',
    15: 'Face',
}


def log(msg: str, level: str = 'info') -> None:
    getattr(logger, level)(msg)
    print(f'[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}')


def get_db() -> mysql.connector.MySQLConnection:
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        charset='utf8mb4',
        collation='utf8mb4_general_ci',
        autocommit=False,
        connection_timeout=10,
    )


def read_settings(db) -> dict:
    """Read device settings from fch_bio_settings, with safe defaults."""
    defaults = {
        'device_ip':             '192.168.1.201',
        'device_port':           '4370',
        'device_timeout':        '10',
        'chain_web_sync':        '1',
    }
    try:
        cur = db.cursor()
        cur.execute("SELECT setting_key, setting_value FROM fch_bio_settings")
        for key, val in cur.fetchall():
            defaults[key] = val or defaults.get(key, '')
        cur.close()
    except Exception as e:
        log(f'Could not read fch_bio_settings (using defaults): {e}', 'warning')
    return defaults


def write_log(db, status: str, message: str, users: int = 0, punches: int = 0) -> None:
    try:
        cur = db.cursor()
        cur.execute(
            "INSERT INTO fch_bio_sync_log (status, message, users_synced, punches_synced, created_at)"
            " VALUES (%s, %s, %s, %s, NOW())",
            (status, message[:1000], users, punches)
        )
        # Keep only the 500 most recent rows
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
    except Exception as e:
        logger.error(f'write_log error: {e}')


def sync_users(db, conn) -> tuple[int, dict]:
    """
    Fetch users from device, upsert into fch_bio_users.
    Auto-map device_user_id to employee_id where they match numerically.
    Returns (count_upserted, user_map {device_user_id: employee_id}).
    """
    log('Fetching users from device...')
    users = conn.get_users()
    log(f'  {len(users)} user(s) on device.')

    cur = db.cursor()
    upserted = 0
    for u in users:
        cur.execute("""
            INSERT INTO fch_bio_users (uid, device_user_id, name, privilege, card, last_synced_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                uid            = VALUES(uid),
                name           = VALUES(name),
                privilege      = VALUES(privilege),
                card           = VALUES(card),
                last_synced_at = NOW()
        """, (u.uid, str(u.user_id), u.name or '', u.privilege, u.card or ''))
        upserted += 1

    # Auto-map: where device_user_id is a positive integer, set employee_id = that number.
    # This does NOT require the employee to exist in fch_employees yet — the mapping
    # is stored so punches are attributed once the employee record is created.
    # Only updates rows that are still unmapped (employee_id IS NULL).
    cur.execute("""
        UPDATE fch_bio_users
        SET employee_id = CAST(device_user_id AS UNSIGNED)
        WHERE device_user_id REGEXP '^[0-9]+$'
          AND CAST(device_user_id AS UNSIGNED) > 0
          AND employee_id IS NULL
    """)
    auto_mapped = cur.rowcount
    if auto_mapped > 0:
        log(f'  Auto-mapped {auto_mapped} device user(s) to employees by numeric ID.')

    db.commit()
    cur.close()

    # Build live map {device_user_id: employee_id} for punch import
    cur2 = db.cursor()
    cur2.execute("SELECT device_user_id, employee_id FROM fch_bio_users WHERE employee_id IS NOT NULL")
    user_map = {row[0]: row[1] for row in cur2.fetchall()}
    cur2.close()
    log(f'  {len(user_map)} device user(s) mapped to employees.')
    return upserted, user_map


def sync_attendance(db, conn, user_map: dict) -> int:
    """
    Fetch all attendance from device and insert new records into fch_punches.
    Uses INSERT IGNORE for dedup via uq_fch_dev_punch (device_user_id, punch_time).
    Returns count of newly inserted rows.
    """
    log('Fetching attendance from device...')
    records = conn.get_attendance()
    log(f'  {len(records)} attendance record(s) on device.')

    cur = db.cursor()
    inserted = 0

    for att in records:
        device_user_id = str(att.user_id)
        employee_id    = user_map.get(device_user_id)   # None if not mapped
        punch_type     = PUNCH_LABELS.get(att.punch,  str(att.punch))
        verifycode     = VERIFY_LABELS.get(att.status, str(att.status))

        try:
            cur.execute("""
                INSERT IGNORE INTO fch_punches
                    (employee_id, punch_time, device_user_id, punch_type, verifycode, processed)
                VALUES (%s, %s, %s, %s, %s, 0)
            """, (employee_id, att.timestamp, device_user_id, punch_type, verifycode))
            if cur.rowcount > 0:
                inserted += 1
        except mysql.connector.Error as ex:
            logger.warning(f'Skipped punch ({device_user_id} @ {att.timestamp}): {ex}')

    db.commit()
    cur.close()
    log(f'  {inserted} new punch(es) inserted into fch_punches.')

    # Backfill employee_id on any punches that were inserted before the mapping existed
    if user_map:
        cur2 = db.cursor()
        updated_total = 0
        for device_user_id, employee_id in user_map.items():
            cur2.execute(
                "UPDATE fch_punches SET employee_id = %s "
                "WHERE device_user_id = %s AND employee_id IS NULL",
                (employee_id, device_user_id)
            )
            updated_total += cur2.rowcount
        db.commit()
        cur2.close()
        if updated_total > 0:
            log(f'  Backfilled employee_id on {updated_total} previously-unmapped punch(es).')

    return inserted


def chain_web_sync() -> None:
    """Run zkteco-sync.php to push new fch_punches rows to the web host."""
    log('Chaining to web sync (zkteco-sync.php)...')
    try:
        result = subprocess.run(
            [PHP_EXE, WEB_SYNC_PHP],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=120,
        )
        output = (result.stdout + result.stderr).strip()
        if result.returncode == 0:
            log(f'Web sync OK. {output[:200] if output else "(no output)"}')
        else:
            log(f'Web sync returned code {result.returncode}: {output[:300]}', 'warning')
    except subprocess.TimeoutExpired:
        log('Web sync timed out after 120 s.', 'warning')
    except Exception as ex:
        log(f'Web sync chain failed: {ex}', 'warning')


# ── Entry point ────────────────────────────────────────────────────────────────
def main() -> None:
    log('=' * 60)
    log('bio_sync.py starting')

    # 1. Connect to local MySQL
    try:
        db = get_db()
    except Exception as ex:
        log(f'DB connection failed: {ex}', 'error')
        sys.exit(1)

    # 2. Read device settings
    settings       = read_settings(db)
    device_ip      = settings['device_ip']
    device_port    = int(settings['device_port'])
    device_timeout = int(settings['device_timeout'])
    do_web_sync    = settings.get('chain_web_sync', '1') == '1'

    log(f'Device: {device_ip}:{device_port}  timeout={device_timeout}s')

    zk   = ZK(device_ip, port=device_port, timeout=device_timeout,
              password=0, force_udp=False, ommit_ping=False)
    conn = None

    try:
        # 3. Connect to device
        log(f'Connecting to ZKTeco device at {device_ip}:{device_port}...')
        conn = zk.connect()
        conn.disable_device()
        log('Connected.')

        # 4. Sync users
        users_synced, user_map = sync_users(db, conn)

        # 5. Sync attendance
        punches_synced = sync_attendance(db, conn, user_map)

        # 6. Log success
        msg = f'OK — {users_synced} user(s), {punches_synced} new punch(es).'
        log(msg)
        write_log(db, 'success', msg, users_synced, punches_synced)

    except Exception as ex:
        msg = f'Sync failed: {ex}\n{traceback.format_exc()}'
        log(msg, 'error')
        write_log(db, 'error', str(ex)[:1000])
        db.close()
        sys.exit(1)

    finally:
        if conn:
            try:
                conn.enable_device()
                conn.disconnect()
            except Exception:
                pass

    db.close()

    # 7. Chain to web sync (outside try/finally so device is always re-enabled first)
    if do_web_sync:
        chain_web_sync()

    log('bio_sync.py done.')
    log('=' * 60)


if __name__ == '__main__':
    main()
