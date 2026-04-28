<?php
/**
 * config/env.php — Minimal .env loader
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads backend/.env (one level above this file) and populates $_ENV.
 * Falls back silently if the file is missing, so hardcoded defaults in db.php
 * still work without a .env on first install.
 *
 * Usage: require_once __DIR__ . '/env.php';   (already called by db.php)
 */
function _loadEnvFile(string $path): void {
    if (!file_exists($path)) return;

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip blank lines and comments
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;

        [$key, $val] = explode('=', $line, 2);
        $key = trim($key);
        $val = trim($val);

        // Strip surrounding single or double quotes
        if (preg_match('/^(["\'])(.*)\\1$/', $val, $m)) {
            $val = $m[2];
        }

        // Don't overwrite values already set by the OS environment
        if (!array_key_exists($key, $_ENV) && getenv($key) === false) {
            $_ENV[$key] = $val;
            putenv("$key=$val");
        }
    }
}

_loadEnvFile(dirname(__DIR__) . '/.env');
