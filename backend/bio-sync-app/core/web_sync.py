"""
Web sync — push new fch_punches rows to the remote web host via FTP + HTTP trigger.
Ported from zkteco-sync.php.  Bot-challenge (InfinityFree AES cookie) is handled
with pycryptodome.
"""
from __future__ import annotations

import ftplib
import os
import re
import binascii
import tempfile
from datetime import datetime
from typing import Callable

import requests
from Crypto.Cipher import AES

from core.config import Config
from core.db import get_local_db

BATCH_SIZE = 200


# ── Helpers ───────────────────────────────────────────────────────────────────
def _sql_val(v) -> str:
    if v is None:
        return 'NULL'
    s = str(v).replace('\\', '\\\\').replace("'", "\\'")
    # Datetime objects need quoting
    return f"'{s}'"


def _solve_bot_challenge(html: str) -> str | None:
    """Solve InfinityFree's AES-128-CBC cookie challenge; return cookie value or None."""
    ma = re.search(r'\ba=toNumbers\("([0-9a-f]+)"\)', html)
    mb = re.search(r'\bb=toNumbers\("([0-9a-f]+)"\)', html)
    mc = re.search(r'\bc=toNumbers\("([0-9a-f]+)"\)', html)
    if not (ma and mb and mc):
        return None
    try:
        key    = binascii.unhexlify(ma.group(1))
        iv     = binascii.unhexlify(mb.group(1))
        cipher_text = binascii.unhexlify(mc.group(1))
        plain  = AES.new(key, AES.MODE_CBC, iv).decrypt(cipher_text)
        return plain.hex()
    except Exception:
        return None


# ── Main ──────────────────────────────────────────────────────────────────────
def run_web_sync(config: Config, log_callback: Callable | None = None) -> dict:
    """
    Reads new fch_punches rows, generates SQL, uploads via FTP, then fires
    the HTTP trigger on the web host.
    Returns { status: 'success'|'error', message: str }
    """
    def log(msg: str) -> None:
        if log_callback:
            ts = datetime.now().strftime('%H:%M:%S')
            log_callback(f'[{ts}] [WEB] {msg}')

    # ── 1. Query new rows ────────────────────────────────────────────────────
    last_id = int(config.get('last_synced_id', 0))
    try:
        db  = get_local_db(config)
        cur = db.cursor(dictionary=True)
        cur.execute(
            "SELECT id, employee_id, punch_time, verifycode, punch_type, "
            "operator, operator_reason, operator_time, annotation, processed "
            "FROM fch_punches "
            "WHERE id > %s AND employee_id IS NOT NULL "
            "ORDER BY id ASC LIMIT %s",
            (last_id, BATCH_SIZE),
        )
        rows = cur.fetchall()
        cur.close()
        db.close()
    except Exception as exc:
        return {'status': 'error', 'message': f'DB query error: {exc}'}

    if not rows:
        log(f'Nothing to sync (cursor at id={last_id}).')
        return {'status': 'success', 'message': 'Nothing to sync.'}

    log(f'Found {len(rows)} record(s) since id={last_id}. Building SQL…')

    # ── 2. Generate INSERT SQL ───────────────────────────────────────────────
    cols     = ['employee_id', 'punch_time', 'verifycode', 'punch_type',
                'operator', 'operator_reason', 'operator_time', 'annotation', 'processed']
    col_list = ', '.join(f'`{c}`' for c in cols)
    lines    = []
    for row in rows:
        vals = ', '.join(_sql_val(row.get(c)) for c in cols)
        lines.append(f"INSERT IGNORE INTO `att_punches` ({col_list}) VALUES ({vals});")
    sql_content = '\n'.join(lines) + '\n'

    # ── 3. Write to temp file ────────────────────────────────────────────────
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False, encoding='utf-8')
    tmp.write(sql_content)
    tmp.close()
    tmp_path = tmp.name

    try:
        # ── 4. FTP upload ────────────────────────────────────────────────────
        log(f'Uploading {len(sql_content)} bytes via FTP…')
        ftp = ftplib.FTP()
        ftp.connect(config.get('ftp_host'), 21, timeout=30)
        ftp.login(config.get('ftp_user'), config.get('ftp_pass'))
        ftp.set_pasv(True)
        with open(tmp_path, 'rb') as f:
            ftp.storlines(f"STOR {config.get('ftp_remote')}", f)
        ftp.quit()
        log('FTP upload complete.')

        # ── 5. Advance cursor ────────────────────────────────────────────────
        max_id = max(int(r['id']) for r in rows)
        config.set('last_synced_id', max_id)
        log(f'Cursor advanced to id={max_id}.')

        # ── 6. HTTP trigger ──────────────────────────────────────────────────
        trigger_url = config.get('trigger_url')
        trigger_key = config.get('trigger_key')
        url = f'{trigger_url}?key={trigger_key}'

        session = requests.Session()
        session.headers['User-Agent'] = 'Mozilla/5.0 (compatible; FCHSync/1.0)'
        session.verify = False  # InfinityFree uses self-signed / shared cert

        r1 = session.get(url, timeout=20)
        log(f'Trigger HTTP {r1.status_code}')

        if 'slowAES' in r1.text:
            cookie_val = _solve_bot_challenge(r1.text)
            if cookie_val:
                log('Bot-challenge solved.')
                r2 = session.get(url + '&i=1', cookies={'__test': cookie_val}, timeout=20)
                log(f'Cookie-retry HTTP {r2.status_code}: {r2.text[:100].strip()}')

        log(f'Done. {len(rows)} record(s) synced to web host.')
        return {'status': 'success', 'message': f'{len(rows)} record(s) pushed to web host.'}

    except Exception as exc:
        return {'status': 'error', 'message': f'Web sync error: {exc}'}

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
