# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec for FCH Bio Sync.
Build with:  pyinstaller build.spec
Output:      dist/FCHBioSync/FCHBioSync.exe   (one-dir bundle)
"""

import certifi

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # Bundle the company assets
        ('assets/logo.png', 'assets'),
        ('assets/icon.ico', 'assets'),
        # certifi CA bundle (needed by requests for HTTPS)
        (certifi.where(), 'certifi'),
    ],
    hiddenimports=[
        # ZKTeco
        'zk', 'zk.base', 'zk.zkconst', 'zk.finger', 'zk.user',
        'zk.attendance', 'zk.lib', 'zk.exception',
        # MySQL
        'mysql', 'mysql.connector', 'mysql.connector.plugins',
        'mysql.connector.plugins.mysql_native_password',
        'mysql.connector.plugins.caching_sha2_password',
        # Crypto
        'Crypto', 'Crypto.Cipher', 'Crypto.Cipher.AES',
        'Crypto.Util', 'Crypto.Util.Padding',
        # Requests / urllib
        'requests', 'requests.adapters', 'requests.auth',
        'urllib3', 'urllib3.util',
        # stdlib
        'ftplib', 'winreg', 'ctypes', 'ctypes.windll',
        # PyQt6 extras
        'PyQt6.QtNetwork',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'scipy', 'pandas'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='FCHBioSync',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,           # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico',
    version_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='FCHBioSync',
)
