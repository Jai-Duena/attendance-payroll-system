<?php
/**
 * ZKTeco Sync Script  â€” FTP relay approach
 * -----------------------------------------
 * 1. Reads new rows from local fch_punches (populated by bio_sync.py)
 * 2. Generates INSERT SQL statements
 * 3. Uploads the SQL file to InfinityFree via FTP
 * 4. Hits trigger.php on the web host via HTTP GET to import immediately
 *
 * Run every 3 minutes via Windows Task Scheduler.
 */

// â”€â”€ Local XAMPP MySQL (source) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
define('LOCAL_HOST',  'localhost');
define('LOCAL_PORT',  '3306');
define('LOCAL_DB',    'family_care');
define('LOCAL_USER',  'zkteco');
define('LOCAL_PASS',  'Family Care');

// â”€â”€ InfinityFree FTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
define('FTP_HOST',    'ftpupload.net');
define('FTP_USER',    'if0_40965702');
define('FTP_PASS',    'clRx4wLpE8gM');
define('FTP_REMOTE',  '/htdocs/backend/sync/punches.sql');

// â”€â”€ Trigger endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
define('TRIGGER_URL', 'https://familycarehospital.ct.ws/backend/sync/trigger.php');
define('TRIGGER_KEY', 'FCHsync2026xK9mP');

define('BATCH_SIZE',  200);
define('CURSOR_FILE', __DIR__ . '/last_synced_id.txt');

// â”€â”€ Logging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
$logFile = __DIR__ . '/zkteco_sync.log';
function syncLog(string $msg): void {
    global $logFile;
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    if (PHP_SAPI === 'cli') echo $line;
}

// â”€â”€ SQL value escaper (no PDO needed for file generation) â”€â”€â”€â”€
function sqlVal($v): string {
    if ($v === null) return 'NULL';
    $s = str_replace(['\\', "'"], ['\\\\', "\\'"], (string)$v);
    return "'" . $s . "'";
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
try {
    $dsn  = 'mysql:host=' . LOCAL_HOST . ';port=' . LOCAL_PORT
          . ';dbname=' . LOCAL_DB . ';charset=utf8mb4';
    $local = new PDO($dsn, LOCAL_USER, LOCAL_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone='+08:00'",
    ]);

    // â”€â”€ Read cursor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    $lastId = (file_exists(CURSOR_FILE) && is_numeric(trim(file_get_contents(CURSOR_FILE))))
        ? (int)trim(file_get_contents(CURSOR_FILE))
        : 0;

    // â”€â”€ Fetch new rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ── Fetch new rows from fch_punches (only mapped/manual punch rows) ──────
    $stmt = $local->prepare(
        "SELECT id, employee_id, punch_time, verifycode,
                punch_type, operator, operator_reason, operator_time,
                annotation, processed
         FROM fch_punches
         WHERE id > ?
           AND employee_id IS NOT NULL
         ORDER BY id ASC
         LIMIT " . (int)BATCH_SIZE
    );
    $stmt->execute([$lastId]);
    $rows = $stmt->fetchAll();

    if (empty($rows)) {
        syncLog("Nothing to sync (cursor at id=$lastId).");
        exit(0);
    }

    syncLog("Found " . count($rows) . " new record(s) since id=$lastId. Building SQL...");

    // ── Generate INSERT statements for web att_punches ───────────────────────
    // Web server still uses att_punches; we write the subset of columns we have.
    $cols    = ['employee_id','punch_time','verifycode','punch_type',
                'operator','operator_reason','operator_time','annotation','processed'];
    $colList = '`' . implode('`,`', $cols) . '`';

    $lines = [];
    foreach ($rows as $row) {
        $vals = array_map('sqlVal', array_map(fn($c) => $row[$c] ?? null, $cols));
        $lines[] = "INSERT IGNORE INTO `att_punches` ($colList) VALUES (" . implode(',', $vals) . ");";
    }
    $sqlContent = implode("\n", $lines) . "\n";

    // ── Write temp file ──────────────────────────────────────────────────────
    $tmpFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'punches_fch_' . getmypid() . '.sql';
    file_put_contents($tmpFile, $sqlContent);

    // ── FTP upload ───────────────────────────────────────────────────────────
    syncLog("Uploading " . strlen($sqlContent) . " bytes via FTP...");
    $ftp = ftp_connect(FTP_HOST, 21, 30);
    if (!$ftp)                                throw new RuntimeException("FTP connect to " . FTP_HOST . " failed.");
    if (!ftp_login($ftp, FTP_USER, FTP_PASS)) throw new RuntimeException("FTP login failed for " . FTP_USER);
    ftp_pasv($ftp, true);
    if (!ftp_put($ftp, FTP_REMOTE, $tmpFile, FTP_ASCII))
                                              throw new RuntimeException("FTP put to " . FTP_REMOTE . " failed.");
    ftp_close($ftp);
    @unlink($tmpFile);
    syncLog("FTP upload complete.");

    // ── Advance cursor (before trigger — file is already on server) ──────────
    $maxId = (int)max(array_column($rows, 'id'));
    file_put_contents(CURSOR_FILE, $maxId);
    syncLog("Cursor advanced to id=$maxId.");

    // ── Trigger import on web host ────────────────────────────────────────────
    // InfinityFree serves a JS bot-challenge on the first bare request.
    // Solve it in PHP (AES-128-CBC) then retry with the computed cookie.
    $url = TRIGGER_URL . '?key=' . TRIGGER_KEY;

    function curlGet(string $url, string $cookie = '', bool $follow = false): array {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => $follow,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; FCHSync/1.0)',
        ]);
        if ($cookie !== '') curl_setopt($ch, CURLOPT_COOKIE, $cookie);
        $body   = (string)curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);
        return ['body' => $body, 'status' => $status, 'err' => $err];
    }

    $r1   = curlGet($url);
    $resp = $r1['body'];
    syncLog("Initial trigger: HTTP {$r1['status']}" . ($r1['err'] ? " | curl_err: {$r1['err']}" : ''));

    // Detect bot-challenge and solve via AES-128-CBC decryption
    if (strpos($resp, 'slowAES.decrypt') !== false &&
        preg_match('/\ba=toNumbers\("([0-9a-f]+)"\)/', $resp, $mA) &&
        preg_match('/\bb=toNumbers\("([0-9a-f]+)"\)/', $resp, $mB) &&
        preg_match('/\bc=toNumbers\("([0-9a-f]+)"\)/', $resp, $mC)) {

        $plain = openssl_decrypt(
            hex2bin($mC[1]), 'AES-128-CBC', hex2bin($mA[1]),
            OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, hex2bin($mB[1])
        );
        if ($plain === false) {
            $plain = openssl_decrypt(
                hex2bin($mC[1]), 'AES-128-CBC', hex2bin($mA[1]),
                OPENSSL_RAW_DATA, hex2bin($mB[1])
            );
        }
        $cookieVal = bin2hex((string)$plain);
        syncLog("Bot-challenge solved — cookie __test=$cookieVal");
        $r2   = curlGet($url . '&i=1', '__test=' . $cookieVal, true);
        $resp = $r2['body'];
        syncLog("Cookie-retry: HTTP {$r2['status']}" . ($r2['err'] ? " | curl_err: {$r2['err']}" : ''));
    }

    syncLog("Trigger response: " . trim($resp ?: '(no response)'));

    syncLog("Done. " . count($rows) . " record(s) synced.");

} catch (Throwable $e) {
    syncLog("FATAL: " . $e->getMessage());
    exit(1);
}
