<?php
$ftp = ftp_connect('ftpupload.net', 21, 15);
ftp_login($ftp, 'if0_40965702', 'clRx4wLpE8gM');
ftp_pasv($ftp, true);

// Ensure config directory exists
@ftp_mkdir($ftp, '/htdocs/backend/config');

$ok = ftp_put($ftp, '/htdocs/backend/config/db.php',
               __DIR__ . '/db_webhost.php', FTP_ASCII);
ftp_close($ftp);
echo $ok ? "config/db.php uploaded OK\n" : "FAILED\n";
