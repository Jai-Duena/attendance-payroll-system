"""
Windows registry auto-start support.
Writes / removes a CurrentVersion\\Run key so the .exe starts on user login.
"""
from __future__ import annotations

import sys
import os

_REG_KEY  = r'Software\Microsoft\Windows\CurrentVersion\Run'
_APP_NAME = 'FCHBioSync'


def _get_exe_path() -> str:
    if getattr(sys, 'frozen', False):
        return f'"{sys.executable}" --minimized'
    # Dev mode: launch via python
    script = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'main.py'))
    return f'"{sys.executable}" "{script}" --minimized'


def set_auto_start(enabled: bool) -> tuple[bool, str]:
    """Enable or disable auto-start via registry. Returns (success, message)."""
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, _REG_KEY, 0, winreg.KEY_SET_VALUE
        )
        if enabled:
            winreg.SetValueEx(key, _APP_NAME, 0, winreg.REG_SZ, _get_exe_path())
        else:
            try:
                winreg.DeleteValue(key, _APP_NAME)
            except FileNotFoundError:
                pass
        winreg.CloseKey(key)
        return True, 'Auto-start ' + ('enabled.' if enabled else 'disabled.')
    except Exception as exc:
        return False, f'Registry error: {exc}'


def is_auto_start_enabled() -> bool:
    """Return True if the auto-start key exists in the registry."""
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, _REG_KEY, 0, winreg.KEY_READ)
        try:
            winreg.QueryValueEx(key, _APP_NAME)
            winreg.CloseKey(key)
            return True
        except FileNotFoundError:
            winreg.CloseKey(key)
            return False
    except Exception:
        return False
