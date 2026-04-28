<?php
$ftp = ftp_connect('ftpupload.net', 21, 15);
ftp_login($ftp, 'if0_40965702', 'clRx4wLpE8gM');
ftp_pasv($ftp, true);
$ok = ftp_put($ftp, '/htdocs/backend/sync/trigger.php',
               __DIR__ . '/trigger.php', FTP_ASCII);
ftp_close($ftp);
echo $ok ? "uploaded OK\n" : "FAILED\n";
